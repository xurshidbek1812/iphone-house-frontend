import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const IncomeFromExpense = () => {
  const data = [
    { id: '166299', date: '25.12.2025', cash: "Qo'shko'pir savdo va kassa-UZS", type: 'Maxsulot eskirish qiymati', amount: '470 000 UZS', note: 'Mijoz Saburov Sobirjon Bekpo\'lat dan qaytarilgan...', status: 'Qabul qilindi' },
    { id: '155308', date: '22.11.2025', cash: "Qo'shko'pir savdo va kassa-UZS", type: 'Maxsulot eskirish qiymati', amount: '11 000 UZS', note: 'MATKURBANOVA FATIMA XAYITBAYEVNA dan qaytgan...', status: 'Qabul qilindi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Xarajatdan pul kirim</h1>
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
              <th className="p-4">Amaliyot ID</th>
              <th className="p-4">Amaliyot sanasi</th>
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Xarajat moddasi</th>
              <th className="p-4">Summasi</th>
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
                <td className="p-4 text-gray-600">{item.cash}</td>
                <td className="p-4 font-medium">{item.type}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 text-xs text-gray-500 truncate max-w-xs">{item.note}</td>
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
export default IncomeFromExpense;