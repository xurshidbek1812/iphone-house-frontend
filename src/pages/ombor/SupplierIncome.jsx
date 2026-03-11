import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, Save, ArrowLeft, Check, Loader2, DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const SupplierIncome = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';
  const userRole = sessionStorage.getItem('userRole') || 'admin';

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('products'); 
  const [allProducts, setAllProducts] = useState([]);      
  const [suppliersList, setSuppliersList] = useState([]); // Ta'minotchilar ro'yxati
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Faktura ma'lumotlari
  const [invoiceItems, setInvoiceItems] = useState([]);   
  const [supplierName, setSupplierName] = useState('');   // SELECT uchun
  const [invoiceNumber, setInvoiceNumber] = useState(''); // Faqat RAQAM
  const [currency, setCurrency] = useState('UZS');
  const [currencyRate, setCurrencyRate] = useState('12500'); 

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- 1. TOVARLAR VA TA'MINOTCHILARNI YUKLASH ---
  const fetchData = useCallback(async (signal = undefined) => {
      if (!token) {
          toast.error("Tizimga kirish tokeni topilmadi!");
          setLoading(false);
          return;
      }

      try {
          setLoading(true);
          const [prodRes, suppRes] = await Promise.allSettled([
              fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
              fetch(`${API_URL}/api/suppliers`, { headers: getAuthHeaders(), signal }) // Ta'minotchilar uchun API bor deb faraz qildim. Yo'q bo'lsa SessionStorage'dan o'qiymiz.
          ]);

          // Products
          if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
              const data = await parseJsonSafe(prodRes.value);
              if (Array.isArray(data)) setAllProducts(data);
              else toast.error("Mahsulotlar formati noto'g'ri keldi");
          } else if (prodRes.reason?.name !== 'AbortError') {
              toast.error("Mahsulotlarni yuklab bo'lmadi");
          }

          // Suppliers (Agar API dan kelsa. Agar API yo'q bo'lsa pastdagi SessionStorage ishlaydi)
          if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
              const data = await parseJsonSafe(suppRes.value);
              if (Array.isArray(data)) setSuppliersList(data);
          } else {
             // Fallback to SessionStorage agar API bo'lmasa
             const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || "[]");
             setSuppliersList(savedSuppliers);
          }

      } catch (error) {
          if (error.name !== 'AbortError') toast.error("Tarmoq xatosi yuz berdi!");
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchData(controller.signal);
      
      // 🚨 FAQAT RAQAMLI Faktura raqami (INV olingan)
      setInvoiceNumber(Date.now().toString().slice(-6)); 
      
      return () => controller.abort();
  }, [fetchData]);

  // --- 2. FAKTURAGA QO'SHISH ---
  const addToInvoice = (product) => {
    if (invoiceItems.some(item => item.id === product.id)) {
      return toast.error("Bu tovar fakturaga qo'shilgan! Uning miqdorini o'zgartiring.");
    }

    const newItem = {
      ...product,
      inputQty: 1,                 
      inputPrice: Number(product.buyPrice) || 0, 
      totalSum: Number(product.buyPrice) || 0    
    };

    setInvoiceItems(prev => [...prev, newItem]);
    toast.success(`${product.name} fakturaga qo'shildi`);
  };

  // --- 3. FAKTURADAGI TOVARNI O'ZGARTIRISH ---
  const updateItem = (id, field, value) => {
    setInvoiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const qty = Number(updatedItem.inputQty) || 0;
        const price = Number(updatedItem.inputPrice) || 0;
        updatedItem.totalSum = qty * price;
        return updatedItem;
      }
      return item;
    }));
  };

  const removeFromInvoice = (id) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  // --- 4. HISOBLASH ---
  const { grandTotal } = useMemo(() => {
      return invoiceItems.reduce((acc, item) => {
          acc.grandTotal += (Number(item.totalSum) || 0);
          return acc;
      }, { grandTotal: 0 });
  }, [invoiceItems]);

  const filteredProducts = useMemo(() => {
      if (!searchTerm) return allProducts;
      const search = searchTerm.trim().toLowerCase();
      return allProducts.filter(p => 
          (p.name || '').toLowerCase().includes(search) || 
          (p.customId != null && p.customId.toString().includes(search))
      );
  }, [allProducts, searchTerm]);

  // --- 5. SAQLASH (BACKENDGA YUBORISH) ---
  const handleSave = async () => {
    const cleanSupplier = supplierName.trim();
    
    if (!cleanSupplier) return toast.error("Ta'minotchi nomini tanlang!");
    if (invoiceItems.length === 0) return toast.error("Fakturaga tovar qo'shing!");
    if (!token) return toast.error("Sessiya xatosi! Qayta kiring.");

    const exchangeRateVal = Number(currencyRate);
    if (currency === 'USD' && (Number.isNaN(exchangeRateVal) || exchangeRateVal <= 0)) {
        return toast.error("USD uchun valyuta kursini to'g'ri kiriting!");
    }

    const invalidItem = invoiceItems.find(item => {
        const qty = Number(item.inputQty);
        const price = Number(item.inputPrice);
        if (Number.isNaN(qty) || qty <= 0) return true;
        if (Number.isNaN(price) || price < 0) return true;
        if (item.unit === 'Dona' && !Number.isInteger(qty)) return true;
        return false;
    });

    if (invalidItem) {
        return toast.error(`Xato: ${invalidItem.name} uchun miqdor yoki narx noto'g'ri!`);
    }

    setIsSubmitting(true);

    try {
      const finalExchangeRate = currency === 'USD' ? exchangeRateVal : 1;

      // 🚨 STATUS "Jarayonda" BO'LDI. VA ENDPOINT /api/invoices GA QARATILDI
      const payload = {
        supplierName: cleanSupplier,
        invoiceNumber: invoiceNumber.trim() || Date.now().toString().slice(-6),
        exchangeRate: finalExchangeRate,
        totalSum: grandTotal,
        status: "Jarayonda", 
        userName: currentUserName,
        items: invoiceItems.map(item => ({
            productId: item.id,
            customId: item.customId != null ? Number(item.customId) : null,
            name: item.name,
            count: Number(item.inputQty),
            price: Number(item.inputPrice),
            salePrice: Number(item.salePrice) || 0, 
            currency: currency, 
            total: Number(item.totalSum)
        }))
      };

      const response = await fetch(`${API_URL}/api/invoices`, {
          method: 'POST',
          headers: getJsonAuthHeaders(),
          body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
          toast.success("Kirim 'Jarayonda' holatida saqlandi!");
          navigate('/ombor/taminotchi-kirim'); // Ro'yxatga qaytish
      } else {
          toast.error(data?.error || `Saqlashda xatolik (${response.status})`);
      }
    } catch (error) {
        toast.error("Server bilan aloqa yo'q!");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
            <button disabled={isSubmitting} onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors disabled:opacity-50">
                <ArrowLeft size={20}/>
            </button>
            <h1 className="text-xl font-black text-slate-800">Ta'minotchidan tovar kirim</h1>
        </div>
        <div className="flex gap-3">
            <button disabled={isSubmitting} onClick={() => navigate(-1)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">
                Bekor qilish
            </button>
            <button 
                onClick={handleSave} 
                disabled={isSubmitting || invoiceItems.length === 0} 
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Saqlanmoqda...</> : <><Save size={18}/> Saqlash</>}
            </button>
        </div>
      </div>

      {/* --- TEPADAGI FORMALAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
         <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ta'minotchi nomi <span className="text-red-500">*</span></label>
                {/* 🚨 TA'MINOTCHI FAQAT TANLANADIGAN QILINDI */}
                <select 
                    disabled={isSubmitting}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 transition-all disabled:opacity-50 disabled:bg-gray-100 cursor-pointer"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                >
                    <option value="" disabled>Ro'yxatdan ta'minotchi tanlang...</option>
                    {suppliersList.map((s, i) => (
                        <option key={s.id || i} value={s.name}>{s.name}</option>
                    ))}
                    {/* Fallback qator, agar api ishlamasa */}
                    {suppliersList.length === 0 && <option value="Samsung Dealer Tashkent">Samsung Dealer Tashkent</option>}
                </select>
            </div>
            
            <div className="grid grid-cols-3 gap-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Faktura Raqami</label>
                    <input type="number" disabled={isSubmitting} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} placeholder="Misol: 981293" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Valyuta turi</label>
                    <select disabled={isSubmitting} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer" value={currency} onChange={(e)=>setCurrency(e.target.value)}>
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Valyuta kursi</label>
                    <input type="number" disabled={isSubmitting || currency === 'UZS'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={currencyRate} onChange={(e)=>setCurrencyRate(e.target.value)} />
                </div>
            </div>
         </div>

         {/* O'ng tomon: Statistika */}
         <div className="lg:col-span-4 grid grid-rows-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-5"><Package size={120}/></div>
                <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Faktura pozitsiyalari</div>
                <div className="text-4xl font-black text-blue-600 relative z-10">{invoiceItems.length} <span className="text-base text-slate-400 font-bold ml-1">xil tovar</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-5"><DollarSign size={120}/></div>
                <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Jami Summasi</div>
                <div className="text-3xl font-black text-emerald-500 relative z-10 truncate" title={`${grandTotal.toLocaleString()} ${currency}`}>
                    {grandTotal.toLocaleString()} <span className="text-base text-emerald-600/50 font-bold ml-1">{currency}</span>
                </div>
            </div>
         </div>
      </div>

      {/* --- TABLAR --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
                disabled={isSubmitting}
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-4 font-black text-sm transition-all disabled:opacity-50 ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                Bazada bor tovarlar
            </button>
            <button 
                disabled={isSubmitting}
                onClick={() => setActiveTab('invoice')}
                className={`flex-1 py-4 font-black text-sm transition-all relative disabled:opacity-50 ${activeTab === 'invoice' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                Faktura qilinganlar 
                {invoiceItems.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{invoiceItems.length}</span>}
            </button>
        </div>

        {/* 1. TOVARLAR RO'YXATI */}
        {activeTab === 'products' && (
            <div className="flex flex-col h-full flex-1 p-6 bg-white animate-in fade-in duration-300">
                <div className="relative mb-6 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        className="w-full pl-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50"
                        placeholder="Qidirish: Tovar nomi yoki ID raqami..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl custom-scrollbar max-h-[500px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-100">ID</th>
                                <th className="p-4 border-b border-slate-100">Nomi</th>
                                <th className="p-4 text-center border-b border-slate-100">Joriy Qoldiq</th>
                                <th className="p-4 text-right border-b border-slate-100">Kirim narxi (Asl)</th>
                                <th className="p-4 text-center border-b border-slate-100">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm font-bold">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={24}/></td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Hech qanday tovar topilmadi</td></tr>
                            ) : (
                                filteredProducts.map(item => {
                                    const isAdded = invoiceItems.some(i => i.id === item.id);
                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                            <td className="p-4 text-slate-700">{item.name || 'Nomsiz tovar'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-xs ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                    {Number(item.quantity || 0)} {item.unit}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-slate-600">{Number(item.buyPrice || 0).toLocaleString()} <span className="text-[10px] text-slate-400">{item.buyCurrency || 'UZS'}</span></td>
                                            <td className="p-4 text-center">
                                                {isAdded ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-[11px] uppercase font-black tracking-wider border border-emerald-100">
                                                        <Check size={14} strokeWidth={3}/> Qo'shilgan
                                                    </span>
                                                ) : (
                                                    <button disabled={isSubmitting} onClick={() => addToInvoice(item)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white hover:shadow-md transition-all active:scale-95 disabled:opacity-50">
                                                        <Plus size={18} strokeWidth={3}/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 2. FAKTURA TOVARLARI */}
        {activeTab === 'invoice' && (
             <div className="flex flex-col h-full flex-1 p-6 bg-slate-50/50 animate-in fade-in duration-300">
                {invoiceItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                        <Package size={64} className="mb-4 opacity-20"/>
                        <p className="font-bold text-lg text-slate-500 mb-1">Faktura hozircha bo'sh</p>
                        <p className="text-sm font-medium">"Bazada bor tovarlar" ro'yxatidan mahsulot qo'shing</p>
                        <button disabled={isSubmitting} onClick={() => setActiveTab('products')} className="mt-4 px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">Qo'shishga o'tish</button>
                    </div>
                ) : (
                    <div className="overflow-y-auto flex-1 border border-slate-200 bg-white rounded-2xl custom-scrollbar max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 border-b border-slate-200">ID</th>
                                    <th className="p-4 border-b border-slate-200">Nomi</th>
                                    <th className="p-4 w-32 text-center border-b border-slate-200">Kirim Miqdori</th>
                                    <th className="p-4 w-48 text-right border-b border-slate-200">Kirim Narxi ({currency})</th>
                                    <th className="p-4 w-48 text-right border-b border-slate-200">Jami Summa</th>
                                    <th className="p-4 w-16 border-b border-slate-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-bold">
                                {invoiceItems.map(item => (
                                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                        <td className="p-4 text-slate-800">{item.name}</td>
                                        
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" min="0" step={item.unit === 'Dona' ? "1" : "0.01"}
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-blue-600 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                                                    value={item.inputQty}
                                                    disabled={isSubmitting}
                                                    onChange={(e) => updateItem(item.id, 'inputQty', e.target.value)}
                                                />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4">
                                            <input 
                                                type="number" min="0" step="0.01"
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right font-black text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                                                value={item.inputPrice}
                                                disabled={isSubmitting}
                                                onChange={(e) => updateItem(item.id, 'inputPrice', e.target.value)}
                                            />
                                        </td>
                                        
                                        <td className="p-4 text-right">
                                            <span className="text-lg font-black text-emerald-500">{(Number(item.totalSum) || 0).toLocaleString()}</span>
                                        </td>

                                        <td className="p-4 text-center">
                                            <button disabled={isSubmitting} onClick={() => removeFromInvoice(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50" title="Fakturadan o'chirish">
                                                <Trash2 size={20}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
             </div>
        )}
      </div>
    </div>
  );
};

export default SupplierIncome;
