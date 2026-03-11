import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Image as ImageIcon, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

// HELPER: Xavfsiz JSON parsing
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

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = sessionStorage.getItem('token');

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  // --- BAZADAN SAVDOLARNI YUKLASH VA CHEGIRMALARNI SARALASH ---
  const fetchDiscounts = useCallback(async (signal = undefined) => {
      if (!token) {
          toast.error("Tizimga kirish tokeni topilmadi!");
          setLoading(false);
          return;
      }

      try {
          setLoading(true);
          // 🚨 ENDPOINT O'ZGARDI: Barcha Naqd Savdolarni chaqiramiz
          const res = await fetch(`${API_URL}/api/cash-sales`, { 
              headers: getAuthHeaders(),
              signal
          });

          if (res.ok) {
              const data = await parseJsonSafe(res);
              if (Array.isArray(data)) {
                  // Faqatgina chegirmasi 0 dan katta bo'lganlarini saralab olamiz
                  const discountedSales = data
                      .filter(sale => Number(sale.discount) > 0)
                      .map(sale => {
                          // Savdodagi barcha tovarlar nomini vergul bilan birlashtiramiz
                          const productNames = Array.isArray(sale.items) && sale.items.length > 0 
                              ? sale.items.map(i => i.name).join(', ') 
                              : 'Noma\'lum tovar';
                          
                          // Savdodagi barcha tovarlar sonini qo'shamiz
                          const totalQty = Array.isArray(sale.items) 
                              ? sale.items.reduce((sum, i) => sum + (Number(i.qty) || 1), 0) 
                              : 1;

                          return {
                              id: sale.id, // Aslida bu yerda chegirma ID si bo'lishi mumkin, hozircha savdo ID sini beramiz
                              saleId: sale.id,
                              date: sale.createdAt || sale.date,
                              productName: productNames,
                              qty: totalQty,
                              salePrice: Number(sale.totalAmount), // Chegirmasiz jami narx
                              discountAmount: Number(sale.discount),
                              userName: sale.userName || sale.staff?.fullName || 'Noma\'lum xodim',
                              note: sale.note || 'Naqd savdo'
                          };
                      });

                  setDiscounts(discountedSales);
              } else {
                  setDiscounts([]);
              }
          } else {
              const errText = await res.text();
              console.error('Discounts fetch error:', res.status, errText);
              toast.error(`Ma'lumotlarni yuklab bo'lmadi (${res.status})`);
          }
      } catch (error) {
          if (error.name !== 'AbortError') {
              console.error("Fetch error:", error);
              toast.error("Tarmoq xatosi yuz berdi!");
          }
      } finally {
          if (!signal?.aborted) {
              setLoading(false);
          }
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchDiscounts(controller.signal);
      return () => controller.abort();
  }, [fetchDiscounts]);

  // --- QIDIRUV VA FILTRLASH MANTIQI ---
  const filteredDiscounts = useMemo(() => {
      if (!searchTerm) return discounts;
      const search = searchTerm.trim().toLowerCase();
      
      return discounts.filter(item => {
          return (
              (item.productName || '').toLowerCase().includes(search) ||
              String(item.id || '').includes(search) ||
              String(item.saleId || '').includes(search) ||
              (item.userName || '').toLowerCase().includes(search)
          );
      });
  }, [discounts, searchTerm]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Tag className="text-amber-500" /> Berilgan chegirmalar
      </h1>
      
      {/* TEPADAGI QIDIRUV VA FILTR PANELI */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Savdo ID, Tovar nomi, yoki xodim ismi bo'yicha qidirish..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
            />
         </div>
         <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
             <Filter size={18}/> Filtr
         </button>
      </div>

      {/* ASOSIY JADVAL QISMI */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                <th className="p-5 text-center">Savdo ID</th>
                <th className="p-5">Sanasi</th>
                <th className="p-5 min-w-[250px]">Tovar nomi (Savat)</th>
                <th className="p-5 text-center">Miqdori</th>
                <th className="p-5 text-right">Sotish narxi</th>
                <th className="p-5 text-right text-amber-600">Chegirma summasi</th>
                <th className="p-5">Chegirma qilgan xodim</th>
                <th className="p-5">Izoh (Sabab)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                {loading ? (
                    <tr><td colSpan="8" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32}/></td></tr>
                ) : filteredDiscounts.length === 0 ? (
                    <tr>
                        <td colSpan="8" className="p-20 text-center text-slate-400">
                            <Tag size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="font-medium text-sm">Hozircha hech qanday chegirma qilinmagan.</p>
                        </td>
                    </tr>
                ) : (
                    filteredDiscounts.map((item, index) => {
                        const discountAmt = item.discountAmount;
                        // Necha foiz chegirma qilinganini avtomat hisoblaymiz:
                        const percent = item.salePrice > 0 ? ((discountAmt / item.salePrice) * 100).toFixed(2) : 0;

                        return (
                            <tr key={item.id || index} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-5 text-center font-black text-blue-600">#{item.saleId || '-'}</td>
                                <td className="p-5 text-slate-500 font-medium">{formatDate(item.date)}</td>
                                <td className="p-5 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                        <ImageIcon size={18}/>
                                    </div>
                                    <span className="truncate w-56 text-slate-800" title={item.productName}>{item.productName}</span>
                                </td>
                                <td className="p-5 text-center bg-slate-50/50">{item.qty} dona</td>
                                <td className="p-5 text-right font-black text-slate-800">
                                    {item.salePrice.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">UZS</span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="text-amber-600 font-black">{discountAmt.toLocaleString()} <span className="text-[10px]">UZS</span></div>
                                    <div className="text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1">{percent}%</div>
                                </td>
                                <td className="p-5">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs tracking-wide">{item.userName}</span>
                                </td>
                                <td className="p-5 text-rose-500 font-bold max-w-[200px] truncate" title={item.note}>
                                    {item.note || '-'}
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
            </table>
        </div>
        
        {/* PAGINATION QISMI */}
        {!loading && filteredDiscounts.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center z-20 text-sm font-bold text-slate-500">
                <div>
                    Ko'rsatkichlar soni: <span className="text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg ml-2">{filteredDiscounts.length}</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Discounts;
