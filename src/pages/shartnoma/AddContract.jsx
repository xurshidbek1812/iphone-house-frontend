import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, ChevronRight, Search, User, 
  X, Briefcase, Users, AlertCircle 
} from 'lucide-react';

const AddContract = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Ma'lumotlar bazasi
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Tanlangan ma'lumotlar
  const [contractData, setContractData] = useState({
    mainCustomer: null,     // Asosiy mijoz 
    staffId: '',            // Xodim ID
    coBorrowers: []         // Birgalikda qarz oluvchilar 
  });

  // API dan yuklash
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, staffRes] = await Promise.all([
            fetch('https://iphone-house-api.onrender.com/api/customers'),
            fetch('https://iphone-house-api.onrender.com/api/users')
        ]);
        const custData = await custRes.json();
        const staffData = await staffRes.json();
        setCustomers(custData);
        setStaffList(staffData);
      } catch (err) {
        console.error("Ma'lumot yuklashda xatolik");
      }
    };
    fetchData();
  }, []);

  // --- LOGIKA ---
  const selectMainCustomer = (customer) => {
    if (contractData.coBorrowers.some(c => c.id === customer.id)) {
        alert("Bu mijoz allaqachon birgalikda qarz oluvchilar ro'yxatida bor!");
        return;
    }
    setContractData(prev => ({ ...prev, mainCustomer: customer }));
  };

  const addCoBorrower = (customer) => {
    if (contractData.mainCustomer && contractData.mainCustomer.id === customer.id) {
        alert("Asosiy mijozni o'zini birgalikda qarz oluvchi qilib bo'lmaydi!");
        return;
    }
    if (contractData.coBorrowers.some(c => c.id === customer.id)) {
        alert("Bu mijoz allaqachon qo'shilgan!");
        return;
    }
    setContractData(prev => ({ ...prev, coBorrowers: [...prev.coBorrowers, customer] }));
  };

  const removeCoBorrower = (id) => {
    setContractData(prev => ({ ...prev, coBorrowers: prev.coBorrowers.filter(c => c.id !== id) }));
  };

  // --- QIDIRUV KOMPONENTI ---
  const SearchableSelect = ({ placeholder, onSelect, excludeIds = [] }) => {
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
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500" onClick={() => setIsOpen(true)}>
                <Search className="text-gray-400 mr-2" size={20} />
                <input type="text" className="w-full outline-none text-gray-700 placeholder-gray-400" placeholder={placeholder} value={search} onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} />
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <div key={customer.id} onClick={() => { onSelect(customer); setIsOpen(false); setSearch(''); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0">
                                <div className="font-bold text-gray-800 uppercase">{customer.lastName} {customer.firstName} {customer.middleName}</div>
                                <div className="text-xs text-gray-500 flex gap-3 mt-1"><span>ID: {customer.id}</span><span>Pass: {customer.document?.series} {customer.document?.number}</span></div>
                            </div>
                        ))
                    ) : (<div className="p-4 text-center text-gray-500 text-sm">Mijoz topilmadi</div>)}
                </div>
            )}
        </div>
    );
  };

  // --- KARTA UI ---
  const CustomerCard = ({ customer, onRemove, title }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col md:flex-row gap-4 items-center">
        <div className="bg-blue-100 p-3 rounded-full text-blue-600"><User size={24} /></div>
        <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">{title} (ID: {customer.id})</div>
            <h3 className="text-lg font-bold text-gray-900 uppercase">{customer.lastName} {customer.firstName}</h3>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span className="font-medium">Pass: {customer.document?.series} {customer.document?.number}</span>
                <span className="font-medium">JSHSHIR: {customer.pinfl}</span>
            </div>
        </div>
        <button onClick={onRemove} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X size={20} /></button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={24} /></button>
            <h1 className="text-2xl font-bold text-gray-800">Shartnoma qo'shish</h1>
         </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
            {[1, 2, 3, 4].map(s => (
                <div key={s} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold border-4 transition-all ${step >= s ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-500'}`}>
                    {step > s ? <Check size={18} /> : s}
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={20} className="text-blue-600"/> 1. Mijoz ma'lumotlari</h2>
                {!contractData.mainCustomer ? (
                    <div className="animate-in fade-in">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mijoz familiyasi, ismi va otasining ismi</label>
                        <SearchableSelect placeholder="Mijozni qidirish..." onSelect={selectMainCustomer} excludeIds={contractData.coBorrowers.map(c => c.id)} />
                    </div>
                ) : (
                    <CustomerCard customer={contractData.mainCustomer} onRemove={() => setContractData(prev => ({ ...prev, mainCustomer: null }))} title="Asosiy mijoz" />
                )}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jalb qilgan xodim</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-3 text-gray-400" size={20}/>
                        <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={contractData.staffId} onChange={(e) => setContractData(prev => ({...prev, staffId: e.target.value}))}>
                            <option value="">Xodimni tanlang...</option>
                            {staffList.map(user => (<option key={user.id} value={user.id}>{user.fullName}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-purple-600"/> 2. Birgalikda qarz oluvchi (Ixtiyoriy)</h2>
                <div className="space-y-4 mb-4">
                    {contractData.coBorrowers.map((coBorrower, index) => (
                        <CustomerCard key={coBorrower.id} customer={coBorrower} onRemove={() => removeCoBorrower(coBorrower.id)} title={`Qarz oluvchi #${index + 1}`} />
                    ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Yana qarz oluvchi qo'shish</label>
                     <SearchableSelect placeholder="Qidirish va qo'shish..." onSelect={addCoBorrower} excludeIds={[contractData.mainCustomer?.id, ...contractData.coBorrowers.map(c => c.id)].filter(Boolean)} />
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium">Ortga qaytish</button>
            <button className={`px-8 py-2.5 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg transition-colors ${contractData.mainCustomer && contractData.staffId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`} disabled={!contractData.mainCustomer || !contractData.staffId} onClick={() => setStep(step + 1)}>Davom etish <ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
};
export default AddContract;