import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { createComplaint, forwardComplaint } from '../api';
import './Home.css';

const Home = () => {
  const [formData, setFormData] = useState({
    issueType: 'Garbage',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [routedTo, setRoutedTo] = useState(null);
  const [submittedId, setSubmittedId] = useState(null);
  const [forwarding, setForwarding] = useState(false);
  const [forwardSent, setForwardSent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Geolocation logic
  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse Geocode using Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              address
            }));
            setError('');
          } catch (err) {
            console.error('Geocoding failed', err);
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              address: 'Unknown Location (Could not fetch address)'
            }));
          }
        },
        (error) => {
          console.error("Error getting location: ", error);
          setError("Could not automatically determine your location. Please check your browser permissions or manually enter an address.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Auto-capture geolocation on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);
    setUseCamera(false);
  }, [webcamRef]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setUseCamera(false);
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview) {
      setError('Please capture or upload an image of the issue.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Location is required. Please allow location access.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const data = new FormData();
      data.append('issueType', formData.issueType);
      data.append('description', formData.description);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);
      data.append('address', formData.address);

      // Convert preview (base64 or objectURL) to a File
      if (preview.startsWith('data:image')) {
        const file = dataURLtoFile(preview, `capture_${Date.now()}.jpg`);
        data.append('image', file);
      } else {
        // Find the actual file from input (a hacky way, or we could just store the file in state)
        // Since we didn't store file in state for standard uploads, let's fix it by selecting from DOM:
        const fileInput = document.getElementById('image-upload-input');
        if (fileInput && fileInput.files[0]) {
          data.append('image', fileInput.files[0]);
        } else {
          throw new Error("Could not construct image file.");
        }
      }

      const response = await createComplaint(data);
      setSubmittedId(response.data?.data?._id || null);
      setRoutedTo(response.data?.routedTo || null);
      setSuccess('Complaint submitted successfully!');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (!submittedId) return;
    setForwarding(true);
    try {
      await forwardComplaint(submittedId);
      setForwardSent(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to forward. Please try again.');
    } finally {
      setForwarding(false);
    }
  };

  // Show success screen after submission
  if (success && routedTo) {
    return (
      <div className="home-container">
        <div className="form-card card success-screen">
          <div className="success-icon">✅</div>
          <h2>Complaint Submitted!</h2>
          <p className="success-sub">A confirmation email has been sent to your inbox with all the details.</p>

          <div className="routed-info-box">
            <div className="routed-row">
              <span className="routed-label">🏛️ Responsible Department</span>
              <span className="routed-value">{routedTo.department}</span>
            </div>
            <div className="routed-row">
              <span className="routed-label">📧 Department Contact</span>
              <span className="routed-value">{routedTo.email}</span>
            </div>
            <div className="routed-row">
              <span className="routed-label">📋 Issue Type</span>
              <span className="routed-value">{formData.issueType}</span>
            </div>
            <div className="routed-row">
              <span className="routed-label">📍 Location</span>
              <span className="routed-value">{formData.address || `${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}`}</span>
            </div>
          </div>

          {/* Forward to Department CTA */}
          {!forwardSent ? (
            <div className="forward-box">
              <p className="forward-desc">Want to escalate this issue? Send it directly to the <strong>{routedTo.department}</strong>.</p>
              <button
                className="btn btn-forward"
                onClick={handleForward}
                disabled={forwarding}
              >
                {forwarding ? '📤 Sending...' : '📢 Forward to Department'}
              </button>
            </div>
          ) : (
            <div className="forward-sent-box">
              ✅ Complaint successfully forwarded to <strong>{routedTo.department}</strong>!
            </div>
          )}

          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              View My Complaints
            </button>
            <button className="btn btn-secondary" onClick={() => { setSuccess(''); setRoutedTo(null); setPreview(null); setSubmittedId(null); setForwardSent(false); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="form-card card">
        <div className="form-header">
          <h2>Report a Civic Issue</h2>
          <p>Help improve your neighborhood with live GPS accuracy.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="complaint-form">
          <div className="form-group">
            <label>Issue Type</label>
            <select name="issueType" value={formData.issueType} onChange={handleInputChange}>
              <option value="Garbage">Garbage / Waste</option>
              <option value="Pothole">Pothole / Broken Road</option>
              <option value="Water Leak">Water Leak / Pipe Burst</option>
              <option value="Streetlight">Broken Streetlight</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location</label>
            <div style={{ marginBottom: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={fetchCurrentLocation}
                style={{ width: '100%', marginBottom: '10px', backgroundColor: '#4CAF50', border: 'none' }}
              >
                📍 Auto-Detect Location (GPS)
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>OR</span>
            </div>
            <label style={{ marginTop: '10px' }}>Enter Address Manually</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                placeholder={formData.latitude ? 'Fetching address...' : 'Enter your address...'}
                onChange={handleInputChange}
                required 
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={async () => {
                  if (!formData.address) return setError('Please enter an address first');
                  setLoading(true);
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                      setFormData(prev => ({
                        ...prev,
                        latitude: parseFloat(data[0].lat),
                        longitude: parseFloat(data[0].lon)
                      }));
                      setError('');
                      setSuccess('Location coordinates found!');
                      setTimeout(() => setSuccess(''), 3000);
                    } else {
                      setError('Could not find coordinates for this address. Please try being more specific.');
                    }
                  } catch (err) {
                    setError('Failed to geocode address.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Find Coordinates
              </button>
            </div>
            {formData.latitude && (
              <small style={{ color: '#4CAF50', display: 'block', marginTop: '5px' }}>
                ✓ Coordinates locked: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              placeholder="Provide more details..." 
              rows="4"
              value={formData.description} 
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-group">
            <label>Evidentiary Photo</label>
            <div className="photo-actions" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setUseCamera(true)}>📷 Take Photo</button>
              <span>OR</span>
              <input type="file" id="image-upload-input" accept="image/*" onChange={handleFileChange} />
            </div>

            {useCamera && (
              <div className="camera-container" style={{ textAlign: 'center' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  videoConstraints={{ facingMode: "environment" }}
                />
                <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ marginTop: '10px' }}>Snap Picture</button>
              </div>
            )}

            {preview && !useCamera && (
              <div className="image-preview-container" style={{ marginTop: '15px' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPreview(null); setUseCamera(true); }} style={{ marginTop: '10px' }}>Retake/Reselect</button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading || !formData.latitude}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
