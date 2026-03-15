import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

// Sonlarni chiroyli formatlash uchun
const formatSum = (num) => Number(num || 0).toLocaleString();

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        // Ikkala ma'lumotni bir vaqtda tortib olamiz (Kassalar va Tranzaksiyalar)
        const [cashboxesRes, transactionsRes] = await Promise.all([
          fetch(`${API_URL}/api/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (cashboxesRes.ok && transactionsRes.ok) {
          setCashboxes(await cashboxesRes.json());
          setTransactions(await transactionsRes.json());
        }
      } catch (error) {
        console.error("Moliya ma'lumotlarini yuklashda xato:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [token]);

  // --- HISOB-KITOBLAR (KARTA VA GRAFIKLAR UCHUN) ---
  
  // 1. Umumiy Kassa qoldig'i
  const totalBalance = cashboxes.reduce((sum, box) => sum + Number(box.balance || 0), 0);

  // 2. Umumiy Kirim va Chiqimlar (Shu oy uchun)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthTransactions = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = thisMonthTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

  // 3. Grafik ma'lumotlarini tayyorlash (Joriy oy kunlari bo'yicha)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Asosiy Tushumlar grafiki (Naqd vs Karta)
  const incomeData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, cash: 0, card: 0 }));
  
  // Shartnoma to'lovlari grafiki
  const installmentData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, collected: 0 }));

  thisMonthTransactions.forEach(t => {
      const dayIndex = new Date(t.createdAt).getDate() - 1;
      
      if (t.type === 'INCOME') {
          // Asosiy grafik
          if (t.paymentMethod === 'KARTA' || t.paymentMethod === 'BANK') {
              incomeData[dayIndex].card += Number(t.amount);
          } else {
              incomeData[dayIndex].cash += Number(t.amount);
          }

          // Shartnoma grafiki (Agar sababi shartnoma bo'lsa)
          if (t.category === "Shartnoma to'lovi" || t.reason?.includes("Shartnoma")) {
              installmentData[dayIndex].collected += Number(t.amount);
          }
      }
  });

  const totalInstallmentIncome = installmentData.reduce((s, d) => s + d.collected, 0);

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold">Ma'lumotlar yuklanmoqda...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <h1 className="text-2xl font-black text-slate-800">Kassa operatsiyalari</h1>

      {/* --- TOP ROW: SMALL CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Income */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami Tushumlar (Shu oy)</p>
                <h3 className="text-3xl font-black text-slate-800">{formatSum(totalIncome)} <span className="text-sm text-slate-400 font-bold">UZS</span></h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm">
                <ArrowDownLeft size={28} strokeWidth={2.5} />
            </div>
        </div>
        
        {/* Card 2: Expense */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami Chiqimlar (Shu oy)</p>
                <h3 className="text-3xl font-black text-slate-800">{formatSum(totalExpense)} <span className="text-sm text-slate-400 font-bold">UZS</span></h3>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl shadow-sm">
                <ArrowUpRight size={28} strokeWidth={2.5} />
            </div>
        </div>
      </div>

      {/* --- MIDDLE ROW: BIG CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT CHART: Tushumlar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Barcha Tushumlar</h3>
                    <h2 className="text-2xl font-black text-slate-800">{formatSum(totalIncome)} <span className="text-xs text-slate-400 font-bold">UZS</span></h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1 text-purple-600"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Naqd</span>
                    <span className="flex items-center gap-1 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Plastik</span>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData} barSize={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} tickFormatter={(val) => `${val / 1000}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="cash" stackId="a" fill="#a855f7" name="Naqd" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="card" stackId="a" fill="#10b981" name="Plastik" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* RIGHT CHART: Muddatli To'lov */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Shartnoma tushumlari</h3>
                    <h2 className="text-2xl font-black text-slate-800">{formatSum(totalInstallmentIncome)} <span className="text-xs text-slate-400 font-bold">UZS</span></h2>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={installmentData} barSize={12} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} tickFormatter={(val) => `${val / 1000}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="collected" fill="#3b82f6" name="Tushgan summa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: CASH BALANCE TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700">
                <Wallet size={20} className="text-blue-500"/>
                <h3 className="font-black">Kassalardagi Qoldiqlar</h3>
            </div>
            <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{formatSum(totalBalance)} <span className="text-xs text-blue-400">UZS</span></span>
        </div>
        <div className="p-2">
            {cashboxes.length === 0 ? (
                <p className="p-4 text-center text-slate-400 font-medium text-sm">Hozircha tizimda kassa mavjud emas.</p>
            ) : (
                cashboxes.map((box, idx) => (
                    <div key={box.id} className={`flex items-center justify-between p-4 ${idx !== cashboxes.length - 1 ? 'border-b border-dashed border-slate-100' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shadow-sm border border-slate-200">
                                {box.name.toLowerCase().includes('karta') || box.name.toLowerCase().includes('plastik') ? <CreditCard size={18} /> : <Wallet size={18} />}
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">{box.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{box.currency}</span>
                            </div>
                        </div>
                        <span className="font-black text-slate-800 text-lg">{formatSum(box.balance)} <span className="text-xs text-slate-400 font-bold">UZS</span></span>
                    </div>
                ))
            )}
        </div>
      </div>

    </div>
  );
};

export default Finance;
