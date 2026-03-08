import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const SupplierReturn = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. ROLNI OLAMIZ
  const userRole = localStorage.getItem('userRole') || 'admin'; // 'director' yoki 'admin'
  const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';
  const token = localStorage.getItem('token');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null });

  useEffect(() => {
    const savedReturns = localStorage.getItem('supplierReturns');
    if (savedReturns) {
      setReturns(JSON.parse(savedReturns));
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-container')) setActiveMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  // --- HAQIQIY AMALLAR ---
  const executeSend = (id) => {
    const updatedReturns = returns.map(item => 
        item.id === id ? { ...item, status: 'Yuborildi' } : item
    );
    setReturns(updatedReturns);
    localStorage.setItem('supplierReturns', JSON.stringify(updatedReturns));
    toast.success("Qaytarish hujjati yuborildi!");
    setConfirmModal({ isOpen: false, type: null, id: null });
  };

  // DIREKTOR UCHUN TASDIQLASH
// --- DIREKTOR UCHUN TASDIQLASH (VA QOLDIQNI KAMAYTIRISH) ---
  const executeApprove = async (id) => {
    const returnDoc = returns.find(r => r.id === id);
    if (!returnDoc) return toast.error("Hujjat topilmadi!");

    try {
        const response = await fetch('https://iphone-house-api.onrender.com/api/products/decrease-stock', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- TOKEN QO'SHILDI
            },
            body: JSON.stringify(returnDoc.items) 
        });

        if (!response.ok) {
            throw new Error("Server xatosi: Ombor qoldig'i yangilanmadi!");
        }

        const updatedReturns = returns.map(item => 
            item.id === id ? { ...item, status: 'Tasdiqlandi' } : item
        );
        
        setReturns(updatedReturns);
        localStorage.setItem('supplierReturns', JSON.stringify(updatedReturns));
        
        toast.success("Muvaffaqiyatli!");

    } catch (err) {
        console.error("Tasdiqlashda xatolik:", err);
        toast.error("Xatolik: " + err.message);
    } finally {
        setConfirmModal({ isOpen: false, type: null, id: null }); 
    }
  };

  const handleAction = (action, id) => {
    setActiveMenu(null);

    if (action === 'send') setConfirmModal({ isOpen: true, type: 'send', id: id });
    if (action === 'approve') setConfirmModal({ isOpen: true, type: 'approve', id: id }); // Direktor uchun
    if (action === 'delete') setConfirmModal({ isOpen: true, type: 'delete', id: id });
    if (action === 'edit') toast.error("Tahrirlash ustida ishlanmoqda!"); 
  };

// --- MANTIQIY FILTRLASH ---
  const filteredReturns = returns.filter(item => {
      // 1. Qidiruvga tushadimi?
      const matchesSearch = (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      // 2. QORALAMA (Jarayonda) qoidasi
      if (item.status === 'Jarayonda') {
          // Agar hujjat jarayonda bo'lsa, UNI FAQAT YARATGAN ODAM KO'RA OLADI
          return item.userName === currentUserName;
      }
      
      // 3. Yuborilgan yoki Tasdiqlangan hujjatlarni hamma ko'ra oladi
      return true;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ta'minotchiga tovar qaytarish</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center mb-6">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input 
                type="text" placeholder="Qidirish (Ta'minotchi yoki Izoh)..." 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
            onClick={() => navigate('/ombor/taminotchi-qaytarish/qoshish')} 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
        >
            <Plus size={18} /> Qaytarish qo'shish
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px]">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                    <th className="p-4">Sana</th>
                    <th className="p-4">Ta'minotchi</th>
                    <th className="p-4">Izoh</th>
                    <th className="p-4 text-right">Summasi</th>
                    <th className="p-4 text-center">Holati</th>
                    <th className="p-4 text-center">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {filteredReturns.length > 0 ? (
                    filteredReturns.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                            <td className="p-4">{item.date}</td>
                            <td className="p-4 font-bold text-gray-800">{item.supplier}</td>
                            <td className="p-4 text-gray-600 italic">{item.note || "-"}</td>
                            <td className="p-4 text-right font-bold text-gray-800">{Number(item.totalSum).toLocaleString()} UZS</td>
                            
                            <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    item.status === 'Tasdiqlandi' ? 'bg-green-100 text-green-600' :
                                    item.status === 'Yuborildi' ? 'bg-blue-100 text-blue-600' : 
                                    'bg-yellow-100 text-yellow-600'
                                }`}>
                                    ● {item.status}
                                </span>
                            </td>
                            
                            <td className="p-4 text-center relative menu-container">
                                <button onClick={(e) => toggleMenu(e, item.id)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                    <MoreVertical size={18}/>
                                </button>
                                
                                {activeMenu === item.id && (
                                    <div className="absolute right-8 top-8 w-48 bg-white shadow-xl border rounded-lg z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                        
                                        {/* 1. XODIM UCHUN (Faqat Jo'natish) */}
                                        {userRole !== 'director' && item.status === 'Jarayonda' && (
                                            <button onClick={() => handleAction('send', item.id)} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 text-sm font-medium border-b flex items-center gap-2">
                                                <Send size={16}/> Yuborish
                                            </button>
                                        )}

                                        {/* 2. DIREKTOR UCHUN (Tasdiqlash) */}
                                        {userRole === 'director' && item.status !== 'Tasdiqlandi' && (
                                            <button onClick={() => handleAction('approve', item.id)} className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-600 text-sm font-medium border-b flex items-center gap-2">
                                                <CheckCircle size={16}/> Tasdiqlash
                                            </button>
                                        )}

                                        {item.status !== 'Tasdiqlandi' && (
                                            <button onClick={() => handleAction('edit', item.id)} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 text-sm border-b flex items-center gap-2">
                                                <Edit size={16}/> Tahrirlash
                                            </button>
                                        )}
                                        
                                        {item.status !== 'Tasdiqlandi' && (
                                            <button onClick={() => handleAction('delete', item.id)} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                                <Trash2 size={16}/> O'chirish
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400">Qaytarishlar yo'q</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- ZAMONAVIY TASDIQLASH / O'CHIRISH MODALI --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    confirmModal.type === 'send' ? 'bg-blue-50 text-blue-600' : 
                    confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 
                    'bg-red-50 text-red-600'
                }`}>
                    {confirmModal.type === 'send' ? <Send size={32} /> : 
                     confirmModal.type === 'approve' ? <CheckCircle size={32} /> : 
                     <AlertTriangle size={32} />}
                </div>

                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    {confirmModal.type === 'send' ? "Hujjat yuborilsinmi?" : 
                     confirmModal.type === 'approve' ? "Hujjatni tasdiqlaysizmi?" : "O'chirilsinmi?"}
                </h3>
                <p className="text-center text-gray-500 text-sm mb-6">
                    {confirmModal.type === 'send' ? "Hujjat holati 'Yuborildi' ga o'zgaradi va direktorga ko'rinadi." : 
                     confirmModal.type === 'approve' ? "Tasdiqlaganingizdan so'ng, tovarlar ombor qoldig'idan ayirib tashlanadi." :
                     "Bu qaytarish hujjati tizimdan butunlay o'chiriladi. Ishonchingiz komilmi?"}
                </p>

                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal({ isOpen: false, type: null, id: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                        Orqaga
                    </button>
                    <button 
                        onClick={() => {
                            if (confirmModal.type === 'send') executeSend(confirmModal.id);
                            else if (confirmModal.type === 'approve') executeApprove(confirmModal.id);
                            else executeDelete(confirmModal.id);
                        }} 
                        className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg ${
                            confirmModal.type === 'send' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 
                            confirmModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 
                            'bg-red-600 hover:bg-red-700 shadow-red-200'
                        }`}
                    >
                        {confirmModal.type === 'send' ? 'Yuborish' : confirmModal.type === 'approve' ? 'Tasdiqlash' : "O'chirish"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};


export default SupplierReturn;

