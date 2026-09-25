const express = require('express');
const Authority = require('../models/Authority');
const { verifyToken, verifyAdmin, verifyAuthorityOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/authorities - Get all authority records
router.get('/', verifyToken, verifyAuthorityOrAdmin, async (req, res) => {
  try {
    const authorities = await Authority.find().sort({ department: 1, name: 1 });
    res.json(authorities);
  } catch (err) {
    console.error('Error fetching authorities:', err);
    res.status(500).json({ error: 'Server error fetching authority records.' });
  }
});

// POST /api/authorities - Create new authority record (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, department, area, email, phone, active } = req.body;

    if (!name || !department || !area || !email) {
      return res.status(400).json({ error: 'Name, department, area, and email are required.' });
    }

    const newAuthority = new Authority({
      name,
      department,
      area,
      email,
      phone: phone || '',
      active: active !== undefined ? active : true
    });

    const saved = await newAuthority.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating authority:', err);
    res.status(500).json({ error: 'Server error creating authority record.' });
  }
});

// PATCH /api/authorities/:id - Update authority record (Admin only)
router.patch('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, department, area, email, phone, active } = req.body;

    const updated = await Authority.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(department && { department }),
        ...(area && { area }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(active !== undefined && { active })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Authority record not found.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating authority:', err);
    res.status(500).json({ error: 'Server error updating authority record.' });
  }
});

// DELETE /api/authorities/:id - Delete authority record (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Authority.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Authority record not found.' });
    }
    res.json({ message: 'Authority record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting authority:', err);
    res.status(500).json({ error: 'Server error deleting authority record.' });
  }
});

module.exports = router;
