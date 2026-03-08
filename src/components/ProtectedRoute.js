import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requireCreator }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireCreator && profile?.role !== 'creator') {
    return <Navigate to="/creator" replace />;
  }

  return children;
}

export default ProtectedRoute;
