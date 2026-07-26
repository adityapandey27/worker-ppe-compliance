const Worker = require('../models/Worker');

// @route GET /api/workers
const getWorkers = async (req, res) => {
  try {
    const { department, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { workerId: { $regex: search, $options: 'i' } }
      ];
    }
    const workers = await Worker.find(filter).sort({ name: 1 });
    res.json({ workers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch workers.', error: err.message });
  }
};

// @route POST /api/workers (admin only)
const createWorker = async (req, res) => {
  try {
    const worker = await Worker.create(req.body);
    res.status(201).json({ worker });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create worker.', error: err.message });
  }
};

// @route GET /api/workers/departments - distinct department list, used for dropdowns/filters
const getDepartments = async (req, res) => {
  try {
    const departments = await Worker.distinct('department');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments.', error: err.message });
  }
};

module.exports = { getWorkers, createWorker, getDepartments };
