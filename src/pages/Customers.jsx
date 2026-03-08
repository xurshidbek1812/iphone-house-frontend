import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const Customers = () => {
  // Mock Data - matching your screenshot (image_6068b2.png)
  const customers = [
    { id: '23805', name: 'KALANDAROVA FERUZA RUSTAMOVNA', birth: '08.10.1973', passport: '40810733160058', doc: 'AB 5927795', score: 100 },
    { id: '23804', name: 'BOBOJANOVA FERUZA TAXIROVNA', birth: '30.04.1978', passport: '43004787190014', doc: 'AB 2869072', score: 100 },
    { id: '23803', name: 'BABAYOZOV ERGASHBOY YULDASHEVICH', birth: '28.07.1970', passport: '32807703090029', doc: 'AD 6819554', score: 100 },
    { id: '23802', name: 'RAXMATULLAYEV NIZAMJAN TURSUNBAYEVICH', birth: '20.12.1983', passport: '32012833080066', doc: 'AE 3844894', score: 100 },
    { id: '23801', name: 'TANGIRBERGANOV MANSURBEK XAMRABAYEVICH', birth: '20.09.1991', passport: '32009913080043', doc: 'AE 1519569', score: 100 },
    { id: '23800', name: 'JUMANIYOZOVA MUXABBAT FAYZULLAYEVNA', birth: '18.08.1974', passport: '41808743120033', doc: 'AB 6696753', score: 100 },
    { id: '23799', name: 'MATYOKUBOV AYRAT MATKURBANOVICH', birth: '14.04.1978', passport: '31404783140018', doc: 'AE 5541757', score: 100 },
    { id: '23798', name: 'OTAJANOV TIMURJON RO\'ZMETOVICH', birth: '19.11.1993', passport: '31911933090050', doc: 'AB 8311334', score: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mijozlar ro'yxati</h1>
      </div>

      {/* Toolbar (Search + Buttons) */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Izlash" 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter size={20} />
          <span>Filtr</span>
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          <span>Qo'shish</span>
        </button>
      </div>

      {/* The Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Ism, familiya va otasining ismi</th>
              <th className="p-4 border-b">Tug'ilgan sanasi</th>
              <th className="p-4 border-b">JSHSHIR raqami</th>
              <th className="p-4 border-b">Hujjat ma'lumoti</th>
              <th className="p-4 border-b">To'lov intizomi (Beta)</th>
              <th className="p-4 border-b text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="p-4 text-sm font-medium text-gray-900">{customer.id}</td>
                <td className="p-4 text-sm text-gray-700 font-medium">{customer.name}</td>
                <td className="p-4 text-sm text-gray-500">{customer.birth}</td>
                <td className="p-4 text-sm text-gray-500">{customer.passport}</td>
                <td className="p-4 text-sm text-gray-500">{customer.doc}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {customer.score} ball
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                  </button>
                </td>
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

export default Customers;