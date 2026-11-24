const { body, param, query, validationResult } = require('express-validator');

const idRules = [param('id').isInt({ min: 1, max: 2147483647 }).withMessage('Identifiant invalide').toInt()];
const productRules = [
  body('name').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Nom : 3 a 150 caracteres'),
  body('price').isFloat({ gt: 0, max: 99999999.99 }).withMessage('Prix positif requis'),
  body('price').custom(value => /^\d{1,8}(\.\d{1,2})?$/.test(String(value))).withMessage('Deux decimales maximum'),
  body('category_id').optional({ nullable: true }).isInt({ min: 1, max: 2147483647 }).withMessage('Categorie invalide').toInt()
];
const categoryRules = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Nom : 2 a 100 caracteres')
];
const searchRules = [
  query('name').optional().isString().isLength({ max: 150 }),
  query('minPrice').optional().isFloat({ min: 0, max: 99999999.99 }),
  query('maxPrice').optional().isFloat({ min: 0, max: 99999999.99 }),
  query('categoryId').optional().isInt({ min: 1, max: 2147483647 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0, max: 2147483647 }).toInt(),
  query('sort').optional().isIn(['id', 'name', 'price'])
];
const transactionRules = [
  ...productRules,
  body('categoryName').isString().trim().isLength({ min: 2, max: 100 }),
  body('category_id').not().exists().withMessage('Utiliser categoryName uniquement')
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (req.query.minPrice !== undefined && req.query.maxPrice !== undefined &&
      Number(req.query.minPrice) > Number(req.query.maxPrice)) {
    return res.status(400).json({ error: 'minPrice doit etre inferieur ou egal a maxPrice' });
  }
  next();
}

module.exports = { idRules, productRules, categoryRules, searchRules, transactionRules, validate };
