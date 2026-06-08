const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const announcementController = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { announcementValidation } = require('../validations/announcement.validation');

const uploadDir = path.join(__dirname, '../uploads/announcements');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Thumbnail must be an image'), false);
    } else if (file.fieldname === 'pdfAttachment') {
        if (file.mimetype !== 'application/pdf') return cb(new Error('Attachment must be a PDF'), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const cpUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdfAttachment', maxCount: 1 },
]);

const uploadHandler = (req, res, next) => {
    cpUpload(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        next();
    });
};

// Public routes
router.get('/', announcementController.getAllAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);

// Admin routes
router.post('/', protect, uploadHandler, validate(announcementValidation.create), announcementController.createAnnouncement);
router.put('/:id', protect, uploadHandler, validate(announcementValidation.update), announcementController.updateAnnouncement);
router.delete('/:id', protect, announcementController.deleteAnnouncement);
router.patch('/:id/toggle', protect, validate(announcementValidation.toggle), announcementController.toggleAnnouncementStatus);

module.exports = router;
