const router = require('express').Router();
const controller = require('../controllers/categoryController');
const { idRules, categoryRules, validate } = require('../middlewares/validation');

router.get('/', controller.list);
router.get('/:id', idRules, validate, controller.get);
router.post('/', categoryRules, validate, controller.create);
router.put('/:id', idRules, categoryRules, validate, controller.update);
router.delete('/:id', idRules, validate, controller.remove);
module.exports = router;
