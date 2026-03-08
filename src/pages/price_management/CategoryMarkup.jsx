import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const CategoryMarkup = () => {
  const data = [
    { id: '17082', date: '14.01.2026\n17:56', category: "Xo'jalik gaz plitalari\nQo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '32', extra: '80 000 UZS', user: 'Yovqochov Doston...', approver: 'Yovqochov Doston...', status: 'Tasdiqlandi' },
    { id: '17058', date: '14.01.2026\n17:55', category: "Idish yuvish mashinalari\nQo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '32', extra: '80 000 UZS', user: 'Yovqochov Doston...', approver: 'Yovqochov Doston...', status: 'Tasdiqlandi' },
    { id: '17054', date: '14.01.2026\n17:55', category: "Avtomat kir yuvish mashinalari\nQo'shko'pir filiali", scope: 'Barcha tovarlar uchun', percent: '32', extra: '80 000 UZS', user: 'Yovqochov Doston...', approver: 'Yovqochov Doston...', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kategoriya uchun ustama</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Izlash" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Kategoriya nomi</th>
              <th className="p-4">Tegishliligi</th>
              <th className="p-4">Ustama (%)</th>
              <th className="p-4">Qo'shimcha ustama</th>
              <th className="p-4">Kiritgan xodim</th>
              <th className="p-4">Tasdiqlagan xodim</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600 whitespace-pre-line">{item.date}</td>
                <td className="p-4 text-gray-800 font-medium whitespace-pre-line">{item.category}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">{item.scope}</span></td>
                <td className="p-4 font-bold">{item.percent}</td>
                <td className="p-4 font-bold text-gray-800">{item.extra}</td>
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
export default CategoryMarkup;