import React from 'react';
import { Search, Filter, Printer } from 'lucide-react';

const AllReceipts = () => {
  const data = [
    { id: '286124', date: '26.01.2026', client: 'KENJAYEV GAYRAT SHUXRATIVICH', type: 'Shartnoma', amount: '1 050 000 UZS', method: 'Naqd', cashier: 'Bekchanov Azomat' },
    { id: '286118', date: '26.01.2026', client: 'FAYZULLAYEVA XANIPA XXX', type: 'Shartnoma', amount: '233 000 UZS', method: 'Naqd', cashier: 'Otanazarov Abdiyozbek' },
    { id: '286107', date: '26.01.2026', client: 'POLVANOVA NILUFAR DAVRONBEK QIZI', type: 'Shartnoma', amount: '370 000 UZS', method: 'Naqd', cashier: 'Bekchanov Azomat' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Barcha tushumlar</h1>
      
      <div className="flex justify-between items-center">
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-bold shadow-sm">Barcha tushumlar ro'yxati</button>
             <button className="px-4 py-2 bg-gray-100 border border-transparent rounded-md text-sm text-gray-500">To'lov turlari bo'yicha</button>
          </div>
          <div className="text-right">
              <span className="text-sm text-gray-500 font-bold mr-2">Jami summa:</span>
              <span className="text-blue-600 font-bold text-lg">16 311 000 UZS</span>
          </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer size={20}/> Barchasini</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Savdo turi va ID</th>
              <th className="p-4">Tushum turi</th>
              <th className="p-4">Summasi va to'lov turi</th>
              <th className="p-4">Kassir F.I.O va kassa nomi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800">{item.client}</td>
                <td className="p-4 font-bold">{item.type}</td>
                <td className="p-4 font-bold">Muddati to'lov</td>
                <td className="p-4">
                    <div className="font-bold text-gray-800">{item.amount}</div>
                    <div className="text-xs text-blue-500">{item.method}</div>
                </td>
                <td className="p-4 text-xs text-gray-600 font-bold">{item.cashier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AllReceipts;