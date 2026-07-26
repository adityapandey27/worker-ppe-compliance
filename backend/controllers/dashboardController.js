const Violation = require('../models/Violation');
const Worker = require('../models/Worker');
const User = require('../models/User');

const ESCALATION_MS = () => (Number(process.env.ESCALATION_MINUTES) || 10) * 60 * 1000;
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

// @route GET /api/dashboard/admin (admin only)
const getAdminMetrics = async (req, res) => {
  try {
    const [totalWorkers, totalSupervisors, violationsToday, pendingTotal, acknowledgedToday, escalatedAlerts] =
      await Promise.all([
        Worker.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'supervisor' }),
        Violation.countDocuments({ detectedAt: { $gte: startOfToday() } }),
        Violation.countDocuments({ status: 'pending' }),
        Violation.countDocuments({ status: 'acknowledged', acknowledgedAt: { $gte: startOfToday() } }),
        Violation.countDocuments({ status: 'pending', detectedAt: { $lte: new Date(Date.now() - ESCALATION_MS()) } })
      ]);

    const totalViolationsAllTime = await Violation.countDocuments();
    const totalAcknowledgedAllTime = await Violation.countDocuments({ status: 'acknowledged' });
    const complianceResponseRate =
      totalViolationsAllTime === 0 ? 100 : Math.round((totalAcknowledgedAllTime / totalViolationsAllTime) * 100);

    res.json({
      totalWorkers,
      totalSupervisors,
      violationsToday,
      pendingViolations: pendingTotal,
      acknowledgedToday,
      escalatedAlerts,
      complianceResponseRate
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load admin metrics.', error: err.message });
  }
};

// @route GET /api/dashboard/supervisor
const getSupervisorMetrics = async (req, res) => {
  try {
    const [violationsToday, pending, acknowledgedByMe, totalWorkers] = await Promise.all([
      Violation.countDocuments({ detectedAt: { $gte: startOfToday() } }),
      Violation.countDocuments({ status: 'pending' }),
      Violation.countDocuments({ acknowledgedBy: req.user._id }),
      Worker.countDocuments({ isActive: true })
    ]);

    // Average response time (minutes) across violations this supervisor acknowledged
    const acknowledgedDocs = await Violation.find({
      acknowledgedBy: req.user._id,
      acknowledgedAt: { $ne: null }
    }).select('detectedAt acknowledgedAt');

    let avgResponseMinutes = 0;
    if (acknowledgedDocs.length > 0) {
      const totalMs = acknowledgedDocs.reduce(
        (sum, v) => sum + (new Date(v.acknowledgedAt) - new Date(v.detectedAt)),
        0
      );
      avgResponseMinutes = Math.round(totalMs / acknowledgedDocs.length / 60000);
    }

    res.json({
      violationsToday,
      pendingViolations: pending,
      acknowledgedByMe: acknowledgedByMe,
      totalWorkers,
      avgResponseMinutes
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load supervisor metrics.', error: err.message });
  }
};

// @route GET /api/dashboard/insights (admin only) - chart-ready aggregate data
const getInsights = async (req, res) => {
  try {
    const [byPpeType, byDepartment, bySeverity, last7Days] = await Promise.all([
      Violation.aggregate([{ $group: { _id: '$ppeType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Violation.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Violation.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Violation.aggregate([
        { $match: { detectedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const topViolators = await Violation.aggregate([
      { $group: { _id: '$worker', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: 'workers', localField: '_id', foreignField: '_id', as: 'worker' }
      },
      { $unwind: '$worker' },
      { $project: { count: 1, name: '$worker.name', workerId: '$worker.workerId', department: '$worker.department' } }
    ]);

    res.json({
      byPpeType: byPpeType.map((d) => ({ type: d._id, count: d.count })),
      byDepartment: byDepartment.map((d) => ({ department: d._id, count: d.count })),
      bySeverity: bySeverity.map((d) => ({ severity: d._id, count: d.count })),
      last7Days: last7Days.map((d) => ({ date: d._id, count: d.count })),
      topViolators
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load insights.', error: err.message });
  }
};

module.exports = { getAdminMetrics, getSupervisorMetrics, getInsights };
