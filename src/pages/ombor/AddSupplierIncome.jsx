import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle, Loader2, DollarSign, Package } from 'lucide-react';
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

const AddSupplierIncome = () => {
  const navigate = useNavigate();
  
  const userRole = sessionStorage.getItem('userRole') || 'admin';
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';
  const token = sessionStorage.getItem('token');
  
  const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`;

  // --- STATES ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState(''); 
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber()); 
  const [exchangeRate, setExchangeRate] = useState(sessionStorage.getItem('globalExchangeRate') || '12500'); 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // INPUT STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState(''); 
  const [inputMarkup, setInputMarkup] = useState(''); 
  const [inputSalePrice, setInputSalePrice] = useState(''); 
  const [inputCurrency, setInputCurrency] = useState('UZS');

  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  const fetchProducts = useCallback(async (signal) => {
      if (!token) {
          toast.error("Tizimga kirish tokeni topilmadi!");
          setLoading(false);
          return;
      }
      try {
          setLoading(true);
          const res = await fetch(`${API_URL}/api/products`, { 
              headers: getAuthHeaders(),
              signal
          });
          
          if (res.ok) {
              const data = await parseJsonSafe(res);
              if (Array.isArray(data)) setProducts(data);
              else toast.error("Mahsulotlar formati noto'g'ri keldi");
          } else {
              toast.error(`Mahsulotlarni yuklab bo'lmadi (${res.status})`);
          }
      } catch (err) {
          if (err.name !== 'AbortError') toast.error("Server bilan aloqa yo'q!");
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchProducts(controller.signal);
      
      try {
          const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || "[]");
          if(Array.isArray(savedSuppliers)) setSuppliersList(savedSuppliers);
      } catch (e) {
          setSuppliersList([]);
      }
      return () => controller.abort();
  }, [fetchProducts]);

  const getCostInUZS = (price, currency, rate) => {
      const numPrice = Number(price) || 0;
      const numRate = Number(rate) || 12500;
      return currency === 'USD' ? numPrice * numRate : numPrice;
  };

  const handlePriceChange = (val) => {
      setInputPrice(val);
      const costUZS = getCostInUZS(val, inputCurrency, exchangeRate);
      if (inputMarkup && val) {
          const sale = costUZS + (costUZS * (Number(inputMarkup) / 100));
          setInputSalePrice(Math.round(sale));
      }
  };

  const handleMarkupChange = (val) => {
      setInputMarkup(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);
      if (inputPrice && val) {
          const sale = costUZS + (costUZS * (Number(val) / 100));
          setInputSalePrice(Math.round(sale));
      } else if (!val) {
          setInputSalePrice('');
      }
  };

  const handleSalePriceChange = (val) => {
      setInputSalePrice(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);
      if (inputPrice && val && costUZS > 0) {
          const markup = ((Number(val) - costUZS) / costUZS) * 100;
          setInputMarkup(markup.toFixed(2));
      } else if (!val) {
          setInputMarkup('');
      }
  };

  const handleCurrencyChange = (val) => {
      setInputCurrency(val);
      const costUZS = getCostInUZS(inputPrice, val, exchangeRate);
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
    
    const costUZS = getCostInUZS(prod.buyPrice, prod.buyCurrency || 'UZS', exchangeRate);

    if (costUZS > 0 && prod.salePrice) {
        setInputSalePrice(prod.salePrice);
        const markup = ((prod.salePrice - costUZS) / costUZS) * 100;
        setInputMarkup(markup.toFixed(2));
    } else {
        setInputSalePrice('');
        setInputMarkup('');
    }
  };

  const handleAddItem = () => {
    let productToAdd = selectedProduct;
    
    if (!productToAdd && searchTerm) {
        const cleanSearch = searchTerm.trim().toLowerCase();
        productToAdd = products.find(p => 
            (p.name || '').toLowerCase() === cleanSearch || 
            String(p.customId || '') === cleanSearch
        );
    }
    
    if (!productToAdd) return toast.error("Bazada topilmadi! To'g'ri tanlang.");
    
    if (selectedItems.some(item => item.id === productToAdd.id)) {
        return toast.error("Bu tovar allaqachon fakturaga qo'shilgan!");
    }

    const qty = Number(inputCount);
    const price = Number(inputPrice);
    const sale = Number(inputSalePrice);

    if (!qty || qty <= 0) return toast.error("Sonini to'g'ri kiriting!");
    if (!price || price <= 0) return toast.error("Kirim narxini to'g'ri kiriting!");
    if (sale < 0) return toast.error("Sotuv narxi manfiy bo'lishi mumkin emas!");
    
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

    setSelectedItems(prev => [...prev, newItem]);
    
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputMarkup('');
    setInputSalePrice('');
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        const currentCurrency = field === 'currency' ? value : updatedItem.currency;
        const currentPrice = field === 'price' ? Number(value) || 0 : Number(updatedItem.price) || 0;
        const currentCount = field === 'count' ? Number(value) || 0 : Number(updatedItem.count) || 0;
        
        const costUZS = getCostInUZS(currentPrice, currentCurrency, exchangeRate);

        if (field === 'price' || field === 'currency' || field === 'count') {
            updatedItem.total = currentCount * currentPrice;
            if (updatedItem.markup) {
                updatedItem.salePrice = Math.round(costUZS + (costUZS * (Number(updatedItem.markup) / 100)));
            }
        }
        if (field === 'markup') {
            updatedItem.salePrice = Math.round(costUZS + (costUZS * ((Number(value) || 0) / 100)));
        }
        if (field === 'salePrice') {
            if (costUZS > 0) {
                updatedItem.markup = Number(((((Number(value) || 0) - costUZS) / costUZS) * 100).toFixed(2));
            }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(prev => {
        const newArr = [...prev];
        newArr.splice(index, 1);
        return newArr;
    });
  };

  const { grandTotalUZS } = useMemo(() => {
    let totalUZS = 0; let totalUSD = 0;
    selectedItems.forEach(item => {
        if (item.currency === 'USD') totalUSD += (Number(item.total) || 0);
        else totalUZS += (Number(item.total) || 0);
    });
    const rate = Number(exchangeRate) || 12500;
    return { 
        grandTotalUZS: totalUZS + (totalUSD * rate)
    };
  }, [selectedItems, exchangeRate]);

  const filteredProducts = useMemo(() => {
      if (!searchTerm) return [];
      const cleanSearch = searchTerm.trim().toLowerCase();
      return products.filter(p => {
          return (p.name || '').toLowerCase().includes(cleanSearch) || 
                 String(p.customId || '').includes(cleanSearch);
      });
  }, [products, searchTerm]);

  const handlePreSave = () => {
    const cleanSupplier = supplierName.trim();
    if (!invoiceNumber.trim() || !cleanSupplier) {
        return toast.error("Ta'minotchi nomi va Faktura raqamini to'ldiring!");
    }
    
    const hasUsdItem = selectedItems.some(i => i.currency === 'USD');
    if (hasUsdItem && (!Number(exchangeRate) || Number(exchangeRate) <= 0)) {
        return toast.error("USD valyutasi uchun kursni to'g'ri kiriting!");
    }

    if (selectedItems.length === 0) return toast.error("Jadvalga tovar qo'shing!");
    
    setShowConfirmModal(true);
  };

  const handleSaveInvoice = async () => {
    setIsSubmitting(true);
    try {
        const finalExchangeRate = Number(exchangeRate) || 12500;

        const payload = {
            supplierName: supplierName.trim(),
            invoiceNumber: invoiceNumber.trim(),
            exchangeRate: finalExchangeRate,
            totalSum: grandTotalUZS,
            status: 'Jarayonda', 
            userName: currentUserName, 
            
            items: selectedItems.map(item => ({
                productId: item.id,
                customId: item.customId != null ? Number(item.customId) : null,
                name: item.name,
                count: Number(item.count) || 0,
                price: Number(item.price) || 0,
                salePrice: Number(item.salePrice) || 0,
                currency: item.currency || 'UZS',
                total: Number(item.total) || 0
            }))
        };

        const res = await fetch(`${API_URL}/api/invoices`, {
            method: 'POST',
            headers: getJsonAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
            toast.success("Faktura muvaffaqiyatli saqlandi!");
            navigate('/ombor/taminotchi-kirim');
        } else {
            toast.error(data?.error || `Fakturani saqlashda xatolik yuz berdi (${res.status})`);
        }
    } catch (err) {
        console.error(err);
        toast.error("Server bilan aloqa yo'q!");
    } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false); 
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button disabled={isSubmitting} onClick={() => navigate(-1)} className="p-2 bg-white rounded-lg border hover:bg-gray-100 disabled:opacity-50 transition-colors"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-bold text-gray-800">Yangi kirim qilish (Batafsil)</h1>
            </div>
            <button disabled={isSubmitting} onClick={handlePreSave} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                Fakturani saqlash
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`space-y-6 ${userRole === 'director' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                
                {/* ASOSIY MA'LUMOTLAR */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                    {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-blue-500"/></div>}
                    
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Asosiy ma'lumotlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="date" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-blue-500 disabled:bg-gray-50" value={date} onChange={e=>setDate(e.target.value)}/>
                        <input type="text" disabled={isSubmitting} className={`w-full p-3 border rounded-lg outline-blue-500 font-bold disabled:bg-gray-50`} placeholder="Faktura №" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
                        
                        {/* 🚨 DIQQAT: MANA SHU QISM SELECT GA O'ZGARTIRILDI 🚨 */}
                        <select 
                            disabled={isSubmitting}
                            className={`w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 transition-all disabled:bg-gray-50 disabled:opacity-50`}
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                        >
                            <option value="">Ta'minotchi tanlang...</option>
                            {suppliersList.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                        {/* -------------------------------------------------------- */}
                        
                        <input type="number" disabled={isSubmitting} className="w-full p-3 border rounded-lg border-blue-300 bg-blue-50 outline-blue-500 disabled:opacity-70" placeholder="1 USD kursi" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)}/>
                    </div>
                </div>

                {/* TOVAR TANLASH VA NARXLASH */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Tovarni tanlash va Narxlash</h3>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                            <div className="flex-1 relative min-w-[200px]">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Tovar nomi / Kod</label>
                                <input 
                                    type="text" disabled={isSubmitting} 
                                    className="w-full p-3 border rounded-lg outline-blue-500 font-bold text-sm disabled:bg-gray-50" 
                                    placeholder="Qidirish..." 
                                    value={searchTerm} 
                                    onChange={e => { setSearchTerm(e.target.value); setSelectedProduct(null); }} 
                                />
                                {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto custom-scrollbar">
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
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-blue-500 text-center font-bold text-sm disabled:bg-gray-50" value={inputCount} onChange={e => setInputCount(e.target.value)} />
                            </div>

                            <div className="w-32">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Valyuta</label>
                                <select disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-blue-500 text-sm font-bold bg-white disabled:bg-gray-50" value={inputCurrency} onChange={e=>handleCurrencyChange(e.target.value)}>
                                    <option value="UZS">UZS</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div className="w-40">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Kirim Narx</label>
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-blue-500 font-bold text-sm disabled:bg-gray-50" value={inputPrice} onChange={e => handlePriceChange(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
                            <div className="w-32">
                                <label className="text-[11px] font-bold text-amber-600 uppercase mb-1 block">Ustama (%)</label>
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border border-amber-200 bg-amber-50 rounded-lg outline-amber-500 font-bold text-amber-700 text-sm text-center disabled:opacity-50" placeholder="Misol: 10" value={inputMarkup} onChange={e => handleMarkupChange(e.target.value)} />
                            </div>

                            <div className="flex-1">
                                <label className="text-[11px] font-bold text-emerald-600 uppercase mb-1 block">Sotuv Narx <span className="text-gray-400 font-normal">(Har doim So'mda)</span></label>
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-lg outline-emerald-500 font-bold text-emerald-700 text-sm disabled:opacity-50" placeholder="Avtomat hisoblanadi" value={inputSalePrice} onChange={e => handleSalePriceChange(e.target.value)} />
                            </div>

                            <div className="w-40">
                                <button disabled={isSubmitting} onClick={handleAddItem} className="w-full h-[46px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center shadow-md font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus size={20}/> Qo'shish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {userRole === 'director' && (
                <div className="lg:col-span-4 grid grid-rows-2 gap-4 h-fit sticky top-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] opacity-5"><Package size={150}/></div>
                        <div className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Pozitsiyalar soni</div>
                        <div className="text-4xl font-black text-blue-600 relative z-10">{selectedItems.length} <span className="text-lg text-gray-400 font-bold ml-1">xil tovar</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] opacity-5"><DollarSign size={150}/></div>
                        <div className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Jami Summasi</div>
                        <div className="text-3xl font-black text-green-600 relative z-10 truncate" title={`${grandTotalUZS.toLocaleString()} UZS`}>
                            {grandTotalUZS.toLocaleString()} <span className="text-lg text-gray-400 font-bold ml-1">UZS</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* JADVAL QISMI */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Package size={18} className="text-blue-500"/> Faktura tovarlari
                </h3>
                {selectedItems.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{selectedItems.length} xil tovar</span>}
            </div>

            <div className="flex flex-col h-full flex-1 p-6 animate-in fade-in">
                {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-10">
                        <Package size={48} className="mb-3 opacity-20"/>
                        <p className="font-medium text-sm">Faktura bo'sh. Yuqoridan mahsulot qo'shing.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border rounded-xl custom-scrollbar max-h-[400px]">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3">Nomi</th>
                                    <th className="p-3 w-24 text-center">Soni</th>
                                    <th className="p-3 w-32">Kirim Narx</th>
                                    <th className="p-3 w-24">Valyuta</th>
                                    <th className="p-3 w-24 text-center text-amber-600">Ustama %</th>
                                    <th className="p-3 w-36 text-emerald-600">Sotuv (UZS)</th>
                                    <th className="p-3 w-32 text-right">Jami Kirim</th>
                                    <th className="p-3 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm font-bold text-slate-700">
                                {selectedItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3">
                                            <div>{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.customId ?? '-'}</div>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} step={item.unit === 'Dona' ? '1' : '0.01'} className="w-full p-2 border rounded-lg text-center outline-blue-500 disabled:bg-gray-50" value={item.count} onChange={(e) => updateItem(item.id, 'count', e.target.value)} />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} step="0.01" className="w-full p-2 border rounded-lg outline-blue-500 disabled:bg-gray-50" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} />
                                        </td>
                                        <td className="p-2">
                                            <select disabled={isSubmitting} className="w-full p-2 border rounded-lg bg-white outline-blue-500 text-xs disabled:bg-gray-50" value={item.currency} onChange={(e) => updateItem(item.id, 'currency', e.target.value)}>
                                                <option value="UZS">UZS</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-center outline-amber-500 text-amber-700 disabled:opacity-50" value={item.markup} onChange={(e) => updateItem(item.id, 'markup', e.target.value)} />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} className="w-full p-2 border border-emerald-200 bg-emerald-50 rounded-lg outline-emerald-500 text-emerald-700 disabled:opacity-50" value={item.salePrice} onChange={(e) => updateItem(item.id, 'salePrice', e.target.value)} />
                                        </td>
                                        <td className="p-3 text-right font-black text-slate-800">
                                            {(Number(item.total) || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button disabled={isSubmitting} onClick={() => handleRemoveItem(index)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50">
                                                <Trash2 size={18}/>
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

        {/* TASDIQLASH MODALI */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner">
                        <CheckCircle size={32} strokeWidth={2.5}/>
                    </div>
                    <h3 className="text-xl font-black text-center text-gray-800 mb-2 tracking-tight">Fakturani saqlaysizmi?</h3>
                    <p className="text-center text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                        Barcha kiritilgan ma'lumotlar, narxlar va ustamalar to'g'riligiga ishonch hosil qiling.
                    </p>
                    <div className="flex gap-3">
                        <button disabled={isSubmitting} onClick={() => setShowConfirmModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">
                            Orqaga
                        </button>
                        <button disabled={isSubmitting} onClick={handleSaveInvoice} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : "Tasdiqlash"}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AddSupplierIncome;
