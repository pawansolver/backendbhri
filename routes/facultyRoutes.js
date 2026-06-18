const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const controller = require('../controllers/facultyController');
const { protect } = require('../middleware/authMiddleware');

// ── Photo Upload Setup ──────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'faculty');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) =>
        cb(null, `faculty-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const validExt  = allowed.test(path.extname(file.originalname).toLowerCase());
        const validMime = allowed.test(file.mimetype);
        if (validExt && validMime) return cb(null, true);
        cb(new Error('Only image files (jpg, png, webp) are allowed'));
    },
});

// Wrapper: converts multer errors to clean JSON responses
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

// ─────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────

// GET /api/faculty
//   Query params: ?department=&designation=
//   Returns only isActive=true records, ordered by displayOrder → department → name
router.get('/', controller.getAll);

// GET /api/faculty/:id
//   Returns a single faculty member by primary key
router.get('/:id', controller.getById);

// ─────────────────────────────────────────────────────────
// ADMIN ROUTES  (require Bearer token via protect middleware)
// ─────────────────────────────────────────────────────────

// GET /api/faculty/admin/all
//   Query params: ?page=&limit=&search=&department=&designation=&isActive=
//   Pass limit=0 to get all records without pagination
router.get('/admin/all', protect, controller.getAllAdmin);

// POST /api/faculty
//   multipart/form-data — fields: name*, designation*, department*, credentials,
//   specialty, experience, nameHindi, tags, displayOrder, isActive
//   File field: photo  (jpg/png/webp, max 5MB)
router.post('/', protect, handleUpload, controller.create);

// POST /api/faculty/bulk
//   JSON body: { faculty: [ { name, designation, department, ... }, ... ] }
//   Accepts aliases: role → designation, dept → department, exp → experience, image → photo
router.post('/bulk', protect, controller.bulkImport);

// PUT /api/faculty/:id
//   Same body shape as POST — all fields optional (only provided fields are updated)
//   File field: photo  (replaces old photo file on disk)
router.put('/:id', protect, handleUpload, controller.update);

// PATCH /api/faculty/:id/toggle-status
//   Toggles isActive (show / hide on website)
router.patch('/:id/toggle-status', protect, controller.toggleStatus);

// DELETE /api/faculty/:id
//   Soft delete — sets isActive = false (record stays in DB)
router.delete('/:id', protect, controller.remove);

// DELETE /api/faculty/:id/permanent
//   Hard delete — removes record from DB and deletes photo file from disk
router.delete('/:id/permanent', protect, controller.hardDelete);

module.exports = router;
