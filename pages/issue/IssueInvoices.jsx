import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const IssueInvoices = () => {
  const data = [
    { id: '071394', date: '25.01.2026', client: 'OTAJANOV TIMURJON RO\'ZMETOVICH', currency: 'UZS', trade: 'Shartnoma 34472', warehouse: "Qo'shko'pir savdo ombori", driver: 'Yollanma Labo Qo\'shko\'pir', status: 'Tasdiqlandi' },
    { id: '071339', date: '24.01.2026', client: 'BEKCHANOVA MUXABBAT EGAMOVNA', currency: 'UZS', trade: 'Shartnoma 34376', warehouse: "Qo'shko'pir savdo ombori", driver: 'Yollanma Labo Qo\'shko\'pir', status: 'Tasdiqlandi' },
    { id: '071258', date: '23.01.2026', client: 'BEKCHANOVA MUXABBAT EGAMOVNA', currency: 'UZS', trade: 'Shartnoma 34376', warehouse: "Qo'shko'pir savdo ombori", driver: 'Yollanma Labo Qo\'shko\'pir', status: 'Tasdiqlandi' },
    { id: '071247', date: '23.01.2026', client: 'ABDIRIMOVA LOBAR', currency: 'UZS', trade: 'Naqd savdo 5613', warehouse: "Qo'shko'pir savdo ombori", driver: 'Yollanma Labo Qo\'shko\'pir', status: 'Tasdiqlandi' },
    { id: '071149', date: '21.01.2026', client: 'KENJAYEVA MARXABO BAYNAZAROVNA', currency: 'UZS', trade: 'Shartnoma 34342', warehouse: "Qo'shko'pir savdo ombori", driver: 'Yollanma Labo Qo\'shko\'pir', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Chiqim fakturalar</h1>
      
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-lg w-fit">
         <button className="px-4 py-2 bg-white shadow-sm rounded-md text-sm font-bold text-gray-800">Yetkazib beriladigan fakturalar</button>
         <button className="px-4 py-2 text-sm text-gray-500 hover:bg-white rounded-md">Olib ketiladigan fakturalar</button>
      </div>

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
              <th className="p-4">Raqami</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Mijoz</th>
              <th className="p-4">Valyuta</th>
              <th className="p-4">Savdo</th>
              <th className="p-4">Ombor nomi</th>
              <th className="p-4">Yetkazib beruvchi haydovchi</th>
              <th className="p-4">Izoh</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4">{item.currency}</td>
                <td className="p-4 text-xs font-medium">{item.trade}</td>
                <td className="p-4 text-xs text-gray-600">{item.warehouse}</td>
                <td className="p-4 text-xs text-gray-600">{item.driver}</td>
                <td className="p-4 text-gray-400">-</td>
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
export default IssueInvoices;