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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏛️</span>
          CivicLens
        </Link>
        <ul className="nav-menu">
          {user ? (
            <>
              <li className="nav-item">
                <Link to="/" className={`nav-links ${location.pathname === '/' ? 'active' : ''}`}>
                  Report Issue
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/dashboard" className={`nav-links ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/map" className={`nav-links ${location.pathname === '/map' ? 'active' : ''}`}>
                  Map View
                </Link>
              </li>
              <li className="nav-item">
                <span className="nav-links user-greeting">Hi, {user.name}</span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
