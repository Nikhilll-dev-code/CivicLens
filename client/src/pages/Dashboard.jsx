import { useState, useEffect } from 'react';
import { getComplaints, getMyComplaints, updateComplaintStatus, markComplaintRead } from '../api';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data } = isAdmin ? await getComplaints() : await getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch complaints. Please ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [isAdmin]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!isAdmin) return; // Users cannot update status
    try {
      await updateComplaintStatus(id, newStatus);
      setComplaints(prevComplaints => 
        prevComplaints.map(comp => 
          comp._id === id ? { ...comp, status: newStatus } : comp
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Server error.');
    }
  };

  const handleMarkRead = async (id, currentReadStatus) => {
    if (!isAdmin) return;
    try {
      await markComplaintRead(id, !currentReadStatus);
      setComplaints(prevComplaints =>
        prevComplaints.map(comp =>
          comp._id === id ? { ...comp, isRead: !currentReadStatus } : comp
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const filteredComplaints = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="dashboard-container center-content">
        <div className="loader"></div>
        <p>Loading complaints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container center-content">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {isAdmin && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white', padding: '6px 16px', borderRadius: '20px',
            fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            🛡️ OFFICER PANEL
          </div>
        )}
        <h2>{isAdmin ? 'All Civic Complaints' : 'My Complaints'}</h2>
        <p>{isAdmin
          ? 'Review and resolve civic issues reported by citizens. Citizens are notified by email when you mark an issue as Resolved.'
          : 'Track the status of the issues you reported.'
        }</p>
        
        <div className="dashboard-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
          <div className="status-legend">
            <span className="legend-item"><span className="dot dot-pending"></span> Pending</span>
            <span className="legend-item"><span className="dot dot-progress"></span> In Progress</span>
            <span className="legend-item"><span className="dot dot-resolved"></span> Resolved</span>
          </div>

          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="empty-state card">
          <h3>No complaints found</h3>
          <p>There are no reports matching your view right now.</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {filteredComplaints.map(complaint => (
            <ComplaintCard 
              key={complaint._id} 
              complaint={complaint} 
              isAdmin={isAdmin}
              onStatusUpdate={handleStatusUpdate}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
