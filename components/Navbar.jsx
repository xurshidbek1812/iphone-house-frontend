import React from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';

const Navbar = () => {
  // Foydalanuvchi ma'lumotlarini olish (Hozircha statik)
  const userRole = localStorage.getItem('userRole') || 'Admin';
  const userName = "Foydalanuvchi"; 

  // Tizimdan chiqish
  const handleLogout = () => {
     if(window.confirm("Tizimdan chiqmoqchimisiz?")) {
         localStorage.removeItem('token');
         localStorage.removeItem('userRole');
         window.location.href = '/login'; // Login sahifasiga qaytish
     }
  }

  return (
    <div className="bg-white h-16 px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        
        {/* Chap tomon: Sarlavha */}
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-blue-800">Iphone House</h2>
        </div>

        {/* O'ng tomon: Bildirishnoma va User info */}
        <div className="flex items-center gap-6">
            
            {/* Qo'ng'iroqcha (Bildirishnomalar) */}
            <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Profil qismi */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-gray-700">{userName}</div>
                    <div className="text-xs text-gray-500 uppercase">{userRole}</div>
                </div>
                
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
                    <User size={20} />
                </div>
                
                {/* Chiqish tugmasi */}
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