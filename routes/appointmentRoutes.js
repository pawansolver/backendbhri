const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const appointmentValidation = require('../validations/appointment.validation');

// Public
router.post('/book', validate(appointmentValidation.book), controller.bookAppointment);
router.get('/search', controller.searchByMobile);
router.get('/track/:id', controller.getById);

// Named routes MUST come before /:id
router.get('/stats', protect, controller.getTodayStats);
router.get('/report', protect, controller.getReport);

// Admin CRUD
router.get('/', protect, controller.getAll);
router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.updateAppointment);
router.patch('/:id/status', protect, controller.updateStatus);
router.delete('/:id', protect, controller.deleteAppointment);

module.exports = router;
