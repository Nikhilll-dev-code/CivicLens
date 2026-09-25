import { useState, useEffect } from 'react';
import { getAnalytics, getAuthorities, createAuthority, updateAuthority, deleteAuthority, reassignComplaint } from '../api';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddAuth, setShowAddAuth] = useState(false);
  const [newAuth, setNewAuth] = useState({ name: '', department: '', area: '', email: '', phone: '' });

  const [reassignTarget, setReassignTarget] = useState(null);
  const [selectedAuthId, setSelectedAuthId] = useState('');
  const [savingReassign, setSavingReassign] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, authRes] = await Promise.all([
        getAnalytics(),
        getAuthorities()
      ]);
      setAnalytics(analyticsRes.data);
      setAuthorities(authRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load system overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAuthority = async (e) => {
    e.preventDefault();
    try {
      await createAuthority(newAuth);
      setShowAddAuth(false);
      setNewAuth({ name: '', department: '', area: '', email: '', phone: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create authority.');
    }
  };

  const handleToggleAuthActive = async (auth) => {
    try {
      await updateAuthority(auth._id, { active: !auth.active });
      fetchData();
    } catch (err) {
      alert('Failed to update authority active status.');
    }
  };

  const handleOpenReassign = (item) => {
    setReassignTarget(item);
    setSelectedAuthId(authorities[0]?._id || '');
  };

  const handleSaveReassign = async () => {
    if (!reassignTarget || !selectedAuthId) return;
    setSavingReassign(true);
    try {
      await reassignComplaint(reassignTarget.id, selectedAuthId);
      setReassignTarget(null);
      fetchData();
    } catch (err) {
      alert('Failed to reassign complaint.');
    } finally {
      setSavingReassign(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading System Overview...</div>;
  }

  return (
    <div className="admin-dashboard" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#1F3864' }}>System Overview</h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Platform-wide monitoring, routing gap oversight, and municipal authority record management.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 style={{ color: '#1F3864', margin: 0, fontSize: '2.2rem' }}>{analytics?.totalComplaints || 0}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Total complaints</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 style={{ color: '#2E5395', margin: 0, fontSize: '2.2rem' }}>{analytics?.activeAuthorities || 0}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Active authorities</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 style={{ color: '#D9534F', margin: 0, fontSize: '2.2rem' }}>{analytics?.escalatedCount || 0}</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Escalated</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h1 style={{ color: '#3FA76A', margin: 0, fontSize: '2.2rem' }}>{analytics?.avgResolutionDays || '0'} days</h1>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Avg. resolution</span>
        </div>
      </div>

      {/* Main Panels Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Panel: Authority Records */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#1F3864', margin: 0 }}>Authority Records</h3>
            <button className="btn btn-secondary" onClick={() => setShowAddAuth(true)} style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
              + Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {authorities.map(auth => (
              <div key={auth._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F4F5F7', borderRadius: '6px', border: '1px solid #B9BEC7' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#1F3864', fontSize: '0.95rem' }}>{auth.department}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{auth.area} • {auth.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: auth.active ? '#3FA76A' : '#6B7280', color: 'white'
                  }}>
                    {auth.active ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => handleToggleAuthActive(auth)} 
                    style={{ background: 'none', border: '1px solid #B9BEC7', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Needs Admin Review Alert List */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #D9534F' }}>
          <h3 style={{ color: '#D9534F', marginBottom: '0.5rem' }}>Needs Admin Review</h3>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
            Fallback-routed complaints and long-escalated items requiring manual intervention.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!analytics?.needsAdminReviewList || analytics.needsAdminReviewList.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#3FA76A', background: '#F0FDF4', borderRadius: '6px', fontSize: '0.9rem' }}>
                ✓ No routing gaps or pending escalations requiring manual review!
              </div>
            ) : (
              analytics.needsAdminReviewList.map(item => (
                <div key={item.id} style={{ padding: '10px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#9B2C2C' }}>{item.complaintId} — {item.issueType}</strong>
                    <button className="btn btn-secondary" onClick={() => handleOpenReassign(item)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                      Reassign
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#742A2A', margin: '4px 0' }}>{item.reason}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9B2C2C', margin: 0 }}>"{item.description}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add Authority Modal */}
      {showAddAuth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', padding: '1.5rem', background: 'white' }}>
            <h3 style={{ color: '#1F3864', marginBottom: '1rem' }}>Add Authority Record</h3>
            <form onSubmit={handleCreateAuthority}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Authority Name</label>
                <input type="text" required value={newAuth.name} onChange={e => setNewAuth({ ...newAuth, name: e.target.value })} placeholder="e.g. Roads Dept Officer" style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Department</label>
                <input type="text" required value={newAuth.department} onChange={e => setNewAuth({ ...newAuth, department: e.target.value })} placeholder="e.g. Roads Department" style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Area / Zone</label>
                <input type="text" required value={newAuth.area} onChange={e => setNewAuth({ ...newAuth, area: e.target.value })} placeholder="e.g. Zone A-C" style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Email Address</label>
                <input type="email" required value={newAuth.email} onChange={e => setNewAuth({ ...newAuth, email: e.target.value })} placeholder="roads_dept@civiclens.gov" style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold' }}>Phone</label>
                <input type="text" value={newAuth.phone} onChange={e => setNewAuth({ ...newAuth, phone: e.target.value })} placeholder="+1-800-ROADS" style={{ width: '100%', padding: '0.5rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAuth(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '440px', padding: '1.5rem', background: 'white' }}>
            <h3 style={{ color: '#1F3864', marginBottom: '0.5rem' }}>Reassign Complaint — {reassignTarget.complaintId}</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
              Select an active municipal authority department to take ownership of this issue.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Target Authority</label>
              <select value={selectedAuthId} onChange={e => setSelectedAuthId(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #B9BEC7' }}>
                {authorities.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.department} ({a.area}) — {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setReassignTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveReassign} disabled={savingReassign}>
                {savingReassign ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
