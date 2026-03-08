import React from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';

const CashSales = () => {
  const data = [
    { id: '5613', date: '23.01.2026', org: "Qo'shko'pir filiali", client: 'ABDIRIMOVA LOBAR', phone: '+998 (88) 418 8590', amount: '1 600 000 UZS', status: 'Tasdiqlandi' },
    { id: '5605', date: '22.01.2026', org: "Qo'shko'pir filiali", client: 'KENJAYEVA MARXABO BAYNAZAROVNA', phone: '+998 (99) 894 2329', amount: '55 000 UZS', status: 'Tasdiqlandi' },
    { id: '5602', date: '21.01.2026', org: "Qo'shko'pir filiali", client: 'BAXTIGUL ARTIQOVA', phone: '+998 (97) 608 1019', amount: '2 650 000 UZS', status: 'Tasdiqlandi' },
    { id: '5595', date: '20.01.2026', org: "Qo'shko'pir filiali", client: "RO'ZMAT", phone: '+998 (02) 310 2110', amount: '15 000 UZS', status: 'Tasdiqlandi' },
    { id: '5577', date: '16.01.2026', org: "Qo'shko'pir filiali", client: 'SHERMETOV IZZAT', phone: '+998 (99) 093 5556', amount: '1 600 000 UZS', note: '88-079-55-56', status: 'Tasdiqlandi' },
    { id: '5563', date: '15.01.2026', org: "Qo'shko'pir filiali", client: "O'RINOVA SHIRIN QO'ZIBOYEVNA", phone: '+998 (77) 343 6467', amount: '100 000 UZS', status: 'Tasdiqlandi' },
    { id: '5554', date: '14.01.2026', org: "Qo'shko'pir filiali", client: 'OLMAJON', phone: '+998 (03) 013 1316', amount: '170 000 UZS', status: 'Tasdiqlandi' },
    { id: '5549', date: '12.01.2026', org: "Qo'shko'pir filiali", client: 'SAMAMJON', phone: '+998 (06) 061 6316', amount: '82 000 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Naqd savdolar ro'yxati</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Savdo ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Savdo qilgan mijoz</th>
              <th className="p-4">Telefon raqami</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Izoh</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-900">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-bold text-gray-800">{item.client}</td>
                <td className="p-4 font-bold text-gray-600">{item.phone}</td>
                <td className="p-4 font-bold text-gray-900">{item.amount}</td>
                <td className="p-4 text-gray-500">{item.note}</td>
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
export default CashSales;