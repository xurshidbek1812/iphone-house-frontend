import React from 'react';
import { Search, Filter, Plus, MoreVertical, CheckCircle2 } from 'lucide-react';

const Sales = () => {
  // Mock Data from image_606d50.png
  const sales = [
    { id: '5613', date: '23.01.2026', branch: "Qo'shko'pir filiali", client: 'ABDIRIMOVA LOBAR', phone: '+998 (88) 418 8590', amount: '1 600 000 UZS', status: 'Tasdiqlandi' },
    { id: '5605', date: '22.01.2026', branch: "Qo'shko'pir filiali", client: 'KENJAYEVA MARXABO BAYNAZAROVNA', phone: '+998 (99) 894 2329', amount: '55 000 UZS', status: 'Tasdiqlandi' },
    { id: '5602', date: '21.01.2026', branch: "Qo'shko'pir filiali", client: 'BAXTIGUL ARTIQOVA', phone: '+998 (97) 608 1019', amount: '2 650 000 UZS', status: 'Tasdiqlandi' },
    { id: '5595', date: '20.01.2026', branch: "Qo'shko'pir filiali", client: "RO'ZMAT", phone: '+998 (02) 310 2110', amount: '15 000 UZS', status: 'Tasdiqlandi' },
    { id: '5577', date: '16.01.2026', branch: "Qo'shko'pir filiali", client: 'SHERMETOV IZZAT', phone: '+998 (99) 093 5556', amount: '1 600 000 UZS', status: 'Tasdiqlandi' },
    { id: '5563', date: '15.01.2026', branch: "Qo'shko'pir filiali", client: "O'RINOVA SHIRIN QO'ZIBOYEVNA", phone: '+998 (77) 343 6467', amount: '100 000 UZS', status: 'Tasdiqlandi' },
    { id: '5554', date: '14.01.2026', branch: "Qo'shko'pir filiali", client: 'OLMAJON', phone: '+998 (03) 013 1316', amount: '170 000 UZS', status: 'Tasdiqlandi' },
    { id: '5549', date: '12.01.2026', branch: "Qo'shko'pir filiali", client: 'SAMAMJON', phone: '+998 (06) 061 6316', amount: '82 000 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Naqd savdolar ro'yxati</h1>
      </div>

      {/* Toolbar */}
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b">Savdo ID</th>
              <th className="p-4 border-b">Sanasi</th>
              <th className="p-4 border-b">Tashkilot nomi</th>
              <th className="p-4 border-b">Savdo qilgan mijoz</th>
              <th className="p-4 border-b">Telefon raqami</th>
              <th className="p-4 border-b">Summasi</th>
              <th className="p-4 border-b">Holati</th>
              <th className="p-4 border-b text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="p-4 text-sm font-medium text-gray-900">{item.id}</td>
                <td className="p-4 text-sm text-gray-600">{item.date}</td>
                <td className="p-4 text-sm text-gray-600">{item.branch}</td>
                <td className="p-4 text-sm font-medium text-gray-800 uppercase">{item.client}</td>
                <td className="p-4 text-sm text-gray-500">{item.phone}</td>
                <td className="p-4 text-sm font-bold text-gray-900">{item.amount}</td>
                <td className="p-4">
                  {/* The Blue Status Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-blue-200 text-blue-600 bg-blue-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer */}
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

export default Sales;