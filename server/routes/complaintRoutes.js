const express = require('express');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const nodemailer = require('nodemailer');
const Complaint = require('../models/Complaint');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'civiclens_complaints',
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});
const upload = multer({ storage: storage });

// Email Transporter Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * GET /api/complaints
 * Get all complaints (Admin) or general public dash
 * Let's keep this public for the transparency dashboard, or returning all
 */
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching complaints' });
  }
});

/**
 * GET /api/complaints/my
 * Get complaints for logged-in user
 */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching your complaints' });
  }
});

/**
 * POST /api/complaints
 * Create a new complaint (Requires Auth)
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { issueType, description, latitude, longitude, address } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = req.file.path;

    const newComplaint = new Complaint({
      issueType,
      description,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      },
      imageUrl,
      createdBy: req.user._id
    });

    const savedComplaint = await newComplaint.save();

    // Determine City Prefix from Address
    let cityPrefix = '';
    const addressLower = (address || '').toLowerCase();
    if (addressLower.includes('hyderabad')) {
      cityPrefix = 'hyd_';
    } else if (addressLower.includes('mumbai')) {
      cityPrefix = 'mumbai_';
    }

    // Determine the responsible department email based on the issue type
    let departmentEmail = '';
    switch(issueType) {
      case 'Garbage': departmentEmail = `${cityPrefix}municipal_dept@civiclens.gov`; break;
      case 'Pothole': departmentEmail = `${cityPrefix}roads_dept@civiclens.gov`; break;
      case 'Water Leak': departmentEmail = `${cityPrefix}water_dept@civiclens.gov`; break;
      case 'Streetlight': departmentEmail = `${cityPrefix}electrical_dept@civiclens.gov`; break;
      default: departmentEmail = `${cityPrefix}general_dept@civiclens.gov`;
    }

    const departmentNames = {
      'Garbage': 'Municipal / Sanitation Department',
      'Pothole': 'Roads & Infrastructure Department',
      'Water Leak': 'Water Supply Department',
      'Streetlight': 'Electrical / Streetlight Department'
    };

    // Always send confirmation to the complaint submitter's own email
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: `✅ Complaint Received: ${issueType} — CivicLens`,
      html: `
        <h2>Your Complaint Has Been Submitted</h2>
        <p>Hello <strong>${req.user.name}</strong>,</p>
        <p>Your complaint has been successfully recorded. Here are the details:</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Complaint ID</td><td style="padding:8px;">${savedComplaint._id}</td></tr>
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Issue Type</td><td style="padding:8px;">${issueType}</td></tr>
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Description</td><td style="padding:8px;">${description}</td></tr>
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Location</td><td style="padding:8px;">${address || (latitude + ', ' + longitude)}</td></tr>
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Status</td><td style="padding:8px;">${savedComplaint.status}</td></tr>
          <tr><td style="padding:8px;background:#f0fdf4;font-weight:bold;">Responsible Dept.</td><td style="padding:8px;">${departmentNames[issueType] || 'General Department'}</td></tr>
        </table>
        <br/>
        <img src="${imageUrl}" alt="Complaint Image" width="300" style="border-radius:8px;"/>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:2rem;">— CivicLens Team</p>
      `
    };

    transporter.sendMail(userMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending confirmation email to user:', error);
      } else {
        console.log('📧 Confirmation email sent to user:', info.response);
      }
    });

    res.status(201).json({
      message: 'Complaint submitted successfully',
      data: savedComplaint,
      routedTo: {
        email: departmentEmail,
        department: departmentNames[issueType] || 'General Department'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while submitting complaint' });
  }
});

/**
 * PUT /api/complaints/:id
 * Update complaint status (Admin only)
 */
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Send resolution email to citizen when status is set to Resolved
    if (status === 'Resolved' && complaint.createdBy?.email) {
      const resolvedMail = {
        from: process.env.EMAIL_USER,
        to: complaint.createdBy.email,
        subject: `✅ Your Complaint Has Been Resolved — CivicLens`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;">
            <h2 style="color:#047857;">✅ Issue Resolved!</h2>
            <p>Hello <strong>${complaint.createdBy.name}</strong>,</p>
            <p>Great news! Your civic complaint has been reviewed and <strong>marked as Resolved</strong> by the municipal officer.</p>
            <table style="border-collapse:collapse;width:100%;margin:20px 0;">
              <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:bold;border:1px solid #a7f3d0;">Issue Type</td><td style="padding:8px 12px;border:1px solid #a7f3d0;">${complaint.issueType}</td></tr>
              <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:bold;border:1px solid #a7f3d0;">Description</td><td style="padding:8px 12px;border:1px solid #a7f3d0;">${complaint.description}</td></tr>
              <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:bold;border:1px solid #a7f3d0;">Location</td><td style="padding:8px 12px;border:1px solid #a7f3d0;">${complaint.location?.address || 'N/A'}</td></tr>
              <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:bold;border:1px solid #a7f3d0;">Status</td><td style="padding:8px 12px;border:1px solid #a7f3d0;color:#047857;font-weight:bold;">✅ Resolved</td></tr>
            </table>
            <p>Thank you for helping improve your neighborhood. Your report made a difference! 🌟</p>
            <p style="color:#6b7280;font-size:0.85rem;margin-top:2rem;">— CivicLens Team</p>
          </div>
        `
      };
      transporter.sendMail(resolvedMail, (err, info) => {
        if (err) console.error('Failed to send resolution email:', err);
        else console.log('📧 Resolution email sent to citizen:', info.response);
      });
    }

    res.status(200).json({ message: 'Status updated successfully', data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
});


/**
 * PUT /api/complaints/:id/read
 * Mark complaint as read/unread (Admin only)
 */
router.put('/:id/read', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { isRead } = req.body;
    const { id } = req.params;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { isRead: Boolean(isRead) },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({ message: 'Read status updated', data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating read status' });
  }
});

/**
 * POST /api/complaints/forward/:id
 * Forward a specific complaint to the responsible department (user action)
 */
router.post('/forward/:id', verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('createdBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Only the owner can forward their complaint
    if (complaint.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only forward your own complaints' });
    }

    const { issueType, description, location, imageUrl } = complaint;
    const addressLower = (location.address || '').toLowerCase();
    let cityPrefix = '';
    if (addressLower.includes('hyderabad')) cityPrefix = 'hyd_';
    else if (addressLower.includes('mumbai')) cityPrefix = 'mumbai_';

    let departmentEmail = '';
    switch(issueType) {
      case 'Garbage': departmentEmail = `${cityPrefix}municipal_dept@civiclens.gov`; break;
      case 'Pothole': departmentEmail = `${cityPrefix}roads_dept@civiclens.gov`; break;
      case 'Water Leak': departmentEmail = `${cityPrefix}water_dept@civiclens.gov`; break;
      case 'Streetlight': departmentEmail = `${cityPrefix}electrical_dept@civiclens.gov`; break;
      default: departmentEmail = `${cityPrefix}general_dept@civiclens.gov`;
    }

    const departmentNames = {
      'Garbage': 'Municipal / Sanitation Department',
      'Pothole': 'Roads & Infrastructure Department',
      'Water Leak': 'Water Supply Department',
      'Streetlight': 'Electrical / Streetlight Department'
    };

    const departmentMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Sending to the app owner email since dept emails are placeholder. In prod, use: departmentEmail
      subject: `📢 [FORWARDED] Civic Complaint: ${issueType} — from ${complaint.createdBy.name}`,
      html: `
        <h2>Civic Complaint Forwarded by Citizen</h2>
        <p>A citizen has forwarded their complaint to your department for action.</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Complaint ID</td><td style="padding:8px;">${complaint._id}</td></tr>
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Issue Type</td><td style="padding:8px;">${issueType}</td></tr>
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Description</td><td style="padding:8px;">${description}</td></tr>
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Location</td><td style="padding:8px;">${location.address || (location.latitude + ', ' + location.longitude)}</td></tr>
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Submitted By</td><td style="padding:8px;">${complaint.createdBy.name} (${complaint.createdBy.email})</td></tr>
          <tr><td style="padding:8px;background:#fef9c3;font-weight:bold;">Department</td><td style="padding:8px;">${departmentNames[issueType] || 'General Department'} (${departmentEmail})</td></tr>
        </table>
        <br/>
        <img src="${imageUrl}" alt="Complaint Image" width="300" style="border-radius:8px;"/>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:2rem;">— Forwarded via CivicLens</p>
      `
    };

    await transporter.sendMail(departmentMailOptions);

    res.status(200).json({
      message: `Complaint forwarded to ${departmentNames[issueType] || 'General Department'}`,
      departmentEmail
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to forward complaint' });
  }
});

module.exports = router;
