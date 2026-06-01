const express = require('express');
const router = express.Router();
const controller = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const settingValidation = require('../validations/setting.validation');

// Public read for website
router.get('/opd-timing', controller.getOPDTiming);

// Admin write
router.put('/opd-timing', protect, validate(settingValidation.opdTiming), controller.upsertOPDTiming);

module.exports = router;
