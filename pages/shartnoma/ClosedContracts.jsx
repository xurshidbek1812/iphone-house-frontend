import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const ClosedContracts = () => {
  const data = [
    { id: '34332', date: '21.01.2026', org: "Qo'shko'pir filiali", number: '997', client: 'NIYOZOV UMID TOJIBOYEVICH', price: '356 000 UZS', prepaid: '0 UZS', closedDate: '22.01.2026 00:01' },
    { id: '34002', date: '14.01.2026', org: "Qo'shko'pir filiali", number: '668', client: 'OTABOYEVA OYGUL QABUL QIZI', price: '2 204 900 UZS', prepaid: '0 UZS', closedDate: '17.01.2026 00:01' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Yopilgan shartnomalar ro'yxati</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Raqami</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Tannarxi</th>
              <th className="p-4">Oldindan</th>
              <th className="p-4">Yopilgan vaqti</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-bold">{item.number}</td>
                <td className="p-4 font-bold text-gray-800">{item.client}</td>
                <td className="p-4 font-bold text-gray-800">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.prepaid}</td>
                <td className="p-4 font-medium">{item.closedDate}</td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ClosedContracts;