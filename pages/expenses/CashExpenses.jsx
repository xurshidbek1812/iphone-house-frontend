import React from 'react';
import { Search, Filter, MoreVertical, ArrowUpRight } from 'lucide-react';

const CashExpenses = () => {
  const data = [
    { id: '176803', date: '26.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Chiqindi tashish xarajatlari\nKommunal to\'lovlar', amount: '36 000 UZS', type: 'Chiqim', note: '2026-yil yanvar oyi uchun chiqindiga to\'lov qilindi', status: 'Qabul qilindi' },
    { id: '176355', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Yoqilg\'i xarajatlari (metan, benzin)\nUndiruv xarajatlari', amount: '100 000 UZS', type: 'Chiqim', note: 'Undiruv xodimi Dilmurodga benzin puli berildi', status: 'Qabul qilindi' },
    { id: '176354', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Yollanma avtomashina uchun yo\'l kira\nLabolar xizmati', amount: '50 000 UZS', type: 'Chiqim', note: 'Urganchga pul berib yuborildi', status: 'Qabul qilindi' },
    { id: '176344', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Filialdan tashqari tushlik/kechki ovqat\nOziq-ovqat xarajatlari', amount: '150 000 UZS', type: 'Chiqim', note: '5 ta odamga abet puli berildi', status: 'Qabul qilindi' },
    { id: '176341', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Yollanma avtomashina uchun yo\'l kira\nLabolar xizmati', amount: '50 000 UZS', type: 'Chiqim', note: '24.01.2026 kuni 1 550$, 25.01.2026 kuni 20 000 000 so\'m berib yuborildi', status: 'Qabul qilindi' },
    { id: '176326', date: '25.01.2026', org: "Qo'shko'pir filiali", cash: "Qo'shko'pir savdo va kassa-UZS", item: 'Internet to\'lovlari\nAloqa va internet uchun to\'lovlar', amount: '30 000 UZS', type: 'Chiqim', note: '2 ta mijoz KATM ni ko\'rish uchun', status: 'Qabul qilindi' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Kassadan xarajatlar</h1>
      
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
              <th className="p-4">Sanasi</th>
              <th className="p-4">Tashkilot nomi</th>
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Xarajat nomi</th>
              <th className="p-4 text-right">Summasi</th>
              <th className="p-4">Turi</th>
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
                <td className="p-4 text-gray-600 font-medium text-xs max-w-[150px] whitespace-normal">{item.org}</td>
                <td className="p-4 text-gray-600 font-medium text-xs max-w-[150px] whitespace-normal">{item.cash}</td>
                <td className="p-4 font-medium text-xs whitespace-pre-line">{item.item}</td>
                <td className="p-4 text-right font-bold text-gray-800">{item.amount}</td>
                <td className="p-4 text-red-500 font-bold flex items-center gap-1"><ArrowUpRight size={14}/> {item.type}</td>
                <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate" title={item.note}>{item.note}</td>
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
export default CashExpenses;