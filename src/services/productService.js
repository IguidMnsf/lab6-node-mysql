const products = require('../repositories/productRepository');
const categories = require('../repositories/categoryRepository');
const { AppError } = require('../middlewares/errorHandler');

async function get(id) {
  const product = await products.getById(id);
  if (!product) throw new AppError(404, 'Produit introuvable');
  return product;
}
async function checkCategory(id) {
  if (id != null && !await categories.getById(id)) throw new AppError(400, 'Categorie introuvable');
}
async function create(data) {
  await checkCategory(data.category_id);
  return products.create(data);
}
async function update(id, data) {
  await checkCategory(data.category_id);
  if (!await products.update(id, data)) throw new AppError(404, 'Produit introuvable');
  return get(id);
}
async function remove(id) {
  if (!await products.remove(id)) throw new AppError(404, 'Produit introuvable');
}
module.exports = {
  list: products.getAll, get, create, update, remove,
  search: products.search, createWithCategory: products.createWithCategory
};
