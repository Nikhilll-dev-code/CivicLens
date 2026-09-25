import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await loginUser(formData);
      login(data.user, data.token);

      // Route dynamically by role
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.user.role === 'AUTHORITY') {
        navigate('/authority');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="card auth-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', color: '#1F3864', marginBottom: '0.5rem' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Sign in to your account. Role is resolved automatically.
        </p>

        {error && <div className="alert alert-error" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="name@example.com"
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #B9BEC7', fontSize: '0.95rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #B9BEC7', fontSize: '0.95rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1F3864', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          New here? <Link to="/register" style={{ color: '#2E5395', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
        </p>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.8rem', color: '#6b7280' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔑 Demo Accounts:</p>
          <p>• Citizen: <code>citizen@civiclens.gov</code> / <code>password123</code></p>
          <p>• Authority: <code>authority@civiclens.gov</code> / <code>password123</code></p>
          <p>• Admin: <code>admin@civiclens.gov</code> / <code>password123</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
