import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN': return '⚙️ ADMIN';
      case 'AUTHORITY': return '🏛️ AUTHORITY';
      default: return '👤 CITIZEN';
    }
  };

  return (
    <nav className="navbar" style={{ backgroundColor: '#1F3864', color: 'white', padding: '0.8rem 2rem' }}>
      <div className="navbar-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="navbar-logo" style={{ color: 'white', textDecoration: 'none', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="logo-icon">👁️</span>
          CivicLens
        </Link>
        <ul className="nav-menu" style={{ display: 'flex', listStyle: 'none', alignItems: 'center', gap: '1.5rem', margin: 0 }}>
          {user ? (
            <>
              {/* Citizen Navigation Links */}
              {user.role === 'USER' && (
                <>
                  <li className="nav-item">
                    <Link to="/report" className={`nav-links ${location.pathname === '/report' || location.pathname === '/' ? 'active' : ''}`}>
                      Report Issue
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/dashboard" className={`nav-links ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                      My Complaints
                    </Link>
                  </li>
                </>
              )}

              {/* Authority Navigation Links */}
              {user.role === 'AUTHORITY' && (
                <>
                  <li className="nav-item">
                    <Link to="/authority" className={`nav-links ${location.pathname === '/authority' ? 'active' : ''}`}>
                      Department Queue
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/map" className={`nav-links ${location.pathname === '/map' ? 'active' : ''}`}>
                      Complaint Map
                    </Link>
                  </li>
                </>
              )}

              {/* Admin Navigation Links */}
              {user.role === 'ADMIN' && (
                <>
                  <li className="nav-item">
                    <Link to="/admin" className={`nav-links ${location.pathname === '/admin' ? 'active' : ''}`}>
                      System Overview
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/map" className={`nav-links ${location.pathname === '/map' ? 'active' : ''}`}>
                      Complaint Map
                    </Link>
                  </li>
                </>
              )}

              <li className="nav-item">
                <span className="user-badge" style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                  {getRoleBadge(user.role)} | {user.name}
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="btn btn-primary" style={{ backgroundColor: '#2E5395', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', color: 'white' }}>Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
