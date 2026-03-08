import React from 'react';
import { Search, Filter, Download } from 'lucide-react';

const WarningLetters = () => {
  const data = [
    { id: '29851', date: '10.11.2025', org: "Qo'shko'pir filiali", client: 'SAPAYEV RASUL ISMAIL OGLI', term: '3', sum: '11 900 000 UZS', debt: '3 933 400 UZS', resp: 'Matqurbanov Ruzmat' },
    { id: '22038', date: '17.06.2025', org: "Qo'shko'pir filiali", client: 'XUDAYBERGANOVA NARGIZA RUSTAMOVNA', term: '12', sum: '12 783 443 UZS', debt: '2 998 453 UZS', resp: 'Matqurbanov Ruzmat' },
    { id: '28635', date: '17.10.2025', org: "Qo'shko'pir filiali", client: 'ALTIBOYEVA MAXSUDA OZODOVNA', term: '12', sum: '34 399 423 UZS', debt: '2 859 800 UZS', resp: 'Ataboyev Dilmurod unduruv' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ogohlantirish xati</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-200"><Download size={20}/> Yuklab olish (0 ta)</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4"><input type="checkbox" /></th>
              <th className="p-4">Shartnoma ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Muddat</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Qarzdorlik</th>
              <th className="p-4">Mas'ul xodim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" /></td>
                <td className="p-4 text-gray-600">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4">{item.term}</td>
                <td className="p-4">{item.sum}</td>
                <td className="p-4 font-bold text-gray-800">{item.debt}</td>
                <td className="p-4 text-xs font-medium text-blue-600">{item.resp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default WarningLetters;