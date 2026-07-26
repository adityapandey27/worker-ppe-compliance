const express = require('express');
const { getAdminMetrics, getSupervisorMetrics, getInsights } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminMetrics);
router.get('/supervisor', authorize('supervisor'), getSupervisorMetrics);
router.get('/insights', authorize('admin'), getInsights);

module.exports = router;
