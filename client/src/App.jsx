import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MapDashboard from './pages/MapDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'AUTHORITY') return <Navigate to="/authority" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Citizen Routes */}
              <Route 
                path="/report" 
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <ReportIssue />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Authority Staff Routes */}
              <Route 
                path="/authority" 
                element={
                  <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                    <AuthorityDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Shared Map Route */}
              <Route 
                path="/map" 
                element={
                  <ProtectedRoute allowedRoles={['USER', 'AUTHORITY', 'ADMIN']}>
                    <MapDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Home & Fallback Route */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
