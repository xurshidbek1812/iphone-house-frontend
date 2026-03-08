import React from 'react';
import { Search, Filter, Download, Upload, MoreVertical } from 'lucide-react';

const AutoPaymentContracts = () => {
  const data = [
    { id: '8852', date: '10.07.2024', org: "Qo'shko'pir filiali", client: 'YUSUBOVA RAJABBIKA MATYOQUBOVNA', duration: '12', amount: '3 683 747.2 UZS', day: '1', delay: '0.62', debt: '191 670.24 UZS', type: 'INPS' },
    { id: '16115', date: '03.01.2025', org: "Qo'shko'pir filiali", client: 'SATIPOVA GAVHARJON OTABERGANOVNA', duration: '12', amount: '8 577 360 UZS', day: '1', delay: '0.31', debt: '219 727 UZS', type: 'INPS' },
    { id: '16256', date: '06.01.2025', org: "Qo'shko'pir filiali", client: 'QURBONOVA HALIMA SAPARBAYEVNA', duration: '12', amount: '6 191 872 UZS', day: '1', delay: '0.9', debt: '465 872 UZS', type: '' },
    { id: '16273', date: '06.01.2025', org: "Qo'shko'pir filiali", client: 'RAXMANOVA MEHRIBON TAJADDIN QIZI', duration: '12', amount: '4 280 593.6 UZS', day: '1', delay: '1', debt: '356 893.6 UZS', type: '' },
    { id: '16334', date: '07.01.2025', org: "Qo'shko'pir filiali", client: 'NARMATOV NURADDIN XAMRO O\'G\'LI', duration: '12', amount: '3 190 518 UZS', day: '1', delay: '1', debt: '265 318 UZS', type: '' },
    { id: '16383', date: '09.01.2025', org: "Qo'shko'pir filiali", client: 'YULDASHEVA NABIRA AZADOVNA', duration: '12', amount: '10 683 289.6 UZS', day: '1', delay: '1', debt: '889 289.6 UZS', type: 'INPS' },
    { id: '16392', date: '09.01.2025', org: "Qo'shko'pir filiali", client: 'JUMANIYOZOVA DILBAR KUTLIMURATOVNA', duration: '12', amount: '9 231 275.4 UZS', day: '1', delay: '2.93', debt: '2 256 137.4 UZS', type: 'INPS' },
    { id: '16425', date: '10.01.2025', org: "Qo'shko'pir filiali", client: 'RAHIMBOYEV IZZATBEK QAHRAMON O\'G\'LI', duration: '12', amount: '3 194 922.2 UZS', day: '1', delay: '1', debt: '266 922.2 UZS', type: 'INPS' },
    { id: '16440', date: '10.01.2025', org: "Qo'shko'pir filiali", client: 'XUDAYBERGANOVA NARGIZA RUSTAMOVNA', duration: '12', amount: '7 139 136 UZS', day: '1', delay: '4.04', debt: '2 403 847 UZS', type: 'INPS' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Shartnomalar ro'yxati</h1>
      
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600"><Download size={20}/> Shablon yuklab olish</button>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600"><Upload size={20}/> Yuklash</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4"><input type="checkbox" /></th>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Mijoz familiyasi, ismi va otasining ismi</th>
              <th className="p-4">Muddati</th>
              <th className="p-4">Summasi</th>
              <th className="p-4 text-center">To'lov kuni</th>
              <th className="p-4">Kechikkan oy</th>
              <th className="p-4">Qarzdorlik</th>
              <th className="p-4">Ulanganlik turi</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" /></td>
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4">{item.date}</td>
                <td className="p-4 text-gray-600 text-xs">{item.org}</td>
                <td className="p-4 font-bold text-gray-800 text-xs">{item.client}</td>
                <td className="p-4">{item.duration}</td>
                <td className="p-4 font-bold">{item.amount}</td>
                <td className="p-4 text-center">{item.day}</td>
                <td className="p-4">{item.delay}</td>
                <td className="p-4 text-red-500 font-bold">{item.debt}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AutoPaymentContracts;