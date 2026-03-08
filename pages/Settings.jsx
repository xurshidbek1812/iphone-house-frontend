import React, { useState, useEffect } from 'react';
import { Save, User, Lock, Info, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- TOAST QO'SHILDI

const Settings = () => {
  const currentRole = localStorage.getItem('userRole') || 'admin';
  const currentLogin = localStorage.getItem('currentUserLogin');

  // Forma ma'lumotlari
  const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      login: '',
      password: ''
  });

  // Komponent yuklanganda ma'lumotlarni o'qiymiz
  useEffect(() => {
      // 1. Agar Master Direktor bo'lsa
      if (currentRole === 'director') {
          const savedDirector = JSON.parse(localStorage.getItem('masterDirector') || "null");
          if (savedDirector) {
              const names = savedDirector.name.split(' ');
              setFormData({
                  firstName: names[0] || 'Bosh',
                  lastName: names[1] || 'Direktor',
                  login: savedDirector.login,
                  password: savedDirector.password
              });
          } else {
              // Default holat (hali o'zgartirilmagan)
              setFormData({
                  firstName: 'Bosh',
                  lastName: 'Direktor',
                  login: 'director',
                  password: '777'
              });
          }
      } 
      // 2. Agar oddiy xodim bo'lsa
      else {
          const staffList = JSON.parse(localStorage.getItem('staffList') || "[]");
          const me = staffList.find(u => u.login === currentLogin);
          if (me) {
              setFormData({
                  firstName: me.firstName || me.name.split(' ')[0] || '',
                  lastName: me.lastName || me.name.split(' ')[1] || '',
                  login: me.login,
                  password: me.password
              });
          }
      }
  }, [currentRole, currentLogin]);


  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // SAQLASH MANTIQI
  const handleSave = () => {
      if (!formData.firstName || !formData.login || !formData.password) {
          toast.error("Barcha qatorlarni to'ldiring!");
          return;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // 1. DIREKTOR UCHUN SAQLASH
      if (currentRole === 'director') {
          const directorData = {
              name: fullName,
              login: formData.login,
              password: formData.password
          };
          localStorage.setItem('masterDirector', JSON.stringify(directorData));
      } 
      // 2. XODIM UCHUN SAQLASH
      else {
          const staffList = JSON.parse(localStorage.getItem('staffList') || "[]");
          const updatedList = staffList.map(u => {
              if (u.login === currentLogin) {
                  return { ...u, firstName: formData.firstName, lastName: formData.lastName, name: fullName, login: formData.login, password: formData.password };
              }
              return u;
          });
          localStorage.setItem('staffList', JSON.stringify(updatedList));
      }

      // 3. Ikkala holat uchun ham joriy sessiyani yangilash
      localStorage.setItem('userName', fullName);
      localStorage.setItem('currentUserLogin', formData.login);

      toast.success("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      
      // Ism va rasmlar o'zgarishi uchun oynani yangilab yuboramiz
      setTimeout(() => {
          window.location.reload();
      }, 1000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Sozlamalar</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Chap Menu */}
        <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 h-fit">
            <ul className="space-y-1">
                <li className="flex items-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-xl font-bold cursor-pointer transition-all">
                    <User size={20} /> Profil sozlamalari
                </li>
                {/* Boshqa menyularni vaqtincha o'chirib qo'yish yoki shunchaki fon sifatida qoldirish mumkin */}
                <li className="flex items-center gap-3 p-4 text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer font-medium transition-all">
                    <Lock size={20} /> Xavfsizlik
                </li>
            </ul>
        </div>

        {/* Asosiy Profil Qismi */}
        <div className="md:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
                
                {/* Bezak */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8 mt-2">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                        {formData.firstName ? formData.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{formData.firstName} {formData.lastName}</h2>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest mt-1 inline-block">
                            {currentRole === 'director' ? 'Bosh Direktor' : currentRole}
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ism</label>
                        <input 
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Familiya</label>
                        <input 
                            type="text" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                        />
                    </div>
                    
                    {/* Maxsus Chegara */}
                    <div className="col-span-1 md:col-span-2 my-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <span className="h-px bg-slate-100 flex-1"></span>
                            Kirish Ma'lumotlari
                            <span className="h-px bg-slate-100 flex-1"></span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1"><User size={12}/> Login</label>
                        <input 
                            type="text" 
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1"><Lock size={12}/> Parol</label>
                        <input 
                            type="text" 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black tracking-widest text-slate-800 outline-none focus:border-blue-500 transition-all" 
                        />
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Info size={14} className="text-blue-500"/>
                        O'zgarishlar tizimga qayta kirganda ham saqlanadi.
                    </p>
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all tracking-wide"
                    >
                        <Save size={20} /> SAQLASH
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;