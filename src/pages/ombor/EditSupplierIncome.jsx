import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle, Loader2, DollarSign, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const EditSupplierIncome = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase()
 || 'admin';
  const token = sessionStorage.getItem('token');
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';
  
  // --- STATES ---
  const [date, setDate] = useState('');
  const [supplierName, setSupplierName] = useState(''); 
  const [invoiceNumber, setInvoiceNumber] = useState(''); 
  const [exchangeRate, setExchangeRate] = useState('12500'); 
  const [status, setStatus] = useState('Jarayonda');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // INPUT STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState(''); 
  const [inputMarkup, setInputMarkup] = useState(''); 
  const [inputSalePrice, setInputSalePrice] = useState(''); 
  const [inputCurrency, setInputCurrency] = useState('UZS');
  const [activeTab, setActiveTab] = useState('invoice');

  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- 1. MA'LUMOTLARNI YUKLASH ---
  const fetchData = useCallback(async (signal = undefined) => {
      if (!token) return;
      try {
          setLoading(true);
          const [prodRes, suppRes, invRes] = await Promise.allSettled([
              fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
              fetch(`${API_URL}/api/suppliers`, { headers: getAuthHeaders(), signal }),
              fetch(`${API_URL}/api/invoices`, { headers: getAuthHeaders(), signal })
          ]);

          // Mahsulotlar
          if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
              const data = await parseJsonSafe(prodRes.value);
              if (Array.isArray(data)) setAllProducts(data);
          }

          // Ta'minotchilar
          if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
              const data = await parseJsonSafe(suppRes.value);
              if (Array.isArray(data)) setSuppliersList(data);
          } else {
             const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || "[]");
             setSuppliersList(savedSuppliers);
          }

          // Tahrirlanayotgan Faktura
          if (invRes.status === 'fulfilled' && invRes.value.ok) {
              const data = await parseJsonSafe(invRes.value);
              if (Array.isArray(data)) {
                  const invoiceToEdit = data.find(inv => inv.id === Number(id));
                  if (invoiceToEdit) {
                      setDate(new Date(invoiceToEdit.date || invoiceToEdit.createdAt).toISOString().split('T')[0]);
                      setSupplierName(invoiceToEdit.supplierName || invoiceToEdit.supplier || '');
                      setInvoiceNumber(invoiceToEdit.invoiceNumber || '');
                      setExchangeRate(invoiceToEdit.exchangeRate || '12500');
                      setStatus(invoiceToEdit.status || 'Jarayonda');

                      const formattedItems = (invoiceToEdit.items || []).map(item => ({
                          id: item.productId || item.id, // Baza ulanishiga qarab
                          customId: item.customId,
                          name: item.name,
                          unit: item.unit || 'Dona', // Agar bazada bo'lmasa fallback
                          count: Number(item.count) || 0,
                          price: Number(item.price) || 0,
                          salePrice: Number(item.salePrice) || 0,
                          currency: item.currency || 'UZS',
                          markup: Number(item.markup || 0),
                          total: Number(item.total) || 0
                      }));
                      setSelectedItems(formattedItems);
                  } else {
                      toast.error("Faktura topilmadi!");
                      navigate(-1);
                  }
              }
          }
      } catch (error) {
          console.error("Yuklashda xato", error);
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [id, token, getAuthHeaders, navigate]);

  useEffect(() => {
      const controller = new AbortController();
      fetchData(controller.signal);
      return () => controller.abort();
  }, [fetchData]);

  // --- NARXLARNI HISOBLASH ---
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
    if (selectedItems.some(item => item.id === productToAdd.id)) {
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

  // --- HISOBLASH VA QIDIRUV ---
  const { grandTotalUZS } = useMemo(() => {
    let totalUZS = 0; let totalUSD = 0;
    selectedItems.forEach(item => {
        if (item.currency === 'USD') totalUSD += (Number(item.total) || 0);
        else totalUZS += (Number(item.total) || 0);
    });
    const rate = Number(exchangeRate) || 12500;
    return { grandTotalUZS: totalUZS + (totalUSD * rate) };
  }, [selectedItems, exchangeRate]);

  const filteredProducts = useMemo(() => {
      if (!searchTerm) return [];
      const cleanSearch = searchTerm.trim().toLowerCase();
      return allProducts.filter(p => 
          (p.name || '').toLowerCase().includes(cleanSearch) || 
          (p.customId != null && p.customId.toString().includes(cleanSearch))
      );
  }, [allProducts, searchTerm]);

  // --- SAQLASH (Baza bilan ulanish) ---
  const handlePreSave = () => {
    const cleanSupplier = supplierName.trim();
    if (!cleanSupplier) return toast.error("Ta'minotchi nomini tanlang!");
    if (selectedItems.length === 0) return toast.error("Fakturaga tovar qo'shing!");
    if (!Number(exchangeRate) || Number(exchangeRate) <= 0) return toast.error("Valyuta kursini to'g'ri kiriting!");

    const invalidItem = selectedItems.find(item => {
        const qty = Number(item.count);
        const price = Number(item.price);
        if (Number.isNaN(qty) || qty <= 0) return true;
        if (Number.isNaN(price) || price < 0) return true;
        if (item.unit === 'Dona' && !Number.isInteger(qty)) return true;
        return false;
    });

    if (invalidItem) {
        return toast.error(`Xato: ${invalidItem.name} uchun miqdor yoki narx noto'g'ri!`);
    }

    setShowConfirmModal(true);
  };

  const handleSaveInvoice = async () => {
    setIsSubmitting(true);
    try {
        const payload = {
            date: date, 
            supplier: supplierName.trim(), // API aynan "supplier" kutadi, garchi stateni name deb atagan bo'lsak ham
            invoiceNumber: invoiceNumber.trim(),
            exchangeRate: Number(exchangeRate) || 12500,
            totalSum: grandTotalUZS,
            status: status, // Tahrirlanayotganda eski status qoladi
            userName: currentUserName,
            
            items: selectedItems.map(item => ({
                id: item.id, // Yoki productId backend kutishiga qarab
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

        const res = await fetch(`${API_URL}/api/invoices/${id}`, {
            method: 'PUT',
            headers: getJsonAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
            toast.success("Faktura muvaffaqiyatli yangilandi!");
            navigate('/ombor/taminotchi-kirim'); 
        } else {
            toast.error(data?.error || `Yangilashda xatolik yuz berdi (${res.status})`);
        }
    } catch (err) {
        toast.error("Server bilan aloqa yo'q!");
    } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false); 
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-amber-500" size={48}/>
          </div>
      );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button disabled={isSubmitting} onClick={() => navigate(-1)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-black text-amber-600 tracking-tight">Fakturani Tahrirlash</h1>
            </div>
            <button disabled={isSubmitting || selectedItems.length === 0} onClick={handlePreSave} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-200 flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} O'zgarishlarni Saqlash
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`space-y-6 ${userRole === 'director' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                
                {/* ASOSIY MA'LUMOTLAR */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Asosiy ma'lumotlar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="date" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-amber-500 font-medium disabled:bg-gray-50" value={date} onChange={e=>setDate(e.target.value)}/>
                        <input type="text" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-amber-500 font-mono font-bold text-slate-700 disabled:bg-gray-50" placeholder="Faktura №" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
                        
                        <select 
                            disabled={isSubmitting}
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                        >
                            <option value="" disabled>Tanlang...</option>
                            {suppliersList.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                            {/* Agar eski nom o'zgarib ketgan bo'lsa yoki bazada yo'q bo'lsa yo'qolib qolmasligi uchun */}
                            {supplierName && !suppliersList.find(s => s.name === supplierName) && <option value={supplierName}>{supplierName}</option>}
                        </select>
                        
                        <input type="number" disabled={isSubmitting} className="w-full p-3 border rounded-lg border-amber-300 bg-amber-50 outline-amber-500 font-bold text-amber-700 disabled:opacity-70" placeholder="1 USD kursi" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)}/>
                    </div>
                </div>

                {/* TOVAR TANLASH VA NARXLASH */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Tovarni tanlash va Narxlash</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                            <div className="flex-1 relative min-w-[200px]">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Tovar nomi / Kod</label>
                                <input 
                                    type="text" disabled={isSubmitting} 
                                    className="w-full p-3 border rounded-lg outline-amber-500 font-bold text-sm disabled:bg-gray-50" 
                                    placeholder="Qidirish..." 
                                    value={searchTerm} 
                                    onChange={e => { setSearchTerm(e.target.value); setSelectedProduct(null); }} 
                                />
                                {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredProducts.map(p => (
                                            <li key={p.id} onClick={() => handleSelectProduct(p)} className="p-3 hover:bg-amber-50 cursor-pointer text-sm border-b transition-colors">
                                                <div className="font-bold text-gray-800">{p.name}</div>
                                                <div className="text-amber-600 font-mono font-bold text-xs mt-1">ID: #{p.customId ?? '-'} | Narx: {p.buyPrice} {p.buyCurrency}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="w-24">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Soni</label>
                                <input type="number" min="0" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-amber-500 text-center font-bold text-sm disabled:bg-gray-50" value={inputCount} onChange={e => setInputCount(e.target.value)} />
                            </div>

                            <div className="w-28">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Valyuta</label>
                                <select disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-amber-500 text-sm font-bold bg-white disabled:bg-gray-50 cursor-pointer" value={inputCurrency} onChange={e=>handleCurrencyChange(e.target.value)}>
                                    <option value="UZS">UZS</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div className="w-36">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Kirim Narx</label>
                                <input type="number" min="0" disabled={isSubmitting} className="w-full p-3 border rounded-lg outline-amber-500 font-bold text-sm disabled:bg-gray-50" value={inputPrice} onChange={e => handlePriceChange(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-2">
                            <div className="w-28">
                                <label className="text-[11px] font-bold text-amber-600 uppercase mb-1 block">Ustama (%)</label>
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border border-amber-200 bg-white rounded-lg outline-amber-500 font-bold text-amber-700 text-sm text-center disabled:opacity-50" placeholder="10" value={inputMarkup} onChange={e => handleMarkupChange(e.target.value)} />
                            </div>

                            <div className="flex-1">
                                <label className="text-[11px] font-bold text-emerald-600 uppercase mb-1 block">Sotuv Narx <span className="text-gray-400 font-normal">(UZS)</span></label>
                                <input type="number" disabled={isSubmitting} className="w-full p-3 border border-emerald-200 bg-white rounded-lg outline-emerald-500 font-bold text-emerald-700 text-sm disabled:opacity-50" placeholder="Avtomat hisoblanadi" value={inputSalePrice} onChange={e => handleSalePriceChange(e.target.value)} />
                            </div>

                            <div className="w-40">
                                <button disabled={isSubmitting} onClick={handleAddItem} className="w-full h-[46px] bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 transition-all flex justify-center items-center shadow-md font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus size={20}/> Qo'shish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {userRole === 'director' && (
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] opacity-5"><Package size={140}/></div>
                        <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Faktura pozitsiyalari</div>
                        <div className="text-4xl font-black text-blue-600 relative z-10">{selectedItems.length} <span className="text-base text-slate-400 font-bold ml-1">xil tovar</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] opacity-5"><DollarSign size={140}/></div>
                        <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Jami Summasi</div>
                        <div className="text-3xl lg:text-4xl font-black text-emerald-500 relative z-10 truncate" title={`${grandTotalUZS.toLocaleString()} UZS`}>
                            {grandTotalUZS.toLocaleString()} <span className="text-base text-emerald-600/50 font-bold ml-1">UZS</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* JADVAL QISMI */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[300px] flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button disabled={isSubmitting} onClick={() => setActiveTab('invoice')} className={`flex-1 py-4 font-black text-sm transition-all relative disabled:opacity-50 ${activeTab === 'invoice' ? 'border-b-2 border-amber-600 text-amber-600 bg-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                    Faktura tovarlari 
                    {selectedItems.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{selectedItems.length}</span>}
                </button>
                <button disabled={isSubmitting} onClick={() => setActiveTab('products')} className={`flex-1 py-4 font-black text-sm transition-all disabled:opacity-50 ${activeTab === 'products' ? 'border-b-2 border-amber-600 text-amber-600 bg-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                    Qidiruv (Katalog)
                </button>
            </div>

            {activeTab === 'products' && (
                <div className="flex flex-col h-full flex-1 p-6 bg-white animate-in fade-in duration-300">
                    <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl custom-scrollbar max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 border-b border-slate-100">ID</th>
                                    <th className="p-4 border-b border-slate-100">Nomi</th>
                                    <th className="p-4 text-center border-b border-slate-100">Joriy Qoldiq</th>
                                    {userRole === 'director' && <th className="p-4 text-right border-b border-slate-100">Asl Narxi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-bold">
                                {filteredProducts.length === 0 ? (
                                    <tr><td colSpan={userRole === 'director' ? "4" : "3"} className="p-10 text-center text-slate-400">Hech qanday tovar topilmadi</td></tr>
                                ) : (
                                    filteredProducts.map(item => (
                                        <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                            <td className="p-4 text-slate-700">{item.name}</td>
                                            <td className="p-4 text-center text-blue-600">{Number(item.quantity || 0)} {item.unit}</td>
                                            {userRole === 'director' && <td className="p-4 text-right font-medium text-slate-600">{Number(item.buyPrice || 0).toLocaleString()} <span className="text-[10px] text-slate-400">{item.buyCurrency}</span></td>}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoice' && (
                <div className="flex flex-col h-full flex-1 p-6 bg-slate-50/50 animate-in fade-in duration-300">
                    {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                            <Package size={48} className="mb-3 text-slate-300"/>
                            <p className="font-medium text-sm text-center">Faktura bo'sh. Yuqoridagi formadan mahsulot qo'shing.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200 bg-white rounded-2xl custom-scrollbar max-h-[500px]">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4 min-w-[150px]">Nomi</th>
                                        <th className="p-4 w-24 text-center">Soni</th>
                                        <th className="p-4 w-32 text-right">Kirim Narx</th>
                                        <th className="p-4 w-24 text-center">Valyuta</th>
                                        <th className="p-4 w-24 text-center text-amber-600">Ustama %</th>
                                        <th className="p-4 w-36 text-right text-emerald-600">Sotuv (UZS)</th>
                                        {userRole === 'director' && <th className="p-4 w-32 text-right">Jami Kirim</th>}
                                        <th className="p-4 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                    {selectedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                            <td className="p-4">{item.name}</td>
                                            <td className="p-2">
                                                <input type="number" disabled={isSubmitting} step={item.unit === 'Dona' ? '1' : '0.01'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-blue-600 outline-none focus:bg-white focus:border-amber-500 disabled:opacity-50" value={item.count} onChange={(e) => updateItem(item.id, 'count', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" disabled={isSubmitting} step="0.01" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-black outline-none focus:bg-white focus:border-amber-500 disabled:opacity-50" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <select disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-amber-500 text-xs font-bold disabled:opacity-50 disabled:bg-gray-50" value={item.currency} onChange={(e) => updateItem(item.id, 'currency', e.target.value)}>
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input type="number" disabled={isSubmitting} className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg text-center outline-none focus:bg-white focus:border-amber-500 text-amber-700 disabled:opacity-50" value={item.markup || ''} onChange={(e) => updateItem(item.id, 'markup', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" disabled={isSubmitting} className="w-full p-2.5 border border-emerald-200 bg-emerald-50 rounded-lg text-right outline-none focus:bg-white focus:border-emerald-500 text-emerald-700 disabled:opacity-50" value={item.salePrice} onChange={(e) => updateItem(item.id, 'salePrice', e.target.value)} />
                                            </td>
                                            {userRole === 'director' && <td className="p-4 text-right font-black text-slate-800">{(Number(item.total) || 0).toLocaleString()}</td>}
                                            <td className="p-4 text-center">
                                                <button disabled={isSubmitting} onClick={() => handleRemoveItem(index)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50">
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
            )}
        </div>

        {/* TASDIQLASH MODALI */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-inner">
                        <CheckCircle size={40} strokeWidth={2.5}/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Fakturani yangilaysizmi?</h3>
                    <p className="text-center text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                        O'zgarishlar saqlanadi. (Ombor qoldig'i direktor tasdiqlagandan so'ng o'zgaradi).
                    </p>
                    <div className="flex gap-3">
                        <button disabled={isSubmitting} onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50">Orqaga</button>
                        <button disabled={isSubmitting} onClick={handleSaveInvoice} className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-700 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase text-xs tracking-widest disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : "Saqlash"}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default EditSupplierIncome;
