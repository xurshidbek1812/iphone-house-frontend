import React from 'react';
import { Search, Filter, Printer, Calendar } from 'lucide-react';

const ChangedPriceProducts = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Narxi o'zgargan tovarlar</h1>
      
      {/* Date Filter */}
      <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg w-fit text-sm text-gray-600">
          <span className="font-medium">Sanasi:</span>
          <span>26.01.2026 00:00 - 26.01.2026 23:59</span>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2 font-medium hover:bg-blue-200"><Printer size={20}/> Narx yorlig'ini chop etish</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto min-h-[400px]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4"><input type="checkbox" /></th>
              <th className="p-4">O'zgarish sanasi</th>
              <th className="p-4">Tovar ID</th>
              <th className="p-4">Nomi</th>
              <th className="p-4">Kategoriyasi</th>
              <th className="p-4">Birligi</th>
              <th className="p-4">Avvalgi narxi</th>
              <th className="p-4">Yangi narxi</th>
              <th className="p-4">O'zgartirgan foydalanuvchi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
             {/* Empty State */}
          </tbody>
        </table>
        {/* Empty state message could go here if needed, but screenshot shows blank table */}
      </div>
    </div>
  );
};
export default ChangedPriceProducts;