import React from 'react';
import { Search, Filter, MoreVertical, ArrowUpRight } from 'lucide-react';

const Expenses = () => {
  // Mock Data from image_60161e.jpg
  const expenses = [
    { id: '176856', date: '25.01.2026', branch: "Qo'shko'pir filiali", name: 'Benzin xarajatlari (metan, benzin)', amount: '100 000 UZS', type: 'Chiqim', note: 'Undiruv xodimi Dilmurodga benzin puli berildi', status: 'Qabul qilindi' },
    { id: '176854', date: '25.01.2026', branch: "Qo'shko'pir filiali", name: 'Eylanma avtomashina uchun yo\'l kira', amount: '50 000 UZS', type: 'Chiqim', note: 'Urganchga pul berib yuborildi', status: 'Qabul qilindi' },
    { id: '176841', date: '25.01.2026', branch: "Qo'shko'pir filiali", name: 'Filialdan tashqari tushlik/kechki ovqat', amount: '150 000 UZS', type: 'Chiqim', note: '5 ta odamga abet puli berildi', status: 'Qabul qilindi' },
    { id: '176840', date: '25.01.2026', branch: "Qo'shko'pir filiali", name: 'Eylanma avtomashina uchun yo\'l kira', amount: '50 000 UZS', type: 'Chiqim', note: '24.01.2026 kuni 1550$, 25.01.2026 kuni 20 000 000 so\'m berib yuborildi', status: 'Qabul qilindi' },
    { id: '176326', date: '25.01.2026', branch: "Qo'shko'pir filiali", name: 'Internet to\'lovlari', amount: '20 000 UZS', type: 'Chiqim', note: '2 ta mijoz KATM ni ko\'rish uchun', status: 'Qabul qilindi' },
    { id: '176103', date: '24.01.2026', branch: "Qo'shko'pir filiali", name: 'Filialdan tashqari tushlik/kechki ovqat', amount: '210 000 UZS', type: 'Chiqim', note: '7 ta odamga abet puli berildi', status: 'Qabul qilindi' },
    { id: '176102', date: '24.01.2026', branch: "Qo'shko'pir filiali", name: 'Mijozlar va tovarlarga servis xizmatlari', amount: '100 000 UZS', type: 'Chiqim', note: 'Maxqurbonova Malika Shamuratovnaning bityum xaladilnik tuzatilib berildi', status: 'Qabul qilindi' },
    { id: '175785', date: '23.01.2026', branch: "Qo'shko'pir filiali", name: 'Eylanma avtomashina uchun yo\'l kira', amount: '50 000 UZS', type: 'Chiqim', note: 'Tikuv mashinasi dostavka qilindi', status: 'Qabul qilindi' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Kassadan xarajatlar</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter size={20} />
          <span>Filtr</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>Ustunlar</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4 border-b">ID</th>
              <th className="p-4 border-b">Sanasi</th>
              <th className="p-4 border-b">Tashkilot nomi</th>
              <th className="p-4 border-b">Xarajat nomi</th>
              <th className="p-4 border-b font-bold text-red-500">Summasi</th>
              <th className="p-4 border-b">Turi</th>
              <th className="p-4 border-b w-1/4">Izoh</th>
              <th className="p-4 border-b">Holati</th>
              <th className="p-4 border-b text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
            {expenses.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500">
                  {formatDate(item.createdAt)}
                </td>

                <td className="p-4">
                  {item.cashbox?.name || '-'}
                </td>

                <td className="p-4 text-right text-rose-600 font-black">
                  {Number(item.amount || 0).toLocaleString('uz-UZ')} UZS
                </td>

                <td className="p-4 text-slate-600 whitespace-normal break-words max-w-[320px]">
                  {item.note || '-'}
                </td>

                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-black border ${
                      item.status === 'Tasdiqlandi'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="p-4">{item.createdByName || '-'}</td>
                <td className="p-4">{item.approvedByName || '-'}</td>

                <td className="p-4 text-center">
                  {/* action menu */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
                <span>Ko'rsatishlar soni</span>
                <select className="border rounded px-2 py-1"><option>15</option></select>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">«</button>
                <button className="px-3 py-1 border rounded bg-white font-bold text-gray-800">1</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">»</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;