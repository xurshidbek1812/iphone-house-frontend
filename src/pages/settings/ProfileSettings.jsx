import React, { useState, useEffect } from 'react';
import { Edit, Save, X, User, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const [isEditingInfo, setIsEditingInfo] = useState(false); 
  const [isChangingPassword, setIsChangingPassword] = useState(false); 
  const [isChangingLogin, setIsChangingLogin] = useState(false); 

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [userData, setUserData] = useState({
    id: null,
    firstName: '',
    lastName: '',
    phone: '+998',
    login: '',
    password: '', 
    role: ''
  });

  const [securityForm, setSecurityForm] = useState({
    newValue: '',
    confirmValue: ''
  });

  const token = sessionStorage.getItem('token');
  const currentLogin = sessionStorage.getItem('currentUserLogin');

  // --- 1. MA'LUMOTLARNI HAQIQIY BAZADAN YUKLASH ---
  useEffect(() => {
    const fetchMyProfile = async () => {
        try {
            // O'ZGARISH: Endi barcha userlarni emas, faqat o'zini (me) yuklaymiz!
            const res = await fetch('https://iphone-house-api.onrender.com/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Yuklab bo'lmadi");
            
            const me = await res.json();

            if (me) {
                const parts = (me.fullName || "").split(' ');
                setUserData({
                    id: me.id,
                    firstName: parts[0] || '',
                    lastName: parts.slice(1).join(' ') || '',
                    phone: me.phone || '+998',
                    login: me.username,
                    password: "", // Xavfsizlik uchun parol boshlang'ich bo'sh keladi
                    role: me.role
                });
            } else {
                toast.error("Profilingiz bazadan topilmadi!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Profilni yuklashda xatolik!");
        }
    };

    if (token) { // currentLogin ga ehtiyoj qolmadi, chunki tokenning o'zi kimligini biladi
        fetchMyProfile();
    }
  }, [token]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (val.startsWith('+998')) {
        setUserData({ ...userData, phone: val });
    }
  };

  // --- 2. SHAXSIY MA'LUMOTLARNI HAQIQIY BAZAGA SAQLASH ---
  const handleSaveInfo = async () => {
    if (userData.phone.length < 13) return toast.error("Telefon raqami to'liq emas!");
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();

    try {
        const res = await fetch(`https://iphone-house-api.onrender.com/api/users/${userData.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                fullName: fullName,
                phone: userData.phone,
                username: userData.login,
                role: userData.role
            })
        });

        if (!res.ok) throw new Error("Saqlab bo'lmadi");
        
        sessionStorage.setItem('userName', fullName);
        setIsEditingInfo(false);
        toast.success("Shaxsiy ma'lumotlar yangilandi!");
    } catch (err) {
        toast.error("Server bilan xatolik yuz berdi");
    }
  };

  // --- 3. LOGINNI O'ZGARTIRISH (API ORQALI) ---
  const handleChangeLogin = async () => {
    if (!securityForm.newValue || securityForm.newValue.length < 4) return toast.error("Yangi login kamida 4 ta belgidan iborat bo'lishi kerak!");

    try {
        const res = await fetch(`https://iphone-house-api.onrender.com/api/users/${userData.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                username: securityForm.newValue, 
                fullName: `${userData.firstName} ${userData.lastName}`.trim(),
                phone: userData.phone,
                role: userData.role
            })
        });

        const data = await res.json();
        if (!res.ok) {
            return toast.error(data.message || "Bu login band yoki xato yuz berdi!");
        }

        sessionStorage.setItem('currentUserLogin', securityForm.newValue); 
        setUserData({ ...userData, login: securityForm.newValue });
        setIsChangingLogin(false);
        resetSecurityForm();
        toast.success("Login muvaffaqiyatli o'zgartirildi!");
    } catch (err) {
        toast.error("Server bilan xatolik yuz berdi");
    }
  };

  // --- 4. PAROLNI O'ZGARTIRISH (API ORQALI) ---
  const handleChangePassword = async () => {
    if (securityForm.newValue.length < 4) return toast.error("Yangi parol juda qisqa!");
    if (securityForm.newValue !== securityForm.confirmValue) return toast.error("Yangi parollar mos kelmadi!");

    try {
        const res = await fetch(`https://iphone-house-api.onrender.com/api/users/${userData.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                password: securityForm.newValue, 
                username: userData.login,
                fullName: `${userData.firstName} ${userData.lastName}`.trim(),
                phone: userData.phone,
                role: userData.role
            })
        });

        if (!res.ok) throw new Error("Saqlab bo'lmadi");

        setIsChangingPassword(false);
        resetSecurityForm();
        toast.success("Parol muvaffaqiyatli o'zgartirildi! Xavfsizlik uchun qayta kiring.");
      

    } catch (err) {
        toast.error("Server bilan xatolik yuz berdi");
    }
  };

  const resetSecurityForm = () => {
    setSecurityForm({ newValue: '', confirmValue: '' });
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Profil sozlamalari</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-8 border-b bg-gradient-to-r from-blue-50 to-white flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-200">
                {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : <User/>}
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {userData.firstName || "Ism"} {userData.lastName || "Familiya"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        userData.role === 'director' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {userData.role}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Phone size={14}/> {userData.phone || "Raqam yo'q"}
                    </span>
                </div>
            </div>
        </div>

        {/* 1. SHAXSIY MA'LUMOTLAR */}
        <div className="p-8 border-b">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Shaxsiy Ma'lumotlar</h3>
                {!isEditingInfo && (
                    <button onClick={() => setIsEditingInfo(true)} className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
                        <Edit size={16}/> Tahrirlash
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                    {isEditingInfo ? (
                        <input type="text" className="w-full p-2.5 border rounded-lg outline-blue-500 bg-gray-50 focus:bg-white"
                            value={userData.firstName} onChange={e => setUserData({...userData, firstName: e.target.value})} />
                    ) : (
                        <div className="text-lg font-medium text-gray-800 border-b border-transparent py-2">{userData.firstName || "-"}</div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                    {isEditingInfo ? (
                        <input type="text" className="w-full p-2.5 border rounded-lg outline-blue-500 bg-gray-50 focus:bg-white"
                            value={userData.lastName} onChange={e => setUserData({...userData, lastName: e.target.value})} />
                    ) : (
                        <div className="text-lg font-medium text-gray-800 border-b border-transparent py-2">{userData.lastName || "-"}</div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                    {isEditingInfo ? (
                        <input type="text" className="w-full p-2.5 border rounded-lg outline-blue-500 bg-gray-50 focus:bg-white"
                            value={userData.phone} onChange={handlePhoneChange} maxLength={17} />
                    ) : (
                        <div className="text-lg font-medium text-gray-800 border-b border-transparent py-2">{userData.phone || "-"}</div>
                    )}
                </div>
            </div>

            {isEditingInfo && (
                <div className="flex justify-end gap-3 mt-4 animate-in fade-in">
                    <button onClick={() => setIsEditingInfo(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Bekor qilish</button>
                    <button onClick={handleSaveInfo} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold">Saqlash</button>
                </div>
            )}
        </div>

        {/* 2. XAVFSIZLIK */}
        <div className="p-8">
            <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-6">Kirish va Xavfsizlik</h3>
            <div className="grid grid-cols-2 gap-8">
                {/* LOGIN */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Login (Username)</div>
                            <div className="text-xl font-bold text-gray-800">@{userData.login}</div>
                        </div>
                        <User className="text-blue-300" size={24}/>
                    </div>
                    <button onClick={() => setIsChangingLogin(true)} className="mt-4 w-full py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors text-sm">
                        Loginni o'zgartirish
                    </button>
                </div>
                {/* PAROL */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-gray-500 font-bold uppercase mb-1">Parol</div>
                            <div className="text-xl font-bold text-gray-800">••••••••</div>
                        </div>
                        <Lock className="text-gray-300" size={24}/>
                    </div>
                    <button onClick={() => setIsChangingPassword(true)} className="mt-4 w-full py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold hover:bg-gray-700 hover:text-white transition-colors text-sm">
                        Parolni o'zgartirish
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- MODAL: PAROLNI O'ZGARTIRISH --- */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="font-bold text-lg text-gray-800">Parolni o'zgartirish</h3>
                    <button onClick={() => {setIsChangingPassword(false); resetSecurityForm();}}><X size={20} className="text-gray-500"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-bold text-green-700 mb-1">Yangi parol</label>
                        <input type={showNewPass ? "text" : "password"} 
                            className="w-full p-3 pr-10 border rounded-xl outline-green-500 bg-white" placeholder="Yangi parol..."
                            value={securityForm.newValue} onChange={e => setSecurityForm({...securityForm, newValue: e.target.value})}
                        />
                         <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-9 text-gray-400 hover:text-green-600">
                            {showNewPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-bold text-green-700 mb-1">Yangi parolni tasdiqlang</label>
                        <input type={showConfirmPass ? "text" : "password"} 
                            className="w-full p-3 pr-10 border rounded-xl outline-green-500 bg-white" placeholder="Yangi parolni qaytadan yozing"
                            value={securityForm.confirmValue} onChange={e => setSecurityForm({...securityForm, confirmValue: e.target.value})}
                        />
                        <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-9 text-gray-400 hover:text-green-600">
                            {showConfirmPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={() => {setIsChangingPassword(false); resetSecurityForm();}} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Bekor qilish</button>
                    <button onClick={handleChangePassword} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg hover:bg-blue-700">Saqlash</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: LOGINNI O'ZGARTIRISH --- */}
      {isChangingLogin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="font-bold text-lg text-gray-800">Loginni o'zgartirish</h3>
                    <button onClick={() => {setIsChangingLogin(false); resetSecurityForm();}}><X size={20} className="text-gray-500"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-blue-700 mb-1">Yangi Login</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400 font-bold">@</span>
                            <input type="text" className="w-full pl-8 p-3 border rounded-xl outline-blue-500 bg-white"
                                placeholder="Yangi login..." value={securityForm.newValue} onChange={e => setSecurityForm({...securityForm, newValue: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button onClick={() => {setIsChangingLogin(false); resetSecurityForm();}} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Bekor qilish</button>
                    <button onClick={handleChangeLogin} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg hover:bg-blue-700">O'zgartirish</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;


