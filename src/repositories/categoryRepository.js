const pool = require('../config/db');

async function getAll() {
  const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY id');
  return rows;
}
async function getById(id) {
  const [rows] = await pool.execute('SELECT id, name FROM categories WHERE id = ?', [id]);
  return rows[0];
}
async function create(data) {
  const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [data.name]);
  return getById(result.insertId);
}
async function update(id, data) {
  const [result] = await pool.execute('UPDATE categories SET name = ? WHERE id = ?', [data.name, id]);
  return result.affectedRows;
}
async function remove(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [categories] = await connection.execute('SELECT id FROM categories WHERE id = ? FOR UPDATE', [id]);
    if (!categories.length) {
      await connection.commit();
      return 'missing';
    }
    const [products] = await connection.execute('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (products.length) {
      await connection.commit();
      return 'linked';
    }
    await connection.execute('DELETE FROM categories WHERE id = ?', [id]);
    await connection.commit();
    return 'deleted';
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
module.exports = { getAll, getById, create, update, remove };
