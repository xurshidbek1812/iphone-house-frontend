import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Printer, ChevronUp, CheckSquare, Square, FileText, Image as ImageIcon } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import QRCode from "react-qr-code";
import toast from 'react-hot-toast';

const PrintPriceTag = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [printList, setPrintList] = useState([]);
  
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

  // --- 1. BAZADAN YUKLASH ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://iphone-house-api.onrender.com/api/products');
        const data = await res.json();
        setAllProducts(data);
      } catch (err) { console.error(err); }
    };
    fetchData();

    const handleClickOutside = (event) => {
      if (paperMenuRef.current && !paperMenuRef.current.contains(event.target)) {
        setIsPaperMenuOpen(false);
      }
      // Tavsiyalar oynasini yopish uchun
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2. QIDIRUV JARAYONI (Auto-suggest) ---
  const handleSearchChange = (type, value) => {
    if (type === 'id') {
      setSearchId(value);
      setSearchName('');
      if (value.trim()) {
          setFilteredSuggestions(allProducts.filter(p => p.customId && p.customId.toString().includes(value)));
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
    } else {
      setSearchName(value);
      setSearchId('');
      if (value.trim()) {
          setFilteredSuggestions(allProducts.filter(p => p.name.toLowerCase().includes(value.toLowerCase())));
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
      discountPrice: product.salePrice,
      printPrice: product.salePrice,
      prepaymentPercent: 0,
      template: '12 oylik kredit (Telefon)',
      copies: 1,
      isChecked: true
    };

    setPrintList([...printList, newItem]);
    setSearchId('');
    setSearchName('');
    setShowSuggestions(false);
    toast.success("Ro'yxatga qo'shildi!");
  };

  // Enter bosilganda ishlashi uchun eski funksiya (Agar ro'yxatdan bittasi to'g'ri kelsa)
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
    setPrintList(printList.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleCheck = (id) => {
    setPrintList(printList.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
  };

  const toggleAll = () => {
    const allChecked = printList.every(item => item.isChecked);
    setPrintList(printList.map(item => ({ ...item, isChecked: !allChecked })));
  };

  const removeChecked = () => {
    setPrintList(printList.filter(item => !item.isChecked));
  };
  const clearAll = () => setPrintList([]);

  // --- 5. HISOB-KITOB ---
  const calculateLoan = (price, percent) => {
    const prepayment = price * (percent / 100);
    const principal = price - prepayment;
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
    const itemsToPrint = printList.filter(i => i.isChecked);
    if (itemsToPrint.length === 0) return toast.error("Chop etish uchun tovar tanlanmagan!");

    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('ru-RU');

    let pageCss = '@page { size: A4 landscape; margin: 0mm; }'; 
    if (paperType === 'Portret (A4)') pageCss = '@page { size: A4 portrait; margin: 0mm; }';
    
    const content = itemsToPrint.map(item => {
        const { prepayment, monthly } = calculateLoan(item.discountPrice, item.prepaymentPercent);
        const qrCodeSvg = ReactDOMServer.renderToString(
            <QRCode value={`ID:${item.customId}|${item.name}|${item.discountPrice}`} size={50} level="M"/>
        );
        const bgUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;

        let itemsHtml = '';
        for(let i=0; i < item.copies; i++) {
            itemsHtml += `
                <div class="label-card">
                    <div class="header">
                        <div class="logo">iPhone House</div>
                    </div>
                    
                    <div class="product-name">${item.name}</div>
                    
                    <div class="price-row">
                        Narxi: <b>${Number(item.discountPrice).toLocaleString()} so'm</b>
                    </div>

                    <div class="credit-box">
                        12 oy : ${monthly.toLocaleString()} so'm
                    </div>

                    <div class="prepayment-row">
                        Oldindan to'lov: ${prepayment.toLocaleString()} so'm
                    </div>

                    <div class="footer">
                        <div class="qr-code" style="background-image: url('${bgUrl}')"></div>
                        <div class="date">${today}</div>
                        <div class="id">ID: ${item.customId}</div>
                    </div>
                </div>
            `;
        }
        return itemsHtml;
    }).join('');

    printWindow.document.write(`
        <html>
        <head>
            <title>Narx Yorliqlari</title>
            <style>
                ${pageCss}
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 15px; 
                    justify-content: flex-start;
                    align-content: flex-start;
                    padding: 15mm; 
                }
                
                .label-card {
                    width: 320px;
                    height: 230px; 
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px 15px 25px 15px; 
                    box-sizing: border-box;
                    display: flex; 
                    flex-direction: column; 
                    align-items: center;
                    position: relative;
                    page-break-inside: avoid;
                    background: white;
                }

                .logo {
                    font-size: 22px;
                    font-weight: 900;
                    color: #4338ca;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                    letter-spacing: 1px;
                }

                .product-name {
                    font-size: 13px;
                    font-weight: 600;
                    text-align: center;
                    margin-bottom: 10px;
                    line-height: 1.3;
                    height: 34px;
                    overflow: hidden;
                    color: #333;
                    width: 100%;
                }

                .price-row {
                    font-size: 14px;
                    color: #555;
                    margin-bottom: 5px;
                }

                .credit-box {
                    border: 2px solid #4338ca;
                    border-radius: 6px;
                    padding: 8px 15px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #000;
                    margin: 5px 0 10px 0;
                    width: 90%;
                    text-align: center;
                }

                .prepayment-row {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                }

                .footer {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: end;
                    margin-top: auto;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 8px; 
                }

                .qr-code {
                    width: 45px;
                    height: 45px;
                    background-size: contain;
                    background-repeat: no-repeat;
                }

                .date {
                    font-size: 11px;
                    color: #888;
                }

                .id {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                }
            </style>
        </head>
        <body>${content}</body>
        <script>window.onload = function() { window.print(); }</script>
        </html>
    `);
    printWindow.document.close();
  };

  const checkedCount = printList.filter(i => i.isChecked).length;

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Narx yorlig'ini chop etish</h1>

      {/* INPUTLAR VA QIDIRUV TAKLIFLARI */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 search-container relative z-40">
        <div className="flex gap-4 items-end">
            <div className="w-48 relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tovar ID</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        className="w-full pl-9 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" 
                        value={searchId} 
                        onChange={(e) => handleSearchChange('id', e.target.value)} 
                        onKeyDown={(e)=>e.key==='Enter'&&handleAddEnter()} 
                        placeholder="ID..."
                    />
                </div>
            </div>
            <div className="flex-1 relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tovar nomi</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        className="w-full pl-9 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" 
                        value={searchName} 
                        onChange={(e) => handleSearchChange('name', e.target.value)} 
                        onKeyDown={(e)=>e.key==='Enter'&&handleAddEnter()} 
                        placeholder="Nomini kiriting..."
                    />
                </div>
            </div>
            <button onClick={handleAddEnter} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
                <Plus size={18} /> Qo'shish
            </button>
        </div>

        {/* TAVSIYALAR RO'YXATI (AUTO-SUGGESTION) */}
        {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-gray-100">
                {filteredSuggestions.map(p => (
                    <li 
                        key={p.id} 
                        onClick={() => handleSelectProduct(p)} 
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md tracking-wider">#{p.customId}</span>
                            <span className="font-bold text-gray-800 group-hover:text-blue-700">{p.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-black text-green-600 block">{Number(p.salePrice).toLocaleString()} {p.saleCurrency || 'UZS'}</span>
                            <span className="text-xs text-gray-400 font-medium">Qoldiq: {p.quantity} {p.unit}</span>
                        </div>
                    </li>
                ))}
            </ul>
        )}
        {showSuggestions && filteredSuggestions.length === 0 && (
             <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center text-gray-500 font-medium z-50">
                 Bunday tovar topilmadi.
             </div>
        )}
      </div>

      {/* JADVAL */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col z-10">
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10">
                    <tr>
                        <th className="p-4 w-10 cursor-pointer" onClick={toggleAll}>
                            {printList.length > 0 && printList.every(i => i.isChecked) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                        </th>
                        <th className="p-4 w-20 text-center">ID</th>
                        <th className="p-4">Nomi</th>
                        <th className="p-4 w-32 text-right">Asl narxi</th>
                        <th className="p-4 w-24 text-center">Oldindan (%)</th>
                        <th className="p-4 w-32 text-right text-blue-600">Oldindan (so'm)</th>
                        <th className="p-4 w-32 text-right text-green-600">12 oyga</th>
                        <th className="p-4 w-56">Andoza turi</th>
                        <th className="p-4 w-24 text-center">Nusxa</th>
                        <th className="p-4 text-center">Amal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {printList.map((item) => {
                        const { prepayment, monthly } = calculateLoan(item.discountPrice, item.prepaymentPercent);
                        return (
                            <tr key={item.id} className={`transition-colors ${item.isChecked ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                <td className="p-4 cursor-pointer" onClick={() => toggleCheck(item.id)}>
                                    {item.isChecked ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-gray-400"/>}
                                </td>
                                <td className="p-4 text-center font-bold text-gray-500 bg-gray-50/50">#{item.customId}</td>
                                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                                
                                <td className="p-4"><input type="number" className="w-full p-2 border border-gray-200 rounded-lg text-right font-bold outline-none focus:border-blue-500" value={item.discountPrice} onChange={(e) => updateItem(item.id, 'discountPrice', Number(e.target.value))}/></td>
                                <td className="p-4"><input type="number" className="w-full p-2 border border-gray-200 rounded-lg text-center font-bold text-blue-600 bg-white outline-none focus:border-blue-500" value={item.prepaymentPercent} onChange={(e) => updateItem(item.id, 'prepaymentPercent', Number(e.target.value))}/></td>
                                
                                <td className="p-4 text-right font-black text-blue-600">{prepayment.toLocaleString()}</td>
                                <td className="p-4 text-right font-black text-green-600">{monthly.toLocaleString()}</td>

                                <td className="p-4">
                                    <select 
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-white text-xs outline-none focus:border-blue-500 font-medium text-gray-700"
                                        value={item.template}
                                        onChange={(e) => updateItem(item.id, 'template', e.target.value)}
                                    >
                                        <option value="12 oylik kredit (Telefon)">12 oylik kredit (Telefon)</option>
                                        <option value="12 oylik kredit (Boshqa)">12 oylik kredit (Boshqa)</option>
                                        <option value="10x15 (12 oyga bo'lish)">10x15 (12 oyga bo'lish)</option>
                                        <option value="Yorliq (58x40)">Yorliq (58x40)</option>
                                    </select>
                                </td>

                                <td className="p-4 text-center">
                                    <input type="number" min="1" className="w-16 p-2 border border-gray-200 rounded-lg text-center font-bold outline-none focus:border-blue-500" value={item.copies} onChange={(e) => updateItem(item.id, 'copies', Number(e.target.value))} />
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => {setPrintList(printList.filter(i=>i.id!==item.id))}} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        );
                    })}
                    {printList.length === 0 && <tr><td colSpan="10" className="p-16 text-center text-gray-400 font-medium">Ro'yxat bo'sh. Qidiruv orqali tovar qo'shing.</td></tr>}
                </tbody>
            </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center z-20">
            <div className="flex gap-3">
                <button onClick={removeChecked} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    O'chirish ({checkedCount})
                </button>
                <button onClick={clearAll} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
                    Barchasini tozalash
                </button>
            </div>
            
            <div className="flex gap-3 items-center">
                <div className="relative" ref={paperMenuRef}>
                    <button 
                        onClick={() => setIsPaperMenuOpen(!isPaperMenuOpen)}
                        className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 min-w-[160px] justify-between font-medium"
                    >
                        <div className="flex items-center gap-2">
                             {paperType.includes('A4') ? <FileText size={18} className="text-gray-500"/> : <ImageIcon size={18} className="text-gray-500"/>}
                             <span>{paperType}</span>
                        </div>
                        <ChevronUp size={16} className={`text-gray-400 transition-transform ${isPaperMenuOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    {isPaperMenuOpen && (
                        <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-50">
                            <div className="py-1">
                                {['Albom (A4)', 'Portret (A4)', 'Yorliq (58x40)'].map((type) => (
                                    <div 
                                        key={type}
                                        onClick={() => { setPaperType(type); setIsPaperMenuOpen(false); }}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                    >
                                        {type}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePrint}
                    disabled={checkedCount === 0}
                    className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all ${
                        checkedCount > 0 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer active:scale-95' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    <Printer size={18} /> Chop etish ({checkedCount})
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPriceTag;