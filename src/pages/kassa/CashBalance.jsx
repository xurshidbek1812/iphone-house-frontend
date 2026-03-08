import React from 'react';
import { Search, Filter } from 'lucide-react';

const CashBalance = () => {
  const data = [
    { id: '35', name: "Otanazarov Abdiyozbek Baxrambek o'g'li UZS", org: "Qo'shko'pir filiali", balance: '18 995 000 UZS', type: 'Naqd', responsible: 'Otanazarov Abdiyozbek Baxrambek o\'g\'li' },
    { id: '7', name: "Qo'shko'pir savdo va kassa-UZS", org: "Qo'shko'pir filiali", balance: '16 052 665.16 UZS', type: 'Naqd', responsible: 'Bekchanov Azomat' },
    { id: '54', name: "Qurbonbayev Mardonbek Saidnazarovich-UZS", org: "Qo'shko'pir filiali", balance: '5 976 000 UZS', type: 'Naqd', responsible: 'Qurbonbayev Mardonbek Saidnazarovich' },
    { id: '8', name: "Qo'shko'pir savdo va kassa-USD", org: "Qo'shko'pir filiali", balance: '0 USD', type: 'Naqd', responsible: 'Bekchanov Azomat' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kassalar qoldig'i</h1>
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
              <th className="p-4">Nomi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Qoldig'i</th>
              <th className="p-4">Turi</th>
              <th className="p-4">Javobgar shaxs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-bold text-gray-800">{item.balance}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4 text-xs text-gray-500">{item.responsible}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CashBalance;