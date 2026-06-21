const { NewsTicker } = require('../models');

// Get all active news tickers (For Frontend)
exports.getActiveNewsTickers = async (req, res) => {
    try {
        const newsTickers = await NewsTicker.findAll({
            where: { isActive: true },
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
        });
        res.json({ success: true, data: newsTickers });
    } catch (error) {
        console.error('Error fetching active news tickers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all news tickers (For Admin)
exports.getAllNewsTickers = async (req, res) => {
    try {
        const newsTickers = await NewsTicker.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, data: newsTickers });
    } catch (error) {
        console.error('Error fetching all news tickers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create a new news ticker
exports.createNewsTicker = async (req, res) => {
    try {
        const { textEnglish, textHindi, link, isActive, sortOrder } = req.body;

        if (!textEnglish) {
            return res.status(400).json({ success: false, message: 'English text is required' });
        }

        const newTicker = await NewsTicker.create({
            textEnglish,
            textHindi,
            link,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0,
        });

        res.status(201).json({ success: true, message: 'News ticker created successfully', data: newTicker });
    } catch (error) {
        console.error('Error creating news ticker:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update a news ticker
exports.updateNewsTicker = async (req, res) => {
    try {
        const { id } = req.params;
        const { textEnglish, textHindi, link, isActive, sortOrder } = req.body;

        const ticker = await NewsTicker.findByPk(id);

        if (!ticker) {
            return res.status(404).json({ success: false, message: 'News ticker not found' });
        }

        await ticker.update({
            textEnglish,
            textHindi,
            link,
            isActive,
            sortOrder,
        });

        res.json({ success: true, message: 'News ticker updated successfully', data: ticker });
    } catch (error) {
        console.error('Error updating news ticker:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a news ticker
exports.deleteNewsTicker = async (req, res) => {
    try {
        const { id } = req.params;

        const ticker = await NewsTicker.findByPk(id);

        if (!ticker) {
            return res.status(404).json({ success: false, message: 'News ticker not found' });
        }

        await ticker.destroy();

        res.json({ success: true, message: 'News ticker deleted successfully' });
    } catch (error) {
        console.error('Error deleting news ticker:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle active status
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const ticker = await NewsTicker.findByPk(id);

        if (!ticker) {
            return res.status(404).json({ success: false, message: 'News ticker not found' });
        }

        ticker.isActive = !ticker.isActive;
        await ticker.save();

        res.json({ success: true, message: 'Status updated successfully', data: ticker });
    } catch (error) {
        console.error('Error toggling status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
