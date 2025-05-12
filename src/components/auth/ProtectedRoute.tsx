import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userStores, loading: storeLoading } = useStore();
  const location = useLocation();

  // Show loading while authentication state is being determined
  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but has no stores and not on the setup page,
  // redirect to store setup page
  if (userStores.length === 0 && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // If everything is fine, render the children
  return <>{children}</>;
};

export default ProtectedRoute;