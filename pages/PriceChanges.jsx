import React from 'react';
import { Search, Filter, Image as ImageIcon } from 'lucide-react';

const PriceChanges = () => {
  // Mock Data from image_6016b7.png
  const products = [
    { id: '12080', date: '14.01.2026 17:56:23', productId: '2', name: 'Konditsioner 12 XTRON TUNDRA (DC INVERTOR R32) White', branch: "Qo'shko'pir filiali", oldPrice: '5 775 000 UZS', newPrice: '6 175 000 UZS', cost: '350 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '12081', date: '14.01.2026 17:56:23', productId: '3', name: 'Konditsioner 18 XTRON TUNDRA (DC INVERTOR R32) White', branch: "Qo'shko'pir filiali", oldPrice: '8 250 000 UZS', newPrice: '8 650 000 UZS', cost: '500 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '10276', date: '14.01.2026 17:56:23', productId: '4', name: 'Ustunli konditsioner Sitronic PLANET ASF-H24B3/SSCQ 24000 BTU', branch: "Qo'shko'pir filiali", oldPrice: '17 655 000 UZS', newPrice: '18 055 000 UZS', cost: '1 070 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '21790', date: '14.01.2026 17:56:23', productId: '6', name: 'Konditsioner AVANGARD 09 INVERTER White', branch: "Qo'shko'pir filiali", oldPrice: '5 693 000 UZS', newPrice: '6 093 000 UZS', cost: '345 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '1361', date: '14.01.2026 17:56:23', productId: '7', name: 'Konditsioner AVANGARD 12 INVERTER White', branch: "Qo'shko'pir filiali", oldPrice: '6 188 000 UZS', newPrice: '6 588 000 UZS', cost: '375 USD', markup: '32%', extra: '400 000 UZS' },
    { id: '14414', date: '14.01.2026 17:56:23', productId: '17', name: 'Konditsioner MOONX 12 VEGA INVERTOR+TEN White', branch: "Qo'shko'pir filiali", oldPrice: '6 105 000 UZS', newPrice: '6 505 000 UZS', cost: '370 USD', markup: '32%', extra: '400 000 UZS' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">O'zgargan narxlar</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter size={20} />
          <span>Filtr</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>Ustunlar</span>
        </button>
      </div>

      {/* The Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Sanasi</th>
              <th className="p-4 border-b">Tovar ID</th>
              <th className="p-4 border-b">Tovar nomi</th>
              <th className="p-4 border-b">Tashkilot nomi</th>
              <th className="p-4 border-b">Avvalgi sotish narxi</th>
              <th className="p-4 border-b">Sotish narxi</th>
              <th className="p-4 border-b">So'ngi kirim narxi</th>
              <th className="p-4 border-b">Ustama(%)</th>
              <th className="p-4 border-b">Qo'shimcha ustama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600 text-xs">{item.date}</td>
                <td className="p-4 text-gray-900 font-medium">{item.productId}</td>
                
                {/* --- The Image + Name Column --- */}
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        {/* Grey box placeholder for image */}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                            <ImageIcon size={20} />
                        </div>
                        <span className="font-medium text-gray-800 w-64 truncate" title={item.name}>
                            {item.name}
                        </span>
                    </div>
                </td>

                <td className="p-4 text-gray-600">{item.branch}</td>
                <td className="p-4 text-gray-500">{item.oldPrice}</td>
                <td className="p-4 font-bold text-gray-900">{item.newPrice}</td>
                <td className="p-4 text-gray-600">{item.cost}</td>
                <td className="p-4 text-gray-600">{item.markup}</td>
                <td className="p-4 font-bold text-gray-900">{item.extra}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
                <span>Ko'rsatishlar soni</span>
                <select className="border rounded px-2 py-1"><option>15</option></select>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">«</button>
                <button className="px-3 py-1 border rounded bg-white font-bold text-gray-800">1</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">»</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChanges;