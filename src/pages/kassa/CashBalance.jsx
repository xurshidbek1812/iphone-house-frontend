import React, { useState, useEffect } from 'react';
import { Search, Filter, Wallet, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const formatSum = (num) => Number(num || 0).toLocaleString();

const CashBalance = () => {
  const [cashboxes, setCashboxes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const token = sessionStorage.getItem('token');

  // --- HAQIQIY KASSALARNI YUKLASH ---
  useEffect(() => {
    const fetchCashboxes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cashboxes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setCashboxes(data);
        }
      } catch (error) {
        console.error("Kassalarni yuklashda xato:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCashboxes();
  }, [token]);

  // Qidiruv funksiyasi
  const filteredCashboxes = cashboxes.filter(box => 
    box.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Wallet className="text-blue-600" /> Kassalar qoldig'i
          </h1>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold shadow-sm border border-blue-100">
              Jami kassalar: {cashboxes.length} ta
          </span>
      </div>

      {/* TOP BAR: Qidiruv va Filtrlar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Kassa nomini qidirish..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-slate-700" 
            />
         </div>
         <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
             <Filter size={18}/> Filtr
         </button>
         <button className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
             Ustunlar
         </button>
      </div>

      {/* ASOSIY JADVAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Kassa Nomi</th>
                  <th className="p-4">Tashkilot nomi</th>
                  <th className="p-4 text-right">Qoldig'i</th>
                  <th className="p-4 text-center">Turi</th>
                  <th className="p-4">Javobgar shaxs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                    <tr>
                        <td colSpan="6" className="p-10 text-center text-slate-500 font-bold">
                            Yuklanmoqda...
                        </td>
                    </tr>
                ) : filteredCashboxes.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="p-10 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <AlertCircle size={40} className="mb-3 text-slate-300"/>
                                <p className="font-bold text-base">Kassalar topilmadi</p>
                                <p className="text-xs mt-1">Hozircha tizimda kassa mavjud emas yoki qidiruvga mos kelmadi.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredCashboxes.map((item, index) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 pl-6 text-slate-400 font-bold">#{item.id}</td>
                        <td className="p-4 font-black text-slate-800">{item.name}</td>
                        <td className="p-4 text-slate-500 font-medium">Asosiy Filial</td> {/* Vaqtincha statik */}
                        <td className="p-4 text-right">
                            <span className="font-black text-blue-600 text-base">{formatSum(item.balance)}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{item.currency}</span>
                        </td>
                        <td className="p-4 text-center">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                {item.name.toLowerCase().includes('karta') ? 'Karta' : 'Naqd'}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                                    A
                                </div>
                                <span className="text-xs font-bold text-slate-600">Admin</span> {/* Vaqtincha statik */}
                            </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CashBalance;
