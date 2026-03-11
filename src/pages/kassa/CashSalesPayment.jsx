import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, ArrowLeft, Plus, Calendar, Briefcase, DollarSign, User, Receipt, X, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}`;
};

const CashSalesPayment = () => {
  // Oyna holati: 'list' (Ro'yxat) yoki 'detail' (Batafsil to'lov oynasi)
  const [viewMode, setViewMode] = useState('list');
  const [selectedSale, setSelectedSale] = useState(null);

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // To'lov modali state'lari
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
      type: 'Naqd pul',
      amount: '',
      note: ''
  });

  const token = sessionStorage.getItem('token');

  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- 1. KUTILAYOTGAN SAVDOLARNI YUKLASH ---
  const fetchPendingSales = useCallback(async (signal = undefined) => {
      if (!token) return;
      try {
          setLoading(true);
          // Eslatma: Backenddan faqat status='Kutilmoqda' bo'lganlarini tortish kerak. 
          // Hozircha hammasini tortib frontendda filter qilamiz (Backendda filter bo'lsa yaxshiroq)
          const res = await fetch(`${API_URL}/api/cash-sales`, { headers: getAuthHeaders(), signal });
          if (res.ok) {
              const data = await parseJsonSafe(res);
              if (Array.isArray(data)) {
                  // Faqat to'lov kutilayotganlarini qoldiramiz
                  const pending = data.filter(s => s.status === 'Kutilmoqda' || s.status === 'Jarayonda'); 
                  setSales(pending);
              }
          }
      } catch (err) {
          if (err.name !== 'AbortError') toast.error("Server bilan aloqa yo'q");
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchPendingSales(controller.signal);
      return () => controller.abort();
  }, [fetchPendingSales]);

  // --- HISOBLASHLAR (Batafsil oyna uchun) ---
  const totalPaidAmount = useMemo(() => {
      if (!selectedSale || !Array.isArray(selectedSale.payments)) return 0;
      return selectedSale.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [selectedSale]);

  const remainingAmount = useMemo(() => {
      if (!selectedSale) return 0;
      const total = Number(selectedSale.finalAmount) || 0;
      return Math.max(0, total - totalPaidAmount);
  }, [selectedSale, totalPaidAmount]);

  // Modalni ochganda qoldiq summani avtomat yozib qo'yish
  const openPaymentModal = () => {
      setPaymentData({ type: 'Naqd pul', amount: remainingAmount, note: '' });
      setIsPaymentModalOpen(true);
  };

  // --- TO'LOVNI SAQLASH ---
  const handleSavePayment = async () => {
      const payAmount = Number(paymentData.amount);
      if (payAmount <= 0) return toast.error("To'lov summasini to'g'ri kiriting!");
      if (payAmount > remainingAmount) return toast.error(`Qarzdorlikdan ortiq summa kiritdingiz! (Maksimum: ${remainingAmount.toLocaleString()} UZS)`);

      setIsSubmitting(true);
      try {
          const payload = {
              amount: payAmount,
              type: paymentData.type,
              note: paymentData.note.trim() || null,
              // Statusni avtomat hisoblaymiz: Agar to'liq to'lasa Yakunlangan, aks holda Kutilmoqda
              status: (totalPaidAmount + payAmount) >= Number(selectedSale.finalAmount) ? 'Yakunlangan' : 'Kutilmoqda'
          };

          // 🚨 BACKEND UCHUN: "/api/cash-sales/:id/payments" marshruti bo'lishi kerak
          const res = await fetch(`${API_URL}/api/cash-sales/${selectedSale.id}/payments`, {
              method: 'POST',
              headers: getJsonAuthHeaders(),
              body: JSON.stringify(payload)
          });

          const data = await parseJsonSafe(res);

          if (res.ok) {
              toast.success("To'lov muvaffaqiyatli qabul qilindi!");
              setIsPaymentModalOpen(false);
              
              // Agar to'liq to'langan bo'lsa ro'yxatga qaytamiz, bo'lmasa shu yerda qolamiz
              if (payload.status === 'Yakunlangan') {
                  setViewMode('list');
                  fetchPendingSales();
              } else {
                  // Ekranni yangilash uchun bitta savdoni qayta tortamiz yoki oddiygina fetchPending qilib tanlanganini yangilaymiz
                  const updatedRes = await fetch(`${API_URL}/api/cash-sales/${selectedSale.id}`, { headers: getAuthHeaders() });
                  if (updatedRes.ok) setSelectedSale(await parseJsonSafe(updatedRes));
              }
          } else {
              toast.error(data?.error || "To'lovni saqlashda xatolik yuz berdi");
          }
      } catch (err) {
          toast.error("Server xatosi!");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- QIDIRUV ---
  const filteredSales = useMemo(() => {
      if (!searchTerm) return sales;
      const search = searchTerm.trim().toLowerCase();
      return sales.filter(s => {
          const customerName = s.isAnonymous ? (s.otherName || '') : (`${s.customer?.firstName || ''} ${s.customer?.lastName || ''}`);
          return customerName.toLowerCase().includes(search) || String(s.id).includes(search);
      });
  }, [sales, searchTerm]);

  // ==========================================
  // 1. RO'YXAT (LIST) KO'RINISHI
  // ==========================================
  if (viewMode === 'list') {
      return (
        <div className="space-y-6 p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Naqd savdoga to'lov olish</h1>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Mijoz ismi yoki Savdo ID bo'yicha qidirish..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                />
             </div>
             <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                 <Filter size={18}/> Filtr
             </button>
          </div>
    
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="p-5">ID</th>
                      <th className="p-5">Sanasi</th>
                      <th className="p-5">Mijoz familiyasi, ismi</th>
                      <th className="p-5 text-center">Telefon raqami</th>
                      <th className="p-5 text-right">Summasi</th>
                      <th className="p-5 text-right text-emerald-600">To'langan summa</th>
                      <th className="p-5 text-center">Savdo holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                    {loading ? (
                        <tr><td colSpan="7" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32}/></td></tr>
                    ) : filteredSales.length === 0 ? (
                        <tr><td colSpan="7" className="p-20 text-center text-slate-400 font-medium">To'lov kutilayotgan savdolar topilmadi.</td></tr>
                    ) : (
                        filteredSales.map((item) => {
                            const customerName = item.isAnonymous ? (item.otherName || 'Noma\'lum') : (`${item.customer?.lastName || ''} ${item.customer?.firstName || ''}`);
                            const phone = item.isAnonymous ? item.otherPhone : (item.customer?.phones?.[0]?.phone || item.customer?.phone || '-');
                            const paid = Array.isArray(item.payments) ? item.payments.reduce((s,p)=>s+Number(p.amount),0) : 0;
                            
                            return (
                                <tr key={item.id} onClick={() => { setSelectedSale(item); setViewMode('detail'); }} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                                  <td className="p-5 text-blue-600 font-black">#{item.id}</td>
                                  <td className="p-5 text-slate-500 font-medium">{formatDate(item.createdAt || item.date)}</td>
                                  <td className="p-5 font-black text-slate-800 group-hover:text-blue-700 transition-colors">{customerName}</td>
                                  <td className="p-5 text-center text-slate-500 font-mono">{phone}</td>
                                  <td className="p-5 text-right text-slate-800">{Number(item.finalAmount).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span></td>
                                  <td className="p-5 text-right text-emerald-600">{paid.toLocaleString()} <span className="text-[10px] text-emerald-400">UZS</span></td>
                                  <td className="p-5 text-center">
                                      <span className="px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black bg-amber-50 text-amber-600 border border-amber-200">
                                          ● {item.status}
                                      </span>
                                  </td>
                                </tr>
                            )
                        })
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      );
  }

  // ==========================================
  // 2. BATAFSIL OYNA (DETAIL VIEW)
  // ==========================================
  const customerName = selectedSale.isAnonymous ? (selectedSale.otherName || 'Noma\'lum') : (`${selectedSale.customer?.lastName || ''} ${selectedSale.customer?.firstName || ''}`);
  const phone = selectedSale.isAnonymous ? selectedSale.otherPhone : (selectedSale.customer?.phones?.[0]?.phone || selectedSale.customer?.phone || 'Kiritilmagan');

  return (
      <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in slide-in-from-right-8 duration-300">
          
          {/* TEPADAGI HEADER */}
          <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={() => { setViewMode('list'); setSelectedSale(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-slate-600"/></button>
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">{customerName}</h1>
             </div>
             <button onClick={() => { setViewMode('list'); setSelectedSale(null); }} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Orqaga qaytish</button>
          </div>

          <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
              
              {/* 4 TA ASOSIY KARTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 text-blue-500 mb-4"><Calendar size={18}/><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sanasi</span></div>
                      <div className="text-xl font-black text-slate-800">{new Date(selectedSale.createdAt || selectedSale.date).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 text-indigo-500 mb-4"><Briefcase size={18}/><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Savdo raqami</span></div>
                      <div className="text-xl font-black text-slate-800 mb-2">{selectedSale.id}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-200">Holati: {selectedSale.status}</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 text-emerald-500 mb-4"><DollarSign size={18}/><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Summasi</span></div>
                      <div className="text-xl font-black text-emerald-600 mb-1">{Number(selectedSale.finalAmount).toLocaleString()} <span className="text-sm text-slate-400">UZS</span></div>
                      <div className="text-xs font-bold text-slate-400">Tovarlar: <span className="text-slate-700">{selectedSale.items?.reduce((s,i)=>s+(Number(i.qty)||1),0)} dona</span></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center gap-2 text-purple-500 mb-4"><User size={18}/><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Mijoz</span></div>
                      <div className="text-sm font-black text-slate-800 mb-1 uppercase truncate" title={customerName}>{customerName}</div>
                      <div className="text-[11px] font-bold text-slate-400">Telefon: <span className="text-slate-600 font-mono">{phone}</span></div>
                  </div>
              </div>

              {/* TO'LOV MA'LUMOTLARI JADVALI */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Receipt className="text-blue-500"/> To'lov ma'lumotlari</h2>
                      <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-500">Jami to'langan: <span className="text-emerald-600 font-black">{totalPaidAmount.toLocaleString()} UZS</span></span>
                          <button onClick={openPaymentModal} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                              <Plus size={18} strokeWidth={3}/> Qo'shish
                          </button>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="p-4 pl-6">ID</th>
                                  <th className="p-4">Sanasi</th>
                                  <th className="p-4 text-right">Summasi</th>
                                  <th className="p-4 text-center">To'lov turi</th>
                                  <th className="p-4">Izoh</th>
                                  <th className="p-4 text-center">Xodim</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                              {(!selectedSale.payments || selectedSale.payments.length === 0) ? (
                                  <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">Hali hech qanday to'lov olinmagan</td></tr>
                              ) : (
                                  selectedSale.payments.map((p, i) => (
                                      <tr key={p.id || i} className="hover:bg-slate-50 transition-colors">
                                          <td className="p-4 pl-6 text-slate-400 font-mono">#{p.id || (i+1)}</td>
                                          <td className="p-4 text-slate-500">{formatDate(p.createdAt || p.date)}</td>
                                          <td className="p-4 text-right text-emerald-600">{Number(p.amount).toLocaleString()} UZS</td>
                                          <td className="p-4 text-center"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider">{p.type}</span></td>
                                          <td className="p-4 text-slate-500 truncate max-w-[200px]" title={p.note}>{p.note || '-'}</td>
                                          <td className="p-4 text-center text-slate-500">{p.userName || p.staff?.fullName || 'Noma\'lum'}</td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* SAVDO TOVARLARI JADVALI */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-lg font-black text-slate-800">Savdo tovarlari</h2>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="p-4 pl-6">ID (Kod)</th>
                                  <th className="p-4">Nomi</th>
                                  <th className="p-4 text-center">Miqdori</th>
                                  <th className="p-4 text-right">Narxi</th>
                                  <th className="p-4 text-right pr-6">Summasi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                              {(selectedSale.items || []).map((item, i) => (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 pl-6 text-slate-400 font-mono">#{item.customId || item.productId || '-'}</td>
                                      <td className="p-4">{item.name}</td>
                                      <td className="p-4 text-center text-blue-600">{item.qty || 1} dona</td>
                                      <td className="p-4 text-right">{Number(item.salePrice).toLocaleString()} UZS</td>
                                      <td className="p-4 text-right pr-6 text-slate-800">{(Number(item.salePrice) * (item.qty || 1)).toLocaleString()} UZS</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          {/* TO'LOV OLISH MODALI (SCREENSHOTDAGI KABI) */}
          {isPaymentModalOpen && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex justify-end" onClick={(e) => {if(e.target===e.currentTarget && !isSubmitting) setIsPaymentModalOpen(false)}}>
                  <div className="bg-white w-full max-w-[450px] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                      <div className="flex justify-between items-center p-6 border-b border-slate-100">
                          <h2 className="text-xl font-black text-slate-800">Naqd savdoga to'lov olish</h2>
                          <button disabled={isSubmitting} onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"><X size={20}/></button>
                      </div>

                      <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                          
                          {/* Jami va Qoldiq */}
                          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center">
                              <div>
                                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">To'lanishi kerak (Qoldiq)</div>
                                  <div className="text-2xl font-black text-blue-700">{remainingAmount.toLocaleString()} <span className="text-sm font-bold">UZS</span></div>
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To'lov turi</label>
                              <select 
                                  disabled={isSubmitting}
                                  value={paymentData.type}
                                  onChange={(e) => setPaymentData({...paymentData, type: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all disabled:opacity-50"
                              >
                                  <option value="Naqd pul">Naqd pul</option>
                                  <option value="Plastik karta">Plastik karta</option>
                                  <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                              </select>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Summa <span className="text-red-500">*</span></label>
                              <input 
                                  type="number" 
                                  disabled={isSubmitting}
                                  value={paymentData.amount}
                                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                  className="w-full p-4 bg-white border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-black text-emerald-600 text-xl transition-all disabled:opacity-50"
                                  placeholder="0"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Izoh</label>
                              <textarea 
                                  disabled={isSubmitting}
                                  value={paymentData.note}
                                  onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none h-32 transition-all disabled:opacity-50"
                                  placeholder="Eslatma qoldirishingiz mumkin..."
                              ></textarea>
                          </div>
                      </div>

                      <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
                          <button 
                              disabled={isSubmitting}
                              onClick={handleSavePayment} 
                              className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                              {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : "Saqlash"}
                          </button>
                          <button 
                              disabled={isSubmitting}
                              onClick={() => setIsPaymentModalOpen(false)} 
                              className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                          >
                              Bekor qilish
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default CashSalesPayment;
