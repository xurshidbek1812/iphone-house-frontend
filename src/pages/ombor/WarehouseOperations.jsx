import React from 'react';
import { Search, Filter } from 'lucide-react';

const WarehouseOperations = () => {
  const data = [
    { id: '71420', date: '25.01.2026', number: '25.01.2026', org: "Qo'shko'pir filiali", type: "Ta'minotchidan kirim", warehouse: "Qo'shko'pir savdo ombori", supplier: 'Beko Xiva "K"', other: '-', client: '', amount: '5 350 000 UZS', status: 'Tasdiqlandi' },
    { id: '71419', date: '25.01.2026', number: '25.01.2026', org: "Qo'shko'pir filiali", type: "Ta'minotchidan kirim", warehouse: "Qo'shko'pir savdo ombori", supplier: 'Avto-Savdo Kushkupir "K"', other: '-', client: '', amount: '11 200 000 UZS', status: 'Tasdiqlandi' },
    { id: '71417', date: '25.01.2026', number: '25.01.2026', org: "Qo'shko'pir filiali", type: "Ta'minotchidan kirim", warehouse: "Qo'shko'pir savdo ombori", supplier: 'Avto Savdo Telefon "K"', other: '-', client: '', amount: '1 890 000 UZS', status: 'Tasdiqlandi' },
    { id: '71416', date: '25.01.2026', number: '25.01.2026', org: "Qo'shko'pir filiali", type: "Ta'minotchidan kirim", warehouse: "Qo'shko'pir savdo ombori", supplier: 'Nixol Dukon Kushkupir "K"', other: '-', client: '', amount: '5 220 000 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Barcha ombor amaliyotlari</h1>
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
              <th className="p-4">Raqami</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Ombor nomi</th>
              <th className="p-4">Ta'minotchi nomi</th>
              <th className="p-4">Boshqa ombor nomi</th>
              <th className="p-4">Mijoz nomi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4">{item.number}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-medium">{item.type}</td>
                <td className="p-4 text-gray-600 text-xs">{item.warehouse}</td>
                <td className="p-4 text-gray-600 text-xs">{item.supplier}</td>
                <td className="p-4 text-center">{item.other}</td>
                <td className="p-4">{item.client}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
                <td className="p-4"><span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">● {item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default WarehouseOperations;