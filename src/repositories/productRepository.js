const pool = require('../config/db');

async function getAll() {
  const [rows] = await pool.query('SELECT id, name, price, category_id FROM products ORDER BY id');
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute('SELECT id, name, price, category_id FROM products WHERE id = ?', [id]);
  return rows[0];
}

async function create(data) {
  const [result] = await pool.execute(
    'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
    [data.name, data.price, data.category_id ?? null]
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const [result] = await pool.execute(
    'UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?',
    [data.name, data.price, data.category_id ?? null, id]
  );
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows;
}

async function search(filters) {
  let sql = 'SELECT id, name, price, category_id FROM products WHERE 1=1';
  const params = [];
  if (filters.name !== undefined) { sql += ' AND name LIKE ?'; params.push(`%${filters.name}%`); }
  if (filters.minPrice !== undefined) { sql += ' AND price >= ?'; params.push(filters.minPrice); }
  if (filters.maxPrice !== undefined) { sql += ' AND price <= ?'; params.push(filters.maxPrice); }
  if (filters.categoryId !== undefined) { sql += ' AND category_id = ?'; params.push(filters.categoryId); }
  const sort = ['id', 'name', 'price'].includes(filters.sort) ? filters.sort : 'name';
  sql += ` ORDER BY ${sort}, id LIMIT ? OFFSET ?`;
  params.push(filters.limit ?? 10, filters.offset ?? 0);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function createWithCategory(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [category] = await connection.execute(
      'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [data.categoryName]
    );
    const [product] = await connection.execute(
      'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
      [data.name, data.price, category.insertId]
    );
    const [rows] = await connection.execute(
      'SELECT id, name, price, category_id FROM products WHERE id = ?', [product.insertId]
    );
    await connection.commit();
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getAll, getById, create, update, remove, search, createWithCategory };
