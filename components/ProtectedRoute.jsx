import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if user info exists in "browser memory"
  const user = JSON.parse(localStorage.getItem('user'));

  // If user exists, let them pass (<Outlet />)
  // If not, send them to login (<Navigate to="/login" />)
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;