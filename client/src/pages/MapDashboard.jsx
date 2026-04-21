import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getComplaints, getMyComplaints } from '../api';
import { useAuth } from '../context/AuthContext';
import './MapDashboard.css';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for different statuses
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

const icons = {
  'Pending': createCustomIcon('yellow'),
  'In Progress': createCustomIcon('blue'),
  'Resolved': createCustomIcon('green'),
  'Escalated': createCustomIcon('red'),
};

const MapDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = isAdmin ? await getComplaints() : await getMyComplaints();
        // Only keep complaints that have valid coordinates
        const validGeoComplaints = data.filter(c => c.location && c.location.latitude && c.location.longitude);
        setComplaints(validGeoComplaints);
      } catch (err) {
        console.error('Failed to fetch map data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [isAdmin]);

  const getMarkerIcon = (complaint) => {
    const createdDate = new Date(complaint.createdAt);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24));
    
    if (complaint.status !== 'Resolved' && diffDays > 7) {
      return icons['Escalated'];
    }
    return icons[complaint.status] || icons['Pending'];
  };

  if (loading) return <div className="loader-container">Loading Map...</div>;

  return (
    <div className="map-dashboard-container">
      <h2>{isAdmin ? 'City-wide Incident Map' : 'My Incident Map'}</h2>
      <div className="map-legend">
        <span><img src={icons['Pending'].options.iconUrl} alt="Pending" height="15"/> Pending</span>
        <span><img src={icons['In Progress'].options.iconUrl} alt="In Progress" height="15"/> In Progress</span>
        <span><img src={icons['Resolved'].options.iconUrl} alt="Resolved" height="15"/> Resolved</span>
        <span><img src={icons['Escalated'].options.iconUrl} alt="Escalated" height="15"/> Escalated (7+ Days)</span>
      </div>

      <div className="map-wrapper">
        <MapContainer 
          center={[20.5937, 78.9629]} // Default center (India roughly)
          zoom={5} 
          style={{ height: '600px', width: '100%', borderRadius: '12px', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {complaints.map(complaint => (
            <Marker 
              key={complaint._id} 
              position={[complaint.location.latitude, complaint.location.longitude]}
              icon={getMarkerIcon(complaint)}
            >
              <Popup>
                <div className="map-popup-card">
                  <img src={complaint.imageUrl} alt="issue" style={{ width: '100%', borderRadius: '4px' }} />
                  <h4>{complaint.issueType}</h4>
                  <p><strong>Status:</strong> {complaint.status}</p>
                  <p>{complaint.description}</p>
                  {isAdmin && complaint.createdBy && (
                    <p style={{ fontSize: '0.8rem', color: '#555' }}>By: {complaint.createdBy.name}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapDashboard;
