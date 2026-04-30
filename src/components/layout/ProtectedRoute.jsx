import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentCR, getCurrentAdmin } from '../../api/auth';

const ProtectedRoute = ({ children, redirectTo = "/cr-login" }) => {
  const cr = getCurrentCR();
  const admin = getCurrentAdmin();

  // If the user is an Admin, they have access to everything
  if (admin) return children;

  // If the user is a CR, they can access CR routes
  if (cr) return children;

  // If no session is found, redirect to the specified login page
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;