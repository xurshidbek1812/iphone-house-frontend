import React from 'react';
import { Search, Filter, Image as ImageIcon } from 'lucide-react';

const Discounts = () => {
  const data = [
    { id: '30928', tradeId: '34478', date: '25.01.2026', product: 'Smartfon Honor X7b 6/128 Gold "K"', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '2 495 000 UZS', discount: '10.62% - 265 000 UZS', user: 'Bekchanov Azomat', note: 'Kollobratsiya' },
    { id: '30922', tradeId: '34469', date: '25.01.2026', product: 'Chang yutgich ZIFFLER CV L23 PRO "K"', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '2 178 000 UZS', discount: '24.24% - 528 000 UZS', user: 'Otanazarov Abdiyozbek', note: 'Chegirma' },
    { id: '30919', tradeId: '34466', date: '25.01.2026', product: 'Televizor MOONX 55M850 Smart "K"', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '4 884 000 UZS', discount: '24.24% - 1 184 000 UZS', user: 'Otanazarov Abdiyozbek', note: '' },
    { id: '30916', tradeId: '34464', date: '25.01.2026', product: 'Televizor Volto 65VT9000 (WebOS) "K"', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '6 890 000 UZS', discount: '12.92% - 890 000 UZS', user: 'Bekchanov Azomat', note: 'kalabratsiya' },
    { id: '30909', tradeId: '34455', date: '25.01.2026', product: 'Televizor Volto 75VT9000 (WebOS) "K"', branch: "Qo'shko'pir filiali", qty: '1 dona', price: '8 844 000 UZS', discount: '12.88% - 1 139 000 UZS', user: 'Bekchanov Azomat', note: 'kollobratsiya' },
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
                   <span className="truncate w-64">{item.product}</span>
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