const express = require('express');
const router = express.Router();
const controller = require('../controllers/slotController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { slotValidation } = require('../validations/slot.validation');

// Public - both /api/slots and /api/slots/available work
router.get('/', controller.getAvailableSlots);
router.get('/available', controller.getAvailableSlots);

// Admin routes MUST come before /:id
router.get('/admin/all', protect, controller.getAllAdmin);

router.post('/', protect, validate(slotValidation.create), controller.createSlot);
router.post('/add-custom-bulk', protect, controller.createCustomSlotsBulk);
router.post('/generate', protect, validate(slotValidation.generate), controller.generateSlots);
router.post('/generate-bulk', protect, validate(slotValidation.generateBulk), controller.generateBulkSlots);
router.post('/regenerate', protect, controller.regenerateSlots);
router.post('/delete-by-date', protect, controller.deleteSlotsByDate);

router.get('/:id', protect, controller.getById);
router.put('/:id', protect, controller.updateSlot);
router.patch('/:id/block', protect, controller.blockSlot);
router.patch('/:id/unblock', protect, controller.unblockSlot);
router.delete('/:id', protect, controller.deleteSlot);

module.exports = router;
