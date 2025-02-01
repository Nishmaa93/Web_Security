import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const tempToken = localStorage.getItem('tempAuthToken');
  const currentPath = location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If user has a tempToken, they need to complete 2FA setup
  if (tempToken) {
    return <Navigate to="/setup-mfa" state={{ from: location }} replace />;
  }

  if (!user) {
    // Store the attempted path for redirect after login
    localStorage.setItem('redirectPath', currentPath);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}