import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Faqat token bormi yoki yo'qligini tekshiramiz
  const token = localStorage.getItem('token');
  
  // Agar token bo'lsa - ichkariga kirgaz, bo'lmasa - login sahifasiga hayda
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
