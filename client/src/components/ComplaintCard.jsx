import './ComplaintCard.css';

const ComplaintCard = ({ complaint, isAdmin, onStatusUpdate, onMarkRead }) => {
  const { _id, issueType, description, location, imageUrl, status, createdAt, createdBy, isRead } = complaint;

  // Calculate days unresolved
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let escalationBadge = null;
  if (status !== 'Resolved') {
    if (diffDays > 7) {
      escalationBadge = <span className="badge badge-escalated">🚨 Escalated ({diffDays}d)</span>;
    } else if (diffDays > 3) {
      escalationBadge = <span className="badge badge-warning">⚠ Needs Attention ({diffDays}d)</span>;
    }
  }

  const handleStatusChange = (newStatus) => {
    onStatusUpdate(_id, newStatus);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'In Progress': return 'status-progress';
      case 'Resolved': return 'status-resolved';
      default: return 'status-pending';
    }
  };

  const displayLocation = location?.address || (location?.latitude ? `${location.latitude}, ${location.longitude}` : 'Location unknown');

  return (
    <div className={`card complaint-card ${isAdmin && !isRead ? 'unread-card' : ''}`}>
      <div className="card-image-container">
        <img src={imageUrl} alt={issueType} className="card-image" />
        <div className={`status-pill ${getStatusClass(status)}`}>{status}</div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3>{issueType}</h3>
          {escalationBadge}
        </div>
        <p className="card-location">📍 {displayLocation}</p>
        <p className="card-description">{description}</p>
        
        {isAdmin && createdBy && (
          <p className="card-user-info" style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            🧑 Reported by: {createdBy.name}
          </p>
        )}

        <div className="card-footer">
          <span className="card-date">
            Reported: {createdDate.toLocaleDateString()}
          </span>
          
          {isAdmin && status !== 'Resolved' && (
            <div className="card-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {status === 'Pending' && (
                <button className="btn btn-sm btn-progress" onClick={() => handleStatusChange('In Progress')}>
                  Mark In Progress
                </button>
              )}
              <button className="btn btn-sm btn-resolve" onClick={() => handleStatusChange('Resolved')}>
                ✅ Mark Resolved
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
