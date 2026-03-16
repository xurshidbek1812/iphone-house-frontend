import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Trash2, Printer, ChevronUp, CheckSquare, Square, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import QRCode from "react-qr-code";
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

const PrintPriceTag = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [printList, setPrintList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Qidiruv
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');

  // Dropdown
  const [paperType, setPaperType] = useState('Albom (A4)');
  const [isPaperMenuOpen, setIsPaperMenuOpen] = useState(false);
  const paperMenuRef = useRef(null);

  // Auto-suggestion (Tavsiyalar) uchun State'lar
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // --- SOZLAMALAR ---
  const MARKUP_PERCENT = 44; // 12 oy uchun ustama
  const token = sessionStorage.getItem('token');

  // HELPER: Auth Headers
  const getAuthHeaders = useCallback(() => ({
      'Authorization': `Bearer ${token}`
  }), [token]);

  // --- 1. BAZADAN YUKLASH (XAVFSIZ) ---
  const fetchData = useCallback(async (signal = undefined) => {
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
                  setAllProducts(data);
              } else {
                  setAllProducts([]);
                  toast.error("Mahsulotlar formati noto'g'ri keldi");
              }
          } else {
              toast.error(`Tovarlarni yuklab bo'lmadi (${res.status})`);
          }
      } catch (err) { 
          if (err.name !== 'AbortError') {
              console.error(err); 
              toast.error("Server bilan aloqa yo'q!");
          }
      } finally {
          if (!signal?.aborted) setLoading(false);
      }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    const handleClickOutside = (event) => {
      if (paperMenuRef.current && !paperMenuRef.current.contains(event.target)) {
        setIsPaperMenuOpen(false);
      }
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
        controller.abort();
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchData]);

  // --- 2. QIDIRUV JARAYONI (Auto-suggest null-safe) ---
  const handleSearchChange = (type, value) => {
    if (type === 'id') {
      setSearchId(value);
      setSearchName('');
      const cleanValue = value.trim();
      if (cleanValue) {
          setFilteredSuggestions(allProducts.filter(p => p.customId != null && String(p.customId).includes(cleanValue)));
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
    } else {
      setSearchName(value);
      setSearchId('');
      const cleanValue = value.trim().toLowerCase();
      if (cleanValue) {
          setFilteredSuggestions(allProducts.filter(p => (p.name || '').toLowerCase().includes(cleanValue)));
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
    }
  };

  // --- 3. TOVARNI TANLASH VA QO'SHISH ---
  const handleSelectProduct = (product) => {
    if (printList.some(item => item.id === product.id)) {
        toast.error("Bu tovar ro'yxatga allaqachon qo'shilgan!");
        setShowSuggestions(false);
        setSearchId('');
        setSearchName('');
        return;
    }

    const newItem = {
      ...product,
      discountPrice: Number(product.salePrice) || 0,
      printPrice: Number(product.salePrice) || 0,
      prepaymentPercent: 0,
      template: '12 oylik kredit (Telefon)',
      copies: 1,
      isChecked: true
    };

    setPrintList(prev => [...prev, newItem]);
    setSearchId('');
    setSearchName('');
    setShowSuggestions(false);
    toast.success("Ro'yxatga qo'shildi!");
  };

  const handleAddEnter = () => {
    if (filteredSuggestions.length === 1) {
        handleSelectProduct(filteredSuggestions[0]);
    } else if (filteredSuggestions.length > 1) {
        toast.error("Bir nechta tovar topildi. Iltimos, ro'yxatdan kerakligini tanlang.");
    } else {
        toast.error("Tovar topilmadi!");
    }
  };

  // --- 4. O'ZGARTIRISH ---
  const updateItem = (id, field, value) => {
    setPrintList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleCheck = (id) => {
    setPrintList(prev => prev.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
  };

  const toggleAll = () => {
    const allChecked = printList.length > 0 && printList.every(item => item.isChecked);
    setPrintList(prev => prev.map(item => ({ ...item, isChecked: !allChecked })));
  };

  const removeChecked = () => {
    setPrintList(prev => prev.filter(item => !item.isChecked));
  };
  const clearAll = () => setPrintList([]);

  // --- 5. HISOB-KITOB ---
  const calculateLoan = (price, percent) => {
    const numPrice = Number(price) || 0;
    const numPercent = Number(percent) || 0;
    
    const prepayment = numPrice * (numPercent / 100);
    const principal = numPrice - prepayment;
    const markupAmount = principal * (MARKUP_PERCENT / 100);
    const totalLoan = principal + markupAmount;
    const monthly = totalLoan / 12;
    
    return {
      prepayment: Math.round(prepayment),
      monthly: Math.round(monthly)
    };
  };

  // --- 6. CHOP ETISH LOGIKASI ---
  const handlePrint = () => {
  const itemsToPrint = printList.filter((i) => i.isChecked);
  if (itemsToPrint.length === 0) {
    return toast.error("Chop etish uchun tovar tanlanmagan!");
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return toast.error("Brauzer yangi oyna ochishga ruxsat bermadi. Iltimos, popup'larni yoqing!");
  }

  const today = new Date().toLocaleDateString('ru-RU');

  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const renderCompactPriceLabel = (item) => {
    const safeName = escapeHtml(item.name);
    const safePrice = Number(item.discountPrice || 0).toLocaleString('uz-UZ');
    const safeId = escapeHtml(item.customId ?? '-');
    const safeDate = escapeHtml(today);

    let copiesHtml = '';

    for (let i = 0; i < (Number(item.copies) || 1); i++) {
      copiesHtml += `
        <div class="mini-label">
          <div class="mini-inner">
            <div class="mini-logo">IPHONE HOUSE</div>

            <div class="mini-name">
              ${safeName}
            </div>

            <div class="mini-line"></div>

            <div class="mini-price-row">
              <span class="mini-price-label">Narxi:</span>
              <span class="mini-price-value">${safePrice} so'm</span>
            </div>

            <div class="mini-footer">
              <span class="mini-date">${safeDate}</span>
              <span class="mini-id">ID: ${safeId}</span>
            </div>
          </div>
        </div>
      `;
    }

    return copiesHtml;
  };

  const renderQrLabel = (item) => {
    const safeName = escapeHtml(item.name || '');
    const safeCategory = escapeHtml(item.category || 'Tovar');
    const qrValue = `ID:${item.customId}|NAME:${item.name}|PRICE:${item.discountPrice}`;

    const qrCodeSvg = ReactDOMServer.renderToString(
      <QRCode value={qrValue} size={140} level="H" />
    );

    let copiesHtml = '';

    for (let i = 0; i < (Number(item.copies) || 1); i++) {
      copiesHtml += `
        <div class="page58">
          <div class="label58">
            <div class="left58">
              <div>
                <div class="category58">${safeCategory}</div>
                <div class="name58">${safeName}</div>
              </div>

              <div class="bottom58">
                <div class="code-label58">Mahsulot kodi</div>
                <div class="product-id58">${item.customId ?? '-'}</div>
              </div>
            </div>

            <div class="right58">
              <div class="qr58">
                ${qrCodeSvg}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return copiesHtml;
  };

  const content = itemsToPrint
    .map((item) => {
      if (item.template === 'Yorliq (58x40)' || paperType === 'Yorliq (58x40)') {
        return renderQrLabel(item);
      }

      return renderCompactPriceLabel(item);
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Narx Yorliqlari</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            display: flex;
            flex-wrap: wrap;
            gap: 4mm;
            padding: 4mm;
            align-content: flex-start;
          }

          @page {
            size: A4;
            margin: 4mm;
          }

          /* ======= YANGI NARX YORLIG'I (QRsiz) ======= */
          .mini-label {
            width: 58mm;
            height: 40mm;
            page-break-inside: avoid;
          }

          .mini-inner {
            width: 58mm;
            height: 40mm;
            border: 1px solid #bdbdbd;
            border-radius: 3mm;
            background: #fff;
            padding: 2.5mm 3mm 2mm 3mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          .mini-logo {
            text-align: center;
            font-size: 4.1mm;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.2mm;
            color: #222;
            text-transform: uppercase;
            margin-top: 0.4mm;
          }

          .mini-name {
            margin-top: 1.4mm;
            text-align: center;
            font-size: 2.9mm;
            line-height: 1.18;
            font-weight: 700;
            color: #333;
            min-height: 8.5mm;
            max-height: 8.5mm;
            overflow: hidden;
            word-break: break-word;
          }

          .mini-line {
            width: 100%;
            border-top: 0.35mm solid #7b7b7b;
            margin-top: 1.2mm;
            margin-bottom: 1.6mm;
          }

          .mini-price-row {
            text-align: center;
            margin-top: 0.4mm;
          }

          .mini-price-label {
            font-size: 2.6mm;
            font-weight: 700;
            color: #555;
            margin-right: 1mm;
          }

          .mini-price-value {
            font-size: 3.5mm;
            line-height: 1;
            font-weight: 900;
            color: #222;
          }

          .mini-footer {
            margin-top: auto;
            padding-top: 1.2mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2mm;
          }

          .mini-date {
            font-size: 2mm;
            color: #8a8a8a;
            font-weight: 600;
          }

          .mini-id {
            font-size: 2.5mm;
            color: #111;
            font-weight: 800;
          }

          /* ======= 58x40 QR LABEL ======= */
          .page58 {
            width: 58mm;
            height: 40mm;
          }

          .label58 {
            width: 58mm;
            height: 40mm;
            border: 1px solid #111;
            border-radius: 3mm;
            background: #fff;
            padding: 2.2mm;
            display: flex;
            gap: 2.2mm;
            overflow: hidden;
          }

          .left58 {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
          }

          .category58 {
            font-size: 2.1mm;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.15mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 0.8mm;
          }

          .name58 {
            font-size: 3.1mm;
            line-height: 1.05;
            font-weight: 800;
            text-transform: uppercase;
            color: #000;
            max-height: 9mm;
            overflow: hidden;
          }

          .bottom58 {
            margin-top: auto;
          }

          .code-label58 {
            font-size: 1.7mm;
            font-weight: 700;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.12mm;
            margin-bottom: 0.3mm;
          }

          .product-id58 {
            font-size: 4.6mm;
            line-height: 1;
            font-weight: 800;
            color: #000;
            white-space: nowrap;
          }

          .right58 {
            width: 24mm;
            height: 100%;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr58 {
            width: 24mm;
            height: 24mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr58 svg {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

  const checkedCount = printList.filter(i => i.isChecked).length;

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col relative animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Narx yorlig'ini chop etish</h1>

      {/* INPUTLAR VA QIDIRUV TAKLIFLARI */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4 search-container relative z-40">
        <div className="flex gap-4 items-end">
            <div className="w-48 relative">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tovar ID</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        disabled={loading}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50" 
                        value={searchId} 
                        onChange={(e) => handleSearchChange('id', e.target.value)} 
                        onKeyDown={(e)=>e.key==='Enter'&&handleAddEnter()} 
                        placeholder="Kodni yozing..."
                    />
                </div>
            </div>
            <div className="flex-1 relative">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tovar nomi</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        disabled={loading}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 disabled:opacity-50" 
                        value={searchName} 
                        onChange={(e) => handleSearchChange('name', e.target.value)} 
                        onKeyDown={(e)=>e.key==='Enter'&&handleAddEnter()} 
                        placeholder="Nomini kiriting..."
                    />
                </div>
            </div>
            <button disabled={loading} onClick={handleAddEnter} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50">
                <Plus size={18} strokeWidth={3} /> Qo'shish
            </button>
        </div>

        {/* TAVSIYALAR RO'YXATI (AUTO-SUGGESTION) */}
        {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-50 custom-scrollbar">
                {filteredSuggestions.map(p => (
                    <li 
                        key={p.id} 
                        onClick={() => handleSelectProduct(p)} 
                        className="p-4 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-lg tracking-widest">#{p.customId ?? '-'}</span>
                            <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{p.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-black text-emerald-600 block text-base">{Number(p.salePrice || 0).toLocaleString()} <span className="text-[10px]">{p.saleCurrency || 'UZS'}</span></span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Omborda: {Number(p.quantity || 0)} {p.unit}</span>
                        </div>
                    </li>
                ))}
            </ul>
        )}
        {showSuggestions && filteredSuggestions.length === 0 && searchName.trim().length > 0 && (
             <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-center text-slate-400 font-bold z-50">
                 Bunday tovar topilmadi.
             </div>
        )}
      </div>

      {/* JADVAL */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10">
        <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                        <th className="p-4 w-12 text-center cursor-pointer hover:text-blue-500 transition-colors" onClick={toggleAll}>
                            {printList.length > 0 && printList.every(i => i.isChecked) ? <CheckSquare size={18} className="text-blue-600 mx-auto"/> : <Square size={18} className="mx-auto"/>}
                        </th>
                        <th className="p-4 w-20 text-center">ID</th>
                        <th className="p-4">Nomi</th>
                        <th className="p-4 w-36 text-right">Asl narxi</th>
                        <th className="p-4 w-28 text-center">Oldindan (%)</th>
                        <th className="p-4 w-36 text-right text-blue-600">Oldindan (UZS)</th>
                        <th className="p-4 w-36 text-right text-emerald-600">12 oyga (UZS)</th>
                        <th className="p-4 w-56">Andoza turi</th>
                        <th className="p-4 w-24 text-center">Nusxa</th>
                        <th className="p-4 text-center w-16">Amal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                    {loading ? (
                        <tr><td colSpan="10" className="p-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={32}/></td></tr>
                    ) : printList.length === 0 ? (
                        <tr>
                            <td colSpan="10" className="p-20 text-center text-slate-400">
                                <Printer size={48} className="mx-auto mb-4 opacity-20"/>
                                <p className="font-medium text-sm">Ro'yxat bo'sh. Qidiruv orqali tovar qo'shing.</p>
                            </td>
                        </tr>
                    ) : (
                        printList.map((item) => {
                            const { prepayment, monthly } = calculateLoan(item.discountPrice, item.prepaymentPercent);
                            return (
                                <tr key={item.id} className={`transition-colors ${item.isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4 text-center cursor-pointer" onClick={() => toggleCheck(item.id)}>
                                        {item.isChecked ? <CheckSquare size={18} className="text-blue-600 mx-auto"/> : <Square size={18} className="text-slate-300 mx-auto"/>}
                                    </td>
                                    <td className="p-4 text-center font-mono text-slate-400">#{item.customId ?? '-'}</td>
                                    <td className="p-4 text-slate-800">{item.name}</td>
                                    
                                    <td className="p-2">
                                        <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-lg text-right font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all" value={item.discountPrice} onChange={(e) => updateItem(item.id, 'discountPrice', Number(e.target.value))}/>
                                    </td>
                                    <td className="p-2">
                                        <input type="number" min="0" max="100" className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-black text-blue-600 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all" value={item.prepaymentPercent} onChange={(e) => updateItem(item.id, 'prepaymentPercent', Number(e.target.value))}/>
                                    </td>
                                    
                                    <td className="p-4 text-right font-black text-blue-600">{prepayment.toLocaleString()}</td>
                                    <td className="p-4 text-right font-black text-emerald-600">{monthly.toLocaleString()}</td>

                                    <td className="p-2">
                                        <select 
                                            className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 cursor-pointer transition-all"
                                            value={item.template}
                                            onChange={(e) => updateItem(item.id, 'template', e.target.value)}
                                        >
                                            <option value="12 oylik kredit (Telefon)">12 oylik kredit (Telefon)</option>
                                            <option value="12 oylik kredit (Boshqa)">12 oylik kredit (Boshqa)</option>
                                            <option value="10x15 (12 oyga bo'lish)">10x15 (12 oyga bo'lish)</option>
                                            <option value="Yorliq (58x40)">Yorliq (58x40)</option>
                                        </select>
                                    </td>

                                    <td className="p-2">
                                        <input type="number" min="1" className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all" value={item.copies} onChange={(e) => updateItem(item.id, 'copies', Number(e.target.value))} />
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => {setPrintList(printList.filter(i=>i.id!==item.id))}} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="O'chirish"><Trash2 size={20}/></button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center z-20">
            <div className="flex gap-3">
                <button disabled={checkedCount === 0} onClick={removeChecked} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50">
                    O'chirish ({checkedCount})
                </button>
                <button disabled={printList.length === 0} onClick={clearAll} className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-colors disabled:opacity-50">
                    Barchasini tozalash
                </button>
            </div>
            
            <div className="flex gap-4 items-center">
                <div className="relative" ref={paperMenuRef}>
                    <button 
                        onClick={() => setIsPaperMenuOpen(!isPaperMenuOpen)}
                        className="flex items-center gap-3 bg-white px-5 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 min-w-[200px] justify-between font-bold text-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                             {paperType.includes('A4') ? <FileText size={18} className="text-slate-400"/> : <ImageIcon size={18} className="text-slate-400"/>}
                             <span>{paperType}</span>
                        </div>
                        <ChevronUp size={18} className={`text-slate-400 transition-transform ${isPaperMenuOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    {isPaperMenuOpen && (
                        <div className="absolute bottom-full mb-2 right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-50 p-1">
                            {['Albom (A4)', 'Portret (A4)', 'Yorliq (58x40)'].map((type) => (
                                <div 
                                    key={type}
                                    onClick={() => { setPaperType(type); setIsPaperMenuOpen(false); }}
                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors rounded-lg"
                                >
                                    {type}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePrint}
                    disabled={checkedCount === 0}
                    className={`px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all ${
                        checkedCount > 0 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-95' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    <Printer size={20} strokeWidth={2.5}/> Chop etish ({checkedCount})
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPriceTag;
