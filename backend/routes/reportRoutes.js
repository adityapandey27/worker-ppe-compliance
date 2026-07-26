const express = require('express');
const { exportViolationsCsv } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/violations/export', protect, authorize('supervisor', 'admin'), exportViolationsCsv);

module.exports = router;
