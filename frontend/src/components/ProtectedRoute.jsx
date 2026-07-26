import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards a route by auth + optional role. Redirects unauthenticated users to /login
// and unauthorized users to their own portal home.
const ProtectedRoute = ({ role, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="flex items-center gap-3 text-muted font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-accent beacon-amber"></span>
          Checking session...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/supervisor/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
