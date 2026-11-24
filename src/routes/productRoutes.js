const router = require('express').Router();
const controller = require('../controllers/productController');
const { idRules, productRules, searchRules, transactionRules, validate } = require('../middlewares/validation');

router.get('/', controller.list);
router.get('/search', searchRules, validate, controller.search);
router.post('/with-category', transactionRules, validate, controller.withCategory);
router.get('/:id', idRules, validate, controller.get);
router.post('/', productRules, validate, controller.create);
router.put('/:id', idRules, productRules, validate, controller.update);
router.delete('/:id', idRules, validate, controller.remove);
module.exports = router;
