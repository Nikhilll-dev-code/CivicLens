const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiclens';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected. Wiping demo data...');
    
    await Complaint.deleteMany({});
    console.log('Old complaints deleted.');

    await User.deleteMany({});
    console.log('Old users deleted.');

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
