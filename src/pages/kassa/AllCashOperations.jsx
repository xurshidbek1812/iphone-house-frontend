import React from 'react';
import { Search, Filter } from 'lucide-react';

const AllCashOperations = () => {
  const data = [
    { id: '176528', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", amount: '1 050 000 UZS', type: 'Shartnomaga to\'lov', status: 'Qabul qilindi' },
    { id: '176522', date: '26.01.2026', org: "Qo'shko'pir filiali", cash: "Otanazarov Abdiyozbek...", amount: '233 000 UZS', type: 'Shartnomaga to\'lov', status: 'Qabul qilindi' },
    { id: '176512', date: '26.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", amount: '370 000 UZS', type: 'Shartnomaga to\'lov', status: 'Qabul qilindi' },
    { id: '176509', date: '26.01.2026', org: "Qo'shko'pir filiali", cash: "Otanazarov Abdiyozbek...", amount: '12 057 000 UZS', type: 'Boshqa kassaga chiqim', status: 'Yuborildi', statusColor: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Barcha kassa amaliyotlari</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Izlash" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
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
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-xs font-medium max-w-[200px] truncate">{item.cash}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 font-medium">{item.type}</td>
                <td className={`p-4 font-bold ${item.statusColor || 'text-blue-600'}`}>● {item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AllCashOperations;