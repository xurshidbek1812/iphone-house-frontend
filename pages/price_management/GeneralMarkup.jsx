import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const GeneralMarkup = () => {
  const data = [
    { id: '17017', date: '14.01.2026\n17:49:56', org: "Qo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '32%', extra: '0 UZS', user: 'Yovqochov Doston Hamidbek o\'g\'li', approver: 'Yovqochov Doston Hamidbek o\'g\'li', status: 'Tasdiqlandi' },
    { id: '16962', date: '12.01.2026\n17:41:47', org: "Qo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '50%', extra: '0 UZS', user: 'Yovqochov Doston Hamidbek o\'g\'li', approver: 'Yovqochov Doston Hamidbek o\'g\'li', status: 'Tasdiqlandi' },
    { id: '16900', date: '07.01.2026\n00:27:52', org: "Qo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '45%', extra: '0 UZS', user: 'Yovqochov Doston Hamidbek o\'g\'li', approver: 'Yovqochov Doston Hamidbek o\'g\'li', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Umumiy ustama belgilash</h1>
      
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
              <th className="p-4">Tashkiloti</th>
              <th className="p-4">Tegishliligi</th>
              <th className="p-4">Ustama (%)</th>
              <th className="p-4">Qo'shimcha ustama</th>
              <th className="p-4">Kiritgan xodim</th>
              <th className="p-4">Tasdiqlagan xodim</th>
              <th className="p-4">Faolligi</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600 whitespace-pre-line">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">{item.scope}</span></td>
                <td className="p-4 font-bold">{item.percent}</td>
                <td className="p-4 text-gray-500">{item.extra}</td>
                <td className="p-4 text-xs text-gray-500 max-w-[150px] truncate">{item.user}</td>
                <td className="p-4 text-xs text-gray-500 max-w-[150px] truncate">{item.approver}</td>
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
export default GeneralMarkup;