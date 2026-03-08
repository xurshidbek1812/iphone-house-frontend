import React from 'react';
import { Search, Edit } from 'lucide-react';

const AssignWorkplace = () => {
  const data = [
    { id: '64', name: 'Qadambayev Umarbek', org: "Qo'shko'pir filiali", job: 'Unduruv bo\'limi bosh mutaxassisi', phone: '+998 (94) 144 7555' },
    { id: '63', name: 'Matqurbanov Ruzmat', org: "Qo'shko'pir filiali", job: 'Unduruv bo\'limi bosh mutaxassisi', phone: '+998 (94) 144 7555' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ish joylarini biriktirish</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Izlash" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Ism, familiya va otasining ismi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Lavozimi</th>
              <th className="p-4">Telefon raqami</th>
              <th className="p-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {item.name.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-700">{item.name}</span>
                </td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-gray-500 max-w-xs truncate">{item.job}</td>
                <td className="p-4 font-mono text-gray-600">{item.phone}</td>
                <td className="p-4 text-right"><div className="bg-gray-100 p-2 rounded-full inline-block cursor-pointer hover:bg-gray-200"><Edit size={14} className="text-gray-600"/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AssignWorkplace;