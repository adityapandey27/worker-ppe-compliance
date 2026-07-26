const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    workerId: { type: String, required: true, unique: true, trim: true }, // e.g. WRK0001
    jobProfile: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    aadharNumber: { type: String, required: true, trim: true },
    site: { type: String, default: 'Main Site' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Mask Aadhar (PII) whenever a worker document is serialized to JSON
workerSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  if (obj.aadharNumber) {
    const digits = obj.aadharNumber.replace(/\s/g, '');
    obj.aadharNumber = `XXXX XXXX ${digits.slice(-4)}`;
  }
  return obj;
};

workerSchema.index({ department: 1 });

module.exports = mongoose.model('Worker', workerSchema);
