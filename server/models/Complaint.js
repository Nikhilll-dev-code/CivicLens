const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Pothole', 'Garbage', 'Water Leakage', 'Water Leak', 'Streetlight', 'Drainage', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
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
      type: String,
      default: ''
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAuthority: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Authority'
  },
  status: {
    type: String,
    default: 'ASSIGNED',
    enum: [
      'Pending', 'Submitted', 'Assigned', 'Acknowledged', 'In Progress', 'Resolved', 'Escalated', 'Needs Attention',
      'PENDING', 'SUBMITTED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN PROGRESS', 'RESOLVED', 'ESCALATED', 'NEEDS ATTENTION'
    ]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  needsAdminReview: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
