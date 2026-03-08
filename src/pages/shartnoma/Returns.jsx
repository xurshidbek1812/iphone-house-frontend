import React from 'react';
import { Search, Plus, MoreVertical, Image as ImageIcon } from 'lucide-react';

const Returns = () => {
  const data = [
    { id: '2231', org: "Qo'shko'pir filiali", contract: 'ID: 34332\n21.01.2026', client: 'NIYOZOV UMID TOJIBOYEVICH', product: 'Coat Katta Techno', qty: '1 Dona\nQaytarildi', amount: '356 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '2223', org: "Qo'shko'pir filiali", contract: 'ID: 34002\n14.01.2026', client: 'OTABOYEVA OYGUL QABUL QIZI', product: 'Smartfon Infinix Hot 30i 8/256 GB Sleek Black', qty: '1 Dona\nQaytarildi', amount: '2 204 900 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '2218', org: "Qo'shko'pir filiali", contract: 'ID: 33691\n08.01.2026', client: 'XOJANIYAZOVA ZAMIRA SABIROVNA', product: 'Kuller Premier PRM-WDBK203S Silver', qty: '1 Dona\nQaytarildi', amount: '1 850 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
    { id: '2161', org: "Qo'shko'pir filiali", contract: 'ID: 32733\n24.12.2025', client: 'RAJABOVA MUHABBAT ERJONOVNA', product: 'Mini pech Klimat K-08 DFL Matt Gray', qty: '1 Dona\nQaytarildi', amount: '1 722 000 UZS', user: 'Bekchanov Azomat', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tovar qaytarish</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Shartnoma</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Tovar nomi</th>
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
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-xs font-bold whitespace-pre-line">{item.contract}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 border"><ImageIcon size={16}/></div>
                   <span className="truncate w-48 font-medium">{item.product}</span>
                </td>
                <td className="p-4 text-blue-600 font-bold whitespace-pre-line text-xs">{item.qty}</td>
                <td className="p-4 font-bold text-gray-800">{item.amount}</td>
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