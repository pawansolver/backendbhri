const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { doctorValidation } = require('../validations/doctor.validation');

// Ensure the upload directory exists before multer tries to write to it
const uploadDir = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `doctor-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
    },
});

// Multer error handler — returns JSON instead of HTML
const handleUpload = (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Admin routes MUST come before /:id
router.get('/admin/all', protect, controller.getAllAdmin);
router.get('/department/:departmentId', controller.getByDepartment);
router.get('/schedule/:id', controller.getSchedule);

// Public
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Admin CRUD — use handleUpload wrapper instead of upload.single directly
router.post('/', protect, handleUpload, validate(doctorValidation.create), controller.create);
router.put('/:id', protect, handleUpload, validate(doctorValidation.update), controller.update);
router.delete('/:id', protect, controller.remove);
router.delete('/:id/permanent', protect, controller.hardDelete);
router.patch('/:id/toggle-status', protect, controller.toggleStatus);
router.patch('/:id/schedule', protect, validate(doctorValidation.updateSchedule), controller.updateSchedule);

module.exports = router;
