require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    const mongoOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      tlsAllowInvalidCertificates: true
    };
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log('✅ MongoDB connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:');
    console.error(err);
    process.exit(1);
  }
}

testConnection();
