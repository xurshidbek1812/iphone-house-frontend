import React, { useState, useEffect } from 'react';
import { 
  Users, Package, DollarSign, TrendingUp, Bell, 
  CheckCircle, Clock, X, ChevronDown, Calendar, Filter, UserCircle, CheckCheck, Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ inventoryValue: 0, totalIncome: 0, totalDebt: 0, productCount: 0 });
  const [notifications, setNotifications] = useState([]);
  
  const userRole = (localStorage.getItem('userRole') || 'admin').toLowerCase();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 

  useEffect(() => {
    fetch('https://iphone-house-api.onrender.com/api/dashboard')
      .then(res => res.json())
      .then(data => setStats(data));

    loadNotifications();
  }, []);

  // 1. XABARLARNI YUKLASH FUNKSIYASI (Qayta ishlatish uchun alohida qildik)
// 1. XABARLARNI YUKLASH FUNKSIYASI (Filtrlangan)
  const loadNotifications = () => {
    const returns = JSON.parse(localStorage.getItem('supplierReturns') || "[]");
    const incomes = JSON.parse(localStorage.getItem('supplierInvoices') || "[]");
    
    // O'ZGARISH: Faqatgina yuborilganlarini olamiz. 
    // "Jarayonda" (yoki "Qoralama") holatidagilarni kesib tashlaymiz.
    const filteredReturns = returns.filter(r => r.status !== 'Jarayonda');
    const filteredIncomes = incomes.filter(i => i.status !== 'Jarayonda');

    const allLogs = [
      ...filteredReturns.map(r => ({ ...r, type: 'Qaytarish', sender: r.userName || r.createdBy || 'Bekchonov Azomat' })),
      ...filteredIncomes.map(i => ({ ...i, type: 'Kirim', sender: i.userName || i.createdBy || 'Bekchonov Azomat' }))
    ].sort((a, b) => b.id - a.id);

    setNotifications(allLogs.slice(0, 10)); 
  };

  // 2. BITTA XABARNI O'QILGAN QILISH
const markAsRead = (id, type) => {
    const storageKey = type === 'Kirim' ? 'supplierInvoices' : 'supplierReturns';
    const items = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    // O'ZGARISH: status ni "Tasdiqlandi" qilmaymiz! Faqat isRead: true degan belgi qo'shamiz.
    const updatedItems = items.map(item => 
        item.id === id ? { ...item, isRead: true } : item
    );
    
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
    
    // Ekranni yangilaymiz
    setNotifications(prev => prev.map(note => 
        note.id === id ? { ...note, isRead: true } : note
    ));
  };

  // 3. BARCHASINI O'QILGAN QILISH (Messenjer uslubi)
