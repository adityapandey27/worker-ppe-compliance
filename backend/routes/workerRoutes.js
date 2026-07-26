const express = require('express');
const { getWorkers, createWorker, getDepartments } = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getWorkers);
router.get('/departments', getDepartments);
router.post('/', authorize('admin'), createWorker);

module.exports = router;
