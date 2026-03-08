import React from 'react';
import { Search, Filter } from 'lucide-react';

const OrderListKassa = () => {
  const data = [
    { id: '1478', date: '23.01.2026', cash: "Qo'shko'pir savdo va kassa-UZS", amount: '200 000 UZS', type: 'Mijozga pul qaytarish', status: 'Band qilinmagan', user: 'Yovqochov Doston' },
    { id: '1423', date: '25.12.2025', cash: "Qo'shko'pir savdo va kassa-UZS", amount: '1 761 000 UZS', type: 'Mijozga pul qaytarish', status: 'Band qilinmagan', user: 'Yovqochov Doston' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Buyurtmalar ro'yxati</h1>
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
              <th className="p-4">Sanasi</th>
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Summa holati</th>
              <th className="p-4">Buyurtmachi nomi</th>
              <th className="p-4">Holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-xs font-medium max-w-[150px] truncate">{item.cash}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 font-medium">{item.type}</td>
                <td className="p-4 text-blue-500 font-bold text-xs bg-blue-50 px-2 py-1 rounded w-fit">{item.status}</td>
                <td className="p-4 text-xs text-gray-600">{item.user}</td>
                <td className="p-4"><span className="text-blue-600 font-bold">● Bajarildi</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default OrderListKassa;