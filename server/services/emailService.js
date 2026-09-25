const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email notification to routed authority upon new complaint submission
 */
const sendNewComplaintEmail = async (routedAuthority, complaint, citizen) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Skipping email delivery: EMAIL_USER or EMAIL_PASS not configured.');
    return;
  }

  const recipientEmail = routedAuthority.email || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"CivicLens Platform" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `🚨 [NEW COMPLAINT] ${complaint.issueType} — ID: ${complaint.complaintId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1F3864; color: white; padding: 16px 20px;">
          <h2 style="margin: 0;">🏛️ CivicLens Complaint Dispatch</h2>
          <p style="margin: 4px 0 0; font-size: 0.9rem;">Assigned to: ${routedAuthority.name} (${routedAuthority.department})</p>
        </div>
        <div style="padding: 20px;">
          <p>A new civic complaint has been routed to your department for resolution.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold; width: 35%;">Complaint ID</td><td style="padding: 8px;">${complaint.complaintId}</td></tr>
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold;">Issue Type</td><td style="padding: 8px;">${complaint.issueType}</td></tr>
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold;">Description</td><td style="padding: 8px;">${complaint.description}</td></tr>
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold;">Location</td><td style="padding: 8px;">${complaint.location?.address || `${complaint.location?.latitude}, ${complaint.location?.longitude}`}</td></tr>
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold;">Submitted By</td><td style="padding: 8px;">${citizen?.name} (${citizen?.email})</td></tr>
            <tr><td style="padding: 8px; background: #f4f5f7; font-weight: bold;">Status</td><td style="padding: 8px; color: #2E5395; font-weight: bold;">${complaint.status}</td></tr>
          </table>
          ${complaint.imageUrl ? `<img src="${complaint.imageUrl}" alt="Evidence Photo" style="max-width: 100%; border-radius: 6px; border: 1px solid #ccc;"/>` : ''}
          <p style="margin-top: 20px; font-size: 0.85rem; color: #6b7280;">Log in to the CivicLens Authority Portal to review and update status.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Authority email notification dispatched:', info.response);
  } catch (err) {
    console.error('❌ Failed to send authority notification email:', err.message);
  }
};

/**
 * Send status change update email to citizen
 */
const sendStatusUpdateEmail = async (citizen, complaint, newStatus) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !citizen?.email) {
    return;
  }

  const mailOptions = {
    from: `"CivicLens Platform" <${process.env.EMAIL_USER}>`,
    to: citizen.email,
    subject: `🔔 Status Update: Complaint ${complaint.complaintId} is now ${newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1F3864; color: white; padding: 16px 20px;">
          <h2 style="margin: 0;">Complaint Status Update</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${citizen.name}</strong>,</p>
          <p>The status of your reported issue <strong>${complaint.issueType}</strong> (ID: <code>${complaint.complaintId}</code>) has been updated to:</p>
          <div style="background: #f0fdf4; border: 1px solid #3FA76A; padding: 12px; border-radius: 6px; text-align: center; font-size: 1.2rem; font-weight: bold; color: #1F3864; margin: 15px 0;">
            ${newStatus}
          </div>
          <p><strong>Description:</strong> ${complaint.description}</p>
          <p><strong>Location:</strong> ${complaint.location?.address || 'N/A'}</p>
          <p style="font-size: 0.85rem; color: #6b7280; margin-top: 20px;">Thank you for helping keep our community safe and clean with CivicLens.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Citizen status update email sent:', info.response);
  } catch (err) {
    console.error('❌ Failed to send status update email to citizen:', err.message);
  }
};

module.exports = {
  sendNewComplaintEmail,
  sendStatusUpdateEmail
};
