import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const BonusOrders = () => {
  const data = [
    { id: '11281', date: '20.01.2026', org: "Qo'shko'pir filiali", clientId: '10461', client: 'YADGAROVA ZOYIRA AZATOVNA', amount: '297 000 UZS', status: 'Tasdiqlandi' },
    { id: '11280', date: '20.01.2026', org: "Qo'shko'pir filiali", clientId: '8205', client: 'OLLABERGANOV JAHONGIR ERGASH O\'G\'LI', amount: '85 800 UZS', status: 'Tasdiqlandi' },
    { id: '11279', date: '20.01.2026', org: "Qo'shko'pir filiali", clientId: '6496', client: 'ABDULLAEVA OLIYA ABDRIMOVNA', amount: '15 800 UZS', status: 'Tasdiqlandi' },
    { id: '11278', date: '20.01.2026', org: "Qo'shko'pir filiali", clientId: '19037', client: 'RAXIMOVA FERUZA FAXRIDDIN QIZI', amount: '52 800 UZS', status: 'Tasdiqlandi' },
    { id: '11277', date: '20.01.2026', org: "Qo'shko'pir filiali", clientId: '3812', client: 'MATKARIMOVA FAZILAT BEKTURDI QIZI', amount: '57 800 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bonus buyurtmalari</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Amaliyot ID</th>
              <th className="p-4">Amaliyot sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Mijoz ID</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Summasi</th>
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
                <td className="p-4 text-gray-600">{item.clientId}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4"><span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">● {item.status}</span></td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default BonusOrders;