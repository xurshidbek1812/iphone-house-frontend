import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, Save, ArrowLeft, Loader2, DollarSign, Package } from 'lucide-react';
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

  // --- STATES ---
  const [allProducts, setAllProducts] = useState([]);      
  const [suppliersList, setSuppliersList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Asosiy ma'lumotlar
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');   
  const [invoiceNumber, setInvoiceNumber] = useState(''); 
  const [currencyRate, setCurrencyRate] = useState(sessionStorage.getItem('globalExchangeRate') || '12500'); 
  
  // Faktura tovarlari
  const [invoiceItems, setInvoiceItems] = useState([]);   
  
  // Qo'shish uchun darcha statelari
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState(''); 
  const [inputMarkup, setInputMarkup] = useState(''); 
  const [inputSalePrice, setInputSalePrice] = useState(''); 
  const [inputCurrency, setInputCurrency] = useState('UZS');

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- 1. YUKLASH ---
  const fetchData = useCallback(async (signal = undefined) => {
      if (!token) return;
      try {
          setLoading(true);
          const [prodRes, suppRes] = await Promise.allSettled([
              fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
              fetch(`${API_URL}/api/suppliers`, { headers: getAuthHeaders(), signal }) 
          ]);

          if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
              const data = await parseJsonSafe(prodRes.value);
              if (Array.isArray(data)) setAllProducts(data);
          }

          if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
              const data = await parseJsonSafe(suppRes.value);
              if (Array.isArray(data)) setSuppliersList(data);
          } else {
             const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || "[]");
             setSuppliersList(savedSuppliers);
          }
      } catch (error) {
          console.error("Yuklashda xato", error);
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchData(controller.signal);
      setInvoiceNumber(Date.now().toString().slice(-6)); 
      return () => controller.abort();
  }, [fetchData]);

  // --- NARXLARNI AVTOMAT HISOBLASH MANTIQI ---
  const getCostInUZS = (price, currency, rate) => {
      const numPrice = Number(price) || 0;
      const numRate = Number(rate) || 12500;
      return currency === 'USD' ? numPrice * numRate : numPrice;
  };

  const handlePriceChange = (val) => {
      setInputPrice(val);
      const costUZS = getCostInUZS(val, inputCurrency, currencyRate);
      if (inputMarkup && val) {
          const sale = costUZS + (costUZS * (Number(inputMarkup) / 100));
          setInputSalePrice(Math.round(sale));
      }
  };

  const handleMarkupChange = (val) => {
      setInputMarkup(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, currencyRate);
      if (inputPrice && val) {
          const sale = costUZS + (costUZS * (Number(val) / 100));
          setInputSalePrice(Math.round(sale));
      } else if (!val) {
          setInputSalePrice('');
      }
  };

  const handleSalePriceChange = (val) => {
      setInputSalePrice(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, currencyRate);
      if (inputPrice && val && costUZS > 0) {
          const markup = ((Number(val) - costUZS) / costUZS) * 100;
          setInputMarkup(markup.toFixed(2));
      } else if (!val) {
          setInputMarkup('');
      }
  };

  const handleCurrencyChange = (val) => {
      setInputCurrency(val);
      const costUZS = getCostInUZS(inputPrice, val, currencyRate);
      if (inputPrice && inputMarkup) {
          const sale = costUZS + (costUZS * (Number(inputMarkup) / 100));
          setInputSalePrice(Math.round(sale));
      }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name || ''); 
    setInputPrice(prod.buyPrice || '');
    setInputCurrency(prod.buyCurrency || 'UZS'); 
    
    const costUZS = getCostInUZS(prod.buyPrice, prod.buyCurrency || 'UZS', currencyRate);

    if (costUZS > 0 && prod.salePrice) {
        setInputSalePrice(prod.salePrice);
        const markup = ((prod.salePrice - costUZS) / costUZS) * 100;
        setInputMarkup(markup.toFixed(2));
    } else {
        setInputSalePrice('');
        setInputMarkup('');
    }
  };

  // --- QO'SHISH VA O'CHIRISH ---
  const handleAddItem = () => {
    let productToAdd = selectedProduct;
    if (!productToAdd && searchTerm) {
        const cleanSearch = searchTerm.trim().toLowerCase();
        productToAdd = allProducts.find(p => 
            (p.name || '').toLowerCase() === cleanSearch || String(p.customId || '') === cleanSearch
        );
    }
    
    if (!productToAdd) return toast.error("Bazada topilmadi! To'g'ri tanlang.");
    if (invoiceItems.some(item => item.id === productToAdd.id)) {
        return toast.error("Bu tovar allaqachon qo'shilgan!");
    }

    const qty = Number(inputCount);
    const price = Number(inputPrice);
    const sale = Number(inputSalePrice);

    if (!qty || qty <= 0) return toast.error("Sonini to'g'ri kiriting!");
    if (!price || price <= 0) return toast.error("Kirim narxini to'g'ri kiriting!");
    if (sale <= 0) return toast.error("Sotuv narxini to'g'ri kiriting!");
    
    if (productToAdd.unit === 'Dona' && !Number.isInteger(qty)) {
        return toast.error("Dona o'lchov birligi uchun miqdor butun son bo'lishi shart!");
    }

    const newItem = {
        id: productToAdd.id,
        customId: productToAdd.customId,
        name: productToAdd.name,
        unit: productToAdd.unit || 'Dona',
        count: qty,
        price: price,
        markup: Number(inputMarkup) || 0,
        salePrice: sale, 
        currency: inputCurrency,
        total: qty * price
    };

    setInvoiceItems(prev => [...prev, newItem]);
    
    // Tozalash
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputMarkup('');
    setInputSalePrice('');
  };

  const removeFromInvoice = (id) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  // --- HISOBLASH VA QIDIRUV ---
  const { grandTotalUZS } = useMemo(() => {
    let totalUZS = 0; let totalUSD = 0;
    invoiceItems.forEach(item => {
        if (item.currency === 'USD') totalUSD += (Number(item.total) || 0);
        else totalUZS += (Number(item.total) || 0);
    });
    const rate = Number(currencyRate) || 12500;
    return { grandTotalUZS: totalUZS + (totalUSD * rate) };
  }, [invoiceItems, currencyRate]);

  const filteredProducts = useMemo(() => {
      if (!searchTerm) return [];
      const cleanSearch = searchTerm.trim().toLowerCase();
      return allProducts.filter(p => 
          (p.name || '').toLowerCase().includes(cleanSearch) || 
          (p.customId != null && p.customId.toString().includes(cleanSearch))
      );
  }, [allProducts, searchTerm]);

  // --- SAQLASH (Baza bilan ulanish) ---
  const handleSave = async () => {
    const cleanSupplier = supplierName.trim();
    if (!cleanSupplier) return toast.error("Ta'minotchi nomini tanlang!");
    if (invoiceItems.length === 0) return toast.error("Fakturaga tovar qo'shing!");
    if (!Number(currencyRate) || Number(currencyRate) <= 0) return toast.error("Valyuta kursini to'g'ri kiriting!");

    setIsSubmitting(true);

    try {
      const payload = {
        supplierName: cleanSupplier,
        invoiceNumber: invoiceNumber.trim() || Date.now().toString().slice(-6),
        exchangeRate: Number(currencyRate),
        totalSum: grandTotalUZS,
        status: "Jarayonda", 
        userName: currentUserName,
        items: invoiceItems.map(item => ({
            productId: item.id,
            // 🚨 BAZA UCHUN HIMOYA: customId albatta raqam bo'lishi kerak. Yo'q bo'lsa 0
            customId: Number(item.customId) || 0,
            name: item.name,
            count: Number(item.count),
            price: Number(item.price),
            markup: Number(item.markup) || 0,
            salePrice: Number(item.salePrice) || 0, 
            currency: item.currency || 'UZS', 
            total: Number(item.total)
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
          navigate('/ombor/taminotchi-kirim'); 
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
      
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
            <button disabled={isSubmitting} onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors disabled:opacity-50">
                <ArrowLeft size={20}/>
            </button>
            <h1 className="text-xl font-black text-slate-800">Yangi Kirim (Faktura)</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
         {/* TEPADAGI ASOSIY FORMALAR */}
         <div className="lg:col-span-8 space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Asosiy ma'lumotlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Faktura Raqami</label>
                        <input type="number" disabled={isSubmitting} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} placeholder="123456" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ta'minotchi <span className="text-red-500">*</span></label>
                        <select 
                            disabled={isSubmitting}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                        >
                            <option value="" disabled>Tanlang...</option>
                            {suppliersList.map((s, i) => <option key={s.id || i} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Valyuta kursi (1 USD)</label>
                        <input type="number" disabled={isSubmitting} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={currencyRate} onChange={(e)=>setCurrencyRate(e.target.value)} />
                    </div>
                </div>
             </div>

             {/* TOVAR QO'SHISH (FOIZ VA NARXLASH) */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Tovarni tanlash va Narxlash</h3>
                
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                        <div className="flex-1 relative min-w-[200px]">
                            <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Tovar nomi / Kod</label>
                            <input 
                                type="text" disabled={isSubmitting} 
                                className="w-full p-3 border rounded-xl outline-blue-500 font-bold text-sm disabled:bg-gray-50" 
                                placeholder="Qidirish..." 
                                value={searchTerm} 
                                onChange={e => { setSearchTerm(e.target.value); setSelectedProduct(null); }} 
                            />
                            {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredProducts.map(p => (
                                        <li key={p.id} onClick={() => handleSelectProduct(p)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b transition-colors">
                                            <div className="font-bold text-gray-800">{p.name}</div>
                                            <div className="text-blue-600 font-mono font-bold text-xs mt-1">ID: #{p.customId ?? '-'} | Narx: {p.buyPrice} {p.buyCurrency}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div className="w-24">
                            <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Soni</label>
                            <input type="number" min="0" disabled={isSubmitting} className="w-full p-3 border rounded-xl outline-blue-500 text-center font-bold text-sm disabled:bg-gray-50" value={inputCount} onChange={e => setInputCount(e.target.value)} />
                        </div>

                        <div className="w-28">
                            <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Valyuta</label>
                            <select disabled={isSubmitting} className="w-full p-3 border rounded-xl outline-blue-500 text-sm font-bold bg-white disabled:bg-gray-50 cursor-pointer" value={inputCurrency} onChange={e=>handleCurrencyChange(e.target.value)}>
                                <option value="UZS">UZS</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>

                        <div className="w-36">
                            <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Kirim Narx</label>
                            <input type="number" min="0" disabled={isSubmitting} className="w-full p-3 border rounded-xl outline-blue-500 font-bold text-sm disabled:bg-gray-50" value={inputPrice} onChange={e => handlePriceChange(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                        <div className="w-28">
                            <label className="text-[11px] font-bold text-amber-600 uppercase mb-1 block">Ustama (%)</label>
                            <input type="number" disabled={isSubmitting} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-xl outline-amber-500 font-bold text-amber-700 text-sm text-center disabled:opacity-50" placeholder="10" value={inputMarkup} onChange={e => handleMarkupChange(e.target.value)} />
                        </div>

                        <div className="flex-1">
                            <label className="text-[11px] font-bold text-emerald-600 uppercase mb-1 block">Sotuv Narx <span className="text-gray-400 font-normal">(UZS)</span></label>
                            <input type="number" disabled={isSubmitting} className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl outline-emerald-500 font-bold text-emerald-700 text-sm disabled:opacity-50" placeholder="Avtomat hisoblanadi" value={inputSalePrice} onChange={e => handleSalePriceChange(e.target.value)} />
                        </div>

                        <div className="w-40">
                            <button disabled={isSubmitting} onClick={handleAddItem} className="w-full h-[46px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center shadow-md font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={20}/> Qo'shish
                            </button>
                        </div>
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
                <div className="text-3xl font-black text-emerald-500 relative z-10 truncate" title={`${grandTotalUZS.toLocaleString()} UZS`}>
                    {grandTotalUZS.toLocaleString()} <span className="text-base text-emerald-600/50 font-bold ml-1">UZS</span>
                </div>
            </div>
         </div>
      </div>

      {/* --- FAKTURA JADVALI --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col overflow-hidden">
         <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <Package size={18} className="text-blue-500"/> Qo'shilgan tovarlar ro'yxati
             </h3>
         </div>

         <div className="flex flex-col h-full flex-1 p-6 animate-in fade-in duration-300">
            {invoiceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                    <Package size={64} className="mb-4 opacity-20"/>
                    <p className="font-bold text-lg text-slate-500 mb-1">Faktura hozircha bo'sh</p>
                    <p className="text-sm font-medium">Yuqoridagi formadan mahsulot qo'shing</p>
                </div>
            ) : (
                <div className="overflow-auto border border-slate-200 rounded-2xl custom-scrollbar max-h-[500px]">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 border-b border-slate-200">ID</th>
                                <th className="p-4 border-b border-slate-200">Nomi</th>
                                <th className="p-4 w-24 text-center border-b border-slate-200">Soni</th>
                                <th className="p-4 w-32 text-right border-b border-slate-200">Kirim Narx</th>
                                <th className="p-4 w-24 text-center border-b border-slate-200">Valyuta</th>
                                <th className="p-4 w-24 text-center text-amber-600 border-b border-slate-200">Ustama %</th>
                                <th className="p-4 w-36 text-right text-emerald-600 border-b border-slate-200">Sotuv (UZS)</th>
                                <th className="p-4 w-32 text-right border-b border-slate-200">Jami Kirim</th>
                                <th className="p-4 w-16 border-b border-slate-200"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-bold">
                            {invoiceItems.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                    <td className="p-4 text-slate-800">{item.name}</td>
                                    <td className="p-4 text-center text-blue-600">{item.count} {item.unit}</td>
                                    <td className="p-4 text-right">{item.price.toLocaleString()}</td>
                                    <td className="p-4 text-center text-slate-400">{item.currency}</td>
                                    <td className="p-4 text-center text-amber-600">{item.markup}%</td>
                                    <td className="p-4 text-right text-emerald-600">{item.salePrice.toLocaleString()}</td>
                                    <td className="p-4 text-right font-black text-slate-800">
                                        {(Number(item.total) || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button disabled={isSubmitting} onClick={() => removeFromInvoice(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50" title="O'chirish">
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
      </div>
    </div>
  );
};

export default SupplierIncome;
