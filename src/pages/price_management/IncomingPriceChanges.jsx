import React from 'react';
import { Search, Filter, Image as ImageIcon } from 'lucide-react';

const IncomingPriceChanges = () => {
  const data = [
    { id: '1164', date: '30.09.2023\n12:56:38', prodId: '1524', name: 'Gaz plita Artel Apetito 01-G ГП CHU Classic Mat Black', org: "Qo'shko'pir filiali", oldPrice: '0 UZS', newPrice: '3 825 000 UZS', user: 'Sabirov Doniyor' },
    { id: '1165', date: '30.09.2023\n12:56:38', prodId: '1525', name: 'Gaz plita Artel Apetito 02-G чўян Brown', org: "Qo'shko'pir filiali", oldPrice: '0 UZS', newPrice: '3 375 000 UZS', user: 'Sabirov Doniyor' },
    { id: '1166', date: '30.09.2023\n12:56:38', prodId: '1526', name: 'Mini pech Artel MD 4218 L Black', org: "Qo'shko'pir filiali", oldPrice: '0 UZS', newPrice: '1 170 000 UZS', user: 'Sabirov Doniyor' },
    { id: '1167', date: '30.09.2023\n12:56:38', prodId: '1450', name: 'Televizor Artel UA32H3200 HD Android', org: "Qo'shko'pir filiali", oldPrice: '0 UZS', newPrice: '2 265 000 UZS', user: 'Sabirov Doniyor' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kirim narxi o'zgarishlari</h1>
      
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
              <th className="p-4">Tovar ID</th>
              <th className="p-4">Tovar nomi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4 text-right">Avvalgi sotish narxi</th>
              <th className="p-4 text-right">Sotish narxi</th>
              <th className="p-4">Tasdiqlagan xodim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600 whitespace-pre-line">{item.date}</td>
                <td className="p-4 text-gray-500">{item.prodId}</td>
                <td className="p-4 flex items-center gap-3">
                   <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border"><ImageIcon size={18}/></div>
                   <span className="truncate w-64 font-medium text-gray-700">{item.name}</span>
                </td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-right text-gray-500">{item.oldPrice}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.newPrice}</td>
                <td className="p-4 text-xs text-gray-600">{item.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default IncomingPriceChanges;