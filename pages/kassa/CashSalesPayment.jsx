import React from 'react';
import { Search, Filter } from 'lucide-react';

const CashSalesPayment = () => {
  const data = [
    { id: '5375', date: '13.12.2025', client: 'MATYOKUBOVA ZUBAYDA UMIDBEKOVNA', phone: '+998 (97) 515 8910', amount: '165 000 UZS', paid: '0 UZS', status: 'Kutilmoqda' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Naqd savdoga to'lov olish</h1>
      
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
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4 text-right">Telefon raqami</th>
              <th className="p-4 text-right">Summasi</th>
              <th className="p-4 text-right">To'langan summa</th>
              <th className="p-4">Savdo holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800">{item.client}</td>
                <td className="p-4 text-right text-gray-600">{item.phone}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.paid}</td>
                <td className="p-4"><span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold">● {item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CashSalesPayment;