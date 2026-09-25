import { useState, useEffect } from 'react';
import { getAssignedComplaints, updateComplaintStatus, markComplaintRead } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const AuthorityDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Selected complaint for status update modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const { user } = useAuth();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data } = await getAssignedComplaints();
      setQueue(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load department queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Compute summary numbers
  const pendingCount = queue.filter(c => ['Pending', 'Submitted', 'ASSIGNED'].includes(c.status)).length;
  const inProgressCount = queue.filter(c => ['In Progress', 'ACKNOWLEDGED'].includes(c.status)).length;
  const resolvedCount = queue.filter(c => c.status === 'Resolved').length;
  const escalatedCount = queue.filter(c => ['Escalated', 'Needs Attention'].includes(c.status)).length;

  // Extract unique areas
  const areas = Array.from(new Set(queue.map(c => c.assignedAuthority?.area || c.location?.address || 'General Zone')));

  // Filter and sort
  let filteredQueue = queue.filter(item => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending' && !['Pending', 'Submitted', 'ASSIGNED'].includes(item.status)) return false;
      if (statusFilter === 'In Progress' && !['In Progress', 'ACKNOWLEDGED'].includes(item.status)) return false;
      if (statusFilter === 'Resolved' && item.status !== 'Resolved') return false;
      if (statusFilter === 'Escalated' && !['Escalated', 'Needs Attention'].includes(item.status)) return false;
    }
    if (areaFilter !== 'All') {
      const itemArea = item.assignedAuthority?.area || item.location?.address || '';
      if (!itemArea.includes(areaFilter)) return false;
    }
    return true;
  });

  if (sortBy === 'newest') {
    filteredQueue.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    filteredQueue.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const handleOpenUpdate = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdatingStatus(complaint.status);
  };

  const handleSaveStatus = async () => {
    if (!selectedComplaint || !updatingStatus) return;
    setUpdating(true);
    try {
      await updateComplaintStatus(selectedComplaint._id, updatingStatus);
      setQueue(prev => prev.map(c => c._id === selectedComplaint._id ? { ...c, status: updatingStatus } : c));
      setSelectedComplaint(null);
    } catch (err) {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRead = async (complaint) => {
    try {
      const newRead = !complaint.isRead;
      await markComplaintRead(complaint._id, newRead);
      setQueue(prev => prev.map(c => c._id === complaint._id ? { ...c, isRead: newRead } : c));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Department Queue...</div>;
  }

  return (
    <div className="authority-dashboard" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#1F3864' }}>
          {user?.department || 'Department Queue'} — Workload Queue
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Review, acknowledge, and resolve complaints assigned to your department.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #E8A33D' }}>
          <h1 style={{ color: '#E8A33D', margin: 0, fontSize: '2rem' }}>{pendingCount}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Pending</span>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #3B7DD8' }}>
          <h1 style={{ color: '#3B7DD8', margin: 0, fontSize: '2rem' }}>{inProgressCount}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>In Progress</span>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #3FA76A' }}>
          <h1 style={{ color: '#3FA76A', margin: 0, fontSize: '2rem' }}>{resolvedCount}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Resolved</span>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #D9534F' }}>
          <h1 style={{ color: '#D9534F', margin: 0, fontSize: '2rem' }}>{escalatedCount}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Escalated</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1F3864' }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #B9BEC7', fontSize: '0.85rem' }}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1F3864' }}>Area:</span>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #B9BEC7', fontSize: '0.85rem' }}>
            <option value="All">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1F3864' }}>Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #B9BEC7', fontSize: '0.85rem' }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Queue Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#1F3864', color: 'white' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Issue</th>
              <th style={{ padding: '12px' }}>Location</th>
              <th style={{ padding: '12px' }}>Filed</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                  No complaints in this queue view.
                </td>
              </tr>
            ) : (
              filteredQueue.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: item.isRead ? '#FFFFFF' : '#F0F4F8' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1F3864' }}>{item.complaintId}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{item.issueType}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {item.description}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#4B5563' }}>{item.location?.address || 'Coordinates logged'}</td>
                  <td style={{ padding: '12px', color: '#6B7280', fontSize: '0.85rem' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleOpenUpdate(item)}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '6px' }}
                    >
                      Update
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleToggleRead(item)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid #B9BEC7', color: '#4B5563' }}
                    >
                      {item.isRead ? 'Unread' : 'Mark Read'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for updating complaint status */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '520px', padding: '1.5rem', background: 'white' }}>
            <h3 style={{ color: '#1F3864', marginBottom: '0.5rem' }}>Update Complaint — {selectedComplaint.complaintId}</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
              Issue: <strong>{selectedComplaint.issueType}</strong> | Filed by: {selectedComplaint.createdBy?.name || 'Citizen'}
            </p>

            <img src={selectedComplaint.imageUrl} alt="Evidence" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }} />

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>"{selectedComplaint.description}"</p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#1F3864' }}>Update Status</label>
              <select 
                value={updatingStatus} 
                onChange={e => setUpdatingStatus(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #B9BEC7', fontSize: '0.95rem' }}
              >
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedComplaint(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveStatus} disabled={updating}>
                {updating ? 'Saving...' : 'Save Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityDashboard;
