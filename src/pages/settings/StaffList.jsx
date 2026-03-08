import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Lock, Shield, Edit, X, Search, Phone, Briefcase, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- TOAST QO'SHILDI

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // O'chirish modali uchun
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

  // YANGI FORM FORMATI (Ism, Familiya, Telefon qo'shildi)
  const [formData, setFormData] = useState({ 
    id: null, 
    firstName: '', 
    lastName: '', 
    phone: '', 
    login: '', 
    password: '', 
    role: 'admin' 
  });

  // --- 1. YUKLASH ---
  useEffect(() => {
    const savedStaff = JSON.parse(localStorage.getItem('staffList') || "[]");
    setStaff(savedStaff);
  }, []);

  // --- 2. MODALNI OCHISH ---
  const handleOpenModal = (user = null) => {
    if (user) {
        setFormData(user); 
        setIsEditing(true);
    } else {
        // Yangi qo'shishda maydonlarni tozalash
        setFormData({ 
            id: null, 
            firstName: '', 
            lastName: '', 
            phone: '+998', 
            login: '', 
            password: '', 
            role: 'admin' 
        }); 
        setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  // --- 3. SAQLASH ---
  const handleSave = () => {
    // Validatsiya - ALERT o'rniga TOAST ishlatamiz
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.login || !formData.password) {
        return toast.error("Barcha maydonlarni to'ldiring!");
    }
    
    let updatedStaff;

    if (isEditing) {
        updatedStaff = staff.map(u => u.id === formData.id ? formData : u);
        toast.success("Xodim ma'lumotlari yangilandi!");
    } else {
        const newUser = { ...formData, id: Date.now() };
        updatedStaff = [...staff, newUser];
        toast.success("Yangi xodim qo'shildi!");
    }
    
    setStaff(updatedStaff);
    localStorage.setItem('staffList', JSON.stringify(updatedStaff));
    setIsModalOpen(false); 
  };

  // --- 4. O'CHIRISH (Modal orqali) ---
  const confirmDelete = () => {
      const updatedStaff = staff.filter(u => u.id !== deleteModal.userId);
      setStaff(updatedStaff);
      localStorage.setItem('staffList', JSON.stringify(updatedStaff));
      
      toast.success("Xodim tizimdan o'chirildi!");
      setDeleteModal({ isOpen: false, userId: null });
  };

  const filteredStaff = staff.filter(s => 
    s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Xodimlar va Direktorlar</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center mb-6">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input 
                type="text" 
                placeholder="Xodimni qidirish (Ism yoki Familiya)..." 
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button 
            onClick={() => handleOpenModal()} 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-colors"
        >
            <Plus size={18} /> Yangi qo'shish
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                    <th className="p-4">Xodim (F.I.O)</th>
                    <th className="p-4">Telefon</th>
                    <th className="p-4">Login</th>
                    <th className="p-4">Parol</th>
                    <th className="p-4 text-center">Lavozim</th>
                    <th className="p-4 text-center">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {filteredStaff.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                        <td className="p-4 font-bold text-gray-700 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${user.role === 'director' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <div>{user.firstName} {user.lastName}</div>
                            </div>
                        </td>
                        <td className="p-4 text-gray-600">{user.phone}</td>
                        <td className="p-4 text-blue-600 font-medium">@{user.login}</td>
                        <td className="p-4 text-gray-500 font-mono tracking-wider">{user.password}</td>
                        <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit mx-auto ${
                                user.role === 'director' 
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {user.role === 'director' ? <Briefcase size={12}/> : <Shield size={12}/>} 
                                {user.role === 'director' ? 'DIREKTOR' : 'ADMIN'}
                            </span>
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors">
                                <Edit size={18}/>
                            </button>
                            <button onClick={() => setDeleteModal({ isOpen: true, userId: user.id })} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                                <Trash2 size={18}/>
                            </button>
                        </td>
                    </tr>
                ))}
                {filteredStaff.length === 0 && (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400">Ro'yxat bo'sh</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- MA'LUMOT QO'SHISH / TAHRIRLASH MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditing ? "Ma'lumotni tahrirlash" : "Yangi xodim qo'shish"}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                            <input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Azizbek" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                            <input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Karimov" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})}/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam (SMS uchun)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                            <input type="text" className="w-full pl-10 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="+998 90 123 45 67" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400 font-bold">@</span>
                                <input type="text" className="w-full pl-8 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="login" value={formData.login} onChange={e=>setFormData({...formData, login: e.target.value})}/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <input type="text" className="w-full pl-10 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="******" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lavozim (Rol)</label>
                        <select 
                            className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={formData.role} 
                            onChange={e=>setFormData({...formData, role: e.target.value})}
                        >
                            <option value="admin">Admin (Sotuvchi)</option>
                            <option value="director">DIREKTOR (Boshqaruvchi)</option> 
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-6 mt-2">
                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Bekor qilish</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">{isEditing ? "Saqlash" : "Qo'shish"}</button>
                </div>
            </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --- YANGI: XODIMNI O'CHIRISHNI TASDIQLASH MODALI --- */}
      {/* ========================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 text-center animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-red-50 text-red-500 shadow-lg shadow-red-100 rotate-3">
                    <AlertTriangle size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">O'chirishni tasdiqlang</h3>
                <p className="text-slate-500 font-bold text-sm mb-8 px-2 leading-relaxed">
                    Haqiqatan ham ushbu xodimni tizimdan butunlay o'chirib tashlamoqchimisiz?
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteModal({ isOpen: false, userId: null })} 
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs"
                    >
                        BEKOR QILISH
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-600 active:scale-95 transition-all uppercase text-xs tracking-widest"
                    >
                        O'CHIRISH
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default StaffList;