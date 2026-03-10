import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

// 🚨 YANGI: Tokenni "ochib" (decode qilib), muddatini tekshiruvchi maxsus funksiya
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        // JWT 3 qismdan iborat bo'ladi (header.payload.signature)
        // Bizga o'rtadagi qismi (payload) kerak
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64); // Base64 dan matnga o'giramiz
        const decoded = JSON.parse(decodedJson); // Matnni JSON obyektga aylantiramiz
        
        // decoded.exp soniyalarda bo'ladi, biz uni millisoniyaga o'giramiz (*1000)
        const expirationTime = decoded.exp * 1000; 
        
        // Hozirgi vaqt tokenning yaroqlilik vaqtidan kichikmi? (Yaroqli bo'lsa true)
        return Date.now() < expirationTime;
    } catch (error) {
        return false; // Token buzilgan yoki noto'g'ri formatda bo'lsa false
    }
};

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');

    // 🚨 YANGI: Endi shunchaki token borligini emas, uning "YAROQLI" ekanligini ham tekshiramiz
    if (!isTokenValid(token)) {
        if (token) {
            // Agar xotirada token bo'lsa-yu, lekin muddati o'tgan bo'lsa
            sessionStorage.clear();
            toast.error("Seans muddati tugadi. Iltimos, tizimga qayta kiring!", { duration: 4000 });
        }
        return <Navigate to="/login" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
