const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', validate(authValidation.login), authController.login);
router.post('/register', validate(authValidation.register), authController.register);
router.get('/profile', protect, authController.getProfile);

module.exports = router;
