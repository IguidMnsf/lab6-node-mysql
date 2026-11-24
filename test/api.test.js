const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

after(async () => pool.end());

test('validation et routes sans connexion MySQL', async () => {
  await request(app).post('/api/products').send({ name: 'X', price: -1 }).expect(400);
  await request(app).post('/api/products').send({ name: 'Casque', price: 2, category_id: 0 }).expect(400);
  await request(app).get('/api/products/search?sort=name%20DESC').expect(400);
  await request(app).get('/api/products/search?minPrice=20&maxPrice=10').expect(400);
  await request(app).get('/api/products/abc').expect(400);
  await request(app).post('/api/products/with-category').send({
    name: 'Casque', price: 10, categoryName: 'Audio', category_id: 1
  }).expect(400);
  await request(app).get('/absent').expect(404);
});

test('recherche parametree avec zero et tri autorise', async (t) => {
  const mock = t.mock.method(pool, 'execute', async (sql, params) => {
    assert.match(sql, /price >= \?/);
    assert.match(sql, /ORDER BY price, id LIMIT \? OFFSET \?/);
    assert.deepEqual(params, ['0', 5, 0]);
    return [[{ id: 1, name: 'Casque', price: '10.00', category_id: null }]];
  });
  const response = await request(app).get('/api/products/search?minPrice=0&limit=5&offset=0&sort=price').expect(200);
  assert.equal(response.body[0].name, 'Casque');
  assert.equal(mock.mock.callCount(), 1);
});

test('transaction : rollback et liberation si insertion impossible', async (t) => {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql) => {
      calls.push(sql.startsWith('INSERT INTO categories') ? 'category' : 'product');
      if (sql.startsWith('INSERT INTO categories')) return [{ insertId: 3 }];
      throw new Error('insertion impossible');
    },
    rollback: async () => calls.push('rollback'),
    commit: async () => calls.push('commit'),
    release: () => calls.push('release')
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  const repository = require('../src/repositories/productRepository');
  await assert.rejects(repository.createWithCategory({ name: 'Casque', price: 20, categoryName: 'Audio' }));
  assert.deepEqual(calls, ['begin', 'category', 'product', 'rollback', 'release']);
});

test('transaction : produit et categorie valides sont confirmes', async (t) => {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql, params) => {
      if (sql.startsWith('INSERT INTO categories')) {
        calls.push('category');
        assert.deepEqual(params, ['Audio']);
        return [{ insertId: 3 }];
      }
      if (sql.startsWith('INSERT INTO products')) {
        calls.push('product');
        assert.deepEqual(params, ['Casque', 20, 3]);
        return [{ insertId: 4 }];
      }
      calls.push('read');
      return [[{ id: 4, name: 'Casque', price: '20.00', category_id: 3 }]];
    },
    rollback: async () => calls.push('rollback'),
    commit: async () => calls.push('commit'),
    release: () => calls.push('release')
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  const response = await request(app).post('/api/products/with-category')
    .send({ name: 'Casque', price: 20, categoryName: 'Audio' }).expect(201);
  assert.equal(response.body.category_id, 3);
  assert.deepEqual(calls, ['begin', 'category', 'product', 'read', 'commit', 'release']);
});

test('erreur MySQL inattendue : reponse 500 sans details internes', async (t) => {
  t.mock.method(pool, 'query', async () => { throw new Error('details internes'); });
  t.mock.method(console, 'error', () => {});
  const response = await request(app).get('/api/products').expect(500);
  assert.deepEqual(response.body, { error: 'Erreur interne du serveur' });
});

test('suppression refusee si des produits sont lies', async (t) => {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql) => {
      calls.push(sql.startsWith('SELECT id FROM categories') ? 'category' : 'products');
      return [[{ id: 1 }]];
    },
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release')
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  await request(app).delete('/api/categories/1').expect(409);
  assert.deepEqual(calls, ['begin', 'category', 'products', 'commit', 'release']);
});
