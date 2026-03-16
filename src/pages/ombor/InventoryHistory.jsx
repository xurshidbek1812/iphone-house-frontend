import React, { useState, useEffect } from 'react';
import { Eye, Calendar, ArrowLeft, Search, FileText, CheckCircle, DatabaseBackup, X } from 'lucide-react'; // <--- X QO'SHILDI
import { useNavigate } from 'react-router-dom';

const InventoryHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedAct, setSelectedAct] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

  // 1. TOKENNI OLAMIZ (Cho'ntakdan pasportni oldik)
  const token = sessionStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 2. SERVERDAN TARIXNI YUKLASH
  useEffect(() => {
    fetch(`${API_URL}/api/inventory/history`, {
        headers: {
            'Authorization': `Bearer ${token}` // <--- PASPORTNI KO'RSATDIK!
        }
    })
      .then(res => res.json())
      .then(data => {
          // Xatolik bo'lsa ekran oqarib ketmasligi uchun tekshiramiz:
          if (Array.isArray(data)) {
              setHistory(data);
          } else {
              console.error("Serverdan kelgan xato:", data);
          }
      })
      .catch(err => console.error("Xatolik:", err));
  }, []);

  // Sanani chiroyli qilish 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };

  // Qidiruv
  const filteredHistory = history.filter(item => 
    String(item.id).includes(searchTerm)
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* Tepa qism */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/ombor/sanoq')} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm">
                <ArrowLeft size={20}/>
            </button>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sanoq Aktlari (Tarix)</h1>
        </div>
        
        <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
                type="text" 
                placeholder="Akt ID bo'yicha qidirish..." 
                className="w-full pl-11 p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm text-slate-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                    <th className="p-5">Akt ID</th>
                    <th className="p-5">Sana</th>
                    <th className="p-5 text-center">Jami Tovar</th>
                    <th className="p-5 text-center">Sanoq Holati</th>
                    <th className="p-5 text-center">Natija (Farq)</th>
                    <th className="p-5 text-center">Amal</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
                {filteredHistory.length === 0 ? (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-400 uppercase tracking-widest text-xs">Hali sanoq qilinmagan</td></tr>
                ) : (
                    filteredHistory.map(act => (
                        <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5 font-black text-blue-600">#{act.id}</td>
                            <td className="p-5 flex items-center gap-2 text-slate-600">
                                <Calendar size={16} className="text-slate-400"/> {formatDate(act.date)}
                            </td>
                            <td className="p-5 text-center text-slate-700">
                                {act.items?.length || 0} xil
                            </td>
                            
                            <td className="p-5 text-center">
                                {act.isStockUpdated ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-tighter border border-emerald-100">
                                        <DatabaseBackup size={14}/> Ombor yangilangan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-tighter border border-slate-200">
                                        <FileText size={14}/> Faqat tarix
                                    </span>
                                )}
                            </td>

                            <td className="p-5 text-center">
                                {act.totalDiff === 0 ? (
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border border-emerald-100">✅ To'g'ri</span>
                                ) : act.totalDiff > 0 ? (
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border border-blue-100">+{act.totalDiff} Ortiqcha</span>
                                ) : (
                                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest border border-rose-100">{act.totalDiff} Kamomat</span>
                                )}
                            </td>
                            <td className="p-5 text-center">
                                <button 
                                    onClick={() => setSelectedAct(act)} 
                                    className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 mx-auto block"
                                >
                                    <Eye size={18}/>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* MODAL (Batafsil ko'rish) */}
      {selectedAct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                            <FileText className="text-blue-600"/> Sanoq Akti #{selectedAct.id}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1"><Calendar size={14}/> {formatDate(selectedAct.date)}</p>
                            
                            {selectedAct.isStockUpdated ? (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle size={12}/> Ombor qoldig'i o'zgargan
                                </span>
                            ) : (
                                <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                                    <FileText size={12}/> Faqat tarix uchun saqlangan
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={() => setSelectedAct(null)} className="p-2 bg-white rounded-full hover:bg-slate-200 text-slate-400 transition-colors shadow-sm">
                        <X size={24}/>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 font-black text-slate-400 text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 pl-6">Tovar Ma'lumotlari</th>
                                    <th className="p-4 text-center">Tizimdagi Qoldiq</th>
                                    <th className="p-4 text-center bg-blue-50/50 text-blue-600">Sanalgan Son</th>
                                    <th className="p-4 text-center">Farq</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold">
                                {selectedAct.items?.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="text-slate-800 text-base">{item.product?.name || "Noma'lum tovar (O'chirilgan)"}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{item.product?.customId || "---"}</div>
                                        </td>
                                        <td className="p-4 text-center text-slate-500 text-base">{item.systemQty}</td>
                                        <td className="p-4 text-center text-blue-600 bg-blue-50/30 text-lg font-black">{item.countedQty}</td>
                                        <td className="p-4 text-center">
                                            {item.diff > 0 ? (
                                                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">+{item.diff}</span>
                                            ) : item.diff < 0 ? (
                                                <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">{item.diff}</span>
                                            ) : (
                                                <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!selectedAct.items || selectedAct.items.length === 0) && (
                                     <tr><td colSpan="4" className="p-8 text-center text-slate-400">Hech qanday ma'lumot topilmadi</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={() => setSelectedAct(null)} className="px-8 py-3.5 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-lg active:scale-95 transition-all">Yopish</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};


export default InventoryHistory;
