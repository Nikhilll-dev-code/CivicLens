/**
 * Run this ONCE to create the officer account:
 *   node seedOfficer.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const OFFICER_EMAIL = 'officer@civiclens.gov';
const OFFICER_PASSWORD = 'Officer@1234';
const OFFICER_NAME = 'Municipal Officer';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  const existing = await User.findOne({ email: OFFICER_EMAIL });
  if (existing) {
    console.log('⚠️  Officer account already exists. Email:', OFFICER_EMAIL);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(OFFICER_PASSWORD, salt);

  await User.create({
    name: OFFICER_NAME,
    email: OFFICER_EMAIL,
    password: hashedPassword,
    role: 'ADMIN'
  });

  console.log('✅ Officer account created!');
  console.log('   Email   :', OFFICER_EMAIL);
  console.log('   Password:', OFFICER_PASSWORD);
  console.log('   Role    : ADMIN');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error seeding officer:', err);
  process.exit(1);
});
