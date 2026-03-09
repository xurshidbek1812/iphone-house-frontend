import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Package, Printer, Calculator as CalcIcon, Filter, Info, AlertTriangle, Layers, EyeOff, CheckCircle, Save } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import QRCode from "react-qr-code";
import Calculator from '../../components/Calculator';
import toast from 'react-hot-toast';

const Sklad = () => {
  const userRole = localStorage.getItem('userRole');
  const isDirector = userRole === 'director'; 

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modallar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, batchId: null }); // <--- YANGI ARXIVLASH MODALI UCHUN
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const token = localStorage.getItem('token');

  // QR Print uchun state-lar
  const [printProduct, setPrintProduct] = useState(null); 
  const [selectedBatch, setSelectedBatch] = useState(null); 

  const [calcInitialPrice, setCalcInitialPrice] = useState('');
  const [calcInitialCurrency, setCalcInitialCurrency] = useState('UZS');

  const [formData, setFormData] = useState({
    name: '', category: '', buyPrice: '', salePrice: '', quantity: '0', unit: 'Dona', buyCurrency: 'USD', saleCurrency: 'UZS'
  });

  const [filterValues, setFilterValues] = useState({
    id: '', category: '', buyPriceFrom: '', buyPriceTo: '', salePriceFrom: '', salePriceTo: '', stockStatus: ''
  });

  // API YUKLASH
  const fetchProducts = async () => {
    try {
      const res = await fetch('https://iphone-house-api.onrender.com/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Server xatosi");
      const data = await res.json();
      setProducts(data);
    } catch (err) { console.error("Xatolik:", err); }
  };

  useEffect(() => { 
      fetchProducts(); 
      
      const fetchCategories = async () => {
          try {
              const res = await fetch('https://iphone-house-api.onrender.com/api/categories', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                  const data = await res.json();
                  setCategories(data); // Eng yangi ro'yxatni Ekranga chiqaramiz
                  localStorage.setItem('categoryList', JSON.stringify(data)); // Zaxira uchun xotiraga ham yozib qo'yamiz
              }
          } catch (err) {
              console.error("Kategoriyalarni yuklashda xatolik:", err);
          }
      };
      
      fetchCategories();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return toast.error("Nomi va kategoriyasini kiriting!");
    const avtomatikId = Math.floor(10000 + Math.random() * 90000).toString();
    const newProduct = {
        id: Date.now().toString(), customId: avtomatikId, name: formData.name,
        category: formData.category, quantity: Number(formData.quantity), buyPrice: Number(formData.buyPrice),
        salePrice: Number(formData.salePrice), unit: formData.unit, buyCurrency: formData.buyCurrency, saleCurrency: formData.saleCurrency
    };

    try {
      const res = await fetch('https://iphone-house-api.onrender.com/api/products', {
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setIsModalOpen(false); setIsSuccessOpen(true); fetchProducts(); 
        setTimeout(() => {
          setIsSuccessOpen(false); 
          setFormData({ name: '', category: '', buyPrice: '', salePrice: '', quantity: '0', unit: 'Dona', buyCurrency: 'USD', saleCurrency: 'UZS' });
        }, 2500);
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch (err) { console.error(err); toast.error("Server bilan aloqa yo'q!"); }
  };
  
  const executeDelete = async (id) => {
      try {
          const res = await fetch(`https://iphone-house-api.onrender.com/api/products/${id}`, { 
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) { toast.success("Tovar o'chirildi!"); fetchProducts(); } 
          else { toast.error("O'chirib bo'lmaydi!"); }
      } catch (err) { toast.error("Xatolik!"); } 
      finally { setDeleteModal({ isOpen: false, productId: null }); }
  };

  const executeArchiveBatch = async () => {
      const batchId = archiveModal.batchId;
      try {
          const res = await fetch(`https://iphone-house-api.onrender.com/api/products/batches/${batchId}/archive`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              toast.success("Partiya muvaffaqiyatli yashirildi!");
              fetchProducts(); 
              
              setSelectedProduct(prev => {
                  if(!prev) return prev;
                  return { ...prev, batches: prev.batches.map(b => b.id === batchId ? { ...b, isArchived: true } : b) };
              });
          } else {
              toast.error("Xatolik yuz berdi");
          }
      } catch (error) {
          toast.error("Server bilan aloqa yo'q");
      } finally {
          setArchiveModal({ isOpen: false, batchId: null }); // Ish tugagach modalni yopamiz
      }
  };

  const openCalculator = (price, currency) => { 
    setCalcInitialPrice(price); setCalcInitialCurrency(currency || 'UZS'); setIsCalcOpen(true); 
  };

  const handleOpenPrintModal = (product) => {
    setPrintProduct(product);
    setSelectedBatch(null); 
  };

  const handleFinalPrint = () => {
    if (!printProduct || !selectedBatch) return toast.error("Partiyani tanlang!");
    const printWindow = window.open('', '_blank');
    const qrValue = `ID:${printProduct.customId}|BATCH:${selectedBatch.id}|NAME:${printProduct.name}`;
    const qrCodeSvg = ReactDOMServer.renderToString(<QRCode value={qrValue} size={80} level="H"/>);
    const bgUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;

    printWindow.document.write(`
        <html><head><title>QR Kod</title><style>
            @page { size: auto; margin: 0mm; } body { margin: 10mm; font-family: Arial, sans-serif; display: flex; justify-content: center; }
            .label-card { width: 320px; border: 2px solid #000; padding: 20px; border-radius: 12px; background: white; }
            .header { font-size: 16px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
            .divider { border-bottom: 2px solid #000; margin-bottom: 12px; }
            .content { display: flex; justify-content: space-between; align-items: flex-end; }
            .product-id { font-size: 34px; font-weight: 900; }
            .batch-tag { font-size: 11px; background: #000; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 5px; display: inline-block; }
            .qr-code-bg { width: 85px; height: 85px; background-image: url('${bgUrl}'); background-size: contain; background-repeat: no-repeat; }
        </style></head><body>
            <div class="label-card"><div class="header">${printProduct.name}</div><div class="divider"></div><div class="content">
            <div><div class="product-id">${printProduct.customId}</div><div class="batch-tag">PARTIYA: #${selectedBatch.id}</div></div>
            <div class="qr-code-bg"></div></div></div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
        </body></html>
    `);
    printWindow.document.close();
    setPrintProduct(null);
  };

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.customId && p.customId.toString().includes(search));
    const matchesId = filterValues.id ? p.customId.toString().includes(filterValues.id) : true;
    const matchesCategory = filterValues.category ? p.category === filterValues.category : true;
    let matchesStock = true;
    if (filterValues.stockStatus === 'available') matchesStock = p.quantity > 0;
    if (filterValues.stockStatus === 'unavailable') matchesStock = p.quantity === 0;
    return matchesSearch && matchesId && matchesCategory && matchesStock;
  });

  return (
    <div className="p-6 relative min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tovarlar qoldig'i</h1>
        <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-100 text-sm font-bold text-slate-500">Jami: <span className="text-blue-600">{products.length}</span> ta</div>
            {isDirector && (<button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={20} strokeWidth={3}/> Tovar qo'shish</button>)}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400" size={20} />
            <input type="text" placeholder="Nomi yoki ID bo'yicha qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full outline-none text-slate-700 font-medium" />
        </div>
        <button onClick={() => setIsFilterOpen(true)} className={`px-6 rounded-2xl border font-bold flex items-center gap-2 transition-all ${Object.values(filterValues).some(v => v !== '') ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Filter size={20} /> Filtr</button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                    <th className="p-5">ID (Kod)</th>
                    <th className="p-5">Nomi</th>
                    {/* YANGI QO'SHILDI: Kategoriya ustuni */}
                    <th className="p-5 text-center">Kategoriya</th>
                    <th className="p-5 text-center">Birlik</th>
                    {isDirector && <th className="p-5 text-right bg-amber-50/50 text-amber-700">Kirim Narxi</th>}
                    <th className="p-5 text-right text-emerald-700">Sotuv Narxi</th>
                    <th className="p-5 text-center">Ombor (Qoldiq)</th>
                    <th className="p-5 text-center">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="p-5 font-mono text-blue-600">#{p.customId}</td>
                            <td className="p-5 text-slate-800">{p.name}</td>
                            
                            {/* YANGI QO'SHILDI: Kategoriya ma'lumoti */}
                            <td className="p-5 text-center text-slate-500 font-medium">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider">
                                    {p.category || 'Kategoriyasiz'}
                                </span>
                            </td>
                            
                            <td className="p-5 text-center text-slate-400">{p.unit}</td>
                            {isDirector && (
                                <td className="p-5 text-right text-slate-600 bg-amber-50/20">
                                    {Number(p.buyPrice).toLocaleString()} <span className="text-[10px] text-slate-400">{p.buyCurrency}</span>
                                </td>
                            )}
                            <td className="p-5 text-right text-emerald-600">
                                {Number(p.salePrice).toLocaleString()} <span className="text-[10px] text-emerald-400">{p.saleCurrency}</span>
                            </td>
                            <td className={`p-5 text-center ${p.quantity === 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                                <span className={`px-3 py-1 rounded-lg ${p.quantity === 0 ? 'bg-rose-50' : 'bg-slate-100'}`}>{p.quantity}</span>
                            </td>
                            <td className="p-5">
                                <div className="flex justify-center gap-1.5">
                                    <button onClick={() => openCalculator(p.salePrice, p.saleCurrency)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Kalkulyator"><CalcIcon size={16}/></button>
                                    <button onClick={() => handleOpenPrintModal(p)} className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all" title="QR Kod chiqarish"><Printer size={16}/></button>
                                    {isDirector && (<button onClick={() => setDeleteModal({ isOpen: true, productId: p.id })} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={16}/></button>)}
                                    <button onClick={() => { setSelectedProduct(p); setIsDetailsOpen(true); }} className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white rounded-xl transition-all" title="Batafsil ma'lumot"><Info size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={isDirector ? "8" : "7"} className="p-20 text-center text-slate-300 font-bold">Mahsulot topilmadi</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- BATAFSIL (KIRIM TARIXI) MODALI --- */}
      {isDetailsOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Package className="text-indigo-600"/> {selectedProduct.name}</h2>
                        <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">ID: #{selectedProduct.customId}</p>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={24} /></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <h3 className="font-black text-slate-700 mb-4 uppercase text-xs tracking-widest">Aktiv Kirim Partiyalari:</h3>
                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
                                <tr>
                                    <th className="p-4">Sana</th>
                                    <th className="p-4">Ta'minotchi / Faktura</th>
                                    <th className="p-4 text-center">Boshlang'ich</th>
                                    <th className="p-4 text-center">Qoldiq</th>
                                    {/* YANGI QO'SHILGAN USTUN: FAQAT DIREKTOR UCHUN */}
                                    {isDirector && <th className="p-4 text-right text-amber-600">Kirim Narxi</th>}
                                    {isDirector && <th className="p-4 text-right">Amal</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold">
                                {selectedProduct.batches && selectedProduct.batches.filter(b => !b.isArchived).length > 0 ? (
                                    selectedProduct.batches.filter(b => !b.isArchived).map((batch) => (
                                        <tr key={batch.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 text-slate-500">{new Date(batch.createdAt).toLocaleDateString('uz-UZ')}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{batch.supplierName || "Boshlang'ich qoldiq"}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-widest">
                                                    {batch.invoiceNumber ? `Faktura: #${batch.invoiceNumber}` : `Partiya ID: P-${batch.id}`}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-slate-400">{batch.initialQty}</td>
                                            <td className="p-4 text-center">{batch.quantity === 0 ? <span className="text-rose-500 text-[10px] bg-rose-50 px-2 py-1 rounded-md uppercase font-black tracking-tighter">Tugagan</span> : batch.quantity}</td>
                                            
                                            {/* YANGI QO'SHILGAN QATOR: FAQAT DIREKTOR UCHUN (NARX VA VALYUTA) */}
                                            {isDirector && (
                                                <td className="p-4 text-right text-amber-700 bg-amber-50/20">
                                                    {Number(batch.buyPrice).toLocaleString()} <span className="text-[10px] text-amber-400">{batch.buyCurrency || 'UZS'}</span>
                                                </td>
                                            )}
                                            
                                            {isDirector && (
                                              <td className="p-4 text-right">
                                                  <button 
                                                      onClick={() => promptArchiveBatch(batch.id)} // DIQQAT: Sizda bu funksiya yuqorida executeArchiveBatch ga o'zgartirilgan bo'lishi mumkin, o'zingiznikiga moslang
                                                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                                      title="Ro'yxatdan yashirish"
                                                  >
                                                      <EyeOff size={18}/>
                                                  </button>
                                              </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={isDirector ? "6" : "4"} className="p-10 text-center text-slate-300 uppercase font-black text-xs">Aktiv partiyalar yo'q</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50"><button onClick={() => setIsDetailsOpen(false)} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-100 transition-all">YOPISH</button></div>
            </div>
        </div>
      )}

      {/* --- QR PRINT MODAL (FAQAT ARXIVLANMAGAN VA QOLDIG'I BORLAR) --- */}
      {printProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-5">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight"><Printer className="text-blue-600"/> Partiya tanlang</h2>
                        <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-wider">{printProduct.name}</p>
                    </div>
                    <button onClick={() => setPrintProduct(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                    {printProduct.batches && printProduct.batches.filter(b => b.quantity > 0 && !b.isArchived).length > 0 ? (
                        printProduct.batches.filter(b => b.quantity > 0 && !b.isArchived).map(batch => (
                            <div 
                                key={batch.id} 
                                onClick={() => setSelectedBatch(batch)}
                                className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center group ${selectedBatch?.id === batch.id ? 'border-blue-600 bg-blue-50/50 shadow-md ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-all ${selectedBatch?.id === batch.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}><Layers size={22}/></div>
                                    <div>
                                        <div className="font-black text-slate-800 text-base">Partiya ID: #{batch.id}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{new Date(batch.createdAt).toLocaleDateString('uz-UZ')} dagi kirim</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-blue-600">{batch.quantity} {printProduct.unit}</div>
                                    <div className="text-[10px] text-slate-300 font-black uppercase tracking-tighter">Hozir bor</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <AlertTriangle className="mx-auto text-amber-400 mb-2" size={32}/>
                            <p className="text-slate-400 font-bold text-sm">Sotuvda aktiv partiyalar yo'q!</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={() => setPrintProduct(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200">BEKOR QILISH</button>
                    <button onClick={handleFinalPrint} disabled={!selectedBatch} className={`flex-1 py-4 rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 transition-all ${selectedBatch ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                        <Printer size={20}/> CHOP ETISH
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- O'CHIRISHNI TASDIQLASH (DELETE PRODUCT) --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 text-rose-500 rotate-3 shadow-lg shadow-rose-100"><AlertTriangle size={40} strokeWidth={2.5} /></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">O'chirilsinmi?</h3>
                <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed px-2">Bu mahsulot tizimdan butunlay o'chib ketadi. Buni ortga qaytarib bo'lmaydi!</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({ isOpen: false, productId: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs">Bekor qilish</button>
                    <button onClick={() => executeDelete(deleteModal.productId)} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest">O'CHIRISH</button>
                </div>
            </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* --- YANGI: PARTIYANI ARXIVLASH (YASHIRISH) TASDIQLASH MODALI --- */}
      {/* ============================================================== */}
      {archiveModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-amber-50 text-amber-500 rotate-3 shadow-lg shadow-amber-100">
                    <EyeOff size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Yashirilsinmi?</h3>
                <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed px-2">
                    Bu partiya barcha ro'yxatlardan yashiriladi, lekin tizim xotirasida (arxivda) saqlanib qoladi.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setArchiveModal({ isOpen: false, batchId: null })} 
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs"
                    >
                        BEKOR QILISH
                    </button>
                    <button 
                        onClick={executeArchiveBatch} 
                        className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        YASHIRISH
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MUVAFFAQIYATLI QO'SHILDI ANIMATSIYASI --- */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 text-center animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-12 border border-slate-100">
                <div className="relative w-28 h-28 mx-auto mb-8">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-28 h-28 bg-emerald-500 rounded-[35px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 rotate-3 transition-transform"><CheckCircle size={56} strokeWidth={2.5} /></div>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">Bajarildi!</h3>
                <p className="text-slate-400 font-bold text-sm px-4 leading-relaxed uppercase tracking-widest">Ombor yangilandi.</p>
                <div className="mt-10 px-4"><div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full animate-progress-line w-full"></div></div></div>
            </div>
        </div>
      )}

      {/* --- TOVAR QO'SHISH MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800">Yangi tovar qo'shish</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tovar nomi *</label>
                            <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Masalan: iPhone 15 Pro" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kategoriya *</label>
                            <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                                <option value="">Tanlang...</option>
                                {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <label className="block text-xs font-black text-amber-700 uppercase mb-2">Kirim Narxi va Valyuta</label>
                            <div className="flex gap-2">
                                <input type="number" className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900" value={formData.buyPrice} onChange={e=>setFormData({...formData, buyPrice: e.target.value})} placeholder="0" />
                                <select className="w-24 p-3 bg-white border border-amber-200 rounded-xl font-bold text-amber-900 outline-none" value={formData.buyCurrency} onChange={e=>setFormData({...formData, buyCurrency: e.target.value})}>
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <label className="block text-xs font-black text-emerald-700 uppercase mb-2">Sotuv Narxi va Valyuta</label>
                            <div className="flex gap-2">
                                <input type="number" className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900" value={formData.salePrice} onChange={e=>setFormData({...formData, salePrice: e.target.value})} placeholder="0" />
                                <select className="w-24 p-3 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-900 outline-none" value={formData.saleCurrency} onChange={e=>setFormData({...formData, saleCurrency: e.target.value})}>
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Boshlang'ich soni (Qoldiq)</label>
                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">O'lchov birligi</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})}>
                                <option value="Dona">Dona</option>
                                <option value="Kg">Kg</option>
                                <option value="Metr">Metr</option>
                                <option value="To'plam">To'plam</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2">
                        <Save size={20} /> Tovarni Saqlash
                    </button>
                </form>
            </div>
        </div>
      )}

      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} initialTotal={calcInitialPrice} initialCurrency={calcInitialCurrency} />
    </div>
  );
};


export default Sklad;






