const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const Worker = require('../models/Worker');

const ESCALATION_MS = () => (Number(process.env.ESCALATION_MINUTES) || 10) * 60 * 1000;

// Helper: the query fragment that defines an "escalated" (admin alert) violation
const escalatedFilter = () => ({
  status: 'pending',
  detectedAt: { $lte: new Date(Date.now() - ESCALATION_MS()) }
});

// @route GET /api/violations
// Supervisors see all violations (site-wide monitoring). Supports filtering.
const getViolations = async (req, res) => {
  try {
    const { status, department, ppeType, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (ppeType) filter.ppeType = ppeType;
    if (from || to) {
      filter.detectedAt = {};
      if (from) filter.detectedAt.$gte = new Date(from);
      if (to) filter.detectedAt.$lte = new Date(to);
    }

    const violations = await Violation.find(filter)
      .populate('worker', 'name workerId jobProfile department')
      .populate('acknowledgedBy', 'name email')
      .sort({ detectedAt: -1 })
      .limit(500);

    const now = Date.now();
    const withEscalationFlag = violations.map((v) => {
      const obj = v.toObject();
      obj.isEscalated =
        v.status === 'pending' && now - new Date(v.detectedAt).getTime() >= ESCALATION_MS();
      obj.minutesPending =
        v.status === 'pending' ? Math.floor((now - new Date(v.detectedAt).getTime()) / 60000) : null;
      return obj;
    });

    res.json({ violations: withEscalationFlag });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch violations.', error: err.message });
  }
};

// @route GET /api/violations/alerts (admin only)
// Only non-compliance events NOT acknowledged within ESCALATION_MINUTES
const getAlerts = async (req, res) => {
  try {
    const alerts = await Violation.find(escalatedFilter())
      .populate('worker', 'name workerId jobProfile department')
      .sort({ detectedAt: 1 });

    const now = Date.now();
    const withMinutes = alerts.map((v) => {
      const obj = v.toObject();
      obj.minutesPending = Math.floor((now - new Date(v.detectedAt).getTime()) / 60000);
      return obj;
    });

    res.json({ alerts: withMinutes, count: withMinutes.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.', error: err.message });
  }
};

// @route PATCH /api/violations/:id/acknowledge (supervisor only)
const acknowledgeViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);
    if (!violation) return res.status(404).json({ message: 'Violation not found.' });
    if (violation.status === 'acknowledged') {
      return res.status(400).json({ message: 'Violation already acknowledged.' });
    }

    violation.status = 'acknowledged';
    violation.acknowledgedBy = req.user._id;
    violation.acknowledgedAt = new Date();
    await violation.save();

    res.json({ violation });
  } catch (err) {
    res.status(500).json({ message: 'Failed to acknowledge violation.', error: err.message });
  }
};

// @route POST /api/violations/simulate
// Demo/manual trigger that mimics an IoT device reporting a non-compliance event.
// body: { workerId? , ppeType?, severity?, backdateMinutes? }
// backdateMinutes lets the demo instantly show escalation on the admin Alerts page
// instead of requiring a real 10 minute wait.
const simulateViolation = async (req, res) => {
  try {
    const { workerId, ppeType, severity, backdateMinutes } = req.body;

    let worker;
    if (workerId) {
      worker = await Worker.findOne({
        $or: [
          { workerId },
          mongoose.isValidObjectId(workerId) ? { _id: workerId } : { workerId: '__none__' }
        ]
      });
      if (!worker) return res.status(404).json({ message: 'Worker not found.' });
    } else {
      const count = await Worker.countDocuments({ isActive: true });
      if (count === 0) return res.status(400).json({ message: 'No active workers to simulate against.' });
      const random = Math.floor(Math.random() * count);
      worker = await Worker.findOne({ isActive: true }).skip(random);
    }

    const types = Violation.PPE_TYPES;
    const severities = Violation.SEVERITIES;
    const chosenType = ppeType || types[Math.floor(Math.random() * types.length)];
    const chosenSeverity = severity || severities[Math.floor(Math.random() * severities.length)];

    const detectedAt = backdateMinutes
      ? new Date(Date.now() - Number(backdateMinutes) * 60 * 1000)
      : new Date();

    const violation = await Violation.create({
      worker: worker._id,
      ppeType: chosenType,
      severity: chosenSeverity,
      department: worker.department,
      site: worker.site,
      deviceId: `IOT-SIM-${worker.workerId}`,
      description: `Simulated IoT detection: ${worker.name} not wearing ${chosenType}.`,
      detectedAt
    });

    const populated = await violation.populate('worker', 'name workerId jobProfile department');
    res.status(201).json({ violation: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to simulate violation.', error: err.message });
  }
};

module.exports = { getViolations, getAlerts, acknowledgeViolation, simulateViolation };
