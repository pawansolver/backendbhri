const express = require('express');
const router = express.Router();
const newsTickerController = require('../controllers/newsTickerController');
const { protect } = require('../middleware/authMiddleware');

// Public route for frontend
router.get('/active', newsTickerController.getActiveNewsTickers);

// Protected admin routes
router.use(protect);

router.route('/')
    .get(newsTickerController.getAllNewsTickers)
    .post(newsTickerController.createNewsTicker);

router.route('/:id')
    .put(newsTickerController.updateNewsTicker)
    .delete(newsTickerController.deleteNewsTicker);

router.patch('/:id/toggle-status', newsTickerController.toggleStatus);

module.exports = router;
