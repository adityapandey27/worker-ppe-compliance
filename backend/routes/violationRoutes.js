const express = require('express');
const {
  getViolations,
  getAlerts,
  acknowledgeViolation,
  simulateViolation
} = require('../controllers/violationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getViolations); // admin + supervisor
router.get('/alerts', authorize('admin'), getAlerts); // admin only: escalated, un-acknowledged > 10 min
router.patch('/:id/acknowledge', authorize('supervisor'), acknowledgeViolation);
router.post('/simulate', simulateViolation); // both roles can trigger the demo simulator

module.exports = router;
