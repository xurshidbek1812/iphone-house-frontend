import React from 'react';
import { Search, Filter } from 'lucide-react';

const ManageCash = () => {
  const data = [
    { id: '7', org: "Qo'shko'pir filiali", name: "Qo'shko'pir savdo va kassa-UZS", currency: 'UZS - O\'zbekiston so\'m', type: 'Naqd', responsible: 'Bekchanov Azomat', status: 'Faol', statusColor: 'text-green-600' },
    { id: '8', org: "Qo'shko'pir filiali", name: "Qo'shko'pir savdo va kassa-USD", currency: 'USD - AQSH dollari', type: 'Naqd', responsible: 'Bekchanov Azomat', status: 'Faol', statusColor: 'text-green-600' },
    { id: '9', org: "Qo'shko'pir filiali", name: "Yovqochov Doston Hamidbek o'g'li-UZS", currency: 'UZS - O\'zbekiston so\'m', type: 'Naqd', responsible: 'Yovqochov Doston Hamidbek o\'g\'li', status: 'Yopilgan', statusColor: 'text-gray-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kassalarni boshqarish</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Nomi</th>
              <th className="p-4">Valyuta turi</th>
              <th className="p-4">Turi</th>
              <th className="p-4">Javobgar shaxs</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.currency}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4 text-xs text-gray-500">{item.responsible}</td>
                <td className={`p-4 font-bold ${item.statusColor}`}>● {item.status}</td>
                <td className="p-4 text-gray-400">...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ManageCash;