const Authority = require('../models/Authority');

const DEPARTMENT_MAP = {
  'Pothole': 'Roads Department',
  'Garbage': 'Sanitation Department',
  'Water Leak': 'Water Supply Department',
  'Water Leakage': 'Water Supply Department',
  'Streetlight': 'Electrical Department',
  'Drainage': 'Drainage Department',
  'Other': 'General Municipal Department'
};

/**
 * Routes a complaint based on issueType and location/address to an active Authority
 * @param {Object} complaintData - { issueType, address }
 * @returns {Promise<{ authority: Object, fallback: boolean }>}
 */
const routeComplaint = async ({ issueType, address }) => {
  const targetDepartment = DEPARTMENT_MAP[issueType] || 'General Municipal Department';
  const addressLower = (address || '').toLowerCase();

  // Find all active authorities for this department
  const activeAuthorities = await Authority.find({ department: targetDepartment, active: true });

  if (activeAuthorities.length > 0) {
    // Check if any authority area matches the address string
    const areaMatch = activeAuthorities.find(auth => {
      if (!auth.area) return false;
      const areaLower = auth.area.toLowerCase();
      return addressLower.includes(areaLower) || areaLower.includes('zone');
    });

    if (areaMatch) {
      return { authority: areaMatch, fallback: false };
    }

    // Default to the first active authority for this department
    return { authority: activeAuthorities[0], fallback: false };
  }

  // Fallback to General Municipal Department if specific department authority is unavailable
  let generalAuthority = await Authority.findOne({ department: 'General Municipal Department', active: true });
  
  if (!generalAuthority) {
    // If no general municipal authority exists, find any active authority
    generalAuthority = await Authority.findOne({ active: true });
  }

  if (!generalAuthority) {
    // Create a default fallback authority record if none exists in DB
    generalAuthority = await Authority.create({
      name: 'General Municipal Office',
      department: 'General Municipal Department',
      area: 'Zone A-D',
      email: process.env.EMAIL_USER || 'general_dept@civiclens.gov',
      phone: '+1-800-CIVIC-00',
      active: true
    });
  }

  return { authority: generalAuthority, fallback: true };
};

module.exports = { routeComplaint, DEPARTMENT_MAP };
