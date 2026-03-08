import React from 'react';
import { Search, Filter, Plus, MoreVertical, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
  const navigate = useNavigate();
  const data = [
    { id: '34478', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1143', client: 'BABAYOZOV ERGASHBOY YULDASHEVICH', price: '2 230 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34472', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1137', client: 'OTAJANOV TIMURJON RO\'ZMETOVICH', price: '1 683 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34469', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1134', client: 'XASANOV ANVARBEK ILXOM O\'G\'LI', price: '1 650 000 UZS', prepaid: '500 000 UZS', status: 'Tasdiqlandi' },
    { id: '34466', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1131', client: 'DJUNUSOVA GUZAYNAB ABDURAXMANOVA', price: '3 700 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34464', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1129', client: 'KUTUMOV MANSURBEK YULDASHEVICH', price: '6 000 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34455', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1120', client: 'MATYOQUBOV TO\'LQIN O\'RINBOYEVICH', price: '7 705 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34454', date: '25.01.2026', org: "Qo'shko'pir filiali", number: '1119', client: 'NAZAROVA ZIYNAT YULDOSHEVNA', price: '4 500 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
    { id: '34447', date: '24.01.2026', org: "Qo'shko'pir filiali", number: '1112', client: 'GULYAMOVA GULNOZA BAXODIROVNA', price: '6 000 000 UZS', prepaid: '0 UZS', status: 'Tasdiqlandi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Shartnoma ro'yxati</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><LayoutList size={20}/> Ro'yxat</button>
         <button 
            onClick={() => navigate('/shartnoma/qoshish')} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
         >
            <Plus size={18} /> Qo'shish
         </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Raqami</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Tannarxi</th>
              <th className="p-4">Oldindan</th>
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
                <td className="p-4 font-bold">{item.number}</td>
                <td className="p-4 font-bold text-gray-800">{item.client}</td>
                <td className="p-4 font-bold text-gray-800">{item.price}</td>
                <td className="p-4 font-bold text-gray-800">{item.prepaid}</td>
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

export default ContractList;
