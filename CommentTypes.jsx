import React from 'react';
import { Search, Filter } from 'lucide-react';

const CommentTypes = () => {
  const data = [
    { id: '2', name: 'Telefoni uchirilgan', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '4', name: 'Yaqin qarindoshlariga aytildi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '5', name: 'Sms yuborildi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '6', name: 'Uyiga borish kerak', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '11', name: 'Qayta savdo', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lgan' },
    { id: '12', name: 'vada', date: 'Bog\'liq', client: 'Bog\'lanib bo\'lgan' },
    { id: '1', name: 'Vada berdi', date: 'Bog\'liq', client: 'Bog\'lanib bo\'lgan' },
    { id: '3', name: 'Qizilladi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '13', name: 'Yaqin qarindoshlariga aytildi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '14', name: 'SMS yuborildi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
    { id: '15', name: 'Ko\'tarmadi', date: 'Bog\'liq emas', client: 'Bog\'lanib bo\'lmagan' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Izoh turlari</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nomi</th>
              <th className="p-4">Sanaga bog'liqligi</th>
              <th className="p-4">Mijoz bilan bog'langanligi</th>
              <th className="p-4 text-right">Faolligi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-gray-600">{item.date}</td>
                <td className="p-4 text-gray-600">{item.client}</td>
                <td className="p-4 text-right">
                    <div className="w-10 h-5 bg-green-200 rounded-full inline-flex items-center px-1 ml-auto cursor-pointer">
                        <div className="w-3 h-3 bg-green-600 rounded-full ml-auto mr-1"></div>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CommentTypes;