import React from 'react';
import { Search, Filter, Image as ImageIcon } from 'lucide-react';

const Discounts = () => {
  const data = [
    { id: '30846', tradeId: '5613', date: '23.01.2026', product: 'Kir yuvish mashinasi yarim avtomat Vesta WMG85P Water 01', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '1 848 000 UZS', discount: '13.42% - 248 000 UZS', user: 'Bekchanov Azomat', note: 'Naqd savdo' },
    { id: '30819', tradeId: '5605', date: '22.01.2026', product: 'Baklashka kuler', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '59 400 UZS', discount: '7.41% - 4 400 UZS', user: 'Bekchanov Azomat', note: 'Naqd savdo' },
    { id: '30801', tradeId: '5602', date: '21.01.2026', product: 'Smartfon Samsung Galaxy M36 6/128 GB Black', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '3 102 000 UZS', discount: '14.57% - 452 000 UZS', user: 'Bekchanov Azomat', note: 'Naqd savdo' },
    { id: '30776', tradeId: '5595', date: '20.01.2026', product: 'Avto aksessuar osvejitel', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '16 500 UZS', discount: '9.09% - 1 500 UZS', user: 'Bekchanov Azomat', note: 'Naqd savdo' },
    { id: '30615', tradeId: '5577', date: '16.01.2026', product: 'Dudbo\'ron Shivaki 0660 Rainbow T inox', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '1 881 000 UZS', discount: '14.94% - 281 000 UZS', user: 'Bekchanov Azomat', note: 'Naqd savdo' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Berilgan chegirmalar</h1>
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
              <th className="p-4">Savdo ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tovar nomi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Miqdori</th>
              <th className="p-4">Sotish narxi</th>
              <th className="p-4">Chegirma</th>
              <th className="p-4">Chegirma qilgan xodim</th>
              <th className="p-4">Izoh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold">{item.tradeId}</td>
                <td className="p-4 text-gray-600">{item.date}</td>
                <td className="p-4 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 border"><ImageIcon size={16}/></div>
                   <span className="truncate w-48">{item.product}</span>
                </td>
                <td className="p-4 text-gray-600">{item.branch}</td>
                <td className="p-4 font-bold">{item.qty}</td>
                <td className="p-4 font-bold text-gray-800">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.discount}</td>
                <td className="p-4 text-xs font-bold text-gray-500">{item.user}</td>
                <td className="p-4 text-gray-500">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Discounts;