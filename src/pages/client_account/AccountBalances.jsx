import React from 'react';
import { Search, Filter } from 'lucide-react';

const AccountBalances = () => {
  const data = [
    { id: '3', name: 'YUSUPOVA SADOKAT RUSTAMBAYEVNA', org: 'Urganch filiali', pin: '41401873160045', doc: 'AD 3509771', balance: '250 UZS' },
    { id: '52', name: 'XABIBULLAYEVA DILARAM KUCHKAROVNA', org: 'Urganch filiali', pin: '40909563160093', doc: 'AB 3643319', balance: '998 UZS' },
    { id: '61', name: 'YULDASHEVA NARGIZ SABUROVNA', org: 'Urganch filiali', pin: '42403783120129', doc: 'AC 2501871', balance: '925 UZS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Hisob raqam qoldiqlari</h1>
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
              <th className="p-4">Ism, familiya va otasining ismi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">JSHSHIR raqami</th>
              <th className="p-4">Hujjat ma'lumoti</th>
              <th className="p-4 text-right">Hisob raqam qoldig'i</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-gray-600">{item.pin}</td>
                <td className="p-4 text-gray-600">{item.doc}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AccountBalances;