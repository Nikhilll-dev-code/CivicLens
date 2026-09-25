const express = require('express');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Complaint = require('../models/Complaint');
const Authority = require('../models/Authority');
const User = require('../models/User');
const { verifyToken, verifyAdmin, verifyAuthorityOrAdmin } = require('../middleware/auth');
const { routeComplaint } = require('../services/authorityRoutingService');
const { notifyNewComplaint, notifyStatusUpdate } = require('../services/notificationService');

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
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});
const upload = multer({ storage: storage });

/**
 * Helper to generate Complaint ID (e.g. CLX-1042)
 */
const generateComplaintId = async () => {
  const count = await Complaint.countDocuments();
  const nextNum = 1000 + count + 1;
  return `CLX-${nextNum}`;
};

/**
 * GET /api/complaints
 * System-wide complaints list (Admin/Authority)
 */
router.get('/', verifyToken, verifyAuthorityOrAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('createdBy', 'name email role')
      .populate('assignedAuthority', 'name department area email phone active')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching all complaints:', err);
    res.status(500).json({ error: 'Server error fetching complaints.' });
  }
});

/**
 * GET /api/complaints/mine (and /my)
 * List complaints reported by the logged-in citizen
 */
const getMyComplaintsHandler = async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email role')
      .populate('assignedAuthority', 'name department area email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching user complaints:', err);
    res.status(500).json({ error: 'Server error fetching your complaints.' });
  }
};
router.get('/mine', verifyToken, getMyComplaintsHandler);
router.get('/my', verifyToken, getMyComplaintsHandler);

/**
 * GET /api/complaints/assigned
 * List complaints assigned to the logged-in authority staff
 */
router.get('/assigned', verifyToken, async (req, res) => {
  try {
    // Find authority record matching the logged-in user's department or email
    let authorityRecord = null;
    if (req.user.department) {
      authorityRecord = await Authority.findOne({ department: req.user.department });
    }
    if (!authorityRecord) {
      authorityRecord = await Authority.findOne({ email: req.user.email });
    }

    let filter = {};
    if (authorityRecord) {
      filter = { assignedAuthority: authorityRecord._id };
    } else if (req.user.department) {
      // Find all authorities matching department
      const auths = await Authority.find({ department: req.user.department });
      filter = { assignedAuthority: { $in: auths.map(a => a._id) } };
    }

    const complaints = await Complaint.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedAuthority', 'name department area email phone')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Error fetching assigned complaints:', err);
    res.status(500).json({ error: 'Server error fetching department queue.' });
  }
});

/**
 * POST /api/complaints
 * Submit a new complaint (Citizen)
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { issueType, description, latitude, longitude, address } = req.body;

    if (!issueType || !description) {
      return res.status(400).json({ error: 'Issue type and description are required.' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Geolocation (latitude/longitude) is required.' });
    }
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'Evidentiary photo upload is required.' });
    }

    const imageUrl = req.file.path;
    const complaintId = await generateComplaintId();

    // Perform database-driven automatic authority routing
    const { authority, fallback } = await routeComplaint({ issueType, address });

    const newComplaint = new Complaint({
      complaintId,
      issueType,
      description,
      imageUrl,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || ''
      },
      createdBy: req.user._id,
      assignedAuthority: authority._id,
      status: 'ASSIGNED',
      needsAdminReview: fallback
    });

    const savedComplaint = await newComplaint.save();
    await savedComplaint.populate('assignedAuthority', 'name department area email phone');
    await savedComplaint.populate('createdBy', 'name email');

    // Trigger centralized notifications (Email to authority, simulated SMS/WhatsApp)
    notifyNewComplaint(authority, savedComplaint, req.user);

    res.status(201).json({
      message: 'Complaint submitted and routed successfully',
      data: savedComplaint,
      routedTo: {
        department: authority.department,
        name: authority.name,
        email: authority.email,
        area: authority.area
      }
    });
  } catch (err) {
    console.error('Error submitting complaint:', err);
    res.status(500).json({ error: err.message || 'Server error while submitting complaint.' });
  }
});

/**
 * PATCH /api/complaints/:id/status (and PUT /:id)
 * Update complaint status (Authority or Admin)
 */
const updateStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['Pending', 'Submitted', 'ASSIGNED', 'ACKNOWLEDGED', 'In Progress', 'Resolved', 'Escalated', 'Needs Attention'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateFields = { status };
    if (status === 'Resolved' || status === 'RESOLVED') {
      updateFields.resolvedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedAuthority', 'name department area email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Trigger status update notification to citizen
    if (complaint.createdBy) {
      notifyStatusUpdate(complaint.createdBy, complaint, status);
    }

    res.json({ message: 'Complaint status updated successfully', data: complaint });
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ error: 'Server error updating status.' });
  }
};
router.patch('/:id/status', verifyToken, verifyAuthorityOrAdmin, updateStatusHandler);
router.put('/:id', verifyToken, verifyAuthorityOrAdmin, updateStatusHandler);

/**
 * PATCH /api/complaints/:id/read (and PUT /:id/read)
 * Mark complaint as read/unread (Authority or Admin)
 */
const updateReadHandler = async (req, res) => {
  try {
    const { isRead } = req.body;
    const { id } = req.params;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { isRead: Boolean(isRead) },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    res.json({ message: 'Read status updated', data: complaint });
  } catch (err) {
    console.error('Error updating read status:', err);
    res.status(500).json({ error: 'Server error updating read status.' });
  }
};
router.patch('/:id/read', verifyToken, verifyAuthorityOrAdmin, updateReadHandler);
router.put('/:id/read', verifyToken, verifyAuthorityOrAdmin, updateReadHandler);

/**
 * PATCH /api/complaints/:id/reassign
 * Reassign complaint to a different authority (Admin only)
 */
router.patch('/:id/reassign', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { authorityId } = req.body;
    const { id } = req.params;

    const newAuthority = await Authority.findById(authorityId);
    if (!newAuthority) {
      return res.status(400).json({ error: 'Target authority record not found.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        assignedAuthority: newAuthority._id,
        needsAdminReview: false,
        status: 'ASSIGNED'
      },
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedAuthority', 'name department area email');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Notify newly assigned authority
    notifyNewComplaint(newAuthority, complaint, complaint.createdBy);

    res.json({ message: 'Complaint reassigned successfully', data: complaint });
  } catch (err) {
    console.error('Error reassigning complaint:', err);
    res.status(500).json({ error: 'Server error reassigning complaint.' });
  }
});

module.exports = router;
