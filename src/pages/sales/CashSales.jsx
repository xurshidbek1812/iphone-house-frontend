import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, X, CheckCircle, Edit2, Eye, AlertTriangle, Clock, User, ShoppingCart, Tag, MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CashSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 

  // Modallar
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, sale: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });

  const token = sessionStorage.getItem('token');

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://iphone-house-api.onrender.com/api/cash-sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSales(await res.json());
      else toast.error("Savdolarni yuklashda xatolik!");
    } catch (err) {
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleApprove = async () => {
    const id = confirmModal.id;
    try {
      const res = await fetch(`https://iphone-house-api.onrender.com/api/cash-sales/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Savdo muvaffaqiyatli tasdiqlandi!");
        fetchSales();
      } else {
        toast.error(data.error || "Tasdiqlashda xatolik");
      }
    } catch (err) { toast.error("Server xatosi!"); } 
    finally { setConfirmModal({ isOpen: false, id: null }); }
  };

  const handleDelete = async () => {
    const id = deleteModal.id;
    try {
      const res = await fetch(`https://iphone-house-api.onrender.com/api/cash-sales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Savdo bekor qilindi!");
        fetchSales();
      } else {
        toast.error(data.error || "O'chirishda xatolik");
      }
    } catch (err) { toast.error("Server xatosi!"); } 
    finally { setDeleteModal({ isOpen: false, id: null }); }
  };

  // --- TAHRIRLASH MANTIQI ---
  const openEditModal = (sale) => {
      setEditModal({
          isOpen: true,
          data: {
              id: sale.id,
              discount: sale.discount || '',
              note: sale.note || '',
              items: sale.items.map(i => ({
                  id: i.productId,
                  name: i.product?.name,
                  qty: i.quantity,
                  salePrice: i.price
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
      const totalAmount = items.reduce((sum, i) => sum + (i.salePrice * i.qty), 0);
      const finalAmount = Math.max(0, totalAmount - Number(discount || 0));

      if (Number(discount) > 0 && (!note || note.trim() === '')) {
          return toast.error("Chegirma uchun izoh majburiy!");
      }
      if (Number(discount) > totalAmount) {
          return toast.error("Chegirma summasi jami summadan ko'p bo'lishi mumkin emas!");
      }

      try {
          const payload = { totalAmount, discount: Number(discount), finalAmount, note, items };
          const res = await fetch(`https://iphone-house-api.onrender.com/api/cash-sales/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              toast.success("Savdo o'zgarishlari saqlandi!");
              setEditModal({ isOpen: false, data: null });
              fetchSales();
          } else {
              toast.error("Tahrirlashda xatolik yuz berdi");
          }
      } catch (err) { toast.error("Server xatosi"); }
  };

  // Qidiruv va Filtr
  const filteredSales = sales.filter(sale => {
    const searchString = `${sale.id} ${sale.customer?.firstName || ''} ${sale.customer?.lastName || ''} ${sale.otherName || ''} ${sale.otherPhone || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Naqd Savdolar</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Barcha naqd pul orqali qilingan savdolar ro'yxati</p>
        </div>
        <button 
            onClick={() => navigate('/naqd-savdo/qoshish')} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
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
            <button onClick={() => setFilterStatus('JARAYONDA')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'JARAYONDA' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-500 hover:bg-amber-50'}`}>Kutilyapti</button>
            <button onClick={() => setFilterStatus('TASDIQLANDI')} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filterStatus === 'TASDIQLANDI' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-emerald-50'}`}>Yakunlangan</button>
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-black tracking-wider border-b border-slate-100">
                <tr>
                    <th className="p-5 text-center">ID</th>
                    <th className="p-5">Sana</th>
                    <th className="p-5">Mijoz</th>
                    <th className="p-5 text-center">Summa</th>
                    <th className="p-5 text-center">Holati</th>
                    <th className="p-5 text-center">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
                {isLoading ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400">Yuklanmoqda...</td></tr>
                ) : filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="p-5 text-center font-black text-slate-400">#{sale.id}</td>
                            <td className="p-5">
                                <div className="text-slate-800">{new Date(sale.date).toLocaleDateString('uz-UZ')}</div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(sale.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="p-5">
                                {sale.customer ? (
                                    <div>
                                        <div className="text-slate-800">{sale.customer.lastName} {sale.customer.firstName}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><User size={12}/> Bazadan tanlangan</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-slate-800">{sale.otherName || 'Anonim mijoz'}</div>
                                        <div className="text-[11px] text-amber-500 mt-0.5 flex items-center gap-1"><User size={12}/> Boshqa shaxs ({sale.otherPhone})</div>
                                    </div>
                                )}
                            </td>
                            <td className="p-5 text-center">
                                <div className="text-lg font-black text-blue-600">{Number(sale.finalAmount || sale.totalAmount).toLocaleString()} <span className="text-xs text-slate-400 font-normal">UZS</span></div>
                                {Number(sale.discount) > 0 && <div className="text-[10px] text-rose-500 mt-0.5">Chegirma: {Number(sale.discount).toLocaleString()}</div>}
                            </td>
                            <td className="p-5 text-center">
                                {sale.status === 'JARAYONDA' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[11px] uppercase font-black tracking-widest border border-amber-100">
                                        <Clock size={14}/> Kutilyapti
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] uppercase font-black tracking-widest border border-emerald-100">
                                        <CheckCircle size={14}/> Tasdiqlangan
                                    </span>
                                )}
                            </td>
                            <td className="p-5">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setDetailsModal({ isOpen: true, sale })} className="p-2 text-slate-400 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all" title="Batafsil ko'rish">
                                        <Eye size={18}/>
                                    </button>

                                    {sale.status === 'JARAYONDA' && (
                                        <>
                                            <button onClick={() => setConfirmModal({ isOpen: true, id: sale.id })} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all" title="Savdoni Tasdiqlash">
                                                <CheckCircle size={18} strokeWidth={2.5}/>
                                            </button>
                                            
                                            <button onClick={() => openEditModal(sale)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all" title="Tahrirlash">
                                                <Edit2 size={18}/>
                                            </button>

                                            <button onClick={() => setDeleteModal({ isOpen: true, id: sale.id })} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all" title="Bekor qilish / O'chirish">
                                                <Trash2 size={18}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold text-lg">Savdolar topilmadi</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- BATAFSIL KO'RISH MODALI --- */}
      {detailsModal.isOpen && detailsModal.sale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> Savdo batafsil</h2>
                        <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">ID: #{detailsModal.sale.id} | Sana: {new Date(detailsModal.sale.date).toLocaleString('uz-UZ')}</p>
                    </div>
                    <button onClick={() => setDetailsModal({ isOpen: false, sale: null })} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24} /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Xaridor</p>
                            <p className="text-lg font-bold text-slate-800">
                                {detailsModal.sale.customer ? `${detailsModal.sale.customer.lastName} ${detailsModal.sale.customer.firstName}` : (detailsModal.sale.otherName || 'Anonim mijoz')}
                            </p>
                            <p className="text-sm font-mono text-slate-500 mt-1">{detailsModal.sale.customer?.phones?.[0]?.phone || detailsModal.sale.otherPhone || '-'}</p>
                        </div>
                        <div className={`p-5 rounded-2xl border ${detailsModal.sale.status === 'JARAYONDA' ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${detailsModal.sale.status === 'JARAYONDA' ? 'text-amber-500' : 'text-emerald-500'}`}>Holati</p>
                            <p className={`text-lg font-bold ${detailsModal.sale.status === 'JARAYONDA' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {detailsModal.sale.status === 'JARAYONDA' ? 'Kutilyapti (Tasdiqlanmagan)' : 'Tasdiqlangan (Yakunlangan)'}
                            </p>
                        </div>
                    </div>

                    {/* Izoh ko'rsatish */}
                    {detailsModal.sale.note && (
                        <div className={`p-5 rounded-2xl mb-8 border ${Number(detailsModal.sale.discount) > 0 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1 ${Number(detailsModal.sale.discount) > 0 ? 'text-rose-500' : 'text-slate-500'}`}><MessageSquare size={14}/> Izoh / Sabab</p>
                            <p className="text-sm font-medium leading-relaxed">{detailsModal.sale.note}</p>
                        </div>
                    )}

                    <h3 className="font-black text-slate-700 mb-4 uppercase text-xs tracking-widest">Xarid qilingan tovarlar:</h3>
                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
                                <tr>
                                    <th className="p-4">Tovar Nomi</th>
                                    <th className="p-4 text-center">Soni</th>
                                    <th className="p-4 text-right">Dona narxi</th>
                                    <th className="p-4 text-right">Jami</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                {detailsModal.sale.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">{item.product?.name || "Noma'lum tovar"}</td>
                                        <td className="p-4 text-center">{item.quantity} ta</td>
                                        <td className="p-4 text-right text-slate-500 font-medium">{Number(item.price).toLocaleString()}</td>
                                        <td className="p-4 text-right text-blue-600">{(Number(item.price) * item.quantity).toLocaleString()}</td>
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
                        <div className="flex justify-between text-sm mb-4 text-amber-400 border-b border-slate-600 pb-4">
                            <span>Chegirma:</span>
                            <span className="font-bold">- {Number(detailsModal.sale.discount || 0).toLocaleString()} UZS</span>
                        </div>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit2 className="text-blue-600"/> Savdoni Tahrirlash</h2>
                    <button onClick={() => setEditModal({ isOpen: false, data: null })} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs font-medium mb-6">
                    Bu yerda siz tovarlar sonini, chegirma miqdorini va izohni o'zgartirishingiz mumkin. Agar yangi tovar qo'shmoqchi bo'lsangiz, ushbu savdoni o'chirib yangidan yaratganingiz ma'qul.
                </div>

                <div className="max-h-60 overflow-y-auto mb-6 border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] text-slate-400 uppercase font-black">
                            <tr><th className="p-3">Tovar</th><th className="p-3 text-center">Soni</th><th className="p-3 text-right">Jami</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                            {editModal.data.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-3 text-slate-700">{item.name}</td>
                                    <td className="p-3 w-28">
                                        <input 
                                            type="number" min="1" 
                                            value={item.qty} 
                                            onChange={(e) => updateEditQty(item.id, Number(e.target.value))} 
                                            className="w-full p-2 border border-slate-200 rounded-lg text-center outline-blue-500 font-black text-blue-600 bg-slate-50 focus:bg-white"
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
                            value={editModal.data.discount} 
                            onChange={(e) => setEditModal(p => ({...p, data: {...p.data, discount: e.target.value}}))} 
                            className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl outline-none focus:border-amber-400 font-black text-amber-700 text-lg" 
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 flex items-center gap-1 ${Number(editModal.data.discount) > 0 ? 'text-rose-500' : 'text-gray-500'}`}><MessageSquare size={14}/> Izoh {Number(editModal.data.discount) > 0 && '*'}</label>
                        <textarea 
                            value={editModal.data.note} 
                            onChange={(e) => setEditModal(p => ({...p, data: {...p.data, note: e.target.value}}))} 
                            className={`w-full p-3 border rounded-xl outline-none resize-none h-16 ${Number(editModal.data.discount) > 0 ? 'bg-rose-50 border-rose-200 focus:border-rose-500 text-rose-900' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-700'}`}
                        ></textarea>
                    </div>
                </div>

                <button onClick={saveEdit} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase tracking-widest">
                    <Save size={20}/> O'zgarishlarni Saqlash
                </button>
            </div>
        </div>
      )}

      {/* --- TASDIQLASH MODALI --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-emerald-50 text-emerald-500 rotate-3 shadow-lg shadow-emerald-100">
                    <CheckCircle size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Tasdiqlaysizmi?</h3>
                <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                    Ushbu amal bajarilgach tovarlar ombordan ayriladi va pul avtomatik kassa kirimiga yoziladi.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal({ isOpen: false, id: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs">Bekor qilish</button>
                    <button onClick={handleApprove} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all uppercase text-xs tracking-widest">Tasdiqlash</button>
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
                    Hali tasdiqlanmagan ushbu savdoni butunlay o'chirib yuborasiz.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs">Yopish</button>
                    <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest">O'chirish</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default CashSales;
