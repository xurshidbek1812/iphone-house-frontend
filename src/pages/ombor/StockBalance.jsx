import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, X, Package, Loader2 } from 'lucide-react';
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

const StockBalance = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const token = sessionStorage.getItem('token');

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  const [formData, setFormData] = useState({
    customId: '',    
    name: '',
    category: '',    
    unit: 'Dona',    
    buyPrice: '',    
    salePrice: '',   
    quantity: '',    
    buyCurrency: 'USD',
    saleCurrency: 'UZS'
  });

  // --- FETCH DATA ---
  // signal default qiymati undefined qilib belgilandi
  const fetchData = useCallback(async (signal = undefined) => {
    if (!token) {
        toast.error("Tizimga kirish tokeni topilmadi!");
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      
      const [prodRes, catRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/categories`, { headers: getAuthHeaders(), signal })
      ]);

      // MAHSULOTLARNI ISHLASH
      if (prodRes.status === 'fulfilled') {
          if (prodRes.value.ok) {
              const data = await parseJsonSafe(prodRes.value);
              if (Array.isArray(data)) {
                  setProducts(data);
              } else {
                  setProducts([]);
                  toast.error("Mahsulotlar ro'yxati noto'g'ri formatda keldi");
              }
          } else {
              const errText = await prodRes.value.text();
              console.error('Products fetch error:', prodRes.value.status, errText);
              toast.error(`Mahsulotlarni yuklab bo'lmadi (${prodRes.value.status})`);
          }
      } else if (prodRes.reason?.name !== 'AbortError') {
          console.error(prodRes.reason);
          toast.error("Mahsulotlar serveriga ulanib bo'lmadi");
      }

      // KATEGORIYALARNI ISHLASH
      if (catRes.status === 'fulfilled') {
          if (catRes.value.ok) {
              const data = await parseJsonSafe(catRes.value);
              if (Array.isArray(data)) {
                  setCategories(data);
              } else {
                  setCategories([]);
                  toast.error("Kategoriyalar formati noto'g'ri keldi");
              }
          } else {
              console.error('Categories fetch error:', catRes.value.status);
              // 🚨 User-facing xato xabari
              toast.error(`Kategoriyalarni yuklab bo'lmadi (${catRes.value.status})`);
          }
      } else if (catRes.reason?.name !== 'AbortError') {
          toast.error("Kategoriyalar serveriga ulanib bo'lmadi");
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
          console.error("Umumiy yuklash xatosi:", error);
          toast.error("Tarmoq xatosi yuz berdi!");
      }
    } finally {
      // 🚨 Abort bo'lsa state update qilinmaydi (memory leak oldi olinadi)
      if (!signal?.aborted) {
          setLoading(false);
      }
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Sessiya xatosi! Iltimos, qayta kiring.");
    
    const cleanName = formData.name.trim();
    const cleanCustomId = formData.customId.trim();

    if(!cleanName || !formData.category || !cleanCustomId) {
        return toast.error("Nomi, Kategoriya va Shtrix kod kiritilishi shart!");
    }

    if (!/^\d+$/.test(cleanCustomId)) {
        return toast.error("ID/Shtrix kod faqat raqamlardan iborat bo'lishi kerak!");
    }

    // 🚨 BIZNES LOGIKA: Dona uchun kasr son kiritishni bloklash
    const parsedQty = Number(formData.quantity) || 0;
    if (formData.unit === 'Dona' && !Number.isInteger(parsedQty)) {
        return toast.error("Dona o'lchov birligi uchun qoldiq faqat butun son bo'lishi shart!");
    }

    setIsSubmitting(true);

    try {
      const payload = {
          customId: Number(cleanCustomId), 
          name: cleanName,
          category: formData.category,
          unit: formData.unit,
          buyPrice: Number(formData.buyPrice) || 0,
          salePrice: Number(formData.salePrice) || 0,
          quantity: parsedQty,
          buyCurrency: formData.buyCurrency,
          saleCurrency: formData.saleCurrency
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
        setIsModalOpen(false);
        await fetchData(); // Signal uzatilmaydi, u undefined bo'ladi
        
        setFormData({
            customId: '', name: '', category: '', unit: 'Dona',
            buyPrice: '', salePrice: '', quantity: '',
            buyCurrency: 'USD', saleCurrency: 'UZS'
        });
        toast.success("Mahsulot muvaffaqiyatli qo'shildi!");
      } else {
        console.error("Submit error status:", response.status);
        toast.error(data?.error || `Saqlashda xatolik (${response.status})`);
      }
    } catch (error) {
      console.error("Submit network error:", error);
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalBackdropClick = (e) => {
      if (e.target === e.currentTarget && !isSubmitting) {
          setIsModalOpen(false);
      }
  };

  // QIDIRUV
  const filteredProducts = useMemo(() => {
      if (!searchTerm) return products;
      // 🚨 trim va toLowerCase tsikldan tashqariga chiqarildi
      const cleanSearch = searchTerm.trim().toLowerCase(); 
      
      return products.filter(p => {
          return (
              (p.name || '').toLowerCase().includes(cleanSearch) || 
              // 🚨 null-safe va "0" holati tekshirildi (?? yoki != null)
              (p.customId != null && p.customId.toString().includes(cleanSearch)) 
          );
      });
  }, [products, searchTerm]);

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Tovarlar qoldig'i</h2>
            <p className="text-gray-500 text-sm">Ombordagi barcha mahsulotlar ro'yxati</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            disabled={!token || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Plus size={20} /> Mahsulot qo'shish
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mahsulot nomi yoki kodini qidiring..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
        </div>
        <button 
            onClick={() => toast("Kengaytirilgan filtr tez orada qo'shiladi!", {icon: '🚧'})} 
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
            <Filter size={20} /> Filtr
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                    <th className="p-4 font-medium">Mahsulot nomi</th>
                    <th className="p-4 font-medium text-center">Kategoriya</th>
                    <th className="p-4 font-medium text-center">Shtrix kod</th>
                    <th className="p-4 font-medium text-right">Kirim narxi</th>
                    <th className="p-4 font-medium text-right">Sotuv narxi</th>
                    <th className="p-4 font-medium text-center">Qoldiq</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400"><Loader2 size={24} className="animate-spin mx-auto"/></td></tr>
                ) : filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="p-10 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <Package size={40} className="text-gray-300"/>
                                <p>{searchTerm ? "Qidiruv bo'yicha mahsulot topilmadi" : "Hozircha mahsulot yo'q"}</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredProducts.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-800">{item.name || 'Nomsiz tovar'}</td>
                            <td className="p-4 text-gray-600 text-center">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                    {item.category || '-'}
                                </span>
                            </td>
                            {/* 🚨 customId 0 bo'lsa xato chiqmasligi uchun ?? ishlatildi */}
                            <td className="p-4 text-gray-500 font-mono text-sm text-center">#{item.customId ?? '-'}</td>
                            <td className="p-4 text-gray-600 text-right">
                                {Number(item.buyPrice || 0).toLocaleString()} <span className="text-[10px] text-gray-400">{item.buyCurrency || ''}</span>
                            </td>
                            <td className="p-4 font-medium text-blue-600 text-right">
                                {Number(item.salePrice || 0).toLocaleString()} <span className="text-[10px] text-gray-400">{item.saleCurrency || ''}</span>
                            </td>
                            <td className={`p-4 font-bold text-center ${Number(item.quantity || 0) <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {Number(item.quantity || 0)} <span className="text-[10px] font-normal text-gray-500">{item.unit}</span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* MODAL - ADD PRODUCT */}
      {isModalOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onMouseDown={handleModalBackdropClick}
        >
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">Yangi mahsulot qo'shish</h3>
                    <button onClick={() => !isSubmitting && setIsModalOpen(false)} disabled={isSubmitting} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full disabled:opacity-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Mahsulot nomi *</label>
                            <input 
                                name="name" required
                                value={formData.name} onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all" 
                                placeholder="Masalan: iPhone 15 Pro Max"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Kategoriya *</label>
                            <select 
                                name="category" required
                                disabled={categories.length === 0}
                                value={formData.category} onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 transition-all"
                            >
                                <option value="">{categories.length > 0 ? "Tanlang..." : "Kategoriyalar topilmadi"}</option>
                                {categories.map((cat, i) => (
                                    <option key={cat.id || i} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Shtrix kod / ID *</label>
                            <input 
                                type="text" name="customId" required 
                                value={formData.customId} onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono text-slate-700 transition-all" 
                                placeholder="Masalan: 12345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Kirim narxi</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" name="buyPrice" required min="0" step="0.01"
                                    value={formData.buyPrice} onChange={handleInputChange}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all" 
                                    placeholder="0.00"
                                />
                                <select name="buyCurrency" value={formData.buyCurrency} onChange={handleInputChange} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none font-bold text-slate-600 focus:border-blue-500 transition-all">
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sotuv narxi</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" name="salePrice" required min="0" step="0.01"
                                    value={formData.salePrice} onChange={handleInputChange}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all" 
                                    placeholder="0.00"
                                />
                                <select name="saleCurrency" value={formData.saleCurrency} onChange={handleInputChange} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 outline-none font-bold text-slate-600 focus:border-blue-500 transition-all">
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Boshlang'ich qoldiq</label>
                            <input 
                                type="number" name="quantity" required min="0" 
                                step={formData.unit === 'Dona' ? '1' : '0.01'}
                                value={formData.quantity} onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium text-slate-700 transition-all" 
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">O'lchov birligi</label>
                            <select 
                                name="unit"
                                value={formData.unit} onChange={handleInputChange}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white font-medium text-slate-700 transition-all"
                            >
                                <option value="Dona">Dona</option>
                                <option value="Kg">Kg</option>
                                <option value="Metr">Metr</option>
                                <option value="Litr">Litr</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 justify-end border-t border-slate-100 mt-6">
                        <button 
                            type="button" 
                            disabled={isSubmitting}
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            Bekor qilish
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !token}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                        >
                            {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Saqlanmoqda...</> : "Saqlash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default StockBalance;
