const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Authority = require('./models/Authority');

dotenv.config();

const DEFAULT_AUTHORITIES = [
  { name: 'Roads Dept.', department: 'Roads Department', area: 'Zone A-C', email: 'roads_dept@civiclens.gov', phone: '+1-800-ROADS-01', active: true },
  { name: 'Sanitation Dept.', department: 'Sanitation Department', area: 'Zone A-D', email: 'sanitation_dept@civiclens.gov', phone: '+1-800-CLEAN-02', active: true },
  { name: 'Water Supply Dept.', department: 'Water Supply Department', area: 'Zone B', email: 'water_dept@civiclens.gov', phone: '+1-800-WATER-03', active: true },
  { name: 'Electrical Dept.', department: 'Electrical Department', area: 'Zone A-C', email: 'electrical_dept@civiclens.gov', phone: '+1-800-POWER-04', active: true },
  { name: 'Drainage Dept.', department: 'Drainage Department', area: 'Zone A-D', email: 'drainage_dept@civiclens.gov', phone: '+1-800-DRAIN-05', active: true },
  { name: 'General Municipal Dept.', department: 'General Municipal Department', area: 'Zone A-D', email: 'general_dept@civiclens.gov', phone: '+1-800-CIVIC-00', active: true }
];

const seedAuthorities = async () => {
  for (const authData of DEFAULT_AUTHORITIES) {
    const exists = await Authority.findOne({ department: authData.department });
    if (!exists) {
      await Authority.create(authData);
      console.log(`✅ Seeded Authority: ${authData.department}`);
    }
  }
};

const seedUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  const defaultUsers = [
    { name: 'Demo Citizen', email: 'citizen@civiclens.gov', password: defaultPasswordHash, role: 'USER' },
    { name: 'Roads Officer', email: 'authority@civiclens.gov', password: defaultPasswordHash, role: 'AUTHORITY', department: 'Roads Department', area: 'Zone A-C' },
    { name: 'System Admin', email: 'admin@civiclens.gov', password: defaultPasswordHash, role: 'ADMIN' }
  ];

  for (const userData of defaultUsers) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      await User.create(userData);
      console.log(`👤 Seeded User: ${userData.email} (${userData.role})`);
    }
  }
};

const runSeed = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiclens';
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');
    await seedAuthorities();
    await seedUsers();
    console.log('🎉 Seeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedAuthorities, seedUsers };
