import React from 'react';

const StatusBadge = ({ status }) => {
  const normStatus = (status || 'Pending').trim();
  
  let badgeClass = 'pending';
  let label = normStatus;

  if (['Pending', 'Submitted', 'ASSIGNED'].includes(normStatus)) {
    badgeClass = 'pending';
    label = normStatus === 'ASSIGNED' ? 'Assigned' : 'Pending';
  } else if (['In Progress', 'ACKNOWLEDGED'].includes(normStatus)) {
    badgeClass = 'in-progress';
    label = normStatus === 'ACKNOWLEDGED' ? 'Acknowledged' : 'In Progress';
  } else if (normStatus === 'Resolved') {
    badgeClass = 'resolved';
    label = 'Resolved';
  } else if (['Escalated', 'Needs Attention'].includes(normStatus)) {
    badgeClass = 'escalated';
    label = normStatus;
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
