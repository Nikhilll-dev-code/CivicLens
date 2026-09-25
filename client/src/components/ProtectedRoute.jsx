import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, AuthLoading } = useAuth();

  if (AuthLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role home dashboard
    if (user.role === 'USER') return <Navigate to="/dashboard" replace />;
    if (user.role === 'AUTHORITY') return <Navigate to="/authority" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
