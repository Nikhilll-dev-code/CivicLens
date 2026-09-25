const express = require('express');
const Complaint = require('../models/Complaint');
const Authority = require('../models/Authority');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics - System-wide statistics for Admin
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const activeAuthorities = await Authority.countDocuments({ active: true });

    const complaints = await Complaint.find()
      .populate('createdBy', 'name email')
      .populate('assignedAuthority', 'name department area email');

    const now = new Date();

    let pendingCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let escalatedCount = 0;

    let totalResolutionTimeMs = 0;
    let resolvedItemCount = 0;

    const issueTypeBreakdown = {};
    const departmentBreakdown = {};
    const areaBreakdown = {};
    const needsAdminReviewList = [];

    complaints.forEach(c => {
      const ageDays = (now - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      
      // Determine effective status (including age-based escalation)
      let status = c.status;
      if (status !== 'Resolved') {
        if (ageDays >= 7 || status === 'Escalated') {
          status = 'Escalated';
          escalatedCount++;
        } else if (status === 'In Progress') {
          inProgressCount++;
        } else {
          pendingCount++;
        }
      } else {
        resolvedCount++;
        if (c.resolvedAt) {
          totalResolutionTimeMs += (new Date(c.resolvedAt) - new Date(c.createdAt));
          resolvedItemCount++;
        } else {
          totalResolutionTimeMs += (new Date(c.updatedAt) - new Date(c.createdAt));
          resolvedItemCount++;
        }
      }

      // Breakdowns
      issueTypeBreakdown[c.issueType] = (issueTypeBreakdown[c.issueType] || 0) + 1;
      
      const deptName = c.assignedAuthority?.department || 'Unassigned / General';
      departmentBreakdown[deptName] = (departmentBreakdown[deptName] || 0) + 1;

      const areaName = c.assignedAuthority?.area || c.location?.address || 'Unknown Area';
      areaBreakdown[areaName] = (areaBreakdown[areaName] || 0) + 1;

      // Check if complaint needs admin review
      if (c.needsAdminReview || status === 'Escalated' || !c.assignedAuthority) {
        needsAdminReviewList.push({
          id: c._id,
          complaintId: c.complaintId,
          issueType: c.issueType,
          description: c.description,
          status,
          ageDays: Math.floor(ageDays),
          reason: c.needsAdminReview ? 'No matching authority for area (fallback routed)' : (status === 'Escalated' ? `Escalated (${Math.floor(ageDays)} days unresolved)` : 'Unassigned'),
          assignedAuthority: c.assignedAuthority
        });
      }
    });

    const avgResolutionDays = resolvedItemCount > 0 
      ? (totalResolutionTimeMs / resolvedItemCount / (1000 * 60 * 60 * 24)).toFixed(1)
      : '0.0';

    res.json({
      totalComplaints,
      activeAuthorities,
      escalatedCount,
      avgResolutionDays,
      statusCounts: {
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        escalated: escalatedCount
      },
      issueTypeBreakdown,
      departmentBreakdown,
      areaBreakdown,
      needsAdminReviewList
    });
  } catch (err) {
    console.error('Analytics computation error:', err);
    res.status(500).json({ error: 'Server error computing system analytics.' });
  }
});

module.exports = router;
