import React, { useState, useEffect, useRef } from 'react';
import { QrCode, RotateCcw, Save, CheckCircle, AlertTriangle, Search, Play, StopCircle, CheckSquare, Square, Layers, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast'; 

const InventoryCount = () => {
  const [products, setProducts] = useState([]); 
  const [scannedItems, setScannedItems] = useState({}); // Endi faqat ID emas, "ID-BATCHID" formatida saqlanadi
  const [scanInput, setScanInput] = useState(''); 
  const [lastScanned, setLastScanned] = useState(null); 
  
  // --- SANOQ SESSIYASI VA TANLOV STATE'LARI ---
  const [isCounting, setIsCounting] = useState(false); 
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [hasDifferences, setHasDifferences] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); 

  const inputRef = useRef(null);
  const token = sessionStorage.getItem('token');

  // OVOZ EFFEKTI
  const playBeep = (type) => {
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
  };

  // YUKLASH
  useEffect(() => {
    fetch('https://iphone-house-api.onrender.com/api/products', {
        headers: {
            'Authorization': `Bearer ${token}` // <--- QOROVULGA PASPORT KO'RSATILDI
        }
    })
      .then(async res => {
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Server xatosi");
          }
          return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => {
          console.error("Xatolik:", err);
          toast.error(err.message === "Token topilmadi! Tizimga kiring." ? "Tizimga qayta kiring!" : "Server bilan aloqa yo'q!");
      });
  }, []);

  // Autofocus faqat sanoq boshlanganda ishlaydi
  useEffect(() => {
      if (isCounting && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isCounting]);


  // --- TANLASH MANTIQI ---
  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(p.customId).includes(searchTerm)
  );

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

  const processCode = (code) => {
    if (!code) return;
    let searchKey = code.trim();
    let batchKey = ""; // Qaysi partiya ekanligi

    // QR kod formati: ID:1234|BATCH:77|NAME:iPhone
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

        // Tovar va partiya ID larini birlashtiramiz (Agar batchKey bo'lmasa, shunchaki 'none')
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
  };

  // --- QO'LDA KIRITISH (MANUAL ENTRY) MANTIQI ---
  const updateManualCount = (productId, batchId, amount) => {
      const uniqueKey = `${productId}-${batchId || 'none'}`;
      
      setScannedItems(prev => {
          const currentCount = prev[uniqueKey] || 0;
          const newCount = currentCount + amount;
          if (newCount < 0) return prev; // Manfiy bo'lishiga yo'l qo'ymaymiz
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

  const handleStopCount = () => {
      const currentTableData = getResultTable();
      const diffExists = currentTableData.some(item => item.diff !== 0);
      
      setHasDifferences(diffExists);
      setFinishModalOpen(true);
  };


  // HISOBLASH
  const getResultTable = () => {
    let result = [];

    products.filter(p => selectedIds.includes(p.id)).forEach(product => {
        
        // Agar tovarda partiyalar yo'q bo'lsa (oddiy tovar bo'lsa)
        if (!product.batches || product.batches.length === 0) {
            const uniqueKey = `${product.id}-none`;
            const scannedQty = scannedItems[uniqueKey] || 0;
            const systemQty = product.quantity || 0;
            const diff = scannedQty - systemQty;
            result.push({ ...product, batchId: null, scannedQty, systemQty, diff });
        } 
        // Agar partiyalari bo'lsa, har bir partiyani alohida qator qilib chiqaramiz
        else {
            product.batches.filter(b => !b.isArchived).forEach(batch => {
                const uniqueKey = `${product.id}-${batch.id}`;
                const scannedQty = scannedItems[uniqueKey] || 0;
                const systemQty = batch.quantity || 0;
                const diff = scannedQty - systemQty;
                
                // Nusxa olib unga partiya ma'lumotlarini biriktiramiz
                result.push({ 
                    ...product, 
                    batchId: batch.id, 
                    batchDate: batch.createdAt,
                    scannedQty, 
                    systemQty, 
                    diff 
                });
            });
            
            // Balki partiyasiz (none) sanalgan qoldiqlar ham bordir (QR da xato bo'lsa)
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
  };

  const tableData = getResultTable();

  // --- SANOQNI YAKUNLASH ---
  const executeFinish = async (updateStock) => {
    try {
        const response = await fetch('https://iphone-house-api.onrender.com/api/inventory/finish', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- BU YERGA HAM PASPORT QO'SHILDI
            },
            body: JSON.stringify({ 
                items: tableData,
                updateStock: updateStock 
            })
        });

        if (response.ok) {
            toast.success("Sanoq muvaffaqiyatli yakunlandi!");
            setScannedItems({});
            setSelectedIds([]); 
            setLastScanned(null);
            setIsCounting(false);
            setFinishModalOpen(false);
            
            setTimeout(() => window.location.reload(), 1500); 
        } else {
            toast.error("Xatolik yuz berdi");
        }
    } catch (error) {
        console.error(error);
        toast.error("Server bilan aloqa yo'q");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <QrCode className="text-blue-600"/> Sanoq (Inventarizatsiya)
          </h1>
          
          {!isCounting ? (
              <button 
                  onClick={handleStartCount}
                  disabled={selectedIds.length === 0}
                  className={`px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                      selectedIds.length > 0 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 cursor-pointer' 
                      : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                  }`}
              >
                  <Play size={20} fill="currentColor" /> Sanoqni Boshlash ({selectedIds.length})
              </button>
          ) : (
              <button 
                  onClick={handleStopCount}
                  className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                  <StopCircle size={20} /> Sanoqni Yakunlash
              </button>
          )}
      </div>

      {/* SANOQ BOSHLANMASDAN OLDIN KO'RINADIGAN QISM (TOVAR TANLASH) */}
      {!isCounting && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300 mb-6">
            <div className="p-5 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Tovarni nomi yoki ID bo'yicha qidiring..." 
                        className="w-full pl-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                    Tanlangan: {selectedIds.length} ta
                </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-white text-slate-400 text-xs uppercase font-black sticky top-0 shadow-sm z-10">
                        <tr>
                            <th className="p-4 w-12 cursor-pointer border-b" onClick={toggleSelectAll}>
                                {isAllSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                            </th>
                            <th className="p-4 border-b">Kod</th>
                            <th className="p-4 border-b">Nomi</th>
                            <th className="p-4 border-b text-center">Joriy Qoldiq</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                        {filteredProducts.map(p => {
                            const isSelected = selectedIds.includes(p.id);
                            return (
                                <tr key={p.id} onClick={() => toggleSelect(p.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4">
                                        {isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-slate-300"/>}
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-500">#{p.customId}</td>
                                    <td className="p-4 font-bold text-slate-800">{p.name}</td>
                                    <td className="p-4 text-center font-bold text-slate-600 bg-slate-50/30">
                                        {p.quantity} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">Hech narsa topilmadi</td></tr>
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
            <div className="p-8 rounded-3xl shadow-sm border bg-white border-blue-200 shadow-blue-100/50 mb-6 text-center">
                <p className="text-slate-500 font-bold mb-4 uppercase tracking-widest text-xs">
                    Skaner bilan kodni o'qing
                </p>
                <div className="relative max-w-2xl mx-auto">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full p-5 pl-14 text-3xl font-black font-mono text-center border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-100 transition-all text-slate-700"
                        placeholder="ID skanerlash..."
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value)}
                        onKeyDown={handleScan}
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={28} />
                    </div>
                </div>

                {lastScanned && (
                    <div className="mt-6 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl inline-flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-800 font-black text-lg">{lastScanned.name}</span>
                        {lastScanned.scannedBatch && (
                            <span className="text-emerald-600 font-bold px-2 py-0.5 bg-emerald-100 rounded-md text-xs border border-emerald-200">
                                P-{lastScanned.scannedBatch}
                            </span>
                        )}
                        <span className="text-emerald-700 font-black">+1</span>
                    </div>
                )}
            </div>

            {/* NATIJALAR JADVALI VA QO'LDA KIRITISH */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-lg text-sm">{tableData.length}</span> ta tovar va partiyalar sanalyapti
                    </h2>
                    <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors">
                        <RotateCcw size={16}/> Natijalarni tozalash
                    </button>
                </div>
                
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[11px] uppercase font-black tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="p-4 pl-6">Nomi / Partiya</th>
                            <th className="p-4 text-center">Joriy Qoldiq</th>
                            <th className="p-4 text-center text-blue-600 bg-blue-50/50">Qo'lda kiritish (Sanaldi)</th>
                            <th className="p-4 text-center">Farq</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {tableData.map((item, index) => {
                            const uniqueKey = `${item.id}-${item.batchId || 'none'}`;
                            return (
                                <tr key={uniqueKey + index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="font-bold text-slate-800">{item.name} <span className="text-slate-400 font-mono text-xs ml-1">#{item.customId}</span></div>
                                        {item.batchId && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mt-1 border border-indigo-100">
                                                <Layers size={10}/> Partiya: P-{item.batchId} 
                                                {item.batchDate && <span className="text-slate-400 ml-1">({new Date(item.batchDate).toLocaleDateString()})</span>}
                                            </div>
                                        )}
                                        {!item.batchId && item.batches?.length > 0 && (
                                             <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded w-fit mt-1">
                                                 Partiyasiz sanalgan (E'tibor bering!)
                                             </div>
                                        )}
                                    </td>
                                    
                                    <td className="p-4 text-center font-bold text-slate-400">{item.systemQty}</td>
                                    
                                    {/* QO'LDA KIRITISH QISMI */}
                                    <td className="p-4 bg-blue-50/30">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => updateManualCount(item.id, item.batchId, -1)}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 shadow-sm active:scale-95 transition-all"
                                            >
                                                <Minus size={14} strokeWidth={3}/>
                                            </button>
                                            
                                            <input 
                                                type="number" 
                                                value={item.scannedQty === 0 ? '' : item.scannedQty}
                                                onChange={(e) => setManualCount(item.id, item.batchId, e.target.value)}
                                                placeholder="0"
                                                className="w-20 p-2 text-center text-xl font-black text-blue-600 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
                                            />

                                            <button 
                                                onClick={() => updateManualCount(item.id, item.batchId, 1)}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-200 shadow-sm active:scale-95 transition-all"
                                            >
                                                <Plus size={14} strokeWidth={3}/>
                                            </button>
                                        </div>
                                    </td>
                                    
                                    <td className="p-4 text-center">
                                        {item.diff === 0 ? (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1 w-28"><CheckCircle size={14}/> To'g'ri</span>
                                        ) : item.diff > 0 ? (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1 w-28">+{item.diff} Ortiqcha</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1 w-28"><AlertTriangle size={14}/> {item.diff} Kam</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- YAKUNLASH MODALI --- */}
      {finishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
                {hasDifferences ? (
                    <>
                        <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2">Farq aniqlandi!</h3>
                        <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed">
                            Siz sanagan tovarlar soni bilan tizimdagi qoldiq o'rtasida farqlar bor. Qoldiqni siz sanagan raqamlarga o'zgartiraylikmi?
                        </p>
                        
                        <div className="space-y-3">
                            <button onClick={() => executeFinish(true)} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all">HA, O'ZGARISHLARNI SAQLASH</button>
                            <button onClick={() => executeFinish(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">YO'Q, FAQAT TARIXGA YOZISH</button>
                            <button onClick={() => setFinishModalOpen(false)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-2">Orqaga qaytish (Sanoqni davom ettirish)</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2">Ajoyib natija!</h3>
                        <p className="text-center text-slate-500 font-medium mb-8">
                            Barcha sanalgan tovarlar soni tizimdagi qoldiq bilan bir xil chiqdi. Sanoqni yakunlaysizmi?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setFinishModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Bekor qilish</button>
                            <button onClick={() => executeFinish(false)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all">YAKUNLASH</button>
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
