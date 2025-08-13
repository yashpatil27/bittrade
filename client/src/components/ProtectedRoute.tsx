import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingWrapper from './LoadingWrapper';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LoadingWrapper 
      isLoading={isLoading} 
      message="Authenticating..."
      minDisplayTime={1500}
    >
      {children}
    </LoadingWrapper>
  );
};

export default ProtectedRoute;
