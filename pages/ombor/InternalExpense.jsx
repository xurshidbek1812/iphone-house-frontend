import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const InternalExpense = () => {
  const data = [
    { id: '71020', date: '20.01.2026', number: 'M071020', from: "Qo'shko'pir savdo ombori\nQo'shko'pir filiali", to: "Urganch savdo ombori\nUrganch filiali", amount: '1 000 000 UZS', status: 'Tasdiqlandi' },
    { id: '70856', date: '18.01.2026', number: 'M070856', from: "Qo'shko'pir savdo ombori\nQo'shko'pir filiali", to: "Urganch savdo ombori\nUrganch filiali", amount: '415 USD', status: 'Tasdiqlandi' },
    { id: '70025', date: '10.01.2026', number: 'M070025', from: "Qo'shko'pir savdo ombori\nQo'shko'pir filiali", to: "Shovot savdo ombori\nShovot filiali", amount: '385 USD', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Boshqa omborga chiqim</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Raqami</th>
              <th className="p-4">Qayerdan</th>
              <th className="p-4">Qayerga</th>
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
                <td className="p-4">{item.number}</td>
                <td className="p-4 text-xs font-medium whitespace-pre-line">{item.from}</td>
                <td className="p-4 text-xs font-medium whitespace-pre-line">{item.to}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 text-gray-400">-</td>
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
export default InternalExpense;