import { Bell, User, LogOut } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = () => {
  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase();
  const token = sessionStorage.getItem('token');
  const userName = "Foydalanuvchi";

  const [unreadCount, setUnreadCount] = useState(0);

  // notificationlarni olish
  const fetchUnreadNotifications = async () => {
    try {
      if (!token || userRole !== 'director') {
        setUnreadCount(0);
        return;
      }

      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Notification yuklanmadi');
      }

      const unread = Array.isArray(data)
        ? data.filter((n) => !n.isRead).length
        : 0;

      setUnreadCount(unread);

    } catch (error) {
      console.error("Notification count xatosi:", error);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();

    if (userRole !== 'director') return;

    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 15000); // har 15 sekundda yangilanadi

    return () => clearInterval(interval);

  }, [token, userRole]);

  // logout
  const handleLogout = () => {
    if (window.confirm("Tizimdan chiqmoqchimisiz?")) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-white h-16 px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-30 shadow-sm">

      {/* Chap tomon */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-blue-800">Iphone House</h2>
      </div>

      {/* O'ng tomon */}
      <div className="flex items-center gap-6">

        {/* Notification bell */}
        {userRole === 'director' && (
          <Link
            to="/dashboard/notifications"
            className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Xabarlar"
          >
            <Bell size={22} />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* Profil */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">

          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-gray-700">
              {userName}
            </div>

            <div className="text-xs text-gray-500 uppercase">
              {userRole}
            </div>
          </div>

          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <User size={20} />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-2 transition-colors"
            title="Chiqish"
          >
            <LogOut size={20} />
          </button>

        </div>

      </div>
    </div>
  );
};

export default Navbar;
