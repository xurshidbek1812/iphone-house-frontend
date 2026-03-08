import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, Send, CheckCircle, Eye, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // ZAMONAVIY XABARLAR

const SupplierIncomeList = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const userRole = localStorage.getItem('userRole') || 'admin';
  const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';

  // --- ZAMONAVIY MODAL UCHUN STATE ---
  // type: 'approve' (tasdiqlash) yoki 'delete' (o'chirish) bo'lishi mumkin
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, invoiceId: null });

  useEffect(() => {
    const savedInvoices = localStorage.getItem('supplierInvoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    document.addEventListener('click', (e) => !e.target.closest('.menu-container') && setActiveMenu(null));
  }, []);

  const toggleMenu = (e, id) => { e.stopPropagation(); setActiveMenu(activeMenu === id ? null : id); };

// --- HAQIQIY TASDIQLASH FUNKSIYASI ---
  const executeApprove = async (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return toast.error("Faktura topilmadi!");

    try {
        // --- ASOSIY O'ZGARISH SHU YERDA ---
        // Backend adashib qolmasligi uchun jo'natilayotgan obyekt nomlarini standartlashtiramiz:
        const itemsToBackend = invoice.items.map(item => ({
            id: item.id,
            customId: item.customId,
            quantity: Number(item.count || item.quantity || item.inputQty), // Soni
            buyPrice: Number(item.price || item.inputPrice || item.buyPrice), // YANGI KIRIM NARXI
            buyCurrency: item.currency || item.inputCurrency || 'UZS'         // Valyutasi
        }));

        const response = await fetch('https://iphone-house-api.onrender.com/api/products/increase-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemsToBackend) // To'g'rilangan ma'lumotni jo'natamiz
        });

        if (!response.ok) throw new Error("Ombor yangilanmadi!");

        const updatedInvoices = invoices.map(inv => 
            inv.id === id ? { ...inv, status: 'Tasdiqlandi' } : inv
        );
        
        setInvoices(updatedInvoices);
        localStorage.setItem('supplierInvoices', JSON.stringify(updatedInvoices));
        
        toast.success("Muvaffaqiyatli! Tovar yangi narx bilan omborga tushdi.");
        if(viewInvoice) setViewInvoice(null);
    } catch (err) {
        console.error(err);
        toast.error("Xatolik: " + err.message);
    } finally {
        setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  // --- HAQIQIY O'CHIRISH FUNKSIYASI (Modal ichidan chaqiriladi) ---
  const executeDelete = (id) => {
    const upd = invoices.filter(i => i.id !== id);
    setInvoices(upd);
    localStorage.setItem('supplierInvoices', JSON.stringify(upd));
    toast.success("Faktura o'chirildi!");
    setConfirmModal({ isOpen: false, type: null, invoiceId: null }); // Modalni yopish
  };

  // --- MENYU AMALLARI ---
  const handleAction = (action, id) => {
    setActiveMenu(null);
    
    if (action === 'view') {
        const inv = invoices.find(i => i.id === id);
        setViewInvoice(inv);
    }
    
    // Tasdiqlash tugmasi bosilganda (Modalni ochamiz)
    if (action === 'approve') {
        setConfirmModal({ isOpen: true, type: 'approve', invoiceId: id });
    }
    
    // O'chirish tugmasi bosilganda (Modalni ochamiz)
    if (action === 'delete') {
        setConfirmModal({ isOpen: true, type: 'delete', invoiceId: id });
    }

    if (action === 'send') {
         const upd = invoices.map(i => i.id === id ? { ...i, status: 'Yuborildi' } : i);
         setInvoices(upd);
         localStorage.setItem('supplierInvoices', JSON.stringify(upd));
         toast.success("Faktura yuborildi!");
    }
  };

// --- MANTIQIY FILTRLASH ---
  const filteredInvoices = invoices.filter(inv => {
      // 1. Qidiruvga tushadimi?
      const matchesSearch = (inv.supplier && inv.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // 2. QORALAMA (Jarayonda) qoidasi
      if (inv.status === 'Jarayonda') {
          // Agar hujjat jarayonda bo'lsa, UNI FAQAT YARATGAN ODAM KO'RA OLADI
          return inv.userName === currentUserName;
      }
      
      // 3. Yuborilgan yoki Tasdiqlangan hujjatlarni hamma ko'ra oladi
      return true;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ta'minotchidan tovar kirim</h1>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center mb-6">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input type="text" placeholder="Qidirish..." className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
         </div>
         <button onClick={() => navigate('/ombor/taminotchi-kirim/qoshish')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg"><Plus size={18} /> Qo'shish</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                    <th className="p-4">Sana</th>
                    <th className="p-4">Faktura №</th>
                    <th className="p-4">Ta'minotchi</th>
                    {/* FAQAT DIREKTOR KO'RADI */}
                    {userRole === 'director' && <th className="p-4 text-right">Summa</th>}
                    <th className="p-4 text-center">Holat</th>
                    <th className="p-4 text-center">Amal</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-blue-50">
                        <td className="p-4">{inv.date}</td>
                        <td className="p-4 font-bold">{inv.invoiceNumber}</td>
                        <td className="p-4">{inv.supplier}</td>
                        {/* FAQAT DIREKTOR KO'RADI */}
                        {userRole === 'director' && <td className="p-4 text-right font-bold">{Number(inv.totalSum).toLocaleString()}</td>}
                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'Tasdiqlandi' ? 'bg-green-100 text-green-600' : (inv.status === 'Yuborildi' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600')}`}>{inv.status}</span></td>
                        <td className="p-4 text-center relative menu-container">
                            <button onClick={(e) => toggleMenu(e, inv.id)}><MoreVertical size={18}/></button>
                            {activeMenu === inv.id && (
                                <div className="absolute right-8 top-8 w-40 bg-white shadow-xl border rounded-lg z-50 overflow-hidden">
                                    <button onClick={() => handleAction('view', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><Eye size={16}/> Ko'rish</button>
                                    
                                    {/* Direktor uchun tasdiqlash */}
                                    {userRole === 'director' && inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('approve', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600 flex items-center gap-2"><CheckCircle size={16}/> Tasdiqlash</button>
                                    )}
                                    
                                    {/* Admin uchun */}
                                    {userRole === 'admin' && inv.status === 'Jarayonda' && (
                                        <button onClick={() => handleAction('send', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 flex items-center gap-2"><Send size={16}/> Yuborish</button>
                                    )}
                                    
                                    {/* O'chirish (Tasdiqlanmagan bo'lsa) */}
                                    {inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('delete', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"><Trash2 size={16}/> O'chirish</button>
                                    )}
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- KATTA FAKTURA KO'RISH MODALI --- */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between mb-4 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                            Faktura: <span className="text-blue-600">№ {viewInvoice.invoiceNumber}</span>
                        </h2>
                        {/* YANGI QO'SHILDI: Ta'minotchi va Yuboruvchi nomi */}
                        <div className="text-sm text-gray-500 font-medium flex gap-4">
                            <span>Ta'minotchi: <span className="text-gray-800 font-bold">{viewInvoice.supplier}</span></span>
                            <span>•</span>
                            <span>Kiritdi: <span className="text-gray-800">{viewInvoice.userName || "Noma'lum"}</span></span>
                        </div>
                    </div>
                    <button onClick={() => setViewInvoice(null)} className="p-2 hover:bg-gray-100 rounded-full h-fit"><X size={24}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 border">Kod</th>
                                <th className="p-3 border">Nomi</th>
                                <th className="p-3 border">Soni</th>
                                {userRole === 'director' && <th className="p-3 border">Narxi</th>}
                                {userRole === 'director' && <th className="p-3 border text-right">Jami</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {viewInvoice.items.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-3 border font-mono text-blue-600 font-bold">{item.customId}</td>
                                    <td className="p-3 border font-medium">{item.name}</td>
                                    <td className="p-3 border font-bold text-center">{item.count}</td>
                                    {userRole === 'director' && <td className="p-3 border">{item.price.toLocaleString()} <span className="text-xs text-gray-500">{item.currency}</span></td>}
                                    {userRole === 'director' && <td className="p-3 border text-right font-bold">{(item.count * item.price).toLocaleString()}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setViewInvoice(null)} className="px-6 py-3 border rounded-xl font-bold text-gray-700 hover:bg-gray-50">Yopish</button>
                    {userRole === 'director' && viewInvoice.status !== 'Tasdiqlandi' && (
                        <button onClick={() => { setViewInvoice(null); handleAction('approve', viewInvoice.id); }} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center gap-2">
                            <CheckCircle size={18}/> Tasdiqlash
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --- ZAMONAVIY TASDIQLASH / O'CHIRISH MODALI (YANGI) --- */}
      {/* ========================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                
                {/* Ikonka (Tasdiqlash uchun yashil, O'chirish uchun qizil) */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                </div>

                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    {confirmModal.type === 'approve' ? "Fakturani tasdiqlaysizmi?" : "O'chirilsinmi?"}
                </h3>
                <p className="text-center text-gray-500 text-sm mb-6">
                    {confirmModal.type === 'approve' 
                        ? "Tasdiqlaganingizdan so'ng tovarlar omborga qo'shiladi va ularni o'zgartirib bo'lmaydi." 
                        : "Bu faktura tizimdan butunlay o'chirib tashlanadi. Buni ortga qaytarib bo'lmaydi."}
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setConfirmModal({ isOpen: false, type: null, invoiceId: null })} 
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                        Orqaga
                    </button>
                    <button 
                        onClick={() => confirmModal.type === 'approve' ? executeApprove(confirmModal.invoiceId) : executeDelete(confirmModal.invoiceId)} 
                        className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all ${confirmModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                    >
                        {confirmModal.type === 'approve' ? 'Tasdiqlash' : "O'chirish"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SupplierIncomeList;