import React from 'react';
import { Search, Filter, Plus, MoreVertical, Image as ImageIcon } from 'lucide-react';

const BonusReturn = () => {
  const data = [
    { id: '2168', date: '20.12.2025', client: 'OTAQOVA ANAGUL', product: 'Kiyim kuritgich MM570 Panama', qty: '1', price: '495 000 UZS', status: 'Tasdiqlandi' },
    { id: '2110', date: '05.12.2025', client: 'YULDOSHOVA YODGOROY', product: 'Xushtak choynak Zepter ZP-1251', qty: '1', price: '92 400 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bonus tovarini qaytarish</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sana</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Tovar nomi</th>
              <th className="p-4">Miqdor</th>
              <th className="p-4">Summa</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 border"><ImageIcon size={16}/></div>
                   <span className="truncate w-48 font-medium">{item.product}</span>
                </td>
                <td className="p-4">{item.qty}</td>
                <td className="p-4 font-bold text-gray-800">{item.price}</td>
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
export default BonusReturn;