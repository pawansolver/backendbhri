const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const appointmentValidation = require('../validations/appointment.validation');

// ─── Public Routes (no auth) ──────────────────────────────────────────────────
router.post('/book',  validate(appointmentValidation.book), controller.bookAppointment);
router.get('/search', controller.searchByMobile);
router.get('/track/:id', controller.getById);

// PUBLIC: Download PDF confirmation slip — patient uses this link
// GET /api/appointments/slip/:appointmentId
router.get('/slip/:appointmentId', controller.downloadSlip);

// ─── Named admin routes (MUST come before /:id wildcard) ─────────────────────
router.get('/stats',  protect, controller.getTodayStats);
router.get('/report', protect, controller.getReport);

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
router.get('/',        protect, controller.getAll);
router.get('/:id',     protect, controller.getById);
router.put('/:id',     protect, controller.updateAppointment);
router.patch('/:id/status', protect, controller.updateStatus);
router.delete('/:id',  protect, controller.deleteAppointment);

module.exports = router;
