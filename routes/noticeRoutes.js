const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const noticeController = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { noticeValidation } = require('../validations/notice.validation');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config: image (<=5MB) and PDF (<=10MB)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Thumbnail must be an image'), false);
        }
    } else if (file.fieldname === 'pdfAttachment') {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Attachment must be a PDF'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

const cpUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdfAttachment', maxCount: 1 },
]);

// Wrap multer to convert thrown file errors to JSON
const uploadHandler = (req, res, next) => {
    cpUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        }
        next();
    });
};

// Public routes
router.get('/', noticeController.getAllNotices);
router.get('/:id', noticeController.getNoticeById);

// Admin routes
router.post('/', protect, uploadHandler, validate(noticeValidation.create), noticeController.createNotice);
router.put('/:id', protect, uploadHandler, validate(noticeValidation.update), noticeController.updateNotice);
router.delete('/:id', protect, noticeController.deleteNotice);
router.patch('/:id/toggle', protect, validate(noticeValidation.toggle), noticeController.toggleNoticeStatus);

module.exports = router;
