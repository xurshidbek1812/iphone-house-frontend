import React from 'react';
import { Search, Filter, FileText } from 'lucide-react';

const UnfinishedSales = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Savdosi yakunlanmaganlar</h1>
      
      {/* Top Buttons */}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50">Planshetdan buyurtma</button>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50">Shartnoma tuzish</button>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50">Naqd savdo tuzish</button>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50">Mijozga chiqim qilish</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <Search className="text-gray-400" size={20} />
         <input type="text" placeholder="Search" className="flex-1 p-2 outline-none" />
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Filter size={20}/> Filtr</button>
      </div>

      {/* Empty State */}
      <div className="bg-white h-96 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Ushbu oynada ma'lumot mavjud emas</h3>
        <p className="text-sm text-gray-500 max-w-sm mt-2">
            Shartnomalarni olish uchun, o'zingizga kerakli shartnomani, mijoz FIO si orqali izlang!
        </p>
      </div>
    </div>
  );
};
export default UnfinishedSales;