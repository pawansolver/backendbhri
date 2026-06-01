const express = require('express');
const router = express.Router();
const { exportExcel, exportPDF } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/export/excel?startDate=&endDate=&doctorId=&departmentId=&status=
router.get('/excel', protect, exportExcel);

// GET /api/export/pdf?startDate=&endDate=&doctorId=&departmentId=&status=
router.get('/pdf', protect, exportPDF);

module.exports = router;
