const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Load routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/authorities', authorityRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const PRIMARY_MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civiclens';
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/civiclens';

const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  tlsAllowInvalidCertificates: true
};

const { seedAuthorities, seedUsers } = require('./seedData');

const connectAndStartServer = async () => {
  try {
    await mongoose.connect(PRIMARY_MONGO_URI, mongoOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (primaryErr) {
    console.warn(`⚠️ Primary MongoDB connection failed (${primaryErr.code || primaryErr.message}). Attempting fallback to local MongoDB...`);
    try {
      await mongoose.connect(LOCAL_MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to local MongoDB fallback successfully');
    } catch (localErr) {
      console.error('❌ Failed to connect to both Primary and Local MongoDB.');
      console.error('💡 TIP 1: Check your internet connection if using MongoDB Atlas.');
      console.error('💡 TIP 2: Ensure your IP is whitelisted in MongoDB Atlas Network Access settings.');
      console.error('💡 TIP 3: To run locally, start a local MongoDB service or update MONGO_URI=mongodb://127.0.0.1:27017/civiclens in server/.env');
      process.exit(1);
    }
  }

  // Auto seed default authorities and test accounts if database is fresh
  try {
    await seedAuthorities();
    await seedUsers();
  } catch (seedErr) {
    console.warn('Auto-seed warning:', seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CivicLens v2.0 Server running on port ${PORT}`);
  });
};

connectAndStartServer();
