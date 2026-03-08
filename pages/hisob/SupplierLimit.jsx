import React from 'react';
import { Search, Filter } from 'lucide-react';

const SupplierLimit = () => {
  const data = [
    { id: '198', name: 'Javlonbek Xoji Stroy Gurpan "K"' },
    { id: '197', name: 'Zapchast Bozor Dilshod urganch' },
    { id: '196', name: 'Barakali mebellar Sardor Xiva "K"' },
    { id: '195', name: 'Maxliyo Taksafe "K"' },
    { id: '194', name: 'Shovot Bonvi "K"' },
    { id: '193', name: 'Brend Optom Aksessuar Urganch "K"' },
    { id: '192', name: 'Qurilish mollari Umrbek Bogot "K"' },
    { id: '191', name: 'Centr Dverey Urganch "K"' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ta'minotchi limiti</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Ta'minotchi ID</th>
              <th className="p-4">Ta'minotchi nomi</th>
              <th className="p-4 text-right">Limit qiymati (UZS)</th>
              <th className="p-4 text-right">Limit qiymati (USD)</th>
              <th className="p-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-right font-bold">0 UZS</td>
                <td className="p-4 text-right font-bold">0 USD</td>
                <td className="p-4 text-right">...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SupplierLimit;