import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, ScanLine, LayoutDashboard, Wallet, FileText, ShoppingCart, 
  RefreshCcw, Calculator, Users, Truck, 
  CreditCard, Tag, MessageSquare, BarChart2, 
  Settings, ChevronDown, Menu, Percent, Car,
  LogOut, UserCircle, DollarSign, X, CheckCircle, AlertTriangle
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // --- ROL VA ISM NI OLISH ---
  const userRole = (sessionStorage.getItem('userRole') || 'admin').toLowerCase();
  const userName = sessionStorage.getItem('userName') || 'Foydalanuvchi';

  // --- MODALLAR STATE ---
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [globalRate, setGlobalRate] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // YANGI: CHIQISHNI TASDIQLASH MODALI UCHUN
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); 

  // --- SCROLL UCHUN REF ---
  const submenuRefs = useRef([]); 

  // --- STARTUP LOGIKA ---
  useEffect(() => {
    const activeIndex = menus.findIndex(menu => 
      menu.submenu && menu.submenu.some(sub => sub.path === location.pathname)
    );
    if (activeIndex !== -1) {
      setOpenSubmenu(activeIndex);
    }

    const savedRate = sessionStorage.getItem('globalExchangeRate');
    if (savedRate) setGlobalRate(savedRate);
  }, [location.pathname]);

  // --- KURS SAQLASH FUNKSIYASI ---
  const handleSaveRate = () => {
    if(!globalRate || globalRate <= 0) return;
    
    sessionStorage.setItem('globalExchangeRate', globalRate);
    
    setIsRateModalOpen(false); 
    setIsSuccessModalOpen(true); 
    
    setTimeout(() => {
      setIsSuccessModalOpen(false);
      window.location.reload();
    }, 2000);
  };
