import React from 'react';
import { Search, Filter, Image as ImageIcon } from 'lucide-react';

const ChangedPrices = () => {
  const data = [
    { id: '12080', date: '14.01.2026\n17:56:23', prodId: '2', name: 'Konditsioner 12 XTRON TUNDRA (DC INVERTOR R32) White', org: "Qo'shko'pir filiali", oldPrice: '5 775 000 UZS', newPrice: '6 175 000 UZS', incomePrice: '350 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '12081', date: '14.01.2026\n17:56:23', prodId: '3', name: 'Konditsioner 18 XTRON TUNDRA (DC INVERTOR R32) White', org: "Qo'shko'pir filiali", oldPrice: '8 250 000 UZS', newPrice: '8 650 000 UZS', incomePrice: '500 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '10276', date: '14.01.2026\n17:56:23', prodId: '4', name: 'Ustunli konditsioner Sitronic PLANET ASF-H24B3/SSCOA 24000 BTU', org: "Qo'shko'pir filiali", oldPrice: '17 655 000 UZS', newPrice: '18 055 000 UZS', incomePrice: '1 070 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '21790', date: '14.01.2026\n17:56:23', prodId: '6', name: 'Konditsioner AVANGARD 09 INVERTER White', org: "Qo'shko'pir filiali", oldPrice: '5 693 000 UZS', newPrice: '6 093 000 UZS', incomePrice: '345 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '1361', date: '14.01.2026\n17:56:23', prodId: '7', name: 'Konditsioner AVANGARD 12 INVERTER White', org: "Qo'shko'pir filiali", oldPrice: '6 188 000 UZS', newPrice: '6 588 000 UZS', incomePrice: '375 USD', markup: '32%', extra: '400 000 UZS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">O'zgargan narxlar</h1>
      
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
              <th className="p-4 text-right">So'ngi kirim narxi</th>
              <th className="p-4 text-center">Ustama(%)</th>
              <th className="p-4 text-right">Qo'shimcha ustama</th>
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
                   <span className="truncate w-64 font-medium text-gray-700 whitespace-pre-wrap">{item.name}</span>
                </td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-right text-gray-500">{item.oldPrice}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.newPrice}</td>
                <td className="p-4 text-right font-medium">{item.incomePrice}</td>
                <td className="p-4 text-center">{item.markup}</td>
                <td className="p-4 text-right">{item.extra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ChangedPrices;