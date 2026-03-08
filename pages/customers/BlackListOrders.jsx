import React from 'react';
import { Search, Filter, Plus, MoreVertical, PlusCircle } from 'lucide-react';

const BlackListOrders = () => {
  const data = [
    { id: '4458', date: '26.01.2026', org: "Qo'shko'pir filiali", clientId: '13252', client: 'IBADULLAYEV ALISHER SADULLAYEVICH', type: 'Qo\'shish', requester: 'Bekchanov Azomat', approver: '', reason: 'XAR OYNI OXIRIDA TO\'LAYDI MUMOLI MIJOZ SHARTNOMA QILINMASIN', status: 'Yuborildi', statusColor: 'text-yellow-600 bg-yellow-50' },
    { id: '4448', date: '24.01.2026', org: "Qo'shko'pir filiali", clientId: '19735', client: 'ALLAYOROVA RAXILA SAPARBAYEVNA', type: 'Qo\'shish', requester: 'Bekchanov Azomat', approver: 'Yovqochov Doston Hamidbek o\'g\'li', reason: 'MUMOLI MIJOZ', status: 'Tasdiqlandi', statusColor: 'text-blue-600 bg-blue-50' },
    { id: '4447', date: '24.01.2026', org: "Qo'shko'pir filiali", clientId: '12216', client: 'YUSUPOV RAXIMBOY SAPAYEVCH', type: 'Qo\'shish', requester: 'Bekchanov Azomat', approver: 'Yovqochov Doston Hamidbek o\'g\'li', reason: 'SHARTNOMA QILINMASIN MUMOLI MIJOZ UYIGA BORIB OLINADI TO\'LOV', status: 'Tasdiqlandi', statusColor: 'text-blue-600 bg-blue-50' },
    { id: '4446', date: '24.01.2026', org: "Qo'shko'pir filiali", clientId: '19433', client: 'ATANIYOZOV SOPARDURDI MIXAILOVICH', type: 'Qo\'shish', requester: 'Bekchanov Azomat', approver: 'Yovqochov Doston Hamidbek o\'g\'li', reason: 'MUMOLI MIJOZ SHARTNOMA QILINMASIN', status: 'Tasdiqlandi', statusColor: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Qora ro'yxat buyurtmalari</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700"><Plus size={20}/> Qo'shish</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Mijoz ID</th>
              <th className="p-4">Familiya, ism va otasining ismi</th>
              <th className="p-4">Turi</th>
              <th className="p-4">Buyurtmachi</th>
              <th className="p-4">Tasdiqlovchi</th>
              <th className="p-4">Sababi</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600">{item.org}</td>
                <td className="p-4 text-gray-600">{item.clientId}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4 text-green-600 font-bold flex items-center gap-1"><PlusCircle size={16}/> {item.type}</td>
                <td className="p-4 text-gray-600">{item.requester}</td>
                <td className="p-4 text-gray-600 text-xs">{item.approver}</td>
                <td className="p-4 text-gray-500 text-xs max-w-[200px] truncate" title={item.reason}>{item.reason}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${item.statusColor}`}>● {item.status}</span></td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default BlackListOrders;