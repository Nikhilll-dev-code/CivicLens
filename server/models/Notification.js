const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'whatsapp'],
    required: true
  },
  complaintRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveryStatus: {
    type: String,
    enum: ['sent', 'simulated', 'failed'],
    default: 'sent'
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
