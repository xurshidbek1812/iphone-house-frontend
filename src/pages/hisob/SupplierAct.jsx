import React from 'react';
import { Search, Filter, Download, Calendar, DollarSign } from 'lucide-react';

const SupplierAct = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ta'minotchi akt-sverkasi</h1>
      
      {/* Filter Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Tashkilot nomi</label>
              <select className="w-full border rounded-lg p-2 text-sm bg-gray-50 outline-none">
                  <option>Barcha filiallar</option>
              </select>
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Ta'minotchi nomi</label>
              <select className="w-full border rounded-lg p-2 text-sm bg-gray-50 outline-none">
                  <option></option>
              </select>
          </div>
          <div className="flex gap-2">
              <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Davr boshlanishi</label>
                  <input type="date" defaultValue="2026-01-01" className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
              <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Davr oxiri</label>
                  <input type="date" defaultValue="2026-01-31" className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
          </div>
          <div className="flex gap-2">
              <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex-1 flex items-center justify-center"><Search size={20}/></button>
              <button className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 flex-1 flex items-center justify-center gap-2 font-medium text-sm"><Download size={18}/> Yuklab olish</button>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20}/></div>
              <div><div className="text-xs text-gray-500">Davr boshlanishi</div><div className="font-bold">-</div></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20}/></div>
              <div><div className="text-xs text-gray-500">Qarzdorlik UZS</div><div className="font-bold">-</div></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20}/></div>
              <div><div className="text-xs text-gray-500">Davr oxiri</div><div className="font-bold">-</div></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20}/></div>
              <div><div className="text-xs text-gray-500">Qarzdorlik UZS</div><div className="font-bold">-</div></div>
          </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto min-h-[300px]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Amaliyot sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Summasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
             {/* Empty State */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SupplierAct;