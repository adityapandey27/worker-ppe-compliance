import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAlerts from './pages/admin/Alerts';
import AdminInsights from './pages/admin/Insights';

import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorViolations from './pages/supervisor/Violations';
import SupervisorReports from './pages/supervisor/Reports';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/supervisor/dashboard'} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute role="admin"><AdminAlerts /></ProtectedRoute>} />
      <Route path="/admin/insights" element={<ProtectedRoute role="admin"><AdminInsights /></ProtectedRoute>} />

      <Route path="/supervisor/dashboard" element={<ProtectedRoute role="supervisor"><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/supervisor/violations" element={<ProtectedRoute role="supervisor"><SupervisorViolations /></ProtectedRoute>} />
      <Route path="/supervisor/reports" element={<ProtectedRoute role="supervisor"><SupervisorReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
