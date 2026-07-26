require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Violation = require('../models/Violation');
const workersData = require('./workers.json');

const run = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await Promise.all([User.deleteMany({}), Worker.deleteMany({}), Violation.deleteMany({})]);

  console.log('Seeding admin user...');
  const admin = await User.create({
    name: 'System Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@ppe.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    site: 'Head Office'
  });

  console.log('Seeding demo supervisor...');
  const supervisor = await User.create({
    name: 'Yamini Chatterjee',
    email: 'supervisor@ppe.com',
    password: 'Supervisor@123',
    role: 'supervisor',
    site: 'Main Site',
    createdBy: admin._id
  });

  console.log('Seeding workers from provided dataset...');
  const workers = await Worker.insertMany(workersData);

  console.log('Seeding a few sample violations for demo purposes...');
  const ppeTypes = Violation.PPE_TYPES;
  const now = Date.now();

  const sampleViolations = [
    // A violation acknowledged already (closed case)
    {
      worker: workers[0]._id,
      ppeType: 'Helmet',
      severity: 'High',
      department: workers[0].department,
      site: workers[0].site,
      deviceId: `IOT-SIM-${workers[0].workerId}`,
      description: `Simulated IoT detection: ${workers[0].name} not wearing Helmet.`,
      detectedAt: new Date(now - 60 * 60 * 1000),
      status: 'acknowledged',
      acknowledgedBy: supervisor._id,
      acknowledgedAt: new Date(now - 55 * 60 * 1000)
    },
    // A fresh pending violation (well within the 10 minute window -> stays on Violations page only)
    {
      worker: workers[1]._id,
      ppeType: 'Safety Gloves',
      severity: 'Medium',
      department: workers[1].department,
      site: workers[1].site,
      deviceId: `IOT-SIM-${workers[1].workerId}`,
      description: `Simulated IoT detection: ${workers[1].name} not wearing Safety Gloves.`,
      detectedAt: new Date(now - 2 * 60 * 1000),
      status: 'pending'
    },
    // A pending violation older than 10 minutes -> will already show up in Admin > Alerts
    {
      worker: workers[3]._id,
      ppeType: 'Safety Boots',
      severity: 'High',
      department: workers[3].department,
      site: workers[3].site,
      deviceId: `IOT-SIM-${workers[3].workerId}`,
      description: `Simulated IoT detection: ${workers[3].name} not wearing Safety Boots.`,
      detectedAt: new Date(now - 25 * 60 * 1000),
      status: 'pending'
    },
    // A second escalated one, different department
    {
      worker: workers[2]._id,
      ppeType: 'Safety Goggles',
      severity: 'Low',
      department: workers[2].department,
      site: workers[2].site,
      deviceId: `IOT-SIM-${workers[2].workerId}`,
      description: `Simulated IoT detection: ${workers[2].name} not wearing Safety Goggles.`,
      detectedAt: new Date(now - 15 * 60 * 1000),
      status: 'pending'
    }
  ];

  await Violation.insertMany(sampleViolations);

  console.log('\nSeed complete.');
  console.log('----------------------------------------');
  console.log('Admin login   :', admin.email, '/', process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123');
  console.log('Supervisor    :', supervisor.email, '/ Supervisor@123');
  console.log(`Workers seeded: ${workers.length}`);
  console.log(`Violations seeded: ${sampleViolations.length}`);
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
