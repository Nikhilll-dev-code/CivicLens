import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyComplaints } from '../api';
import StatusBadge from '../components/StatusBadge';

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await getMyComplaints();
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading your complaints...</div>;
  }

  return (
    <div className="citizen-dashboard" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#1F3864' }}>My Complaints</h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Track the status and department routing for issues you reported.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/report')}>
          + Report Issue
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {complaints.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#1F3864', marginBottom: '0.5rem' }}>No complaints filed yet</h3>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>You have not reported any civic issues yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/report')}>
            Report an Issue Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {complaints.map(complaint => (
            <div key={complaint._id} className="card" style={{ display: 'flex', gap: '1.25rem', padding: '1rem', alignItems: 'center' }}>
              <img 
                src={complaint.imageUrl} 
                alt="evidence" 
                style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#e5e7eb' }} 
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h4 style={{ color: '#1F3864', margin: 0, fontWeight: '700' }}>{complaint.complaintId}</h4>
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>• Filed {new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontWeight: '600', margin: '2px 0', fontSize: '0.95rem' }}>
                  {complaint.issueType} — <span style={{ fontWeight: 'normal', color: '#4B5563' }}>{complaint.location?.address || 'Location recorded'}</span>
                </p>
                <p style={{ fontSize: '0.85rem', color: '#2E5395', margin: 0, fontWeight: '500' }}>
                  🏛️ Assigned: {complaint.assignedAuthority?.department || 'General Municipal Department'}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                  "{complaint.description}"
                </p>
              </div>

              <div>
                <StatusBadge status={complaint.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
