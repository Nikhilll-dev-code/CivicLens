import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getComplaints, getMyComplaints, getAssignedComplaints } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import './MapDashboard.css';

// Fix Leaflet's default icon path issues with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Status Markers matching UI/UX Section 7.1 Status Colors
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const statusIcons = {
  'Pending': createCustomIcon('orange'),
  'Submitted': createCustomIcon('orange'),
  'ASSIGNED': createCustomIcon('orange'),
  'In Progress': createCustomIcon('blue'),
  'ACKNOWLEDGED': createCustomIcon('blue'),
  'Resolved': createCustomIcon('green'),
  'Escalated': createCustomIcon('red'),
  'Needs Attention': createCustomIcon('red')
};

const MapDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        let res;
        if (user?.role === 'ADMIN') {
          res = await getComplaints();
        } else if (user?.role === 'AUTHORITY') {
          res = await getAssignedComplaints();
        } else {
          res = await getMyComplaints();
        }

        const validGeoComplaints = (res.data || []).filter(c => c.location && c.location.latitude && c.location.longitude);
        setComplaints(validGeoComplaints);
      } catch (err) {
        console.error('Failed to fetch map data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [user]);

  const getMarkerIcon = (complaint) => {
    const ageDays = (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24);
    if (complaint.status !== 'Resolved' && ageDays >= 7) {
      return statusIcons['Escalated'];
    }
    return statusIcons[complaint.status] || statusIcons['Pending'];
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Complaint Map...</div>;

  return (
    <div className="map-dashboard-container" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ color: '#1F3864' }}>Complaint Map</h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Geographic location and status visualization across reported civic incidents.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '0.85rem' }}>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#E8A33D' }}></span> Pending</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#3B7DD8' }}></span> In Progress</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#3FA76A' }}></span> Resolved</span>
          <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#D9534F' }}></span> Escalated</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 340px' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
        {/* Leaflet Map */}
        <div className="card" style={{ padding: '4px', overflow: 'hidden' }}>
          <MapContainer 
            center={[17.3850, 78.4867]} // Default map center
            zoom={6} 
            style={{ height: '580px', width: '100%', borderRadius: '8px', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {complaints.map(item => (
              <Marker 
                key={item._id} 
                position={[item.location.latitude, item.location.longitude]}
                icon={getMarkerIcon(item)}
                eventHandlers={{
                  click: () => setSelectedComplaint(item)
                }}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ color: '#1F3864' }}>{item.complaintId}</strong>
                    <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>{item.issueType}</p>
                    <StatusBadge status={item.status} />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Selected Complaint Side Panel */}
        {selectedComplaint && (
          <div className="card" style={{ padding: '1.25rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ color: '#1F3864', margin: 0 }}>{selectedComplaint.complaintId}</h3>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{selectedComplaint.issueType}</span>
              </div>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
            </div>

            <StatusBadge status={selectedComplaint.status} />

            <img 
              src={selectedComplaint.imageUrl} 
              alt="Evidence" 
              style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', margin: '1rem 0' }} 
            />

            <div style={{ fontSize: '0.85rem', color: '#1F2937', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '6px' }}><strong>Description:</strong> {selectedComplaint.description}</p>
              <p style={{ marginBottom: '6px' }}><strong>Assigned Dept:</strong> {selectedComplaint.assignedAuthority?.department || 'General Department'}</p>
              <p style={{ marginBottom: '6px' }}><strong>Location:</strong> {selectedComplaint.location?.address || 'GPS Coordinates'}</p>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.8rem' }}><strong>Filed:</strong> {new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDashboard;
