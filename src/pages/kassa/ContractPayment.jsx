import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, FileText, ArrowLeft, MoreVertical, Calendar, Hash, Clock, DollarSign, Package, CreditCard, Printer, MessageSquare, Send, ChevronRight, Plus } from 'lucide-react';

// --- MOCK DATA (Vaqtinchalik ma'lumotlar) ---
const mockCustomer = {
    id: 101,
    fullName: "QADAMOV DIYORBEK BAXRAMBEK OGLI",
    phone: "+998 99 123 45 67",
    pinfl: "31205987654321",
    contracts: {
        active: [
            {
                id: 36551, date: "10.03.2026", branch: "Qo'shko'pir filiali", debt: 0,
                details: {
                    number: "3176", duration: 12, costPrice: 3094000, totalSum: 3094000, prepayment: 0, maxPayment: 3094000, itemsCount: 1,
                    items: [ { id: 265, name: "Televizor MOONX 43AH700 Smart", qty: 1, price: 3094000, total: 3094000 } ],
                    schedule: [
                        { id: 1, date: "01.04.2026", monthlyPay: 257800, paid: 0 },
                        { id: 2, date: "01.05.2026", monthlyPay: 257800, paid: 0 },
                        { id: 3, date: "01.06.2026", monthlyPay: 257800, paid: 0 }
                    ],
                    payments: [],
                    comments: [
                        { id: 1, author: "Admin", text: "Mijoz pasport nusxasi olindi.", date: "10.03.2026 14:30" }
                    ]
                }
            }
        ],
        joint: [],
        completed: [
            {
                id: 25011, date: "15.01.2025", branch: "Urganch filiali", debt: 0,
                details: {
                    number: "1120", duration: 6, costPrice: 1500000, totalSum: 1500000, prepayment: 500000, maxPayment: 1500000, itemsCount: 1,
                    items: [ { id: 105, name: "Smartfon Samsung Galaxy A14", qty: 1, price: 1500000, total: 1500000 } ],
                    schedule: [], payments: [], comments: []
                }
            }
        ]
    }
};

