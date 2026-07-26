const { Parser } = require('json2csv');
const Violation = require('../models/Violation');

// @route GET /api/reports/violations/export
// Exports the (optionally filtered) violations list as a downloadable CSV
const exportViolationsCsv = async (req, res) => {
  try {
    const { status, department, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (from || to) {
      filter.detectedAt = {};
      if (from) filter.detectedAt.$gte = new Date(from);
      if (to) filter.detectedAt.$lte = new Date(to);
    }

    const violations = await Violation.find(filter)
      .populate('worker', 'name workerId jobProfile department')
      .populate('acknowledgedBy', 'name email')
      .sort({ detectedAt: -1 });

    const rows = violations.map((v) => ({
      detectedAt: v.detectedAt.toISOString(),
      workerName: v.worker?.name || 'N/A',
      workerId: v.worker?.workerId || 'N/A',
      jobProfile: v.worker?.jobProfile || 'N/A',
      department: v.department,
      ppeType: v.ppeType,
      severity: v.severity,
      status: v.status,
      acknowledgedBy: v.acknowledgedBy?.name || '',
      acknowledgedAt: v.acknowledgedAt ? v.acknowledgedAt.toISOString() : '',
      deviceId: v.deviceId
    }));

    const fields = [
      'detectedAt',
      'workerName',
      'workerId',
      'jobProfile',
      'department',
      'ppeType',
      'severity',
      'status',
      'acknowledgedBy',
      'acknowledgedAt',
      'deviceId'
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`violations-report-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export report.', error: err.message });
  }
};

module.exports = { exportViolationsCsv };
