import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Search, User, X, ShoppingCart, Save, ScanLine, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const SearchableSelect = ({ placeholder, onSelect, customers = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredCustomers = customers.filter(c => {
        const text = `${c.firstName} ${c.lastName} ${c.pinfl} ${c.document?.number || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 cursor-text focus-within:ring-2 focus-within:ring-blue-500 transition-all" onClick={() => setIsOpen(true)}>
                <Search className="text-gray-400 mr-2" size={20} />
                <input type="text" className="w-full outline-none bg-transparent text-gray-700 font-medium placeholder-gray-400" placeholder={placeholder} value={search} onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} />
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <div key={customer.id} onClick={() => { onSelect(customer); setIsOpen(false); setSearch(''); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                                <div className="font-bold text-gray-800 uppercase text-sm">{customer.lastName} {customer.firstName} {customer.middleName}</div>
                                <div className="text-[11px] font-mono text-gray-500 flex gap-3 mt-1">
                                    <span>JSHSHIR: {customer.pinfl}</span>
                                    <span>Tel: {customer.phones?.[0]?.phone || '-'}</span>
                                </div>
                            </div>
                        ))
                    ) : (<div className="p-4 text-center text-gray-400 text-sm">Mijoz topilmadi</div>)}
                </div>
            )}
        </div>
    );
};

const AddCashSale = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const token = sessionStorage.getItem('token');
  const barcodeInputRef = useRef(null); 

  const [saleData, setSaleData] = useState({
      isAnonymous: false,
      mainCustomer: null,
      otherName: '',
      otherPhone: '+998 ',
      items: []
  });

  const [productTab, setProductTab] = useState('catalog'); // 'catalog' yoki 'cart'
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
      const fetchData = async () => {
          try {
              const [custRes, prodRes] = await Promise.all([
                  fetch('https://iphone-house-api.onrender.com/api/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
                  fetch('https://iphone-house-api.onrender.com/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
              ]);
              if (custRes.ok) setCustomers(await custRes.json());
              if (prodRes.ok) setProducts(await prodRes.json());
          } catch (err) { toast.error("Xatolik"); }
      };
      fetchData();
  }, [token]);

  const handleBarcodeScan = (e) => {
      if (e.key === 'Enter' && e.target.value.trim() !== '') {
          const code = e.target.value.trim();
          const foundProduct = products.find(p => p.customId.toString() === code || p.id.toString() === code);
          
          if (foundProduct) {
              addProductToCart(foundProduct);
          } else {
              toast.error(`Kod [${code}] bo'yicha tovar topilmadi!`);
          }
          e.target.value = '';
          barcodeInputRef.current?.focus();
      }
  };

  const grandTotal = saleData.items.reduce((sum, item) => sum + ((Number(item.salePrice) || 0) * item.qty), 0);

  const addProductToCart = (product) => {
      if (product.quantity <= 0) return toast.error("Omborda qoldiq yo'q!");
      
      const existingItem = saleData.items.find(i => i.id === product.id);
      if (existingItem) {
          if (existingItem.qty + 1 > product.quantity) return toast.error("Ombordagi qoldiqdan oshib ketdi!");
          setSaleData(prev => ({
              ...prev, 
              items: prev.items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
          }));
          toast.success(`${product.name} soni oshirildi`);
      } else {
          setSaleData(prev => ({ ...prev, items: [...prev.items, { ...product, qty: 1 }] }));
          toast.success(`${product.name} savatga qo'shildi`);
      }
  };

  const updateItemQty = (id, newQty) => {
      const product = products.find(p => p.id === id);
      if (newQty > product.quantity) return toast.error(`Faqat ${product.quantity} ta qoldi!`);
      if (newQty < 1) return;
      setSaleData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, qty: newQty } : item) }));
  };

  const removeItem = (id) => setSaleData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  const handleNext = () => {
      if (step === 1 && !saleData.isAnonymous && !saleData.mainCustomer) return toast.error("Mijozni tanlang yoki 'Boshqa shaxs' ni tanlang!");
      if (step === 1 && saleData.isAnonymous && !saleData.otherName) return toast.error("Xaridor ismini yozing!");
      if (step === 2 && saleData.items.length === 0) return toast.error("Savat bo'sh! Tovar qo'shing.");
      
      if (step < 3) {
          setStep(step + 1);
          if (step === 1) setTimeout(() => barcodeInputRef.current?.focus(), 100);
      } else {
          submitSale();
      }
  };

  const submitSale = async () => {
      setIsLoading(true);
      try {
          const payload = {
              isAnonymous: saleData.isAnonymous,
              customerId: saleData.mainCustomer?.id,
              otherName: saleData.otherName,
              otherPhone: saleData.otherPhone,
              totalAmount: grandTotal,
              items: saleData.items
          };

          const res = await fetch('https://iphone-house-api.onrender.com/api/cash-sales', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              toast.success("Naqd savdo saqlandi!");
              navigate('/naqd-savdo/ro-yxati');
          } else {
              toast.error("Saqlashda xatolik");
          }
      } catch (err) { toast.error("Server xatosi"); } 
      finally { setIsLoading(false); }
  };

  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.customId.toString().includes(productSearch)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-gray-600"/></button>
            <h1 className="text-xl font-bold text-gray-800">Naqd savdo qo'shish</h1>
         </div>
         <button onClick={() => navigate(-1)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Bekor qilish</button>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-4">
                    <User size={14}/> Xaridor
                </div>
                {saleData.isAnonymous ? (
                    <div>
                        <h3 className="font-black text-gray-800 text-lg uppercase mb-1">{saleData.otherName || 'Kiritilmagan'}</h3>
                        <p className="text-sm font-mono text-gray-500">{saleData.otherPhone}</p>
                    </div>
                ) : saleData.mainCustomer ? (
                    <div>
                        <h3 className="font-black text-gray-800 text-lg leading-tight uppercase mb-2">{saleData.mainCustomer.lastName} <br/> {saleData.mainCustomer.firstName}</h3>
                        <p className="text-sm font-mono text-gray-500">{saleData.mainCustomer.phones?.[0]?.phone || 'Tel kiritilmagan'}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">Mijoz tanlanmagan</p>
                )}
            </div>

            {saleData.items.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14}/> Jami Savdo</h3>
                    <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-300">Tovarlar soni:</span>
                        <span className="font-bold">{saleData.items.reduce((s, i) => s + i.qty, 0)} ta</span>
                    </div>
                    <div className="border-t border-gray-600 pt-4 mt-2">
                        <p className="text-gray-400 text-[11px] uppercase mb-1">To'lanadigan summa</p>
                        <p className="text-3xl font-black text-emerald-400">{grandTotal.toLocaleString()} <span className="text-sm font-normal text-emerald-600">UZS</span></p>
                    </div>
                </div>
            )}
        </div>

        {/* ASOSIY OYNA */}
        <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-center items-center relative max-w-sm mx-auto">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-4 h-1 bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold border-2 transition-all mx-auto bg-white ${step >= s ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-400'}`}>
                            {step > s ? <Check size={16} /> : s}
                        </div>
                    ))}
                </div>
            </div>

            {/* QADAM 1: MIJOZ TANLASH */}
            {step === 1 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8">
                    <div className="flex gap-6 p-2 bg-gray-50 rounded-xl mb-6 w-fit">
                        <button onClick={() => setSaleData(prev => ({...prev, isAnonymous: false}))} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${!saleData.isAnonymous ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Bazada bor Mijoz</button>
                        <button onClick={() => setSaleData(prev => ({...prev, isAnonymous: true}))} className={`px-6 py-2.5 rounded-lg font-bold transition-all ${saleData.isAnonymous ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Boshqa shaxs (Anonim)</button>
                    </div>

                    {!saleData.isAnonymous ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Bazada bor mijozni qidiring</label>
                            <SearchableSelect placeholder="Ism, familiya yoki pasport..." onSelect={(c) => setSaleData(prev => ({...prev, mainCustomer: c}))} customers={customers} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xaridor ism-familiyasi</label><input type="text" value={saleData.otherName} onChange={(e) => setSaleData(prev => ({...prev, otherName: e.target.value}))} className="w-full p-3 border rounded-xl outline-blue-500 bg-white" placeholder="Masalan: Alisher"/></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefon raqami (Ixtiyoriy)</label><input type="text" value={saleData.otherPhone} onChange={(e) => setSaleData(prev => ({...prev, otherPhone: e.target.value}))} className="w-full p-3 border rounded-xl outline-blue-500 bg-white font-mono" placeholder="+998"/></div>
                        </div>
                    )}
                </div>
            )}

            {/* QADAM 2: TOVARLAR (SKANER VA KATALOG BIKGA) */}
            {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px] animate-in slide-in-from-right-8">
                    
                    {/* DOIMIY SKANER INPUTI */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                        <div className="relative max-w-lg mx-auto">
                            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={24}/>
                            <input 
                                ref={barcodeInputRef}
                                type="text" 
                                placeholder="Shtrix kodni skanerlang yoki yozing..." 
                                onKeyDown={handleBarcodeScan}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-300 focus:border-blue-600 rounded-xl outline-none shadow-sm font-mono text-lg transition-colors"
                            />
                        </div>
                    </div>

                    {/* TABLAR */}
                    <div className="flex border-b border-gray-100 bg-white">
                        <button onClick={() => setProductTab('catalog')} className={`flex-1 py-3 text-sm font-bold transition-colors ${productTab === 'catalog' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>Katalog (Qidiruv)</button>
                        <button onClick={() => setProductTab('cart')} className={`flex-1 py-3 text-sm font-bold transition-colors relative ${productTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>
                            Tanlangan tovarlar
                            {saleData.items.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{saleData.items.length}</span>}
                        </button>
                    </div>

                    {/* KATALOG QISMI */}
                    {productTab === 'catalog' && (
                        <div className="p-4 flex flex-col flex-1 overflow-hidden bg-white">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" placeholder="Nomi bo'yicha tezkor qidiruv..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 sticky top-0 text-[11px] text-gray-500 uppercase">
                                        <tr><th className="p-3">Nomi va Kod</th><th className="p-3 text-center">Qoldiq</th><th className="p-3 text-right">Narxi (UZS)</th><th className="p-3 text-center"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredProducts.map(p => {
                                            const isAdded = saleData.items.some(i => i.id === p.id);
                                            return (
                                                <tr key={p.id} className={`hover:bg-blue-50 transition-colors ${isAdded ? 'bg-blue-50/30' : ''}`}>
                                                    <td className="p-3">
                                                        <div className="font-bold text-gray-800">{p.name}</div>
                                                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">#{p.customId}</div>
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-blue-600">{p.quantity}</td>
                                                    <td className="p-3 text-right font-bold text-gray-800">{Number(p.salePrice).toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <button disabled={p.quantity <= 0} onClick={() => addProductToCart(p)} className={`p-2 rounded-lg transition-colors ${isAdded ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                                                            {isAdded ? <Check size={18}/> : <Plus size={18}/>}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SAVAT QISMI */}
                    {productTab === 'cart' && (
                        <div className="p-4 flex flex-col flex-1 overflow-hidden bg-gray-50/50">
                            {saleData.items.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingCart size={48} className="mb-4 opacity-20"/>
                                    <p className="font-medium text-lg">Savat bo'sh. Shtrix kod ishlating yoki katalogdan tanlang.</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar border bg-white border-gray-100 rounded-xl shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 sticky top-0 text-[10px] text-gray-500 uppercase">
                                            <tr><th className="p-3">Nomi</th><th className="p-3 w-28 text-center">Soni</th><th className="p-3 text-right">Dona Narxi</th><th className="p-3 text-right">Jami (UZS)</th><th className="p-3 text-center"></th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {saleData.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="p-3 font-bold text-gray-800">{item.name}</td>
                                                    <td className="p-3 text-center">
                                                        <input type="number" min="1" max={item.quantity} value={item.qty} onChange={(e) => updateItemQty(item.id, Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-center outline-blue-500 font-bold bg-gray-50 focus:bg-white"/>
                                                    </td>
                                                    <td className="p-3 text-right text-gray-600 font-medium">{Number(item.salePrice).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-black text-blue-600">{(Number(item.salePrice) * item.qty).toLocaleString()}</td>
                                                    <td className="p-3 text-center"><button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* QADAM 3: TASDIQLASH (PUL TO'LASH) */}
            {step === 3 && (
                <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center animate-in slide-in-from-right-8">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">To'lovni qabul qiling</h2>
                    <p className="text-gray-500 mb-8">Mijoz quyidagi summani to'liq kiritishini tasdiqlaysizmi?</p>
                    
                    <div className="bg-gray-800 text-white p-8 rounded-2xl max-w-sm mx-auto shadow-2xl mb-8 transform -rotate-2">
                        <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-2">Jami to'lov summasi</p>
                        <p className="text-4xl font-black">{grandTotal.toLocaleString()} UZS</p>
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-end gap-4">
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)} className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">Orqaga</button>
                )}
                <button 
                    onClick={handleNext} 
                    disabled={isLoading}
                    className={`px-10 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg ${step === 3 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? "Kuting..." : (step === 3 ? <><Save size={20}/> Tasdiqlash</> : <>Davom etish <ChevronRight size={20}/></>)}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddCashSale;
