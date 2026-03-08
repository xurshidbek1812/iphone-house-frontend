import React from 'react';
import { Search, Filter, Plus, ArrowRightCircle } from 'lucide-react';

const CurrencyExchange = () => {
  const data = [
    { id: '3583', date: '23.01.2026', out: '607 500 UZS', in: '50 USD', rate: '12 150 UZS' },
    { id: '3581', date: '23.01.2026', out: '18 225 000 UZS', in: '1 500 USD', rate: '12 150 UZS' },
    { id: '3526', date: '14.01.2026', out: '300 USD', in: '3 615 000 UZS', rate: '12 050 UZS' },
    { id: '3524', date: '13.01.2026', out: '3 615 000 UZS', in: '300 USD', rate: '12 050 UZS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Valyuta ayirboshlash</h1>
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
              <th className="p-4">Chiqim summasi</th>
              <th className="p-4"></th>
              <th className="p-4">Kirim summasi</th>
              <th className="p-4">Valyuta kursi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-red-500 font-bold">{item.out}</td>
                <td className="p-4 text-blue-500"><ArrowRightCircle size={20}/></td>
                <td className="p-4 text-green-600 font-bold">{item.in}</td>
                <td className="p-4 font-bold text-gray-800">{item.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CurrencyExchange;