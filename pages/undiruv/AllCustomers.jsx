import React from 'react';
import { Search, Filter, FileText } from 'lucide-react';

const AllCustomers = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Barcha mijozlar</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
      </div>

      <div className="bg-white h-96 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Ushbu oynada ma'lumot mavjud emas</h3>
        <p className="text-sm text-gray-500 max-w-sm mt-2">
            Shartnomalarni olish uchun, o'zingizga kerakli mijozni ID, FIO, telefon raqami va shartnoma IDsi orqali izlang!
        </p>
      </div>
    </div>
  );
};
export default AllCustomers;