const markAllAsRead = () => {
    ['supplierInvoices', 'supplierReturns'].forEach(key => {
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        // O'ZGARISH: Hammasiga isRead: true beramiz. Status o'z joyida qoladi.
        const updatedItems = items.map(item => ({ ...item, isRead: true }));
        localStorage.setItem(key, JSON.stringify(updatedItems));
    });

    setNotifications(prev => prev.map(note => ({ ...note, isRead: true })));
  };

  const data = [
    { name: 'Du', uv: 4000 }, { name: 'Se', uv: 3000 }, { name: 'Ch', uv: 5000 },
    { name: 'Pa', uv: 2780 }, { name: 'Ju', uv: 1890 }, { name: 'Sh', uv: 2390 }, { name: 'Ya', uv: 3490 },
  ];

  // Qancha yangi xabar borligini hisoblash
  const unreadCount = notifications.filter(n => !n.isRead && n.status !== 'Tasdiqlandi').length;

  return (
    <div className="flex p-6 bg-slate-100 min-h-screen font-sans gap-6">
      
      {/* 1. BILDIRISHNOMALAR (FAQAT DIREKTOR UCHUN) */}
      {userRole === 'director' && (
        <div className={`flex flex-col gap-3 transition-all duration-500 ${isSidebarCollapsed ? 'w-[340px] opacity-100 flex-shrink-0' : 'w-0 opacity-0 overflow-hidden'}`}>
          
          <div className="flex items-center justify-between px-1 mb-1">
              <h2 className="text-[13px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Bell size={16} className="text-blue-600"/> Xabarlar
              </h2>
              
              <div className="flex items-center gap-3">
                  {/* BARCHASINI O'QILGAN QILISH TUGMASI */}
                  {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-all">
                          <CheckCheck size={14} /> Hammasini o'qish
                      </button>
                  )}
                  {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md animate-pulse">
                          {unreadCount} ta yangi
                      </span>
                  )}
              </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[85vh] pr-1 custom-scrollbar">
              {notifications.map((note) => {
                  const isNew = !note.isRead && note.status !== 'Tasdiqlandi';
                  return (
                      <div 
                          key={note.id} 
                          className={`group relative overflow-hidden p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md ${
                              isNew 
                              ? 'bg-white border-slate-200 border-l-[4px] border-l-blue-500 shadow-sm' 
                              : 'bg-slate-50/60 border-slate-200 opacity-70' 
                          }`}
                      >
                          <div className="flex justify-between items-center mb-1.5 pr-6">
                              <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isNew ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                      {note.type}
                                  </span>
                                  {isNew && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                  {note.date.split(',')[0]}
                              </span>
                          </div>
                          
                          <h4 className={`text-[13px] font-bold truncate pr-6 ${isNew ? 'text-slate-800' : 'text-slate-600'}`}>
                              {note.supplier}
                          </h4>
                          
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                              <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-400 font-medium mb-0.5">Yuboruvchi:</span>
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                                      <UserCircle size={12} className="text-slate-400" />
                                      {note.sender}
                                  </div>
                              </div>
                              
                              <p className={`text-sm font-black ${isNew ? 'text-blue-600' : 'text-slate-500'}`}>
                                  {Number(note.totalSum).toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">UZS</span>
                              </p>
                          </div>
                          
                          {/* BITTA XABARNI O'QILGAN QILISH TUGMASI (Yangi bo'lsa chiqadi) */}
                          {isNew && (
                              <button 
                                onClick={() => markAsRead(note.id, note.type)}
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-1.5 rounded-lg transition-all shadow-sm"
                                title="O'qilgan qilib belgilash"
                              >
                                  <Check size={14} strokeWidth={3} />
                              </button>
                          )}
                      </div>
                  );
              })}
              {notifications.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">Xabarlar yo'q</div>
              )}
          </div>
        </div>
      )}

      {/* 2. ASOSIY QISM (Grafik va Kartalar) */}
      <div className="flex-1 space-y-6 w-full overflow-hidden">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-slate-200">
            <h1 className="text-xl font-black text-slate-800">Dashboard</h1>
            <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    <Calendar size={16} /> Bugun
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                    <Filter size={16} /> Filtr
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Ombor qiymati" value={stats.inventoryValue} unit="UZS" icon={<Package />} colors={{ bg: 'bg-blue-50', iconBg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-100' }} />
          <StatCard title="Kassa (Tushum)" value={stats.totalIncome} unit="UZS" icon={<DollarSign />} colors={{ bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' }} />
          <StatCard title="Undiruv (Qarz)" value={stats.totalDebt} unit="UZS" icon={<TrendingUp />} colors={{ bg: 'bg-rose-50', iconBg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-100' }} />
          <StatCard title="Mahsulot turi" value={stats.productCount} unit="ta" icon={<Users />} colors={{ bg: 'bg-amber-50', iconBg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' }} />
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Savdo Tahlili</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">Haftalik foyda va tushumlar dinamikasi</p>
            </div>
            
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button className="px-5 py-1.5 bg-white shadow-sm rounded-lg text-xs font-black text-blue-600">Haftalik</button>
                <button className="px-5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">Oylik</button>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} cursor={{stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3.5} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, colors }) => {
    return (
      <div className={`bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex items-center gap-4`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-105 ${colors.iconBg}`}>
            {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
        </div>
        
        <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-xl font-black text-slate-800 flex items-baseline gap-1.5">
                {typeof value === 'number' ? value.toLocaleString() : value}
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                    {unit}
                </span>
            </h3>
        </div>
      </div>
    );
};

export default Dashboard;