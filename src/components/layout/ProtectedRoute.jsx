import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentCR } from '../../api/auth';

const ProtectedRoute = ({ children }) => {
  const cr = getCurrentCR();

  if (!cr) {
    return <Navigate to="/cr-login" replace />;
  }

  return children;
};

export default ProtectedRoute;