// --- CHIQISH FUNKSIYASI (MODAL ORQALI) ---
  const confirmLogout = () => {
      sessionStorage.clear(); 
      localStorage.clear();
      
      navigate('/login');
      window.location.reload(); 
  };

  // --- SUBMENU OCHILISHI VA AVTOMATIK SCROLL ---
  const toggleSubmenu = (index) => {
    if (openSubmenu === index) {
      setOpenSubmenu(null); 
    } else {
      setOpenSubmenu(index); 
      
      setTimeout(() => {
        if (submenuRefs.current[index]) {
          submenuRefs.current[index].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',   
          });
        }
      }, 150); 
    }
  };

  // SIZNING TO'LIQ MENYULARINGIZ
  const menus = [
    { title: "Bosh sahifa", path: "/", icon: <LayoutDashboard size={20} /> },
    {
      title: "Kassa",
      icon: <Wallet size={20} />,
      submenu: [
        { title: "Shartnomaga to'lov olish", path: "/kassa/shartnoma-tolov" },
        { title: "Oldindan to'lov", path: "/kassa/oldindan-tolov" },
        { title: "Naqd savdoga to'lov olish", path: "/kassa/naqd-tolov" },
        { title: "Boshqa kassadan kirim", path: "/kassa/boshqa-kirim" },
        { title: "Boshqa kassaga chiqim", path: "/kassa/boshqa-chiqim" },
        { title: "Xarajatdan pul kirim", path: "/kassa/xarajat-kirim" },
        { title: "Xarajatga pul chiqim", path: "/kassa/xarajat-chiqim" },
        { title: "Barcha kassa amaliyotlari", path: "/kassa/amaliyotlar" },
        { title: "Barcha kassa buyurtmalari", path: "/kassa/buyurtmalar" },
        { title: "Kassalarni boshqarish", path: "/kassa/boshqarish" },
        { title: "Kassalar qoldig'i", path: "/kassa/qoldiq" },
        { title: "Mening kassalarim", path: "/kassa/mening-kassam" },
        { title: "Barcha tushumlar", path: "/kassa/tushumlar" },
        { title: "Buyurtmalar ro'yxati", path: "/kassa/buyurtmalar-royxati" },
        { title: "Valyuta ayirboshlash", path: "/kassa/valyuta" },
      ]
    },
    {
      title: "Shartnoma",
      icon: <FileText size={20} />,
      submenu: [
        { title: "Shartnoma ro'yxati", path: "/shartnoma" },
        { title: "Buyurtmalar ro'yxati", path: "/shartnoma/buyurtmalar" },
        { title: "Berilgan chegirmalar", path: "/shartnoma/chegirmalar" },
        { title: "Tovar qaytarish", path: "/shartnoma/qaytarish" },
        { title: "Yopilgan shartnomalar", path: "/shartnoma/yopilgan" },
      ]
    },
    {
      title: "Naqd savdo",
      icon: <ShoppingCart size={20} />,
      submenu: [
        { title: "Naqd savdolar ro'yxati", path: "/savdo" },
        { title: "Tovar qaytarish", path: "/savdo/qaytarish" },
        { title: "Berilgan chegirmalar", path: "/savdo/chegirmalar" },
      ]
    },
    {
      title: "Undiruv",
      icon: <RefreshCcw size={20} />,
      submenu: [
        { title: "Biriktirilgan shartnomalar", path: "/undiruv" },
        { title: "Barcha shartnomalar", path: "/undiruv/barcha" },
        { title: "Barcha mijozlar", path: "/undiruv/mijozlar" },
        { title: "Ogohlantirish xati", path: "/undiruv/xat" },
        { title: "Ogohlantirish xati shablonlari", path: "/undiruv/xat-shablon" },
        { title: "Mas'ul biriktirish", path: "/undiruv/biriktirish" },
        { title: "MFY larni biriktirish", path: "/undiruv/mfy" },
        { title: "Ish joylarini biriktirish", path: "/undiruv/ish-joyi" },
        { title: "Izoh turlari", path: "/undiruv/izoh" },
      ]
    },
    {
      title: "Ombor",
      icon: <Package size={20} />,
      submenu: [
        { title: "Barcha ombor amaliyotlari", path: "/ombor/amaliyotlar" },
        { title: "Boshqa ombordan kirim", path: "/ombor/boshqa-kirim" },
        { title: "Boshqa omborga chiqim", path: "/ombor/boshqa-chiqim" },
        { title: "Ta'minotchidan tovar kirim", path: "/ombor/taminotchi-kirim" },
        { title: "Ta'minotchiga tovar qaytarish", path: "/ombor/taminotchi-qaytarish" },
        { title: "Savdosi yakunlanmaganlar", path: "/ombor/yakunlanmagan" },
        { title: "Mijozdan tovar kirimi", path: "/ombor/mijoz-kirim" },
        { title: "Sanoq aktlari (Tarix)", path: "/ombor/sanoq-tarixi" }, 
        { title: "Tovarlar qoldig'i", path: "/ombor/qoldiq" },
        { title: "Sanoq (Skaner)", path: "/ombor/sanoq", icon: <ScanLine size={18} /> },
      ]
    },
    {
      title: "Hisob-kitoblar",
      icon: <Calculator size={20} />,
      submenu: [
        { title: "Ta'minotchi akt-sverkasi", path: "/hisob/akt" },
        { title: "Ta'minotchilar ro'yxati", path: "/hisob/taminotchilar-royxati" }, 
        { title: "Ta'minotchilar hisob-kitobi", path: "/hisob/taminotchi" },
        { title: "Ta'minotchi limiti", path: "/hisob/limit" },
      ]
    },
    {
      title: "Mijozlar",
      icon: <Users size={20} />,
      submenu: [
        { title: "Mijozlar ro'yxati", path: "/mijozlar" },
        { title: "Qora ro'yxat", path: "/mijozlar/qora" },
        { title: "Qora ro'yxat buyurtmalari", path: "/mijozlar/qora-buyurtma" },
      ]
    },
    {
      title: "Mijozga tovar chiqimi",
      icon: <Truck size={20} />,
      submenu: [
        { title: "Chiqim fakturalar", path: "/chiqim/faktura" },
        { title: "Yetkazib berish", path: "/chiqim/yetkazish" },
        { title: "Olib ketish", path: "/chiqim/olib-ketish" },
      ]
    },
    {
      title: "Mijoz hisob raqami",
      icon: <CreditCard size={20} />,
      submenu: [
        { title: "Bonus buyurtmalari", path: "/hisobraqam/bonus" },
        { title: "Bonus farqi uchun to'lov", path: "/hisobraqam/tolov" },
        { title: "Bonusga olingan tovarlar", path: "/hisobraqam/tovar" },
        { title: "Bonus hisob raqami tarixi", path: "/hisobraqam/tarix" },
        { title: "Hisob raqam qoldiqlari", path: "/hisobraqam/qoldiq" },
        { title: "Hisob raqam amaliyotlari", path: "/hisobraqam/amaliyot" },
        { title: "Bonus tovarini qaytarish", path: "/hisobraqam/qaytarish" },
        { title: "Hisob raqam tarixi", path: "/hisobraqam/hisob-tarix" },
      ]
    },
    {
      title: "Narxlarni boshqarish",
      icon: <Tag size={20} />,
      submenu: [
        { title: "O'zgargan narxlar", path: "/narxlar/ozgargan" },
        { title: "Kirim narxi o'zgarishlari", path: "/narxlar/kirim" },
        { title: "Umumiy ustama belgilash", path: "/narxlar/umumiy" },
        { title: "Kategoriya uchun ustama", path: "/narxlar/kategoriya" },
        { title: "Tovarlar uchun ustama", path: "/narxlar/tovar" },
      ]
    },
    {
      title: "SMS yuborish",
      icon: <MessageSquare size={20} />,
      submenu: [
        { title: "Mijozlarga sms yuborish", path: "/sms/mijozlar" }
      ]
    },
    {
      title: "Narx yorlig'i",
      icon: <Tag size={20} />,
      submenu: [
        { title: "Narxi o'zgargan tovarlar", path: "/yorliq/ozgargan" },
        { title: "Narx yorlig'ini chop etish", path: "/yorliq/chop-etish" },
        { title: "Narx yorlig'i shablonlari", path: "/yorliq/shablonlar" },
      ]
    },
    {
      title: "Xarajatlar",
      icon: <Percent size={20} />,
      submenu: [
        { title: "Kassadan xarajatlar", path: "/xarajatlar/kassa" }
      ]
    },
    { 
      title: "Hisobotlar", 
      icon: <BarChart2 size={20} />,
      submenu: [
        { title: "Hisobotlar ro'yxati", path: "/hisobotlar/royxat" }
      ]
    },
    { 
      title: "Naqdsiz pullar hisobi", 
      icon: <CreditCard size={20} />,
      submenu: [
        { title: "Mijozdan tushumlar", path: "/naqdsiz/tushumlar" }
      ]
    },
    { 
      title: "Avtoto'lov", 
      icon: <Car size={20} />,
      submenu: [
        { title: "Shartnomalar ro'yxati", path: "/avto/shartnomalar" }
      ]
    },
    {
      title: "Sozlamalar",
      icon: <Settings size={20} />,
      submenu: [
        { title: "Mening profilim", path: "/sozlamalar/profil" }, 
        { title: "Kategoriyalar", path: "/sozlamalar/kategoriyalar", roles: ['director'] },
        { title: "Xodimlar boshqaruvi", path: "/sozlamalar/xodimlar", roles: ['director'] }
      ]
    },
  ];

  return (
    <div className={`bg-white h-screen shadow-2xl flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} fixed left-0 top-0 z-50 border-r border-slate-100`}>
      
      {/* 1. HEADER (LOGO QISMI) */}
      <div className={`flex items-center ${isOpen ? 'justify-between p-4' : 'justify-center py-6'} border-b border-slate-50 flex-shrink-0`}>
        {isOpen ? (
          <h1 className="font-black text-xl tracking-tighter text-blue-600 animate-in fade-in">
            IPHONE <span className="text-slate-800">HOUSE</span>
          </h1>
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 animate-in zoom-in">
            I
          </div>
        )}
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400">
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* 2. ASOSIY MENU (Scroll qismi) */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {!isOpen && (
           <button onClick={() => setIsOpen(true)} className="w-full flex justify-center mb-4 text-slate-300 hover:text-blue-600">
              <ChevronDown className="-rotate-90" size={20} />
           </button>
        )}
        <ul className="space-y-1.5 px-2 pb-10">
          {menus.map((menu, index) => {
            if (menu.roles && !menu.roles.includes(userRole)) return null;
            const isMenuActive = menu.path === location.pathname;
            
            return (
              <li 
                key={index} 
                className="relative group"
                ref={el => (submenuRefs.current[index] = el)}
              >
                {menu.submenu ? (
                  <div>
                    <button 
                      onClick={() => isOpen ? toggleSubmenu(index) : setIsOpen(true)}
                      className={`w-full flex items-center ${isOpen ? 'justify-between px-4' : 'justify-center'} py-3 rounded-xl transition-all ${openSubmenu === index && isOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        {menu.icon}
                        {isOpen && <span className="font-bold text-sm">{menu.title}</span>}
                      </div>
                      {isOpen && (
                        <ChevronDown size={14} className={`transition-transform duration-300 ${openSubmenu === index ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] whitespace-nowrap font-bold shadow-xl">
                        {menu.title}
                      </div>
                    )}
                    
                    {isOpen && openSubmenu === index && (
                      <ul className="pl-10 pr-2 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                        {menu.submenu.map((subItem, subIndex) => {
                          if (subItem.roles && !subItem.roles.includes(userRole)) return null;
                          const isSubItemActive = location.pathname === subItem.path;
                          return (
                            <li key={subIndex}>
                              <Link 
                                to={subItem.path}
                                className={`block py-2 px-3 rounded-lg text-[13px] transition-all ${isSubItemActive ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link 
                    to={menu.path}
                    className={`flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center'} py-3 rounded-xl transition-all ${isMenuActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    {menu.icon}
                    {isOpen && <span className="font-bold text-sm">{menu.title}</span>}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[100] whitespace-nowrap font-bold">
                        {menu.title}
                      </div>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 3. FOOTER (KURS VA PROFIL) */}
      <div className={`p-2 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-2 flex-shrink-0 ${!isOpen && 'items-center'}`}>
          
          {/* KURS TUGMASI */}
          {(userRole === 'director' || userRole === 'owner') && (
            <button 
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    setIsRateModalOpen(true);
                }}
                className={`flex items-center group ${isOpen ? 'justify-between px-3' : 'justify-center'} py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-300`}
            >
                <div className="flex items-center gap-2">
                    <DollarSign size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform"/>
                    {isOpen && <span className="font-black text-xs">KURS:</span>}
                </div>
                {isOpen && <span className="font-black text-xs">{Number(globalRate).toLocaleString()}</span>}
            </button>
          )}

          {/* PROFIL VA CHIQISH */}
          <div className={`flex items-center gap-2 p-1 ${!isOpen && 'flex-col'}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                  <UserCircle size={24}/>
              </div>
              {isOpen && (
                  <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-black text-slate-800 truncate leading-none mb-1">{userName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{userRole}</p>
                  </div>
              )}
              {/* O'ZGARTIRILGAN QISM: CHIQISH TUGMASI ENDI MODAL OCHADI */}
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className={`p-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all ${isOpen ? 'ml-auto' : 'w-10 h-10 flex items-center justify-center'}`}
                title="Tizimdan chiqish"
              >
                  <LogOut size={20}/>
              </button>
          </div>
      </div>

      {/* --- KURS KIRITISH MODALI --- */}
      {isRateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[30px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Dollar Kursi</h3>
              <button onClick={() => setIsRateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Joriy kurs (1 USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-[18px] text-slate-400" size={24} />
                <input 
                  type="number" 
                  className="w-full py-4 pr-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                  value={globalRate}
                  onChange={(e) => setGlobalRate(e.target.value)}
                  placeholder="12500"
                />
              </div>
            </div>
            <button onClick={handleSaveRate} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              SAQLASH
            </button>
          </div>
        </div>
      )}

      {/* --- MUVAFFAQIYATLI SAQLANDI OYNASI (KURS) --- */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1001] p-4">
          <div className="bg-white w-full max-w-xs rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle size={48} strokeWidth={3} className="animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Muvaffaqiyatli!</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed">Yangi valyuta kursi tizimga saqlandi.</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 overflow-hidden">
              <div className="bg-emerald-500 h-full animate-[progressShrink_2s_linear_forwards] w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --- YANGI: TIZIMDAN CHIQISHNI TASDIQLASH MODALI --- */}
      {/* ========================================================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 text-rose-500 shadow-lg shadow-rose-100">
                    <LogOut size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Tizimdan chiqish</h3>
                <p className="text-slate-500 font-bold text-sm mb-8 px-2 leading-relaxed">
                    Haqiqatan ham o'z akkauntingizdan chiqmoqchimisiz? Davom etish uchun "Tasdiqlash" ni bosing.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsLogoutModalOpen(false)} 
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs"
                    >
                        BEKOR QILISH
                    </button>
                    <button 
                        onClick={confirmLogout} 
                        className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        TASDIQLASH
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};


export default Sidebar;
