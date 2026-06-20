const express = require('express');
const router = express.Router();
const controller = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { departmentValidation } = require('../validations/department.validation');

// Admin routes MUST come before /:id
router.get('/admin/all', protect, controller.getAllAdmin);
router.put('/admin/sort-order', protect, controller.updateSortOrder);

// Public
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Admin CRUD
router.post('/', protect, validate(departmentValidation.create), controller.create);
router.put('/:id', protect, validate(departmentValidation.update), controller.update);
router.delete('/:id', protect, controller.remove);
router.delete('/:id/permanent', protect, controller.hardDelete);
router.patch('/:id/toggle-status', protect, controller.toggleStatus);

module.exports = router;
