const categories = require('../repositories/categoryRepository');
const { AppError } = require('../middlewares/errorHandler');

async function get(id) {
  const category = await categories.getById(id);
  if (!category) throw new AppError(404, 'Categorie introuvable');
  return category;
}
async function update(id, data) {
  if (!await categories.update(id, data)) throw new AppError(404, 'Categorie introuvable');
  return get(id);
}
async function remove(id) {
  const result = await categories.remove(id);
  if (result === 'missing') throw new AppError(404, 'Categorie introuvable');
  if (result === 'linked') throw new AppError(409, 'Categorie liee a des produits');
}
module.exports = { list: categories.getAll, get, create: categories.create, update, remove };
