import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const CountingActs = () => {
  const data = [
    { id: '112', date: '20.01.2026', org: "Qo'shko'pir filiali", warehouse: "Qo'shko'pir savdo ombori", type: 'Ichki', user: 'Boltaboyev Sanjarbek M', note: '20.01.2026 kuni Qo\'shko\'pir ichki sanoq o\'tkazildi', status: 'Tasdiqlandi' },
    { id: '103', date: '08.12.2025', org: "Qo'shko'pir filiali", warehouse: "Qo'shko'pir savdo ombori", type: 'Ichki', user: 'Boltaboyev Sanjarbek M', note: '08.12.2025 kuni Qo\'shko\'pir ichki sanoq', status: 'Tasdiqlandi' },
    { id: '73', date: '26.06.2025', org: "Qo'shko'pir filiali", warehouse: "Qo'shko'pir savdo ombori", type: 'Ichki', user: 'Boltaboyev Sanjarbek M', note: '26-06-2025 Kuni Ichki Sanoq O\'tkazildi', status: 'Yakunlandi', statusColor: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Sanoq aktlari</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Ombor nomi</th>
              <th className="p-4">Turi</th>
              <th className="p-4">Tasdiqlagan xodim</th>
              <th className="p-4">Izoh</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-gray-600 text-xs">{item.warehouse}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4 text-xs font-bold text-gray-500">{item.user}</td>
                <td className="p-4 text-gray-500 text-xs truncate max-w-xs">{item.note}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.statusColor ? item.statusColor : 'text-blue-600 bg-blue-50'}`}>
                       ● {item.status}
                    </span>
                </td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CountingActs;