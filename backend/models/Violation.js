const mongoose = require('mongoose');

const PPE_TYPES = ['Helmet', 'Safety Vest', 'Safety Gloves', 'Safety Boots', 'Safety Goggles', 'Face Mask'];
const SEVERITIES = ['Low', 'Medium', 'High'];

const violationSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    ppeType: { type: String, enum: PPE_TYPES, required: true },
    severity: { type: String, enum: SEVERITIES, default: 'Medium' },
    site: { type: String, default: 'Main Site' },
    department: { type: String, required: true },
    deviceId: { type: String, default: 'SIMULATED-IOT-DEVICE' },
    description: { type: String, default: '' },

    status: { type: String, enum: ['pending', 'acknowledged'], default: 'pending' },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acknowledgedAt: { type: Date, default: null },

    // detectedAt is the "clock" the escalation logic uses. It is normally == createdAt,
    // but the demo "simulate" endpoint can back-date it so escalation can be demonstrated instantly.
    detectedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

violationSchema.index({ status: 1, detectedAt: 1 });
violationSchema.index({ department: 1 });

violationSchema.statics.PPE_TYPES = PPE_TYPES;
violationSchema.statics.SEVERITIES = SEVERITIES;

module.exports = mongoose.model('Violation', violationSchema);
