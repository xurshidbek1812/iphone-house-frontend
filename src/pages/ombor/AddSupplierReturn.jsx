import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, Save, ArrowLeft, CheckCircle, AlertTriangle, PackageX, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

// HELPER: Xavfsiz JSON parsing
const parseJsonSafe = async (response) => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};

const AddSupplierReturn = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [allBatches, setAllBatches] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [invoicesHistory, setInvoicesHistory] = useState([]); 
  
  const [returnItems, setReturnItems] = useState([]);
  const [supplierId, setSupplierId] = useState(''); 
  const [note, setNote] = useState('');
  
  const [currencyRate, setCurrencyRate] = useState(sessionStorage.getItem('globalExchangeRate') || '12500');
  
  // Holatlar
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = sessionStorage.getItem('token');
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // --- MA'LUMOTLARNI YUKLASH (XAVFSIZ) ---
  const fetchData = useCallback(async (signal = undefined) => {
    if (!token) return;

    try {
        setLoading(true);

        // API larni parallel chaqiramiz (Agar sizda supplier va invoice uchun API bo'lsa. Aks holda sessionStorage'dan olamiz)
        const [prodRes, suppRes, invRes] = await Promise.allSettled([
            fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
            fetch(`${API_URL}/api/suppliers`, { headers: getAuthHeaders(), signal }),
            fetch(`${API_URL}/api/invoices`, { headers: getAuthHeaders(), signal })
        ]);

        // TOVARLAR VA PARTIYALARNI YIG'ISH
        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
            const apiData = await parseJsonSafe(prodRes.value);
            if (Array.isArray(apiData)) {
                let extractedBatches = [];
                
                apiData.forEach(prod => {
                    if (prod.batches && prod.batches.length > 0) {
                        prod.batches.forEach(batch => {
                            if (batch.quantity > 0) {
                                extractedBatches.push({
                                    id: prod.id,                 
                                    batchId: batch.id,           
                                    customId: prod.customId,
                                    name: prod.name,
                                    quantity: batch.quantity,    
                                    buyPrice: batch.buyPrice,    
                                    buyCurrency: batch.buyCurrency,
                                    inputQty: 1,
                                    inputPrice: batch.buyPrice,
                                    inputCurrency: batch.buyCurrency || 'USD'
                                });
                            }
                        });
                    } else if (prod.quantity > 0) {
                        extractedBatches.push({
                            id: prod.id,
                            batchId: `old-${prod.id}`,
                            customId: prod.customId,
                            name: prod.name,
                            quantity: prod.quantity,
                            buyPrice: prod.buyPrice,
                            buyCurrency: prod.buyCurrency || 'USD',
                            inputQty: 1,
                            inputPrice: prod.buyPrice,
                            inputCurrency: prod.buyCurrency || 'USD'
                        });
                    }
                });

                setAllBatches(extractedBatches);
            }
        }

        // TA'MINOTCHILAR
        if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
            const data = await parseJsonSafe(suppRes.value);
            if (Array.isArray(data)) setSuppliersList(data);
        } else {
            const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || "[]");
            setSuppliersList(savedSuppliers);
        }

        // FAKTURALAR TARIXI
        if (invRes.status === 'fulfilled' && invRes.value.ok) {
            const data = await parseJsonSafe(invRes.value);
            if (Array.isArray(data)) setInvoicesHistory(data);
        } else {
            const savedInvoices = JSON.parse(sessionStorage.getItem('supplierInvoices') || "[]");
            setInvoicesHistory(savedInvoices);
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Fetch error:", err);
            toast.error("Tarmoq xatosi yuz berdi!");
        }
    } finally {
        if (!signal?.aborted) setLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchData(controller.signal);
      return () => controller.abort();
  }, [fetchData]);

  const handleProductInputChange = (batchId, field, value) => {
    setAllBatches(allBatches.map(b => 
        b.batchId === batchId ? { ...b, [field]: value } : b
    ));
  };

  // --- QAYTARISHGA QO'SHISH ---
  const addToReturn = (batchItem) => {
    if (!supplierId) return toast.error("Iltimos, avval Ta'minotchini tanlang!");

    const quantityToAdd = Number(batchItem.inputQty);
    if (quantityToAdd <= 0) return toast.error("Sonini to'g'ri kiriting!");

    const alreadyInCart = returnItems
        .filter(item => item.batchId === batchItem.batchId)
        .reduce((sum, item) => sum + Number(item.inputQty), 0);

    const totalRequested = alreadyInCart + quantityToAdd;

    if (totalRequested > batchItem.quantity) {
        return toast.error(`Xatolik! Bu narxdagi tovardan omborda faqat ${batchItem.quantity} dona bor.`);
    }

    const newItem = {
      ...batchItem,
      uid: Date.now() + Math.random(),
      inputQty: quantityToAdd,
      inputPrice: Number(batchItem.inputPrice) || 0,
      inputCurrency: batchItem.inputCurrency,
      totalSum: quantityToAdd * (Number(batchItem.inputPrice) || 0)
    };
    
    setReturnItems(prev => [...prev, newItem]);
    toast.success("Ro'yxatga qo'shildi!");
  };

  const updateReturnItem = (uid, field, value) => {
    setReturnItems(prevItems => {
        return prevItems.map(item => {
            if (item.uid === uid) {
                let newValue = Number(value);
                
                if (field === 'inputQty') {
                    const otherRowsQty = prevItems
                        .filter(i => i.batchId === item.batchId && i.uid !== uid)
                        .reduce((sum, i) => sum + Number(i.inputQty), 0);
                    
                    if ((newValue + otherRowsQty) > item.quantity) {
                        toast.error(`Maksimum ruxsat: ${item.quantity} dona!`);
                        newValue = item.quantity - otherRowsQty; 
                        if (newValue < 0) newValue = 0;
                    }
                }

                const updatedItem = { ...item, [field]: field === 'inputCurrency' ? value : newValue };
                updatedItem.totalSum = Number(updatedItem.inputQty) * Number(updatedItem.inputPrice);
                return updatedItem;
            }
            return item;
        });
    });
  };

  const removeFromReturn = (uid) => {
    setReturnItems(prev => prev.filter(item => item.uid !== uid));
  };

  // --- HISOBLASHLAR (Memoized) ---
  const { totalQty, totalUZS, totalUSD } = useMemo(() => {
      let qty = 0; let uzs = 0; let usd = 0;
      returnItems.forEach(item => {
          qty += Number(item.inputQty) || 0;
          if (item.inputCurrency === 'UZS') uzs += (Number(item.totalSum) || 0);
          if (item.inputCurrency === 'USD') usd += (Number(item.totalSum) || 0);
      });
      return { totalQty: qty, totalUZS: uzs, totalUSD: usd };
  }, [returnItems]);

  const handlePreSave = () => {
    if (!supplierId) return toast.error("Iltimos, Ta'minotchini tanlang!");
    if (returnItems.length === 0) return toast.error("Qaytariladigan tovarlarni qo'shmadingiz!");
    if (!Number(currencyRate) || Number(currencyRate) <= 0) return toast.error("Valyuta kursini to'g'ri kiriting!");
    setShowConfirmModal(true);
  };

  // --- HAQIQIY BAZAGA SAQLASH ---
  const executeSave = async () => {
    setIsSubmitting(true);
    try {
        const supplierName = suppliersList.find(s => String(s.id) === String(supplierId))?.name || "Noma'lum";

        // Backend kutayotgan to'g'ri (Contract) format
        const payload = {
            supplierId: supplierId,
            supplierName: supplierName,
            note: note.trim(),
            exchangeRate: Number(currencyRate),
            totalSumUZS: totalUZS,
            totalSumUSD: totalUSD,
            totalSum: totalUZS + (totalUSD * Number(currencyRate)), 
            status: 'Jarayonda',
            userName: currentUserName,
            items: returnItems.map(item => ({
                productId: item.id,
                batchId: String(item.batchId).startsWith('old-') ? null : item.batchId,
                customId: Number(item.customId) || 0,
                name: item.name,
                returnQty: Number(item.inputQty),
                returnPrice: Number(item.inputPrice),
                currency: item.inputCurrency,
                totalSum: Number(item.totalSum)
            }))
        };

        // 🚨 ENDPOINT: Backendda mos route bo'lishi shart (masalan /api/supplier-returns)
        const response = await fetch(`${API_URL}/api/supplier-returns`, {
            method: 'POST',
            headers: getJsonAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await parseJsonSafe(response);

        if (response.ok) {
            toast.success("Qaytarish hujjati muvaffaqiyatli saqlandi!");
            navigate('/ombor/taminotchi-qaytarish');
        } else {
            toast.error(data?.error || `Saqlashda xatolik (${response.status})`);
        }
    } catch (error) {
        toast.error("Server bilan aloqa yo'q!");
    } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
    }
  };

  // --- FILTRLASH MANTIQI (Memoized va Null-safe) ---
  const filteredBatches = useMemo(() => {
      const search = searchTerm.trim().toLowerCase();
      const selectedSupplier = suppliersList.find(s => String(s.id) === String(supplierId));

      return allBatches.filter(batch => {
          const matchesSearch = (batch.name || '').toLowerCase().includes(search) || 
                                String(batch.customId || '').includes(search);
          
          if (!matchesSearch) return false;
          if (!selectedSupplier) return false;

          // Shu ta'minotchi obkegan fakturalarni qidiramiz
          const validInvoices = invoicesHistory.filter(inv => 
              (inv.supplierName || inv.supplier || '') === selectedSupplier.name
          );

          if (validInvoices.length === 0) return false;

          const isFromThisSupplier = validInvoices.some(inv => 
              Array.isArray(inv.items) && inv.items.some(item => 
                  String(item.productId || item.id) === String(batch.id) || 
                  String(item.customId) === String(batch.customId)
              )
          );

          return isFromThisSupplier;
      });
  }, [allBatches, searchTerm, supplierId, suppliersList, invoicesHistory]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
            <button disabled={isSubmitting} onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"><ArrowLeft size={20}/></button>
            <h1 className="text-xl font-black text-slate-800">Tovar qaytarish</h1>
        </div>
        <div className="flex gap-3">
            <button disabled={isSubmitting} onClick={() => navigate(-1)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">Bekor qilish</button>
            <button 
                disabled={isSubmitting || returnItems.length === 0}
                onClick={handlePreSave} 
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Saqlash
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
         {/* ASOSIY FORMALAR */}
         <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
            {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-blue-500"/></div>}
            
            <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ta'minotchi nomi <span className="text-red-500">*</span></label>
                <select 
                    disabled={isSubmitting}
                    className={`w-full p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 transition-all disabled:bg-slate-50 disabled:opacity-50 cursor-pointer ${!supplierId ? 'bg-red-50 border-red-200 ring-2 ring-red-100' : 'bg-white border-slate-200'}`}
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                >
                    <option value="" disabled>Ta'minotchini tanlang...</option>
                    {suppliersList.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Izoh (Sabab)</label>
                    <input type="text" disabled={isSubmitting} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 font-medium" placeholder="Masalan: Sifatsiz chiqdi..." value={note} onChange={(e)=>setNote(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bugungi Kurs (1 USD)</label>
                    <input type="number" disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 text-slate-800 font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={currencyRate} onChange={(e)=>setCurrencyRate(e.target.value)} />
                </div>
            </div>
         </div>

         {/* STATISTIKA */}
         <div className="lg:col-span-4 grid grid-rows-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-5"><PackageX size={120}/></div>
                <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Qaytarilayotgan Tovar</div>
                <div className="text-4xl font-black text-rose-500 relative z-10">{totalQty} <span className="text-base text-slate-400 font-bold ml-1">dona</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-5"><DollarSign size={120}/></div>
                <div className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Qaytarish Summasi</div>
                <div className="flex flex-col relative z-10">
                    <div className="text-2xl font-black text-emerald-500 truncate" title={`${totalUZS.toLocaleString()} UZS`}>{totalUZS.toLocaleString()} <span className="text-xs text-slate-400 font-bold">UZS</span></div>
                    {totalUSD > 0 && <div className="text-xl font-black text-blue-500 truncate mt-1" title={`${totalUSD.toLocaleString()} USD`}>{totalUSD.toLocaleString()} <span className="text-xs text-slate-400 font-bold">USD</span></div>}
                </div>
            </div>
         </div>
      </div>

      {/* TABLAR VA JADVALLAR */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
                disabled={isSubmitting}
                onClick={() => setActiveTab('products')} 
                className={`flex-1 py-4 font-black text-sm transition-all disabled:opacity-50 ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                Mavjud mahsulotlar
            </button>
            <button 
                disabled={isSubmitting}
                onClick={() => setActiveTab('invoice')} 
                className={`flex-1 py-4 font-black text-sm transition-all relative disabled:opacity-50 ${activeTab === 'invoice' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                Qaytariladiganlar
                {returnItems.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{returnItems.length}</span>}
            </button>
        </div>

        {activeTab === 'products' && (
            <div className="p-6 flex flex-col h-full flex-1 animate-in fade-in duration-300">
                {!supplierId ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 bg-slate-50/50 border-2 border-dashed rounded-2xl border-slate-200 min-h-[300px]">
                        <AlertTriangle className="text-amber-400 mb-4" size={56} strokeWidth={1.5} />
                        <h3 className="text-xl font-black text-slate-700">Ta'minotchini tanlang</h3>
                        <p className="text-sm mt-2 font-medium">Tovarlarni ko'rish uchun avval tepadan ta'minotchini tanlashingiz shart.</p>
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 bg-slate-50/50 border-2 border-dashed rounded-2xl border-slate-200 min-h-[300px]">
                        <PackageX className="text-slate-300 mb-4" size={56} strokeWidth={1.5} />
                        <h3 className="text-xl font-black text-slate-700">Hech qanday tovar topilmadi</h3>
                        <p className="text-sm mt-2 text-center max-w-sm font-medium">
                            Bu ta'minotchi bizga hali tovar olib kelmagan, yoki siz qidirayotgan tovar ushbu ta'minotchiga tegishli emas.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="relative mb-6 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                            <input 
                                type="text" 
                                disabled={isSubmitting}
                                className="w-full pl-12 p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50" 
                                placeholder="Qidirish..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl custom-scrollbar max-h-[500px]">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4">Nomi</th>
                                        <th className="p-4 text-center">Partiya Qoldig'i</th>
                                        <th className="p-4 w-32 text-center">Qaytarish Soni</th>
                                        <th className="p-4 w-40 text-right">Kirim Narxi</th>
                                        <th className="p-4 w-28 text-center">Valyuta</th>
                                        <th className="p-4 text-center w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                                    {filteredBatches.map(batch => (
                                        <tr key={batch.batchId} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4">
                                                <div>{batch.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{batch.customId ?? '-'}</div>
                                            </td>
                                            <td className="p-4 text-center text-blue-600 bg-blue-50/50">{batch.quantity}</td>
                                            <td className="p-2">
                                                <input type="number" min="1" disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg text-center outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 disabled:bg-slate-50" value={batch.inputQty} onChange={(e) => handleProductInputChange(batch.batchId, 'inputQty', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" min="0" disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg text-right outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 disabled:bg-slate-50" value={batch.inputPrice} onChange={(e) => handleProductInputChange(batch.batchId, 'inputPrice', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <select disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white text-xs disabled:bg-slate-50" value={batch.inputCurrency} onChange={(e) => handleProductInputChange(batch.batchId, 'inputCurrency', e.target.value)}>
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button disabled={isSubmitting} onClick={() => addToReturn(batch)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm" title="Qaytarishga qo'shish">
                                                    <Plus size={20} strokeWidth={3}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        )}

        {activeTab === 'invoice' && (
             <div className="flex flex-col h-full flex-1 p-6 animate-in fade-in duration-300">
                {returnItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-2xl min-h-[300px]">
                        <PackageX size={48} className="mb-3 text-slate-300"/>
                        <p className="font-medium text-sm">Ro'yxat bo'sh. "Mavjud mahsulotlar" qismidan qo'shing.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto border border-slate-200 rounded-2xl custom-scrollbar max-h-[500px]">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4">Nomi</th>
                                    <th className="p-4 w-32 text-center">Miqdor</th>
                                    <th className="p-4 w-40 text-right">Narx</th>
                                    <th className="p-4 w-28 text-center">Valyuta</th>
                                    <th className="p-4 text-right w-40">Jami Summa</th>
                                    <th className="p-4 w-16 text-center">X</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                {returnItems.map(item => (
                                    <tr key={item.uid} className="hover:bg-rose-50/30 transition-colors">
                                        <td className="p-4">
                                            <div>{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.customId ?? '-'}</div>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg text-center outline-none focus:border-rose-400 focus:ring-2 ring-rose-100 font-black text-rose-500 disabled:bg-slate-50" value={item.inputQty} onChange={(e) => updateReturnItem(item.uid, 'inputQty', e.target.value)}/>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg text-right outline-none focus:border-rose-400 focus:ring-2 ring-rose-100 disabled:bg-slate-50" value={item.inputPrice} onChange={(e) => updateReturnItem(item.uid, 'inputPrice', e.target.value)}/>
                                        </td>
                                        <td className="p-2">
                                            <select disabled={isSubmitting} className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-rose-400 text-xs disabled:bg-slate-50" value={item.inputCurrency} onChange={(e) => updateReturnItem(item.uid, 'inputCurrency', e.target.value)}>
                                                <option value="UZS">UZS</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right font-black text-slate-800">
                                            {(Number(item.totalSum) || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button disabled={isSubmitting} onClick={() => removeFromReturn(item.uid)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50" title="O'chirish">
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
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-inner rotate-3">
                      <CheckCircle size={40} strokeWidth={2.5}/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Hujjatni saqlaysizmi?</h3>
                  <p className="text-center text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                      Barcha qaytarilayotgan tovarlar soni va narxlari to'g'ri kiritilganligiga ishonch hosil qiling.
                  </p>
                  <div className="flex gap-3">
                      <button disabled={isSubmitting} onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50">Orqaga</button>
                      <button disabled={isSubmitting} onClick={executeSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase text-xs tracking-widest disabled:opacity-70 disabled:cursor-not-allowed">
                          {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : "Tasdiqlash"}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AddSupplierReturn;
