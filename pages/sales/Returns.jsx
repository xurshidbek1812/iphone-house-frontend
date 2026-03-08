import React from 'react';
import { Search, Filter, Plus, MoreVertical, Image as ImageIcon } from 'lucide-react';

const Returns = () => {
  const data = [
    { id: '1972', tradeId: '4809', tradeDate: '21.09.2025', client: 'RAXIMOVA SADOQAT', productName: 'Ko\'p funksiyali printer (MFU) Epson L3210 Rangi', productId: '4564', qty: '1', price: '2 184 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '1964', tradeId: '4802', tradeDate: '08.10.2025', client: 'SOXIBA', productName: 'Ko\'p funksiyali printer (MFU) Epson L3120 Rangi', productId: '7581', qty: '1 Dona', price: '3 100 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '1928', tradeId: '4708', tradeDate: '03.09.2025', client: 'AMINOVA GULANDON', productName: 'Ko\'p funksiyali printer (MFU) Canon PIXMA G2420 Rangi', productId: '3895', qty: '1 Dona', price: '1 775 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '1927', tradeId: '4704', tradeDate: '02.09.2025', client: 'ULUGBEK', productName: 'Elektr go\'sht maydalagich ALONSA 375', productId: '7533', qty: '1 Dona', price: '1 931 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '1760', tradeId: '4277', tradeDate: '09.06.2025', client: 'ZUHRA RAXMATOVA', productName: 'Fuzer Novot kuk', productId: '1413', qty: '1', price: '203 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tovar qaytarish</h1>
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
              <th className="p-4">Savdo</th>
              <th className="p-4">Mijoz ism, familiyasi</th>
              <th className="p-4">Tovar nomi va kodi</th>
              <th className="p-4">Miqdori</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Tasdiqlagan xodim</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">
                    <div className="font-bold text-gray-700">ID: {item.tradeId}</div>
                    <div className="text-xs text-gray-400">{item.tradeDate}</div>
                </td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 border"><ImageIcon size={16}/></div>
                   <div>
                       <div className="truncate w-48 font-medium">{item.productName}</div>
                       <div className="text-xs text-gray-400">ID: {item.productId}</div>
                   </div>
                </td>
                <td className="p-4 font-bold">{item.qty}</td>
                <td className="p-4 font-bold text-gray-800">{item.price}</td>
                <td className="p-4 text-xs font-bold text-gray-500">{item.user}</td>
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
export default Returns;