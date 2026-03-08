import React from 'react';
import { Search, Filter } from 'lucide-react';

const BonusGoods = () => {
  const data = [
    { id: '213', date: '05.10.2023', org: "Qo'shko'pir filiali", clientId: '274', client: 'QALANDAROVA SAYYORA BARDIYEVNA', product: 'Elektr choynak Emerald E-137', qty: '1 dona', price: '90 000 UZS', total: '90 000 UZS' },
    { id: '215', date: '05.10.2023', org: "Qo'shko'pir filiali", clientId: '277', client: 'AMINOV AZAMAT ROVSHANBEK OGLI', product: 'Kronshteyn Brando BR-702 17"-65"', qty: '1 dona', price: '150 000 UZS', total: '150 000 UZS' },
    { id: '216', date: '05.10.2023', org: "Qo'shko'pir filiali", clientId: '277', client: 'AMINOV AZAMAT ROVSHANBEK OGLI', product: 'Fen Fakang FK-9900', qty: '1 dona', price: '90 000 UZS', total: '90 000 UZS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Bonusga olingan tovarlar</h1>
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
              <th className="p-4">Amaliyot ID</th>
              <th className="p-4">Amaliyot sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Mijoz ID</th>
              <th className="p-4">Mijoz familiyasi, ismi</th>
              <th className="p-4">Tovar nomi va kodi</th>
              <th className="p-4">Miqdori</th>
              <th className="p-4">Narxi</th>
              <th className="p-4">Summasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-gray-600">{item.clientId}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 text-xs max-w-[200px] truncate">{item.product}</td>
                <td className="p-4 font-bold">{item.qty}</td>
                <td className="p-4">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default BonusGoods;