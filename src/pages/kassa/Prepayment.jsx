import React from 'react';
import { Search, Filter } from 'lucide-react';

const Prepayment = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Oldindan to'lov</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Shartnoma sanasi</th>
              <th className="p-4">Shartnoma raqami</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Oldindan to'lov</th>
              <th className="p-4">To'langan summa</th>
              <th className="p-4">Shartnoma holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
             {/* Empty State */}
          </tbody>
        </table>
        <div className="p-8 text-center text-gray-400 text-sm">Ma'lumot topilmadi</div>
      </div>
    </div>
  );
};
export default Prepayment;