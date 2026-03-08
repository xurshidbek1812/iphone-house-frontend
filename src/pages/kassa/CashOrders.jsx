import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const CashOrders = () => {
  const data = [
    { id: '1478', date: '23.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", amount: '200 000 UZS', type: 'Mijozga pul qaytarish', user: 'Bekchanov Azomat', status: 'Bajarildi' },
    { id: '1423', date: '25.12.2025', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", amount: '1 761 000 UZS', type: 'Mijozga pul qaytarish', user: 'Bekchanov Azomat', status: 'Bajarildi' },
    { id: '1383', date: '13.12.2025', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", amount: '1 511 000 UZS', type: 'Mijozga pul qaytarish', user: 'Bekchanov Azomat', status: 'Bajarildi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Barcha kassa buyurtmalari</h1>
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
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Bajargan foydalanuvchi</th>
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
                <td className="p-4 text-xs font-medium max-w-[150px] truncate">{item.cash}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 font-medium">{item.type}</td>
                <td className="p-4 text-xs text-gray-500">{item.user}</td>
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
export default CashOrders;