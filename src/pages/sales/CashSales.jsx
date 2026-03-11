import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, X, Edit2, Eye, AlertTriangle, Clock, User, CheckCircle, CreditCard, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const CashSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 

  // Modallar
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, sale: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [sendToPaymentModal, setSendToPaymentModal] = useState({ isOpen: false, id: null }); 
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });

  const token = sessionStorage.getItem('token');

  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- BAZADAN YUKLASH ---
  const fetchSales = useCallback(async (signal = undefined) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cash-sales`, { 
          headers: getAuthHeaders(),
          signal
      });

      if (res.ok) {
          const data = await parseJsonSafe(res);
          if (Array.isArray(data)) setSales(data);
      } else {
          toast.error("Savdolarni yuklashda xatolik!");
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error("Server bilan aloqa yo'q!");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => { 
      const controller = new AbortController();
      fetchSales(controller.signal); 
      return () => controller.abort();
  }, [fetchSales]);

  // --- TO'LOVGA YUBORISH ---
  const handleSendToPayment = async () => {
    const id = sendToPaymentModal.id;
    setIsActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cash-sales/${id}/approve`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({ status: 'Kutilmoqda' })
      });
      
      const data = await parseJsonSafe(res);
      
      if (res.ok) {
        toast.success("Savdo to'lov bo'limiga yuborildi!");
        await fetchSales();
      } else {
        toast.error(data?.error || "Yuborishda xatolik");
      }
    } catch (err) { 
        toast.error("Server xatosi!"); 
    } finally { 
        setIsActionLoading(false);
        setSendToPaymentModal({ isOpen: false, id: null }); 
    }
  };

  // --- O'CHIRISH (Bekor qilish) ---
  const handleDelete = async () => {
    const id = deleteModal.id;
    setIsActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cash-sales/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await parseJsonSafe(res);
      
      if (res.ok) {
        toast.success("Savdo bekor qilindi (o'chirildi)!");
        await fetchSales();
      } else {
        toast.error(data?.error || "O'chirishda xatolik");
      }
    } catch (err) { 
        toast.error("Server xatosi!"); 
    } finally { 
        setIsActionLoading(false);
        setDeleteModal({ isOpen: false, id: null }); 
    }
  };

  // --- TAHRIRLASH MANTIQI ---
  const openEditModal = (sale) => {
      setEditModal({
          isOpen: true,
          data: {
              id: sale.id,
              discount: sale.discount || '',
              note: sale.note || '',
              items: (sale.items || []).map(i => ({
                  id: i.productId || i.id,
                  name: i.product?.name || i.name,
                  qty: Number(i.quantity || i.qty),
                  salePrice: Number(i.price || i.salePrice)
              }))
          }
      });
  };

  const updateEditQty = (itemId, newQty) => {
      if (newQty < 1) return;
      setEditModal(prev => ({
          ...prev,
          data: {
              ...prev.data,
              items: prev.data.items.map(i => i.id === itemId ? { ...i, qty: newQty } : i)
          }
      }));
  };

  const saveEdit = async () => {
      const { id, discount, note, items } = editModal.data;
      const totalAmount = items.reduce((sum, i) => sum + (Number(i.salePrice) * Number(i.qty)), 0);
      const finalAmount = Math.max(0, totalAmount - Number(discount || 0));

      if (Number(discount) > 0 && (!note || note.trim() === '')) {
          return toast.error("Chegirma uchun izoh majburiy!");
      }
      if (Number(discount) > totalAmount) {
          return toast.error("Chegirma summasi jami summadan ko'p bo'lishi mumkin emas!");
      }

      setIsActionLoading(true);
      try {
          const payload = { totalAmount, discount: Number(discount), finalAmount, note: note.trim(), items };
          const res = await fetch(`${API_URL}/api/cash-sales/${id}`, {
              method: 'PUT',
              headers: getJsonAuthHeaders(),
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              toast.success("Savdo o'zgarishlari saqlandi!");
              setEditModal({ isOpen: false, data: null });
              await fetchSales();
          } else {
              const data = await parseJsonSafe(res);
              toast.error(data?.error || "Tahrirlashda xatolik yuz berdi");
          }
      } catch (err) { 
          toast.error("Server xatosi"); 
      } finally {
          setIsActionLoading(false);
      }
  };

  // --- QIDIRUV VA FILTR ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const search = searchTerm.trim().toLowerCase();
      const customerName = sale.isAnonymous ? (sale.otherName || '') : (`${sale.customer?.firstName || ''} ${sale.customer?.lastName || ''}`);
      const phone = sale.isAnonymous ? (sale.otherPhone || '') : (sale.customer?.phones?.[0]?.phone || sale.customer?.phone || '');
      
      const searchString = `${sale.id} ${customerName} ${phone}`.toLowerCase();
      const matchesSearch = searchString.includes(search);
      
      const matchesStatus = filterStatus === 'ALL' || String(sale.status).toUpperCase() === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [sales, searchTerm, filterStatus]);

  return (
    <div className="p-6 min-h-screen bg-gray-50/50 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Naqd Savdolar</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Barcha naqd pul orqali qilingan savdolar ro'yxati</p>
        </div>
        <button 
            disabled={isLoading || isActionLoading}
            onClick={() => navigate('/naqd-savdo/qoshish')} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
        >
            <Plus size={20} strokeWidth={3}/> Yangi Savdo
        </button>
      </div>

      {/* FILTR VA QIDIRUV */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
                type="text" 
                placeholder="Mijoz ismi, raqami yoki savdo ID si bo'yicha qidirish..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full outline-none text-slate-700 font-medium bg-transparent" 
            />
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
            <button onClick={() => setFilterStatus('ALL')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Barchasi</button>
            <button onClick={() => setFilterStatus('JARAYONDA')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'JARAYONDA' ? 'bg-slate-100 text-slate-700 shadow-inner border border-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}>Yangi (Jarayonda)</button>
            <button onClick={() => setFilterStatus('KUTILMOQDA')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'KUTILMOQDA' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-500 hover:bg-amber-50'}`}>To'lov Kutilmoqda</button>
            <button onClick={() => setFilterStatus('YAKUNLANGAN')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'YAKUNLANGAN' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-emerald-50'}`}>Yakunlangan</button>
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-black tracking-wider border-b border-slate-100">
                <tr>
                    <th className="p-5 text-center">ID</th>
                    <th className="p-5">Sana</th>
                    <th className="p-5">Mijoz</th>
                    <th className="p-5 text-right">Summa</th>
                    <th className="p-5 text-center">Holati</th>
                    <th className="p-5 text-center">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                {isLoading ? (
                    <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32}/></td></tr>
                ) : filteredSales.length > 0 ? (
                    filteredSales.map((sale) => {
                        const statusUpper = String(sale.status).toUpperCase();
                        return (
                        <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="p-5 text-center font-black text-slate-400">#{sale.id}</td>
                            <td className="p-5">
                                <div className="text-slate-800">{new Date(sale.date || sale.createdAt).toLocaleDateString('uz-UZ')}</div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(sale.date || sale.createdAt).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="p-5">
                                {!sale.isAnonymous && sale.customer ? (
                                    <div>
                                        <div className="text-slate-800">{sale.customer.lastName} {sale.customer.firstName}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><User size={12}/> Bazadan tanlangan</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-slate-800">{sale.otherName || 'Anonim mijoz'}</div>
                                        <div className="text-[11px] text-amber-500 mt-0.5 flex items-center gap-1"><User size={12}/> Boshqa shaxs ({sale.otherPhone || '-'})</div>
                                    </div>
                                )}
                            </td>
                            <td className="p-5 text-right">
                                <div className="text-lg font-black text-blue-600">{Number(sale.finalAmount || sale.totalAmount).toLocaleString()} <span className="text-xs text-slate-400 font-normal">UZS</span></div>
                                {Number(sale.discount) > 0 && <div className="text-[10px] text-rose-500 mt-0.5">Chegirma: {Number(sale.discount).toLocaleString()}</div>}
                            </td>
                            <td className="p-5 text-center">
                                {/* STATUSLAR DIZAYNI */}
                                {statusUpper === 'JARAYONDA' ? (
                                    <span className="inline-flex items-center justify-center w-32 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-slate-200">
                                        <Clock size={12} className="mr-1"/> Yangi
                                    </span>
                                ) : statusUpper === 'KUTILMOQDA' ? (
                                    <span className="inline-flex items-center justify-center w-32 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-amber-200">
                                        To'lov kutilmoqda
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center justify-center w-32 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-emerald-200">
                                        <CheckCircle size={12} className="mr-1"/> Yakunlangan
                                    </span>
                                )}
                            </td>
                            <td className="p-5">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setDetailsModal({ isOpen: true, sale })} className="p-2 text-slate-400 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all" title="Batafsil ko'rish">
                                        <Eye size={18}/>
                                    </button>

                                    {/* 🚨 FAQAT "JARAYONDA" (Yangi) SAVDOLARNI TO'LOVGA YUBORISH / TAHRIRLASH MUMKIN */}
                                    {statusUpper === 'JARAYONDA' && (
                                        <>
                                            <button disabled={isActionLoading} onClick={() => setSendToPaymentModal({ isOpen: true, id: sale.id })} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all disabled:opacity-50" title="To'lovga yuborish (Kassaga)">
                                                <CreditCard size={18}/>
                                            </button>
                                            
                                            <button disabled={isActionLoading} onClick={() => openEditModal(sale)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all disabled:opacity-50" title="Tahrirlash">
                                                <Edit2 size={18}/>
                                            </button>
                                        </>
                                    )}

                                    {/* 🚨 O'CHIRISH TUGMASI ENDI "JARAYONDA" VA "KUTILMOQDA" UCHUN HAM ISHLAYDI */}
                                    {(statusUpper === 'JARAYONDA' || statusUpper === 'KUTILMOQDA') && (
                                        <button disabled={isActionLoading} onClick={() => setDeleteModal({ isOpen: true, id: sale.id })} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all disabled:opacity-50" title="Bekor qilish / O'chirish">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )})
                ) : (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold text-lg">Savdolar topilmadi</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- BATAFSIL KO'RISH MODALI --- */}
      {detailsModal.isOpen && detailsModal.sale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={(e) => {if(e.target===e.currentTarget) setDetailsModal({ isOpen: false, sale: null })}}>
            <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> Savdo batafsil</h2>
                        <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">ID: #{detailsModal.sale.id} | Sana: {new Date(detailsModal.sale.date || detailsModal.sale.createdAt).toLocaleString('uz-UZ')}</p>
                    </div>
                    <button onClick={() => setDetailsModal({ isOpen: false, sale: null })} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Xaridor</p>
                            <p className="text-lg font-bold text-slate-800">
                                {!detailsModal.sale.isAnonymous && detailsModal.sale.customer ? `${detailsModal.sale.customer.lastName} ${detailsModal.sale.customer.firstName}` : (detailsModal.sale.otherName || 'Anonim mijoz')}
                            </p>
                            <p className="text-sm font-mono text-slate-500 mt-1">{detailsModal.sale.customer?.phones?.[0]?.phone || detailsModal.sale.otherPhone || '-'}</p>
                        </div>
                        <div className={`p-5 rounded-2xl border ${String(detailsModal.sale.status).toUpperCase() === 'JARAYONDA' ? 'bg-slate-50 border-slate-200' : String(detailsModal.sale.status).toUpperCase() === 'KUTILMOQDA' ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${String(detailsModal.sale.status).toUpperCase() === 'JARAYONDA' ? 'text-slate-500' : String(detailsModal.sale.status).toUpperCase() === 'KUTILMOQDA' ? 'text-amber-500' : 'text-emerald-500'}`}>Holati</p>
                            <p className={`text-lg font-bold ${String(detailsModal.sale.status).toUpperCase() === 'JARAYONDA' ? 'text-slate-700' : String(detailsModal.sale.status).toUpperCase() === 'KUTILMOQDA' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {String(detailsModal.sale.status).toUpperCase() === 'JARAYONDA' ? 'Yangi (To\'lovga yuborilmagan)' : String(detailsModal.sale.status).toUpperCase() === 'KUTILMOQDA' ? 'To\'lov Kutilyapti' : 'Tasdiqlangan (Yakunlangan)'}
                            </p>
                        </div>
                    </div>

                    {detailsModal.sale.note && (
                        <div className={`p-5 rounded-2xl mb-8 border ${Number(detailsModal.sale.discount) > 0 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1 ${Number(detailsModal.sale.discount) > 0 ? 'text-rose-500' : 'text-slate-500'}`}><MessageSquare size={14}/> Izoh / Sabab</p>
                            <p className="text-sm font-medium leading-relaxed">{detailsModal.sale.note}</p>
                        </div>
                    )}

                    <h3 className="font-black text-slate-700 mb-4 uppercase text-xs tracking-widest">Xarid qilingan tovarlar:</h3>
                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden mb-6">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
                                <tr>
                                    <th className="p-4">Tovar Nomi</th>
                                    <th className="p-4 text-center">Soni</th>
                                    <th className="p-4 text-right">Dona narxi</th>
                                    <th className="p-4 text-right">Jami</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                {(detailsModal.sale.items || []).map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">{item.product?.name || item.name || "Noma'lum tovar"}</td>
                                        <td className="p-4 text-center">{item.quantity || item.qty} ta</td>
                                        <td className="p-4 text-right text-slate-500 font-medium">{Number(item.price || item.salePrice).toLocaleString()}</td>
                                        <td className="p-4 text-right text-blue-600">{(Number(item.price || item.salePrice) * (item.quantity || item.qty)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-800 text-white rounded-2xl p-6">
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                            <span>Jami summa:</span>
                            <span className="font-bold">{Number(detailsModal.sale.totalAmount).toLocaleString()} UZS</span>
                        </div>
                        {Number(detailsModal.sale.discount) > 0 && (
                            <div className="flex justify-between text-sm mb-4 text-amber-400 border-b border-slate-600 pb-4">
                                <span>Chegirma:</span>
                                <span className="font-bold">- {Number(detailsModal.sale.discount || 0).toLocaleString()} UZS</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] uppercase tracking-widest text-emerald-400">Yakuniy To'lov</span>
                            <span className="text-3xl font-black text-emerald-400">{Number(detailsModal.sale.finalAmount || detailsModal.sale.totalAmount).toLocaleString()} <span className="text-sm font-normal">UZS</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- TAHRIRLASH MODALI --- */}
      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={(e) => {if(e.target===e.currentTarget && !isActionLoading) setEditModal({ isOpen: false, data: null })}}>
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit2 className="text-blue-600"/> Savdoni Tahrirlash</h2>
                    <button disabled={isActionLoading} onClick={() => setEditModal({ isOpen: false, data: null })} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"><X size={24} /></button>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs font-medium mb-6">
                    Bu yerda siz tovarlar sonini, chegirma miqdorini va izohni o'zgartirishingiz mumkin. Agar yangi tovar qo'shmoqchi bo'lsangiz, ushbu savdoni o'chirib yangidan yaratganingiz ma'qul.
                </div>

                <div className="max-h-60 overflow-y-auto mb-6 border border-slate-100 rounded-xl custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] text-slate-400 uppercase font-black">
                            <tr><th className="p-3">Tovar</th><th className="p-3 text-center">Soni</th><th className="p-3 text-right">Jami (UZS)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                            {editModal.data.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-3 text-slate-700">{item.name}</td>
                                    <td className="p-3 w-28">
                                        <input 
                                            type="number" min="1" 
                                            disabled={isActionLoading}
                                            value={item.qty} 
                                            onChange={(e) => updateEditQty(item.id, Number(e.target.value))} 
                                            className="w-full p-2 border border-slate-200 rounded-lg text-center outline-blue-500 font-black text-blue-600 bg-slate-50 focus:bg-white disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="p-3 text-right text-slate-600">{(item.salePrice * item.qty).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Tag size={14}/> Chegirma (UZS)</label>
                        <input 
                            type="number" min="0" 
                            disabled={isActionLoading}
                            value={editModal.data.discount} 
                            onChange={(e) => setEditModal(p => ({...p, data: {...p.data, discount: e.target.value}}))} 
                            className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl outline-none focus:border-amber-400 font-black text-amber-700 text-lg disabled:opacity-50" 
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 flex items-center gap-1 ${Number(editModal.data.discount) > 0 ? 'text-rose-500' : 'text-gray-500'}`}><MessageSquare size={14}/> Izoh {Number(editModal.data.discount) > 0 && '*'}</label>
                        <textarea 
                            disabled={isActionLoading}
                            value={editModal.data.note} 
                            onChange={(e) => setEditModal(p => ({...p, data: {...p.data, note: e.target.value}}))} 
                            className={`w-full p-3 border rounded-xl outline-none resize-none h-16 disabled:opacity-50 ${Number(editModal.data.discount) > 0 ? 'bg-rose-50 border-rose-200 focus:border-rose-500 text-rose-900' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-700'}`}
                        ></textarea>
                    </div>
                </div>

                <button disabled={isActionLoading} onClick={saveEdit} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed">
                    {isActionLoading ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20}/> O'zgarishlarni Saqlash</>}
                </button>
            </div>
        </div>
      )}

      {/* --- TO'LOVGA YUBORISH (OLDINGI TASDIQLASH) MODALI --- */}
      {sendToPaymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-amber-50 text-amber-500 rotate-3 shadow-lg shadow-amber-100">
                    <Send size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">To'lovga yuborasizmi?</h3>
                <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                    Ushbu amal bajarilgach, savdo "To'lov kutilmoqda" holatiga o'tadi va uni tahrirlab bo'lmaydi. Kassa bo'limida to'lov qilish imkoniyati ochiladi.
                </p>
                <div className="flex gap-3">
                    <button disabled={isActionLoading} onClick={() => setSendToPaymentModal({ isOpen: false, id: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50">Bekor qilish</button>
                    <button disabled={isActionLoading} onClick={handleSendToPayment} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                        {isActionLoading ? <Loader2 size={16} className="animate-spin"/> : "Yuborish"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- O'CHIRISH MODALI --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 text-rose-500 rotate-3 shadow-lg shadow-rose-100">
                    <AlertTriangle size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Bekor qilinadimi?</h3>
                <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                    Bu savdoni butunlay o'chirib yuborasiz. Agar u kassaga to'lovga yuborilgan bo'lsa, u yerdan ham o'chadi.
                </p>
                <div className="flex gap-3">
                    <button disabled={isActionLoading} onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50">Yopish</button>
                    <button disabled={isActionLoading} onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                        {isActionLoading ? <Loader2 size={16} className="animate-spin"/> : "O'chirish"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default CashSales;
