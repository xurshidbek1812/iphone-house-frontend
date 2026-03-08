import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';

const AssignResponsible = () => {
  const data = [
    { id: '29', name: 'SULTANOVA NARGIZA RUSTAMBAYEVNA', pin: '41511833100029', area: 'Urganch shahar', mfy: 'Mash\'al MFY', resp: 'Ataboyev Dilmurod unduruv' },
    { id: '108', name: 'JUMANIYOZOVA SHAHLO SHOMUROTOVNA', pin: '42311853090019', area: 'Kushkupir tumani', mfy: 'Polvon MFY', resp: 'Matqurbanov Ruzmat' },
    { id: '264', name: 'BEKCHANOVA MUYASSAR XO\'JAYEVNA', pin: '40909663090035', area: 'Kushkupir tumani', mfy: 'Qorovul MFY', resp: 'Yuldashev Tangribergan' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mas'ul biriktirish</h1>
      
      <div className="flex gap-2 mb-4">
         <button className="px-4 py-2 bg-white border border-gray-200 rounded-md font-bold text-sm text-gray-700 shadow-sm">Mijozlar bo'yicha</button>
         <button className="px-4 py-2 bg-gray-100 rounded-md text-sm text-gray-500 hover:bg-white">Shartnomalar bo'yicha</button>
         <div className="ml-auto flex items-center gap-4 text-sm font-bold text-gray-600">
             <span>Mijozlar: <span className="text-blue-600">1 654 ta</span></span>
             <span>Shartnomalar: <span className="text-blue-600">0 ta</span></span>
         </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Barchasini biriktirish (1654 ta)</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4"><input type="checkbox" /></th>
              <th className="p-4">Mijoz ID</th>
              <th className="p-4">Mijozning familiya, ism va otasining ismi</th>
              <th className="p-4">JSHSHIR raqami</th>
              <th className="p-4">Tuman</th>
              <th className="p-4">MFY</th>
              <th className="p-4">Ma'sul xodim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" /></td>
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold text-gray-700 text-xs">{item.name}</td>
                <td className="p-4">{item.pin}</td>
                <td className="p-4 text-gray-600">{item.area}</td>
                <td className="p-4 text-gray-600">{item.mfy}</td>
                <td className="p-4 text-xs font-medium text-blue-600">{item.resp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AssignResponsible;