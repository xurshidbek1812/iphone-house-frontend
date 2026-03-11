import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { QrCode, RotateCcw, CheckCircle, AlertTriangle, Search, Play, StopCircle, CheckSquare, Square, Layers, Plus, Minus, Loader2 } from 'lucide-react';
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

const InventoryCount = () => {
  const [products, setProducts] = useState([]); 
  const [scannedItems, setScannedItems] = useState({}); 
  const [scanInput, setScanInput] = useState(''); 
  const [lastScanned, setLastScanned] = useState(null); 
  
  // Yuklanish va Holatlar
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SANOQ SESSIYASI VA TANLOV STATE'LARI ---
  const [isCounting, setIsCounting] = useState(false); 
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [hasDifferences, setHasDifferences] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); 

  const inputRef = useRef(null);
  const token = sessionStorage.getItem('token');

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  // OVOZ EFFEKTI
  const playBeep = useCallback((type) => {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        if (type === 'success') {
            osc.frequency.value = 1000; gain.gain.value = 0.1;
            osc.start(); setTimeout(() => osc.stop(), 100);
        } else {
            osc.frequency.value = 300; gain.gain.value = 0.1;
            osc.start(); setTimeout(() => osc.stop(), 300);
        }
    } catch (e) {
        console.log("Audio play xatosi: ", e);
    }
  }, []);

  // YUKLASH (XAVFSIZ)
  const fetchProducts = useCallback(async (signal = undefined) => {
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
            if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
                toast.error("Mahsulotlar formati noto'g'ri keldi");
            }
        } else {
            const errText = await res.text();
            console.error('Products fetch error:', res.status, errText);
            toast.error(`Mahsulotlarni yuklab bo'lmadi (${res.status})`);
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            toast.error("Tarmoq xatosi yuz berdi!");
        }
    } finally {
        if (!signal?.aborted) setLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
      const controller = new AbortController();
      fetchProducts(controller.signal);
      return () => controller.abort();
  }, [fetchProducts]);

  // Autofocus faqat sanoq boshlanganda ishlaydi
  useEffect(() => {
      if (isCounting && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isCounting]);


  // --- TANLASH MANTIQI (Null-safe va Memoized) ---
  const filteredProducts = useMemo(() => {
      const search = searchTerm.trim().toLowerCase();
      if (!search) return products;
      return products.filter(p => 
          (p.name || '').toLowerCase().includes(search) || 
          (p.customId != null && String(p.customId).includes(search))
      );
  }, [products, searchTerm]);

  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));

  const toggleSelect = (id) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (isAllSelected) {
          setSelectedIds(selectedIds.filter(id => !filteredProducts.some(p => p.id === id)));
      } else {
          const newIds = filteredProducts.map(p => p.id).filter(id => !selectedIds.includes(id));
          setSelectedIds([...selectedIds, ...newIds]);
      }
  };

  // --- SCAN JARAYONI ---
  const processCode = useCallback((code) => {
    if (!code) return;
    let searchKey = code.trim();
    let batchKey = ""; 

    if (code.includes('|')) {
        const parts = code.split('|');
        searchKey = parts.find(p => p.startsWith('ID:'))?.replace('ID:', '').trim() || searchKey;
        batchKey = parts.find(p => p.startsWith('BATCH:'))?.replace('BATCH:', '').trim() || "";
    }

    const product = products.find(p => String(p.customId) === searchKey);

    if (product) {
        if (!selectedIds.includes(product.id)) {
            toast.error(`❌ "${product.name}" bu sanoq ro'yxatiga kiritilmagan!`);
            playBeep('error');
            return;
        }

        const uniqueKey = `${product.id}-${batchKey || 'none'}`;

        setScannedItems(prev => {
            const currentCount = prev[uniqueKey] || 0;
            return { ...prev, [uniqueKey]: currentCount + 1 };
        });
        setLastScanned({ ...product, scannedBatch: batchKey });
        playBeep('success');
    } else {
        toast.error(`Diqqat! "${searchKey}" kodli tovar bazada yo'q!`);
        playBeep('error');
    }
  }, [products, selectedIds, playBeep]);

  const handleScan = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!isCounting) {
            toast.error("Avval sanoqni boshlang!");
            setScanInput('');
            return;
        }
        processCode(scanInput);
        setScanInput(''); 
    }
  };

  // --- QO'LDA KIRITISH (MANUAL ENTRY) MANTIQI ---
  const updateManualCount = (productId, batchId, amount) => {
      const uniqueKey = `${productId}-${batchId || 'none'}`;
      
      setScannedItems(prev => {
          const currentCount = prev[uniqueKey] || 0;
          const newCount = currentCount + amount;
          if (newCount < 0) return prev; 
          return { ...prev, [uniqueKey]: newCount };
      });
  };

  const setManualCount = (productId, batchId, value) => {
      const uniqueKey = `${productId}-${batchId || 'none'}`;
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) return;
      
      setScannedItems(prev => ({
          ...prev, 
          [uniqueKey]: numValue
      }));
  };

  const handleReset = () => {
    if(window.confirm("Barcha sanalgan raqamlar o'chib ketadi. Rozimisiz?")) {
        setScannedItems({});
        setLastScanned(null);
        if(inputRef.current) inputRef.current.focus();
    }
  };

  const handleStartCount = () => {
      if (selectedIds.length === 0) {
          toast.error("Sanoqni boshlash uchun kamida bitta tovar tanlang!");
          return;
      }
      setIsCounting(true);
      toast.success(`${selectedIds.length} ta tovar uchun sanoq boshlandi!`);
  };

  // HISOBLASH (useMemo)
  const tableData = useMemo(() => {
    let result = [];
    products.filter(p => selectedIds.includes(p.id)).forEach(product => {
        if (!product.batches || product.batches.length === 0) {
            const uniqueKey = `${product.id}-none`;
            const scannedQty = scannedItems[uniqueKey] || 0;
            const systemQty = Number(product.quantity) || 0;
            const diff = scannedQty - systemQty;
            result.push({ ...product, batchId: null, scannedQty, systemQty, diff });
        } 
        else {
            product.batches.filter(b => !b.isArchived).forEach(batch => {
                const uniqueKey = `${product.id}-${batch.id}`;
                const scannedQty = scannedItems[uniqueKey] || 0;
                const systemQty = Number(batch.quantity) || 0;
                const diff = scannedQty - systemQty;
                
                result.push({ 
                    ...product, 
                    batchId: batch.id, 
                    batchDate: batch.createdAt,
                    scannedQty, 
                    systemQty, 
                    diff 
                });
            });
            
            const noneKey = `${product.id}-none`;
            if (scannedItems[noneKey]) {
                result.push({ 
                    ...product, 
                    batchId: null, 
                    scannedQty: scannedItems[noneKey], 
                    systemQty: 0, 
                    diff: scannedItems[noneKey] 
                });
            }
        }
    });
    return result;
  }, [products, selectedIds, scannedItems]);

  const handleStopCount = () => {
      const diffExists = tableData.some(item => item.diff !== 0);
      setHasDifferences(diffExists);
      setFinishModalOpen(true);
  };

  // --- SANOQNI YAKUNLASH ---
  const executeFinish = async (updateStock) => {
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_URL}/api/inventory/finish`, {
            method: 'POST',
            headers: getJsonAuthHeaders(),
            body: JSON.stringify({ 
                items: tableData,
                updateStock: updateStock 
            })
        });

        const data = await parseJsonSafe(response);

        if (response.ok) {
            toast.success("Sanoq muvaffaqiyatli yakunlandi!");
            setScannedItems({});
            setSelectedIds([]); 
            setLastScanned(null);
            setIsCounting(false);
            setFinishModalOpen(false);
            
            setTimeout(() => window.location.reload(), 1500); 
        } else {
            toast.error(data?.error || `Saqlashda xatolik yuz berdi (${response.status})`);
        }
    } catch (error) {
        console.error(error);
        toast.error("Server bilan aloqa yo'q");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <QrCode className="text-blue-600"/> Sanoq (Inventarizatsiya)
          </h1>
          
          {!isCounting ? (
              <button 
                  onClick={handleStartCount}
                  disabled={selectedIds.length === 0}
                  className={`px-8 py-3.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                      selectedIds.length > 0 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                  }`}
              >
                  <Play size={20} fill="currentColor" /> Sanoqni Boshlash ({selectedIds.length})
              </button>
          ) : (
              <button 
                  onClick={handleStopCount}
                  className="px-8 py-3.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                  <StopCircle size={20} /> Sanoqni Yakunlash
              </button>
          )}
      </div>

      {/* SANOQ BOSHLANMASDAN OLDIN KO'RINADIGAN QISM (TOVAR TANLASH) */}
      {!isCounting && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-5 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Tovarni nomi yoki ID bo'yicha qidiring..." 
                        className="w-full pl-12 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm font-black text-blue-600 bg-blue-50 px-5 py-3.5 rounded-xl border border-blue-100">
                    Tanlangan: {selectedIds.length} ta
                </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 shadow-sm z-10">
                        <tr>
                            <th className="p-4 w-16 cursor-pointer border-b border-slate-100 text-center" onClick={toggleSelectAll}>
                                {isAllSelected ? <CheckSquare size={20} className="text-blue-600 mx-auto"/> : <Square size={20} className="mx-auto hover:text-blue-400 transition-colors"/>}
                            </th>
                            <th className="p-4 border-b border-slate-100">Kod</th>
                            <th className="p-4 border-b border-slate-100">Nomi</th>
                            <th className="p-4 border-b border-slate-100 text-center">Joriy Qoldiq</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                        {loading ? (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={24}/></td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium">Hech narsa topilmadi</td></tr>
                        ) : (
                            filteredProducts.map(p => {
                                const isSelected = selectedIds.includes(p.id);
                                return (
                                    <tr key={p.id} onClick={() => toggleSelect(p.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <td className="p-4 text-center">
                                            {isSelected ? <CheckSquare size={20} className="text-blue-600 mx-auto"/> : <Square size={20} className="text-slate-300 mx-auto"/>}
                                        </td>
                                        <td className="p-4 font-mono text-slate-400">#{p.customId ?? '-'}</td>
                                        <td className="p-4">{p.name || "Noma'lum tovar"}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-xs ${Number(p.quantity || 0) <= 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600'}`}>
                                                {Number(p.quantity || 0)} <span className="font-normal text-slate-400">{p.unit}</span>
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* SANOQ BOSHLANGANDAN KEYIN KO'RINADIGAN QISM */}
      {isCounting && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            {/* KATTA INPUT (SKANER UCHUN) */}
            <div className="p-10 rounded-3xl shadow-lg border bg-white border-blue-200 shadow-blue-100/50 mb-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-pulse"></div>
                <p className="text-slate-400 font-black mb-4 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <QrCode size={16}/> Skaner bilan kodni o'qing
                </p>
                <div className="relative max-w-2xl mx-auto">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full p-6 pl-16 text-4xl font-black font-mono text-center border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-100 transition-all text-slate-800 tracking-widest placeholder:text-slate-200 placeholder:font-medium placeholder:text-xl"
                        placeholder="Kodni skanerlang..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScan}
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                        <Search size={32} strokeWidth={3} />
                    </div>
                </div>

                {lastScanned && (
                    <div className="mt-8 px-6 py-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl inline-flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-800 font-black text-xl tracking-tight">{lastScanned.name}</span>
                        {lastScanned.scannedBatch && (
                            <span className="text-emerald-700 font-bold px-3 py-1 bg-emerald-100 rounded-lg text-xs uppercase tracking-widest">
                                Partiya: P-{lastScanned.scannedBatch}
                            </span>
                        )}
                        <span className="text-white bg-emerald-500 px-3 py-1 rounded-lg font-black text-sm shadow-md shadow-emerald-200">+1 qo'shildi</span>
                    </div>
                )}
            </div>

            {/* NATIJALAR JADVALI VA QO'LDA KIRITISH */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-black text-slate-700 flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-xl shadow-md text-sm">{tableData.length}</span> 
                        ta tovar (va partiyalar) sanalyapti
                    </h2>
                    <button onClick={handleReset} className="px-5 py-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 flex items-center gap-2 font-bold transition-all shadow-sm active:scale-95">
                        <RotateCcw size={18} strokeWidth={2.5}/> Natijalarni tozalash
                    </button>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 pl-6">Nomi / Partiya</th>
                                <th className="p-4 text-center">Joriy Qoldiq</th>
                                <th className="p-4 text-center text-blue-600 bg-blue-50/80">Qo'lda kiritish (Sanaldi)</th>
                                <th className="p-4 text-center">Farq</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                            {tableData.map((item, index) => {
                                const uniqueKey = `${item.id}-${item.batchId || 'none'}`;
                                return (
                                    <tr key={uniqueKey + index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="text-slate-800 text-base">{item.name} <span className="text-slate-400 font-mono text-[11px] ml-2">#{item.customId}</span></div>
                                            {item.batchId && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit mt-2 border border-indigo-100 uppercase tracking-widest">
                                                    <Layers size={12} strokeWidth={2.5}/> Partiya: P-{item.batchId} 
                                                    {item.batchDate && <span className="text-indigo-400 ml-1">({new Date(item.batchDate).toLocaleDateString()})</span>}
                                                </div>
                                            )}
                                            {!item.batchId && Array.isArray(item.batches) && item.batches.length > 0 && (
                                                 <div className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg w-fit mt-2 uppercase tracking-widest border border-rose-100">
                                                     Partiyasiz sanalgan! E'tibor bering
                                                 </div>
                                            )}
                                        </td>
                                        
                                        <td className="p-4 text-center text-slate-400 text-lg">{item.systemQty}</td>
                                        
                                        {/* QO'LDA KIRITISH QISMI */}
                                        <td className="p-4 bg-blue-50/30">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => updateManualCount(item.id, item.batchId, -1)}
                                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-300 shadow-sm active:scale-95 transition-all"
                                                >
                                                    <Minus size={18} strokeWidth={3}/>
                                                </button>
                                                
                                                <input 
                                                    type="number" min="0" step={item.unit === 'Dona' ? '1' : '0.01'}
                                                    value={item.scannedQty === 0 ? '' : item.scannedQty}
                                                    onChange={(e) => setManualCount(item.id, item.batchId, e.target.value)}
                                                    placeholder="0"
                                                    className="w-24 p-2 text-center text-2xl font-black text-blue-600 bg-white border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-100 shadow-inner transition-all"
                                                />

                                                <button 
                                                    onClick={() => updateManualCount(item.id, item.batchId, 1)}
                                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-300 shadow-sm active:scale-95 transition-all"
                                                >
                                                    <Plus size={18} strokeWidth={3}/>
                                                </button>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 text-center">
                                            {item.diff === 0 ? (
                                                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-black text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-1.5 w-36 shadow-sm"><CheckCircle size={16} strokeWidth={3}/> To'g'ri</span>
                                            ) : item.diff > 0 ? (
                                                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-black text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-1.5 w-36 shadow-sm">+{item.diff} Ortiqcha</span>
                                            ) : (
                                                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-black text-[11px] uppercase tracking-widest inline-flex items-center justify-center gap-1.5 w-36 shadow-sm"><AlertTriangle size={16} strokeWidth={3}/> {item.diff} Kam</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- YAKUNLASH MODALI --- */}
      {finishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
                {hasDifferences ? (
                    <>
                        <div className="w-24 h-24 bg-amber-50 text-amber-500 border border-amber-100 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
                            <AlertTriangle size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Farq aniqlandi!</h3>
                        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
                            Siz sanagan tovarlar soni bilan tizimdagi qoldiq o'rtasida farqlar mavjud. Qoldiqni aynan siz sanagan raqamlarga moslashtirib o'zgartiraylikmi?
                        </p>
                        
                        <div className="space-y-3">
                            <button disabled={isSubmitting} onClick={() => executeFinish(true)} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : "HA, O'ZGARISHLARNI SAQLASH"}
                            </button>
                            <button disabled={isSubmitting} onClick={() => executeFinish(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50">
                                YO'Q, FAQAT TARIXGA YOZISH
                            </button>
                            <button disabled={isSubmitting} onClick={() => setFinishModalOpen(false)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-2">Orqaga qaytish (Sanoqni davom ettirish)</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
                            <CheckCircle size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Ajoyib natija!</h3>
                        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
                            Barcha sanalgan tovarlar soni tizimdagi qoldiq bilan 100% bir xil chiqdi. Sanoqni yakunlaysizmi?
                        </p>
                        <div className="flex gap-3">
                            <button disabled={isSubmitting} onClick={() => setFinishModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50">BEKOR QILISH</button>
                            <button disabled={isSubmitting} onClick={() => executeFinish(false)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : "YAKUNLASH"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCount;