const ContractPayment = () => {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedCustomer, setSearchedCustomer] = useState(null); // Agar topilsa, mijoz obyekti tushadi
    
    // Left Panel State
    const [leftTab, setLeftTab] = useState('active'); // active | joint | completed
    const [selectedContract, setSelectedContract] = useState(null);
    
    // Right Panel State
    const [rightTab, setRightTab] = useState('general'); // general | payments | schedule | items | comments
    
    // UI States
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [newComment, setNewComment] = useState('');

    // --- EFFECT ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // --- HANDLERS ---
    const handleFakeSearch = (e) => {
        if (e.key === 'Enter') {
            // Vaqtincha: Enter bosilsa mock mijozni chiqaradi
            setSearchedCustomer(mockCustomer);
            setSelectedContract(mockCustomer.contracts.active[0]); // Avtomat birinchisini tanlaymiz
            setSearchQuery('');
        }
    };

    const closeCustomer = () => {
        setSearchedCustomer(null);
        setSelectedContract(null);
        setLeftTab('active');
        setRightTab('general');
    };

    // Calculate total debt for left panel footer
    const currentList = searchedCustomer ? searchedCustomer.contracts[leftTab] : [];
    const totalDebt = currentList.reduce((sum, c) => sum + c.debt, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* TEPADAGI QIDIRUV VA FILTR QISMI (Agar mijoz tanlanmagan bo'lsa) */}
            {!searchedCustomer && (
                <>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Shartnomaga to'lov olish</h1>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleFakeSearch}
                                placeholder="Mijoz F.I.O, ID raqami, Pasport yoki Tel raqamini kiriting va Enter bosing..." 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700" 
                            />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"><Filter size={18}/> Filtr</button>
                    </div>
                </>
            )}

            {/* --- EMPTY STATE (BOSH HOLAT) --- */}
            {!searchedCustomer && (
                <div className="bg-white h-[500px] rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <FileText size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Ushbu oynada ma'lumot mavjud emas</h3>
                    <p className="text-slate-500 max-w-md font-medium leading-relaxed">
                        Shartnomaga to'lov olish uchun, o'zingizga kerakli mijozni ID, FIO, telefon raqami yoki shartnoma IDsi orqali izlang!
                    </p>
                </div>
            )}

            {/* --- CUSTOMER SELECTED STATE (SPLIT VIEW) --- */}
            {searchedCustomer && (
                <div className="space-y-4">
                    {/* Header qismi */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <button onClick={closeCustomer} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                                <ArrowLeft size={24}/>
                            </button>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{searchedCustomer.fullName}</h2>
                        </div>
                        <button onClick={closeCustomer} className="px-6 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
                            Bekor qilish
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* ======================================================= */}
                        {/* CHAP PANEL: SHARTNOMALAR RO'YXATI */}
                        {/* ======================================================= */}
                        <div className="lg:col-span-5 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
                            <div className="p-6 pb-0">
                                <h3 className="text-lg font-black text-slate-800 mb-4">Shartnomalar</h3>
                                {/* Tabs */}
                                <div className="flex bg-slate-50 p-1 rounded-xl mb-4 text-sm font-bold text-slate-500 border border-slate-100">
                                    <button onClick={() => setLeftTab('active')} className={`flex-1 py-2.5 rounded-lg transition-all ${leftTab === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'}`}>Joriy</button>
                                    <button onClick={() => setLeftTab('joint')} className={`flex-1 py-2.5 rounded-lg transition-all ${leftTab === 'joint' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'}`}>Birgalikdagi</button>
                                    <button onClick={() => setLeftTab('completed')} className={`flex-1 py-2.5 rounded-lg transition-all ${leftTab === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'}`}>Yakunlangan</button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-y border-slate-100">
                                        <tr>
                                            <th className="py-4 pl-6 pr-2">ID</th>
                                            <th className="p-4">Sanasi</th>
                                            <th className="p-4">Tashkilot nomi</th>
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
                                                    <td className={`py-4 pl-6 pr-2 ${selectedContract?.id === contract.id ? 'text-blue-600' : 'text-slate-600'}`}>{contract.id}</td>
                                                    <td className="p-4 font-medium text-slate-500">{contract.date}</td>
                                                    <td className="p-4">{contract.branch}</td>
                                                    <td className={`py-4 pr-6 pl-2 text-right ${contract.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {contract.debt.toLocaleString()} UZS
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Bu bo'limda shartnomalar yo'q.</td>
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
                        <div className="lg:col-span-7 bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-[700px] overflow-hidden relative">
                            
                            {!selectedContract ? (
                                /* Empty state for Right Panel */
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center mb-4">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">Ushbu oynada ma'lumot mavjud emas</h3>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">Shartnoma ma'lumotlarini ko'rish uchun, ro'yxatdan shartnomani tanlang!</p>
                                </div>
                            ) : (
                                /* Content State for Right Panel */
                                <div className="flex flex-col h-full">
                                    {/* Header & 3 dots */}
                                    <div className="p-6 pb-2 flex justify-between items-center shrink-0">
                                        <h3 className="text-xl font-black text-slate-800">Shartnoma ma'lumotlari</h3>
                                        
                                        <div className="relative" ref={dropdownRef}>
                                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors">
                                                <MoreVertical size={20}/>
                                            </button>
                                            {dropdownOpen && (
                                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in zoom-in-95">
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"><Printer size={16}/> Chop etish</button>
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"><DollarSign size={16}/> To'lov olish</button>
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"><CreditCard size={16}/> Onlayn to'lov ma'lumotlari</button>
                                                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"><CreditCard size={16}/> Karta biriktirish</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horizontal Tabs */}
                                    <div className="px-6 shrink-0 border-b border-slate-100">
                                        <div className="flex gap-6 overflow-x-auto no-scrollbar">
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
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Calendar size={18}/><span className="text-xs font-black uppercase tracking-widest">Sanasi</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.date}</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Hash size={18}/><span className="text-xs font-black uppercase tracking-widest">Raqami</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.number}</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Clock size={18}/><span className="text-xs font-black uppercase tracking-widest">Muddati</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.duration} oy</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><DollarSign size={18}/><span className="text-xs font-black uppercase tracking-widest">Tannarxi</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.costPrice.toLocaleString()} UZS</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><DollarSign size={18}/><span className="text-xs font-black uppercase tracking-widest">Summasi</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.totalSum.toLocaleString()} UZS</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><Package size={18}/><span className="text-xs font-black uppercase tracking-widest">Tovarlar</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.itemsCount} dona</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><CreditCard size={18}/><span className="text-xs font-black uppercase tracking-widest">Oldindan to'lov</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.prepayment.toLocaleString()} UZS</div>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 col-span-2 lg:col-span-1">
                                                    <div className="flex items-center gap-2 text-blue-500 mb-3"><DollarSign size={18}/><span className="text-xs font-black uppercase tracking-widest">Maksimal to'lov</span></div>
                                                    <div className="text-lg font-black text-slate-800">{selectedContract.details.maxPayment.toLocaleString()} UZS</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: TO'LOVLAR */}
                                        {rightTab === 'payments' && (
                                            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex gap-3 mb-4 shrink-0">
                                                    <div className="flex-1 relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                        <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                                                    </div>
                                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50"><Printer size={16}/> Barchasini</button>
                                                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700"><Plus size={16}/> Qo'shish</button>
                                                </div>
                                                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex-1 flex flex-col">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                                                            <tr>
                                                                <th className="p-4 text-center">To'lov ID</th>
                                                                <th className="p-4">Sanasi</th>
                                                                <th className="p-4 text-right">Summasi</th>
                                                                <th className="p-4 text-center">To'lov turi</th>
                                                                <th className="p-4 text-center">Holati</th>
                                                                <th className="p-4 text-center">Amallar</th>
                                                            </tr>
                                                        </thead>
                                                    </table>
                                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                                        <DollarSign size={40} className="mb-3 opacity-20"/>
                                                        <p className="font-bold">To'lovlar ro'yxati bo'sh</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 text-right border-t border-slate-100 shrink-0">
                                                        <span className="font-black text-slate-800 text-base">Jami: 0 UZS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: GRAFIK JADVAL */}
                                        {rightTab === 'schedule' && (
                                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                                        <tr>
                                                            <th className="p-4 text-center">T/R</th>
                                                            <th className="p-4">Sanasi</th>
                                                            <th className="p-4 text-right">Oylik to'lov</th>
                                                            <th className="p-4 text-right">To'langan summa</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                                        {selectedContract.details.schedule.map((row, i) => (
                                                            <tr key={row.id} className="hover:bg-slate-50">
                                                                <td className="p-4 text-center">{i + 1}</td>
                                                                <td className="p-4 text-slate-500">{row.date}</td>
                                                                <td className="p-4 text-right">{row.monthlyPay.toLocaleString()} UZS</td>
                                                                <td className="p-4 text-right text-emerald-500">{row.paid.toLocaleString()} UZS</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div className="bg-slate-800 text-white p-5 flex flex-col items-end gap-2 shrink-0">
                                                    <div className="text-sm text-slate-400">Jami qiymat: <span className="font-black text-white ml-2">{selectedContract.details.totalSum.toLocaleString()} UZS</span></div>
                                                    <div className="text-sm text-slate-400">Jami to'landi: <span className="font-black text-emerald-400 ml-2">0 UZS</span></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: SHARTNOMA TOVARLARI */}
                                        {rightTab === 'items' && (
                                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                                                        <tr>
                                                            <th className="p-4 text-center">Tovar ID</th>
                                                            <th className="p-4">Nomi</th>
                                                            <th className="p-4 text-center">Miqdori</th>
                                                            <th className="p-4 text-right">Narxi</th>
                                                            <th className="p-4 text-right">Summasi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                                        {selectedContract.details.items.map((item) => (
                                                            <tr key={item.id} className="hover:bg-slate-50">
                                                                <td className="p-4 text-center font-mono text-slate-400">{item.id}</td>
                                                                <td className="p-4">{item.name}</td>
                                                                <td className="p-4 text-center">{item.qty}</td>
                                                                <td className="p-4 text-right text-slate-500">{item.price.toLocaleString()} UZS</td>
                                                                <td className="p-4 text-right text-blue-600">{item.total.toLocaleString()} UZS</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div className="bg-slate-50 p-5 text-right border-t border-slate-100">
                                                    <span className="text-sm font-bold text-slate-500">Jami summa: </span>
                                                    <span className="text-xl font-black text-slate-800 ml-2">{selectedContract.details.totalSum.toLocaleString()} UZS</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 5: IZOHLAR */}
                                        {rightTab === 'comments' && (
                                            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                                    {selectedContract.details.comments.length > 0 ? (
                                                        selectedContract.details.comments.map(c => (
                                                            <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{c.author}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {c.date}</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.text}</p>
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
                                                    />
                                                    <button onClick={() => { if(newComment) { toast.success("Izoh qo'shildi!"); setNewComment(''); } }} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0">
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
