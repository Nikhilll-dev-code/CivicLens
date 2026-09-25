import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { createComplaint } from '../api';
import './Home.css';

const ISSUE_TYPES = [
  { label: 'Pothole', value: 'Pothole' },
  { label: 'Garbage', value: 'Garbage' },
  { label: 'Water Leak', value: 'Water Leak' },
  { label: 'Streetlight', value: 'Streetlight' },
  { label: 'Drainage', value: 'Drainage' },
  { label: 'Other', value: 'Other' }
];

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    issueType: 'Pothole',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [routedTo, setRoutedTo] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [useCamera, setUseCamera] = useState(false);

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Helper: Convert base64 dataURL to File object
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  // Auto detect location
  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData(prev => ({ ...prev, latitude, longitude, address }));
            setError('');
          } catch (err) {
            setFormData(prev => ({ ...prev, latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
        },
        (error) => {
          console.error("Location error:", error);
          setError("Could not auto-detect location. Please enter address manually.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const file = dataURLtoFile(imageSrc, `capture_${Date.now()}.jpg`);
        setImageFile(file);
        setPreview(imageSrc);
        setUseCamera(false);
      }
    }
  }, [webcamRef]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setUseCamera(false);
    }
  };

  const resetImage = () => {
    setPreview(null);
    setImageFile(null);
    setUseCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile && !preview) {
      setError('Please capture or upload evidentiary photo.');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Location is required. Please capture GPS or enter address.');
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
      data.append('address', formData.address || '');

      if (imageFile) {
        data.append('image', imageFile);
      } else if (preview && preview.startsWith('data:image')) {
        const file = dataURLtoFile(preview, `evidence_${Date.now()}.jpg`);
        data.append('image', file);
      } else {
        throw new Error('Image file missing. Please re-select or take a picture.');
      }

      const response = await createComplaint(data);
      setSubmittedData(response.data?.data || null);
      setRoutedTo(response.data?.routedTo || null);
      setSuccess('Complaint submitted successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (success && routedTo) {
    return (
      <div className="report-container" style={{ maxWidth: '720px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#1F3864', marginBottom: '0.5rem' }}>Complaint Submitted</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Your Complaint ID is <strong>{submittedData?.complaintId || 'CLX-1000'}</strong>. An email notification has been dispatched to the responsible department.
          </p>

          <div style={{ background: '#F4F5F7', border: '1px solid #B9BEC7', borderRadius: '8px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#1F3864' }}>Routed Department:</span>
              <span style={{ fontWeight: '600' }}>{routedTo.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#1F3864' }}>Department Contact:</span>
              <span>{routedTo.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#1F3864' }}>Issue Type:</span>
              <span>{formData.issueType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold', color: '#1F3864' }}>Location:</span>
              <span>{formData.address || `${formData.latitude?.toFixed(4)}, ${formData.longitude?.toFixed(4)}`}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              View My Complaints
            </button>
            <button className="btn btn-secondary" onClick={() => { setSuccess(''); setRoutedTo(null); resetImage(); }}>
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1F3864', marginBottom: '1.5rem' }}>Report an Issue</h2>
      
      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        {/* Left Form Panel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Issue Type Chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#1F3864' }}>Issue type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ISSUE_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, issueType: type.value })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: formData.issueType === type.value ? '2px solid #2E5395' : '1px solid #B9BEC7',
                      backgroundColor: formData.issueType === type.value ? 'rgba(46, 83, 149, 0.1)' : 'white',
                      color: formData.issueType === type.value ? '#2E5395' : '#1F2937',
                      fontWeight: formData.issueType === type.value ? '700' : '500',
                      cursor: 'pointer'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#1F3864' }}>Description</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the civic issue in detail..."
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #B9BEC7', fontSize: '0.95rem' }}
              />
            </div>

            {/* Side-by-side Photo & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Photo Upload */}
              <div style={{ border: '1px dashed #B9BEC7', borderRadius: '8px', padding: '1rem', textAlign: 'center', backgroundColor: '#F4F5F7' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#1F3864' }}>Photo evidence</label>
                {preview ? (
                  <div>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                    <button type="button" className="btn btn-secondary" onClick={resetImage} style={{ marginTop: '6px', padding: '2px 8px', fontSize: '0.8rem' }}>
                      Change Photo
                    </button>
                  </div>
                ) : useCamera ? (
                  <div>
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" height={120} videoConstraints={{ facingMode: "environment" }} />
                    <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ marginTop: '6px', padding: '4px 10px', fontSize: '0.8rem' }}>
                      Snap Picture
                    </button>
                  </div>
                ) : (
                  <div>
                    <button type="button" className="btn btn-secondary" onClick={() => setUseCamera(true)} style={{ marginBottom: '8px', width: '100%' }}>
                      📷 Camera
                    </button>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '0.8rem', width: '100%' }} />
                  </div>
                )}
              </div>

              {/* Location */}
              <div style={{ border: '1px dashed #B9BEC7', borderRadius: '8px', padding: '1rem', backgroundColor: '#F4F5F7' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#1F3864' }}>Location</label>
                <button type="button" className="btn btn-secondary" onClick={fetchCurrentLocation} style={{ width: '100%', marginBottom: '8px', fontSize: '0.85rem' }}>
                  📍 Refresh GPS
                </button>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address manually..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #B9BEC7', fontSize: '0.85rem' }}
                />
                {formData.latitude && (
                  <div style={{ fontSize: '0.75rem', color: '#3FA76A', marginTop: '4px' }}>
                    ✓ Locked: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Submitting & Routing...' : 'Submit complaint'}
            </button>
          </form>
        </div>

        {/* Right Expectation Panel */}
        <div className="card" style={{ padding: '1.5rem', height: 'fit-content', backgroundColor: '#FFFFFF' }}>
          <h3 style={{ color: '#1F3864', marginBottom: '1rem', fontSize: '1.1rem' }}>What happens next</h3>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.8', color: '#1F2937', fontSize: '0.9rem' }}>
            <li>Photo is stored securely</li>
            <li>We match your issue to the responsible department</li>
            <li>That department is notified automatically</li>
            <li>Track progress from your dashboard any time</li>
          </ol>
          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#F4F5F7', borderRadius: '6px', fontSize: '0.8rem', color: '#6B7280', borderLeft: '3px solid #2E5395' }}>
            💡 <strong>Automatic Routing:</strong> Issue type + location drive authority routing — no department selection required.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
