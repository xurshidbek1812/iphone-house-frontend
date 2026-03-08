import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const PickupList = () => {
  const data = [
    { id: '65008', trade: 'Shartnoma 34504', date: '26.01.2026', client: 'DAVLATOVA FOTIMA OTABOYEVNA', prodId: '1493', product: 'Quvvatlovchi adapter Samsung 25W', qty: '1', price: '340 000 UZS', total: '340 000 UZS' },
    { id: '65007', trade: 'Shartnoma 34504', date: '26.01.2026', client: 'DAVLATOVA FOTIMA OTABOYEVNA', prodId: '11577', product: 'Smartfon Samsung Galaxy S25 Ultra 12/512 GB Titanium Black', qty: '1 Dona', price: '13 800 000 UZS', total: '13 800 000 UZS' },
    { id: '65006', trade: 'Shartnoma 34503', date: '26.01.2026', client: 'ATAYEVA DILNOZA ABDULLAYEVNA', prodId: '12324', product: 'Sovutgich VOLNA KD-328F "K"', qty: '1 Dona', price: '3 000 000 UZS', total: '3 000 000 UZS' },
    { id: '64997', trade: 'Shartnoma 34495', date: '26.01.2026', client: 'JANIBEKOVA ZULXUMOR IBRAGIMOVNA', prodId: '12797', product: 'Elektr go\'sht maydalagich Sonifer SF-5012 "K"', qty: '1 Dona', price: '1 100 000 UZS', total: '1 100 000 UZS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Olib ketish</h1>
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
              <th className="p-4">Sana</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Tovar ID</th>
              <th className="p-4">Tovar nomi</th>
              <th className="p-4">Miqdori</th>
              <th className="p-4">Sotish narxi</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-xs font-medium text-gray-600">{item.trade}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 text-gray-500">{item.prodId}</td>
                <td className="p-4 font-medium text-gray-700 max-w-[250px] truncate">{item.product}</td>
                <td className="p-4 font-bold">{item.qty}</td>
                <td className="p-4">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.total}</td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PickupList;