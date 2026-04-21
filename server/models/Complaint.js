const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Garbage', 'Pothole', 'Water Leak', 'Streetlight']
  },
  description: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'In Progress', 'Resolved']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);
