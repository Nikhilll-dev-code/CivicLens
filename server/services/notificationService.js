const Notification = require('../models/Notification');
const { sendNewComplaintEmail, sendStatusUpdateEmail } = require('./emailService');

/**
 * Dispatch new complaint notification across channels
 */
const notifyNewComplaint = async (routedAuthority, complaint, citizen) => {
  // 1. Email notification (Live)
  try {
    await sendNewComplaintEmail(routedAuthority, complaint, citizen);
    await Notification.create({
      type: 'NEW_COMPLAINT',
      recipient: routedAuthority.email || 'authority@civiclens.gov',
      channel: 'email',
      complaintRef: complaint._id,
      deliveryStatus: 'sent'
    });
  } catch (err) {
    console.error('Notification log error (email):', err);
  }

  // 2. SMS notification (Simulated)
  console.log(`📱 [SIMULATED SMS] Dispatching to ${routedAuthority.phone || '+1-800-AUTHORITY'}: New complaint ${complaint.complaintId} assigned.`);
  try {
    await Notification.create({
      type: 'NEW_COMPLAINT',
      recipient: routedAuthority.phone || '+1-800-AUTHORITY',
      channel: 'sms',
      complaintRef: complaint._id,
      deliveryStatus: 'simulated'
    });
  } catch (err) {
    console.error('Notification log error (sms):', err);
  }

  // 3. WhatsApp notification (Simulated)
  console.log(`💬 [SIMULATED WHATSAPP] Dispatching to ${routedAuthority.phone || '+1-800-AUTHORITY'}: Alert: Complaint ${complaint.complaintId} (${complaint.issueType}) requires review.`);
  try {
    await Notification.create({
      type: 'NEW_COMPLAINT',
      recipient: routedAuthority.phone || '+1-800-AUTHORITY',
      channel: 'whatsapp',
      complaintRef: complaint._id,
      deliveryStatus: 'simulated'
    });
  } catch (err) {
    console.error('Notification log error (whatsapp):', err);
  }
};

/**
 * Dispatch status update notification to citizen
 */
const notifyStatusUpdate = async (citizen, complaint, newStatus) => {
  try {
    await sendStatusUpdateEmail(citizen, complaint, newStatus);
    await Notification.create({
      type: 'STATUS_UPDATE',
      recipient: citizen?.email || 'citizen@civiclens.gov',
      channel: 'email',
      complaintRef: complaint._id,
      deliveryStatus: 'sent'
    });
  } catch (err) {
    console.error('Notification log error (email status update):', err);
  }

  // Simulated SMS to citizen
  console.log(`📱 [SIMULATED SMS] Sent to citizen (${citizen?.email}): Status of ${complaint.complaintId} is now ${newStatus}.`);
  try {
    await Notification.create({
      type: 'STATUS_UPDATE',
      recipient: citizen?.email || 'citizen@civiclens.gov',
      channel: 'sms',
      complaintRef: complaint._id,
      deliveryStatus: 'simulated'
    });
  } catch (err) {
    console.error('Notification log error (sms status update):', err);
  }
};

module.exports = {
  notifyNewComplaint,
  notifyStatusUpdate
};
