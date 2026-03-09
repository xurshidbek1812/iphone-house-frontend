import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, ChevronRight, Search, User, 
  X, Briefcase, Users, ShoppingCart, Calendar, Save, 
  CheckCircle, Plus, Trash2, ScanLine
} from 'lucide-react';
import toast from 'react-hot-toast';

// QIDIRUV KOMPONENTI
const SearchableSelect = ({ placeholder, onSelect, excludeIds = [], customers = [] }) => {
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
        if (excludeIds.includes(c.id)) return false;
        const text = `${c.firstName} ${c.lastName} ${c.pinfl} ${c.document?.number || ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 hover:bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all" onClick={() => setIsOpen(true)}>
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
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {customer.id}</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">JSHSHIR: {customer.pinfl}</span>
                                </div>
                            </div>
                        ))
                    ) : (<div className="p-4 text-center text-gray-400 text-sm">Mijoz topilmadi</div>)}
                </div>
            )}
        </div>
    );
};

const AddContract = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);

  const token = localStorage.getItem('token');
  
  // Skaner uchun Reference
  const barcodeInputRef = useRef(null);

  const [contractData, setContractData] = useState({
    mainCustomer: null,     
    coBorrowers: [],         
    staffId: '',             
    items: [],               
    duration: 12,            
    prepayment: 0,           
    paymentDay: 1,           
    hasBonus: true,
    bonusPercent: 0,
    note: ''
  });

  const [productTab, setProductTab] = useState('catalog'); 
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, staffRes, prodRes] = await Promise.all([
            fetch('https://iphone-house-api.onrender.com/api/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('https://iphone-house-api.onrender.com/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('https://iphone-house-api.onrender.com/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (custRes.ok) { const d = await custRes.json(); setCustomers(Array.isArray(d) ? d : []); }
        if (staffRes.ok) { const d = await staffRes.json(); setStaffList(Array.isArray(d) ? d : []); }
        if (prodRes.ok) { const d = await prodRes.json(); setProducts(Array.isArray(d) ? d : []); }
      } catch (err) {
        toast.error("Ma'lumotlarni yuklashda xatolik!");
      }
    };
    fetchData();
  }, [token]);

  // Hisob-kitoblar
  const grandTotal = contractData.items.reduce((sum, item) => sum + ((Number(item.salePrice) || 0) * item.qty), 0);
  const debtAmount = Math.max(0, grandTotal - Number(contractData.prepayment || 0));
  const monthlyPayment = contractData.duration > 0 ? (debtAmount / contractData.duration) : 0;

  const generateSchedule = () => {
      let schedule = [];
      let currentDate = new Date();
      for(let i = 1; i <= contractData.duration; i++) {
          currentDate.setMonth(currentDate.getMonth() + 1);
          let d = new Date(currentDate.getFullYear(), currentDate.getMonth(), contractData.paymentDay);
          if (d.getMonth() !== currentDate.getMonth()) {
              d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
          }
          schedule.push({
              month: i,
              date: d.toLocaleDateString('ru-RU'),
              amount: monthlyPayment
          });
      }
      return schedule;
  };

  // Logika
  const selectMainCustomer = (customer) => setContractData(prev => ({ ...prev, mainCustomer: customer }));
  const addCoBorrower = (customer) => setContractData(prev => ({ ...prev, coBorrowers: [...prev.coBorrowers, customer] }));
  const removeCoBorrower = (id) => setContractData(prev => ({ ...prev, coBorrowers: prev.coBorrowers.filter(c => c.id !== id) }));

  // --- YANGI: SHTRIX KODNI O'QISH ---
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

  const addProductToCart = (product) => {
      if (product.quantity <= 0) return toast.error("Bazada qoldiq yo'q!");
      
      const existingItem = contractData.items.find(i => i.id === product.id);
      if (existingItem) {
          if (existingItem.qty + 1 > product.quantity) return toast.error("Ombordagi qoldiqdan oshib ketdi!");
          setContractData(prev => ({
              ...prev, 
              items: prev.items.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
          }));
          toast.success(`${product.name} soni oshirildi`);
      } else {
          setContractData(prev => ({ ...prev, items: [...prev.items, { ...product, qty: 1 }] }));
          toast.success(`${product.name} savatga qo'shildi`);
      }
  };

  const updateItemQty = (id, newQty) => {
      const product = products.find(p => p.id === id);
      if (newQty > product.quantity) return toast.error(`Bazada faqat ${product.quantity} ta bor!`);
      if (newQty < 1) return;
      setContractData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, qty: newQty } : item) }));
  };

  const removeItem = (id) => setContractData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  const handleNext = () => {
      if (step === 1 && (!contractData.mainCustomer || !contractData.staffId)) return toast.error("Asosiy mijoz va xodimni tanlang!");
      if (step === 2 && contractData.items.length === 0) return toast.error("Kamida 1 ta tovar tanlang!");
      if (step === 3 && (contractData.prepayment > grandTotal)) return toast.error("Oldindan to'lov umumiy summadan ko'p bo'lolmaydi!");
      
      if (step < 4) {
          setStep(step + 1);
          // Skanerga avtomat fokus qaratish
          if (step === 1) setTimeout(() => barcodeInputRef.current?.focus(), 100);
      } else {
          submitContract();
      }
  };

  // --- HAQIQIY BAZAGA YUBORISH ---
  const submitContract = async () => {
      setIsLoading(true);
      try {
          const payload = {
              customerId: contractData.mainCustomer.id,
              staffId: contractData.staffId,
              durationMonths: contractData.duration,
              totalAmount: grandTotal,
              prepayment: contractData.prepayment,
              debtAmount: debtAmount,
              items: contractData.items
          };

          const res = await fetch('https://iphone-house-api.onrender.com/api/contracts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              toast.success("Shartnoma muvaffaqiyatli saqlandi!");
              navigate('/shartnoma/ro-yxati');
          } else {
              toast.error("Xatolik yuz berdi");
          }
      } catch (err) {
          toast.error("Server xatosi");
      } finally {
          setIsLoading(false);
      }
  };

  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.customId.toString().includes(productSearch)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600"/></button>
            <h1 className="text-xl font-bold text-gray-800">Yangi shartnoma rasmiylashtirish</h1>
         </div>
         <button onClick={() => navigate(-1)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Bekor qilish</button>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            {contractData.mainCustomer && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group animate-in fade-in slide-in-from-left-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                <User size={14}/> Asosiy Mijoz
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded">ID: {contractData.mainCustomer.id}</span>
                        </div>
                        <h3 className="font-black text-gray-800 text-lg leading-tight uppercase mb-4">{contractData.mainCustomer.lastName} <br/> {contractData.mainCustomer.firstName}</h3>
                    </div>
                </div>
            )}

            {contractData.coBorrowers.map((co, idx) => (
                <div key={co.id} className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 relative overflow-hidden animate-in fade-in">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                            <Users size={14}/> Qarz oluvchi #{idx + 1}
                        </div>
                        <button onClick={() => removeCoBorrower(co.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm uppercase">{co.lastName} {co.firstName}</h3>
                </div>
            ))}

            {contractData.items.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg text-white animate-in slide-in-from-bottom-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14}/> Shartnoma summasi</h3>
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Jami tovarlar:</span>
                            <span className="font-bold">{contractData.items.reduce((s, i) => s + i.qty, 0)} ta</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Tannarx:</span>
                            <span className="font-bold">{grandTotal.toLocaleString()} UZS</span>
                        </div>
                        {step >= 3 && contractData.prepayment > 0 && (
                            <div className="flex justify-between text-sm text-emerald-400 border-t border-gray-700 pt-3">
                                <span>Oldindan to'lov:</span>
                                <span className="font-bold">- {Number(contractData.prepayment).toLocaleString()} UZS</span>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-600 pt-4 mt-2">
                        <p className="text-gray-400 text-[11px] uppercase mb-1">Qolgan qarz miqdori</p>
                        <p className="text-2xl font-black text-white">{debtAmount.toLocaleString()} <span className="text-sm font-normal text-gray-400">UZS</span></p>
                    </div>
                </div>
            )}
        </div>

        {/* ASOSIY OYNA */}
        <div className="lg:col-span-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-6 right-6 h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-6 h-1 bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                    
                    {[
                        { num: 1, icon: User, label: "Mijoz" },
                        { num: 2, icon: ShoppingCart, label: "Tovarlar" },
                        { num: 3, icon: Calendar, label: "Muddat" },
                        { num: 4, icon: CheckCircle, label: "Tasdiq" }
                    ].map(s => (
                        <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-sm font-bold border-2 transition-all duration-300 ${step === s.num ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : step > s.num ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-200 text-gray-400'}`}>
                                {step > s.num ? <Check size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${step >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* QADAMLAR */}
            {step === 1 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8">
                    <h2 className="text-xl font-black text-gray-800 mb-6">Shartnoma subyektlari</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Asosiy mijozni tanlang *</label>
                            {!contractData.mainCustomer ? (
                                <SearchableSelect placeholder="Ism yoki JSHSHIR bo'yicha qidiring..." onSelect={selectMainCustomer} excludeIds={contractData.coBorrowers.map(c => c.id)} customers={customers} />
                            ) : (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-emerald-800 font-medium">
                                    <div className="flex items-center gap-3"><CheckCircle className="text-emerald-500" size={20}/> Mijoz tanlandi</div>
                                    <button onClick={() => setContractData(prev => ({...prev, mainCustomer: null}))} className="text-emerald-600 hover:text-emerald-800 text-sm font-bold underline">Boshqa tanlash</button>
                                </div>
                            )}
                        </div>
                        <div className="pt-6 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Birgalikda qarz oluvchilar (Ixtiyoriy)</label>
                            <SearchableSelect placeholder="Qo'shimcha javobgarlarni qo'shish..." onSelect={addCoBorrower} excludeIds={[contractData.mainCustomer?.id, ...contractData.coBorrowers.map(c => c.id)].filter(Boolean)} customers={customers} />
                        </div>
                        <div className="pt-6 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Jalb qilgan xodim (Sotuvchi) *</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                                <select className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none font-medium appearance-none transition-colors ${contractData.staffId ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-700 focus:bg-white focus:border-blue-500'}`} value={contractData.staffId} onChange={(e) => setContractData(prev => ({...prev, staffId: e.target.value}))}>
                                    <option value="">Ro'yxatdan xodimni tanlang...</option>
                                    {staffList.map(user => (<option key={user.id} value={user.id}>{user.fullName} ({user.role})</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px] animate-in slide-in-from-right-8">
                    
                    {/* YAngilangan Skaner inputi (Eng tepadagi asosiy joyda) */}
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

                    <div className="flex border-b border-gray-100 bg-white">
                        <button onClick={() => setProductTab('catalog')} className={`flex-1 py-3 text-sm font-bold transition-colors ${productTab === 'catalog' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>Katalog (Qidiruv)</button>
                        <button onClick={() => setProductTab('cart')} className={`flex-1 py-3 text-sm font-bold transition-colors relative ${productTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>
                            Savat <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{contractData.items.length}</span>
                        </button>
                    </div>

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
                                            const isAdded = contractData.items.some(i => i.id === p.id);
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

                    {productTab === 'cart' && (
                        <div className="p-4 flex flex-col flex-1 overflow-hidden bg-gray-50/50">
                            {contractData.items.length === 0 ? (
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
                                            {contractData.items.map(item => (
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

            {step === 3 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8">
                    <h2 className="text-xl font-black text-gray-800 mb-6">To'lov grafigi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Necha oyga?</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[3, 6, 9, 12, 15, 18].map(m => (
                                        <button key={m} onClick={() => setContractData(prev => ({...prev, duration: m}))} className={`py-3 rounded-xl font-black transition-all ${contractData.duration === m ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>{m}</button>
                                    ))}
                                    <div className="col-span-2"><input type="number" placeholder="Boshqa" value={contractData.duration} onChange={(e) => setContractData(prev => ({...prev, duration: Number(e.target.value)}))} className="w-full h-full p-3 border border-gray-200 rounded-xl outline-blue-500 text-center font-bold bg-gray-50"/></div>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Boshlang'ich to'lov (UZS)</label><input type="number" value={contractData.prepayment} onChange={(e) => setContractData(prev => ({...prev, prepayment: Number(e.target.value)}))} className="w-full p-3 border rounded-xl outline-blue-500 font-bold text-lg text-emerald-600" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">To'lov sanasi (Har oyning)</label><div className="flex items-center gap-2"><input type="number" min="1" max="31" value={contractData.paymentDay} onChange={(e) => setContractData(prev => ({...prev, paymentDay: Number(e.target.value)}))} className="w-20 p-3 border rounded-xl outline-blue-500 font-bold text-center" /> <span>- sanasi</span></div></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-1 rounded-xl border border-gray-200 flex flex-col h-full max-h-[400px]">
                            <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl flex justify-between items-center">
                                <span className="font-bold text-gray-700">Grafik</span>
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Oylik: {Math.round(monthlyPayment).toLocaleString()} UZS</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-gray-400 uppercase sticky top-0 bg-gray-50"><tr><th className="py-2 px-3">Oy</th><th className="py-2 px-3">Sana</th><th className="py-2 px-3 text-right">Summa</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100 font-medium">
                                        {generateSchedule().map(row => (
                                            <tr key={row.month} className="hover:bg-white"><td className="py-2 px-3 text-gray-500">{row.month}</td><td className="py-2 px-3 text-gray-800">{row.date}</td><td className="py-2 px-3 text-right text-gray-800">{Math.round(row.amount).toLocaleString()}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8">
                    <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><CheckCircle className="text-emerald-500"/> Yakuniy tasdiq</h2>
                    <div className="space-y-6 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maxsus izoh</label>
                            <textarea value={contractData.note} onChange={(e) => setContractData(prev => ({...prev, note: e.target.value}))} rows="4" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="Izoh (ixtiyoriy)..."></textarea>
                        </div>
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
                    className={`px-10 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg ${step === 4 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? "Kuting..." : (step === 4 ? <><Save size={20}/> Saqlash</> : <>Davom etish <ChevronRight size={20}/></>)}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddContract;
