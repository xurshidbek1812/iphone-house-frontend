import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clearAuthData } from '../utils/authStorage';

// 🚨 YANGI: 100% xavfsiz va ishonchli JWT dekoder
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const base64Url = token.split('.')[1];
        
        // 1-HIMOYA: Base64Url ni oddiy Base64 formatiga to'g'irlash
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // 2-HIMOYA: atob() xato bermasligi va Unicode (masalan, kirill yoki maxsus belgilar) ni to'g'ri o'qishi uchun maxsus dekodirovka
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );

        const decoded = JSON.parse(jsonPayload);
        const expirationTime = decoded.exp * 1000; 
        
        return Date.now() < expirationTime;
    } catch (error) {
        console.error("Tokenni o'qishda xatolik:", error);
        return false; 
    }
};

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');

    if (!isTokenValid(token)) {
        if (token) {
            clearAuthData();
            toast.error("Seans muddati tugadi yoki xatolik yuz berdi. Iltimos, tizimga qayta kiring!", { duration: 4000 });
        }
        return <Navigate to="/login" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
