import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

const SmsSend = () => {
  const data = [
    { id: '74', date: '26.01.2026 10:55', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '64 ta', user: '', status: 'Yuborildi' },
    { id: '73', date: '24.01.2026 06:33', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '47 ta', user: '', status: 'Yuborildi' },
    { id: '72', date: '23.01.2026 10:39', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '50 ta', user: '', status: 'Yuborildi' },
    { id: '71', date: '22.01.2026 10:58', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '40 ta', user: '', status: 'Yuborildi' },
    { id: '70', date: '21.01.2026 05:25', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '46 ta', user: '', status: 'Yuborildi' },
    { id: '69', date: '20.01.2026 06:30', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '81 ta', user: '', status: 'Yuborildi' },
    { id: '68', date: '19.01.2026 06:39', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '48 ta', user: '', status: 'Yuborildi' },
    { id: '67', date: '19.01.2026 05:45', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '66 ta', user: '', status: 'Yuborildi' },
    { id: '66', date: '15.01.2026 05:40', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '66 ta', user: '', status: 'Yuborildi' },
    { id: '65', date: '14.01.2026 04:53', org: 'Bosh ofis', template: "Tug'ilgan kun", count: '55 ta', user: '', status: 'Yuborildi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mijozlarga sms yuborish</h1>
      
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
              <th className="p-4">Yuborilgan sana</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Shablon nomi</th>
              <th className="p-4 text-center">Yuborilgan smslar soni</th>
              <th className="p-4">Foydalanuvchi</th>
              <th className="p-4">Holati</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600">{item.date}</td>
                <td className="p-4 font-bold text-gray-800">{item.org}</td>
                <td className="p-4 text-gray-600">{item.template}</td>
                <td className="p-4 text-center font-bold">{item.count}</td>
                <td className="p-4 text-gray-500">{item.user}</td>
                <td className="p-4"><span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">● {item.status}</span></td>
                <td className="p-4"><ChevronDown size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SmsSend;