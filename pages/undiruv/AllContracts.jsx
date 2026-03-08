import React from 'react';
import { Search, Filter } from 'lucide-react';

const AllContracts = () => {
  const data = [
    { id: '29851', name: 'SAPAYEV RASUL ISMAIL OGLI', date: '10.11.2025', term: '3', payDay: '1', monthly: '3 966 700 UZS', delay: '0.99', debt: '3 933 400 UZS' },
    { id: '22038', name: 'XUDAYBERGANOVA NARGIZA RUSTAMOVNA', date: '17.06.2025', term: '12', payDay: '1', monthly: '1 065 300 UZS', delay: '2.81', debt: '2 998 453 UZS' },
    { id: '28635', name: 'ALTIBOYEVA MAXSUDA OZODOVNA', date: '17.10.2025', term: '12', payDay: '1', monthly: '2 866 600 UZS', delay: '1', debt: '2 859 800 UZS' },
    { id: '23605', name: 'ERJANOV NURADDIN EGAMBERGANOVICH', date: '22.07.2025', term: '6', payDay: '1', monthly: '2 789 800 UZS', delay: '1', debt: '2 789 000 UZS', status: 'Muddati o\'tgan' },
    { id: '16440', name: 'XUDAYBERGANOVA NARGIZA RUSTAMOVNA', date: '10.01.2025', term: '12', payDay: '1', monthly: '594 900 UZS', delay: '4.04', debt: '2 403 847 UZS', status: 'Muddati o\'tgan' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Biriktirilgan shartnomalar</h1>
      
      {/* Top Tabs */}
      <div className="flex gap-2 bg-gray-50 p-1 rounded-lg w-fit mb-4">
         <button className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-bold text-gray-800">Barchasi</button>
         <button className="px-4 py-2 text-sm text-gray-500 hover:bg-white rounded-md">Bugun to'lov kuni</button>
         <button className="px-4 py-2 text-sm text-gray-500 hover:bg-white rounded-md">Bugun gaplashilgan</button>
         <button className="px-4 py-2 text-sm text-gray-500 hover:bg-white rounded-md">Bugun gaplashilmagan</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Shartnoma ID</th>
              <th className="p-4">Familiya, ism va otasining ismi</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Muddat</th>
              <th className="p-4">To'lov sanasi</th>
              <th className="p-4">Oylik to'lov</th>
              <th className="p-4">Kechikkan oy</th>
              <th className="p-4">Qarzdorlik</th>
              <th className="p-4">Holati</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-600">{item.id}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.name}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4">{item.term}</td>
                <td className="p-4">{item.payDay}</td>
                <td className="p-4 font-medium">{item.monthly}</td>
                <td className="p-4 font-bold">{item.delay}</td>
                <td className="p-4 font-bold text-gray-800">{item.debt}</td>
                <td className="p-4">
                    {item.status && (
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-fit">
                           <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> {item.status}
                        </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AllContracts;