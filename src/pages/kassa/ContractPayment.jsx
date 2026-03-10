import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, FileText, ArrowLeft, MoreVertical, Calendar, Hash, Clock, DollarSign, Package, CreditCard, Printer, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ContractPayment = () => {
    // --- STATE ---
    const [allContracts, setAllContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Qidiruv uchun
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef(null);

    // Tanlangan ma'lumotlar
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerContracts, setCustomerContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    
    // Tablar
    const [leftTab, setLeftTab] = useState('ACTIVE'); // ACTIVE | COMPLETED
    const [rightTab, setRightTab] = useState('general'); // general | payments | schedule | items | comments
    
    // UI
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isCommentLoading, setIsCommentLoading] = useState(false);
    const actionMenuRef = useRef(null);
    const token = sessionStorage.getItem('token');

    // --- EFFECT ---
    useEffect(() => {
        fetchContracts();
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) setIsDropdownOpen(false);
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) setDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- API DAN YUKLASH ---
    const fetchContracts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('https://iphone-house-api.onrender.com/api/contracts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllContracts(data);
                
                // Agar oldin biron shartnoma tanlangan bo'lsa, uni yangilab qo'yish (comment qo'shilganda yangilanishi uchun)
                if (selectedContract) {
                    const updatedContract = data.find(c => c.id === selectedContract.id);
                    if (updatedContract) setSelectedContract(updatedContract);
                }
            } else {
                toast.error("Shartnomalarni yuklashda xatolik");
            }
        } catch (error) {
            toast.error("Server bilan aloqa yo'q");
        } finally {
            setIsLoading(false);
        }
    };

    // --- QIDIRUV MANTIQI ---
    const searchResults = allContracts.filter(c => {
        if (!searchQuery) return false;
        const q = searchQuery.toLowerCase();
        const idMatch = c.id.toString().includes(q);
        const contractNumMatch = c.contractNumber?.toLowerCase().includes(q);
        const nameMatch = `${c.customer?.firstName} ${c.customer?.lastName} ${c.customer?.pinfl}`.toLowerCase().includes(q);
        const phoneMatch = c.customer?.phones?.some(p => p.phone.includes(q));
        
        return idMatch || contractNumMatch || nameMatch || phoneMatch;
    });

    // Noyob mijozlarni ajratib olish (Bir mijoz 2 marta chiqmasligi uchun)
    const uniqueCustomers = [];
    const seenCustomerIds = new Set();
    searchResults.forEach(c => {
        if (!seenCustomerIds.has(c.customerId)) {
            seenCustomerIds.add(c.customerId);
            uniqueCustomers.push(c);
        }
    });

    const handleSelectCustomer = (contractData) => {
        const customer = contractData.customer;
        setSelectedCustomer(customer);
        
        const cContracts = allContracts.filter(c => c.customerId === customer.id);
        setCustomerContracts(cContracts);
        
        // Mijozning oxirgi tuzgan shartnomasini avtomat tanlab qo'yish
        const activeContract = cContracts.find(c => c.status === 'ACTIVE') || cContracts[0];
        setSelectedContract(activeContract);
        setLeftTab(activeContract.status);
        
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const closeCustomer = () => {
        setSelectedCustomer(null);
        setSelectedContract(null);
        setCustomerContracts([]);
        setLeftTab('ACTIVE');
        setRightTab('general');
    };

    // --- YANGI IZOH QO'SHISH ---
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsCommentLoading(true);
        try {
            const res = await fetch(`https://iphone-house-api.onrender.com/api/contracts/${selectedContract.id}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ text: newComment })
            });

            if (res.ok) {
                setNewComment('');
                fetchContracts(); // Ma'lumotlarni qayta yuklaymiz (Izohlar ko'rinishi uchun)
            } else {
                toast.error("Izoh saqlanmadi!");
            }
        } catch (error) {
            toast.error("Server bilan xatolik");
        } finally {
            setIsCommentLoading(false);
        }
    };

    // --- RENDER YORDAMCHILARI ---
    const currentList = customerContracts.filter(c => c.status === leftTab);
    const totalDebt = currentList.reduce((sum, c) => sum + Number(c.debtAmount || 0), 0);

    const getPhone = (customer) => {
        if (!customer) return '-';
        if (customer.phones && customer.phones.length > 0) return customer.phones[0].phone;
        return customer.phone || '-';
    };

    // Sana formatlash yordamchisi
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('uz-UZ')} ${d.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* TEPADAGI QIDIRUV QISMI */}
            {!selectedCustomer && (
                <>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Shartnomaga to'lov olish</h1>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative" ref={searchRef}>
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Mijoz F.I.O, ID raqami, JSHSHIR, Tel yoki Shartnoma raqami..." 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                            />
                            
                            {/* QIDIRUV NATIJALARI (DROPDOWN) */}
                            {isDropdownOpen && searchQuery.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto z-50 custom-scrollbar">
                                    {uniqueCustomers.length > 0 ? (
                                        uniqueCustomers.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => handleSelectCustomer(c)}
                                                className="p-4 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-800 uppercase">{c.customer?.lastName} {c.customer?.firstName}</span>
                                                    <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{getPhone(c.customer)}</span>
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 flex gap-4 mt-1">
                                                    <span>JSHSHIR: {c.customer?.pinfl}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-400 font-medium">Bunday mijoz yoki shartnoma topilmadi...</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"><Filter size={18}/> Filtr</button>
                    </div>
                </>
            )}

            {/* --- EMPTY STATE (BOSH HOLAT) --- */}
            {!selectedCustomer && (
                <div className="bg-white h-[500px] rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center p-8">
                    {isLoading ? (
                        <div className="text-slate-400 font-bold animate-pulse">Ma'lumotlar yuklanmoqda...</div>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <FileText size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Ushbu oynada ma'lumot mavjud emas</h3>
                            <p className="text-slate-500 max-w-md font-medium leading-relaxed">
                                Shartnomaga to'lov olish yoki ko'rish uchun, yuqoridagi qidiruv qatori orqali mijozni izlang!
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* --- CUSTOMER SELECTED STATE (SPLIT VIEW) --- */}
            {selectedCustomer && (
                <div className="space-y-4">
                    {/* Header qismi */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <button onClick={closeCustomer} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                                <ArrowLeft size={24}/>
                            </button>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {selectedCustomer.lastName} {selectedCustomer.firstName} {selectedCustomer.middleName}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                {getPhone(selectedCustomer)}
                            </span>
                            <button onClick={closeCustomer} className="px-6 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
                                Bekor qilish
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* ======================================================= */}
                        {/* CHAP PANEL: SHARTNOMALAR RO'YXATI */}
                        {/* ======================================================= */}
                        <div className="lg:col-span-4 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
                            <div className="p-6 pb-0">
                                <h3 className="text-lg font-black text-slate-800 mb-4">Shartnomalar</h3>
                                {/* Tabs */}
                                <div className="flex bg-slate-50 p-1 rounded-xl mb-4 text-sm font-bold text-slate-500 border border-slate-100">
                                    <button onClick={() => {setLeftTab('ACTIVE'); setSelectedContract(null);}} className={`flex-1 py-2.5 rounded-lg transition-all ${leftTab === 'ACTIVE' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'}`}>Joriy</button>
                                    <button onClick={() => {setLeftTab('COMPLETED'); setSelectedContract(null);}} className={`flex-1 py-2.5 rounded-lg transition-all ${leftTab === 'COMPLETED' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'}`}>Yakunlangan</button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-100">
                                        <tr>
                                            <th className="py-4 pl-6 pr-2">ID</th>
                                            <th className="p-4">Sanasi</th>
                                            <th className="py-4 pr-6 pl-2 text-right">Qarzdorlik</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold text-slate-700 divide-y divide-slate-50">
                                        {currentList.length > 0 ? (
                                            currentList.map(contract => (
                                                <tr 
                                                    key={contract.id} 
                                                    onClick={() => setSelectedContract(contract)}
                                                    className={`cursor-pointer transition-colors ${selectedContract?.id === contract.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className={`py-4 pl-6 pr-2 ${selectedContract?.id === contract.id ? 'text-blue-600' : 'text-slate-600'}`}>
                                                        {contract.contractNumber}
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-500">
                                                        {new Date(contract.date).toLocaleDateString('uz-UZ')}
                                                    </td>
                                                    <td className={`py-4 pr-6 pl-2 text-right ${Number(contract.debtAmount) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {Number(contract.debtAmount || 0).toLocaleString()} UZS
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-10 text-slate-400 font-medium">Bu bo'limda shartnomalar yo'q.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer: Total Debt */}
                            <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100 shrink-0">
                                <span className="font-black text-slate-800">Jami qarzdorlik</span>
                                <span className={`text-lg font-black ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {totalDebt.toLocaleString()} UZS
                                </span>
                            </div>
                        </div>

                        {/* ======================================================= */}
                        {/* O'NG PANEL: SHARTNOMA MA'LUMOTLARI (DETALLARI) */}
                        {/* ======================================================= */}
                        <div className="lg:col-span-8 bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-[700px] overflow-hidden relative">
                            
                            {!selectedContract ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center mb-4">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">Shartnoma tanlanmagan</h3>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">Shartnoma ma'lumotlarini ko'rish uchun, chap paneldan birini bosing!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    {/* Header & 3 dots */}
                                    <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">Shartnoma ma'lumotlari</h3>
                                            <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest uppercase">ID: {selectedContract.contractNumber}</p>
                                        </div>
                                        
                                        <div className="relative" ref={actionMenuRef}>
                                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                                                <MoreVertical size={20}/>
                                            </button>
                                            {dropdownOpen && (
                                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in zoom-in-95">
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"><Printer size={16}/> Chop etish</button>
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"><DollarSign size={16}/> To'lov olish</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horizontal Tabs */}
                                    <div className="px-6 shrink-0 border-b border-slate-100">
                                        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-1">
                                            <button onClick={() => setRightTab('general')} className={`py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${rightTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Umumiy ma'lumotlar</button>
                                            <button onClick={() => setRightTab('payments')} className={`py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${rightTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>To'lovlar</button>
                                            <button onClick={() => setRightTab('schedule')} className={`py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${rightTab === 'schedule' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Grafik jadval</button>
                                            <button onClick={() => setRightTab('items')} className={`py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${rightTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Shartnoma tovarlari</button>
                                            <button onClick={() => setRightTab('comments')} className={`py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${rightTab === 'comments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Izohlar</button>
                                        </div>
                                    </div>

                                    {/* Tab Content Area */}
                                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                                        
                                        {/* TAB 1: UMUMIY MA'LUMOTLAR */}
                                        {rightTab === 'general' && (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Calendar size={18}/><span className="text-xs font-black uppercase tracking-widest">Sana</span></div>
                                                    <div className="text-lg font-black text-slate-800">{new Date(selectedContract.date).toLocaleDateString('uz-UZ')}</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Clock size={18}/><span className="text-xs font-black uppercase tracking-widest">Muddati</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.durationMonths || 0} oy</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><DollarSign size={18}/><span className="text-xs font-black uppercase tracking-widest">Umumiy Summa</span></div>
                                                    <div className="text-lg font-black text-slate-800">{Number(selectedContract.totalAmount).toLocaleString()} UZS</div>
                                                </div>
                                                
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-emerald-500 mb-3"><CreditCard size={18}/><span className="text-xs font-black uppercase tracking-widest">Oldindan to'lov</span></div>
                                                    <div className="text-lg font-black text-slate-800">{Number(selectedContract.paidAmount || 0).toLocaleString()} UZS</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-rose-500 col-span-2">
                                                    <div className="flex items-center gap-2 text-rose-500 mb-3"><DollarSign size={18}/><span className="text-xs font-black uppercase tracking-widest">Qolgan qarz summasi</span></div>
                                                    <div className="text-xl font-black text-slate-800">{Number(selectedContract.debtAmount || 0).toLocaleString()} UZS</div>
                                                </div>
                                                
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 col-span-3 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={24}/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shartnoma tuzgan hodim</p>
                                                        <p className="font-bold text-slate-800">{selectedContract.user?.fullName || 'Noma\'lum xodim'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: TO'LOVLAR */}
                                        {rightTab === 'payments' && (
                                            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex gap-3 mb-4 shrink-0 justify-end">
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-colors">
                                                        <DollarSign size={16}/> To'lov Qabul Qilish
                                                    </button>
                                                </div>
                                                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex-1 flex flex-col">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                                                            <tr>
                                                                <th className="p-4 text-center">ID</th>
                                                                <th className="p-4">Sanasi</th>
                                                                <th className="p-4 text-center">Turi</th>
                                                                <th className="p-4 text-right">Summasi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                                            {selectedContract.payments && selectedContract.payments.length > 0 ? (
                                                                selectedContract.payments.map((p) => (
                                                                    <tr key={p.id} className="hover:bg-slate-50">
                                                                        <td className="p-4 text-center font-mono text-slate-400">#{p.id}</td>
                                                                        <td className="p-4 text-slate-500">{formatDate(p.date)}</td>
                                                                        <td className="p-4 text-center text-blue-600 bg-blue-50/50">{p.type}</td>
                                                                        <td className="p-4 text-right text-emerald-600">{Number(p.amount).toLocaleString()} UZS</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="4" className="text-center p-10 text-slate-400">Hozircha to'lovlar yo'q</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: GRAFIK JADVAL (YANGI ULANGAN) */}
                                        {rightTab === 'schedule' && (
                                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
                                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 sticky top-0">
                                                            <tr>
                                                                <th className="p-4 text-center">Oy</th>
                                                                <th className="p-4">To'lov Sanasi</th>
                                                                <th className="p-4 text-right">Oylik to'lov</th>
                                                                <th className="p-4 text-right">To'langan</th>
                                                                <th className="p-4 text-center">Holat</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                                            {selectedContract.schedules && selectedContract.schedules.length > 0 ? (
                                                                selectedContract.schedules.map((row) => (
                                                                    <tr key={row.id} className="hover:bg-slate-50">
                                                                        <td className="p-4 text-center">{row.monthNumber}</td>
                                                                        <td className="p-4 text-slate-500">{new Date(row.date).toLocaleDateString('uz-UZ')}</td>
                                                                        <td className="p-4 text-right">{Number(row.monthlyPay).toLocaleString()} UZS</td>
                                                                        <td className="p-4 text-right text-emerald-500">{Number(row.paid).toLocaleString()} UZS</td>
                                                                        <td className="p-4 text-center">
                                                                            <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${row.status === 'TOLANDI' ? 'bg-emerald-100 text-emerald-700' : row.status === 'KECIKDI' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                                {row.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="5" className="p-10 text-center text-slate-400">Grafik shakllanmagan</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="bg-slate-800 text-white p-5 flex flex-col items-end gap-2 shrink-0">
                                                    <div className="text-sm text-slate-400">Jami qiymat: <span className="font-black text-white ml-2">{Number(selectedContract.totalAmount).toLocaleString()} UZS</span></div>
                                                    <div className="text-sm text-slate-400">Jami to'landi (Bosh. to'lov bilan): <span className="font-black text-emerald-400 ml-2">{Number(selectedContract.paidAmount).toLocaleString()} UZS</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: SHARTNOMA TOVARLARI */}
                                        {rightTab === 'items' && (
                                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                                        <tr>
                                                            <th className="p-4 text-center">ID</th>
                                                            <th className="p-4">Nomi</th>
                                                            <th className="p-4 text-center">Miqdor</th>
                                                            <th className="p-4 text-right">Narx</th>
                                                            <th className="p-4 text-right">Summa</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                                        {selectedContract.items && selectedContract.items.length > 0 ? (
                                                            selectedContract.items.map((item) => (
                                                                <tr key={item.id} className="hover:bg-slate-50">
                                                                    <td className="p-4 text-center font-mono text-slate-400">{item.product?.customId || item.productId}</td>
                                                                    <td className="p-4">{item.product?.name || "Noma'lum tovar"}</td>
                                                                    <td className="p-4 text-center text-blue-600">{item.quantity}</td>
                                                                    <td className="p-4 text-right text-slate-500">{Number(item.price).toLocaleString()} UZS</td>
                                                                    <td className="p-4 text-right">{(Number(item.price) * item.quantity).toLocaleString()} UZS</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr><td colSpan="5" className="p-10 text-center text-slate-400">Tovarlar topilmadi</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* TAB 5: IZOHLAR (YANGI ULANGAN) */}
                                        {rightTab === 'comments' && (
                                            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                                    {selectedContract.comments && selectedContract.comments.length > 0 ? (
                                                        selectedContract.comments.map(c => (
                                                            <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{c.authorName}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {formatDate(c.createdAt)}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                            <MessageSquare size={40} className="mb-2 opacity-20"/>
                                                            <p className="font-bold text-sm">Hali izohlar yo'q</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-end gap-2 shrink-0">
                                                    <textarea 
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Yangi izoh yozing..." 
                                                        className="flex-1 p-3 bg-transparent outline-none resize-none h-12 text-sm font-medium text-slate-700"
                                                        disabled={isCommentLoading}
                                                    />
                                                    <button 
                                                        onClick={handleAddComment} 
                                                        disabled={isCommentLoading || !newComment.trim()}
                                                        className={`p-3 rounded-xl transition-colors shrink-0 ${isCommentLoading || !newComment.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractPayment;
