import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const DeliveryList = () => {
  const data = [
    { id: '52339', trade: 'Shartnoma 26081', date: '11.09.2025', client: 'KURONBOYEVA KLARA RAJABBOYEVNA', product: 'Gazova plita Biryusa U90GE91BL 8004', time: '11.09.2025 13:12:00', qty: '1', price: '6 895 000 UZS', total: '6 895 000 UZS', address: 'Xorazm viloyati Viloyati, Kushkupir tumani, Yangilik MFY Yangi avlod kuchasi 94-uy' },
    { id: '56191', trade: 'Bonus 10206', date: '27.10.2025', client: 'KURONBOYEVA KLARA RAJABBOYEVNA', product: 'Kastryulya to\'plami Zepter 1130', time: '27.10.2025 00:00:00', qty: '1', price: '538 000 UZS', total: '538 000 UZS', address: 'Xorazm viloyati Viloyati, Kushkupir tumani, Adolat MFY srth' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Yetkazib berish</h1>
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
              <th className="p-4">Savdo</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Tovar nomi va ID</th>
              <th className="p-4">Vaqti</th>
              <th className="p-4">Miqdori</th>
              <th className="p-4">Sotish narxi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Manzili</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-xs font-medium text-gray-600">{item.trade}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800 text-xs max-w-[150px] truncate">{item.client}</td>
                <td className="p-4 text-xs font-medium max-w-[200px] truncate">{item.product}</td>
                <td className="p-4 text-xs text-gray-500">{item.time}</td>
                <td className="p-4 font-bold">{item.qty}</td>
                <td className="p-4">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.total}</td>
                <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate" title={item.address}>{item.address}</td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default DeliveryList;