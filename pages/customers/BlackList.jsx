import React from 'react';
import { Search, Filter, History } from 'lucide-react';

const BlackList = () => {
  const data = [
    { id: '9395', name: 'RAJAPOVA ILMIRA KURAMBAYEVNA', birth: '21.08.1989', pinfl: '42108893120080', doc: 'AA 7402078' },
    { id: '13202', name: 'KURBANOVA MASTURA ERKINOVNA', birth: '16.07.1988', pinfl: '41607883100019', doc: 'AD 5052883' },
    { id: '22899', name: 'KULJANOVA NILUFAR IXTIYAROVNA', birth: '05.03.1989', pinfl: '40503893100041', doc: 'AD 7675756' },
    { id: '18641', name: 'BEKCHANOV SHOXRUX QADAMBAYEVICH', birth: '13.04.1988', pinfl: '31304887190015', doc: 'AD 1286882' },
    { id: '6848', name: 'YULDASHEVA ZAMIRA UKTAMOVNA', birth: '02.12.1970', pinfl: '40212703140053', doc: 'AB 2334769' },
    { id: '9310', name: 'XASANOVA RAZIYA BERDIYEVNA', birth: '05.01.1966', pinfl: '40501663120015', doc: 'AC 2605231' },
    { id: '14119', name: 'KADIROV MATYOKUB XXX', birth: '18.04.1951', pinfl: '31804513090015', doc: 'AC 0525143' },
    { id: '21256', name: 'SADULLAYEV RASULBEK ABDULLAYEVICH', birth: '16.07.1982', pinfl: '31607823120052', doc: 'AD 8569834' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Qora ro'yxat</h1>
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
              <th className="p-4">Familiya, ism va otasining ismi</th>
              <th className="p-4">Tug'ilgan sanasi</th>
              <th className="p-4">JSHSHIR raqami</th>
              <th className="p-4">Hujjat ma'lumoti</th>
              <th className="p-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.birth}</td>
                <td className="p-4 font-mono text-gray-600">{item.pinfl}</td>
                <td className="p-4 font-mono text-gray-600">{item.doc}</td>
                <td className="p-4 text-right"><History size={18} className="text-gray-400 cursor-pointer inline-block hover:text-blue-600"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default BlackList;