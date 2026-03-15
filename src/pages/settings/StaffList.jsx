import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Lock,
  Shield,
  Edit,
  X,
  Search,
  Phone,
  Briefcase,
  AlertTriangle,
  Loader2,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const PERMISSION_GROUPS = [
  {
    title: 'Kirimlar',
    color: 'blue',
    items: [
      { key: 'invoice.approve', label: "Kirimni tasdiqlash" }
    ]
  },
  {
    title: "Qora ro'yxat",
    color: 'red',
    items: [
      { key: 'blacklist.approve', label: "Qora ro'yxat so'rovini tasdiqlash" }
    ]
  },
  {
    title: 'Xodimlar',
    color: 'purple',
    items: [
      { key: 'users.manage', label: "Xodimlarni boshqarish" }
    ]
  },
  {
    title: 'Kassa',
    color: 'emerald',
    items: [
        { key: 'cashbox.manage', label: "Kassalarni boshqarish" }
    ]
  }

];

const groupColorClasses = {
  blue: {
    box: 'border-blue-200 bg-blue-50/40',
    title: 'text-blue-700',
    checked: 'bg-blue-50 border-blue-300',
    unchecked: 'bg-white border-gray-200 hover:border-blue-200'
  },
  red: {
    box: 'border-red-200 bg-red-50/40',
    title: 'text-red-700',
    checked: 'bg-red-50 border-red-300',
    unchecked: 'bg-white border-gray-200 hover:border-red-200'
  },
  purple: {
    box: 'border-purple-200 bg-purple-50/40',
    title: 'text-purple-700',
    checked: 'bg-purple-50 border-purple-300',
    unchecked: 'bg-white border-gray-200 hover:border-purple-200'
  },
  emerald: {
    box: 'border-emerald-200 bg-emerald-50/40',
    title: 'text-emerald-700',
    checked: 'bg-emerald-50 border-emerald-300',
    unchecked: 'bg-white border-gray-200 hover:border-emerald-200'
  }
};

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

  const [formData, setFormData] = useState({
    id: null,
    firstName: '',
    lastName: '',
    phone: '',
    login: '',
    password: '',
    role: 'admin',
    permissions: []
  });

  const token = sessionStorage.getItem('token');
  const currentUserRole = (sessionStorage.getItem('userRole') || '').toLowerCase();
  const currentUserLogin = sessionStorage.getItem('currentUserLogin') || '';
  const isCurrentDirector = currentUserRole === 'director';

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
        setStaff(Array.isArray(data) ? data : []);
      } else {
        toast.error(data?.error || data?.message || "Xodimlarni yuklashda xatolik yuz berdi");
        setStaff([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Server bilan ulanishda xatolik!');
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      const isTargetDirector = String(user.role || '').toLowerCase() === 'director';

      if (!isCurrentDirector && isTargetDirector) {
        toast.error("Direktor akkauntini tahrirlash mumkin emas!");
        return;
      }

      const nameParts = String(user.fullName || '').split(' ').filter(Boolean);
      const fName = nameParts[0] || '';
      const lName = nameParts.slice(1).join(' ') || '';

      setFormData({
        id: user.id,
        firstName: fName,
        lastName: lName,
        phone: user.phone || '+998',
        login: user.username || '',
        password: '',
        role: user.role || 'admin',
        permissions: Array.isArray(user.permissions) ? user.permissions.filter(Boolean) : []
      });
      setIsEditing(true);
    } else {
      setFormData({
        id: null,
        firstName: '',
        lastName: '',
        phone: '+998',
        login: '',
        password: '',
        role: 'admin',
        permissions: []
      });
      setIsEditing(false);
    }

    setIsModalOpen(true);
  };

  const togglePermission = (permissionKey) => {
    if (!permissionKey) return;

    setFormData((prev) => {
      const currentPermissions = Array.isArray(prev.permissions)
        ? prev.permissions.filter(Boolean)
        : [];

      const exists = currentPermissions.includes(permissionKey);

      return {
        ...prev,
        permissions: exists
          ? currentPermissions.filter((p) => p !== permissionKey)
          : [...currentPermissions, permissionKey]
      };
    });
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.login) {
      return toast.error("Barcha maydonlarni to'ldiring!");
    }

    if (!isEditing && !formData.password) {
      return toast.error('Yangi xodim uchun parol kiriting!');
    }

    setIsLoading(true);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing
      ? `${API_URL}/api/users/${formData.id}`
      : `${API_URL}/api/users`;

    const payload = {
      username: formData.login,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      role: formData.role,
      permissions: Array.isArray(formData.permissions)
        ? formData.permissions.filter(Boolean)
        : []
    };

    if (formData.password?.trim()) {
      payload.password = formData.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
        toast.success(isEditing ? "Ma'lumotlar yangilandi!" : "Yangi xodim qo'shildi!");
        setIsModalOpen(false);
        fetchStaff();
      } else {
        toast.error(data?.error || data?.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      console.error(error);
      toast.error("Serverga ulanib bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/${deleteModal.userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
        toast.success("Xodim tizimdan o'chirildi!");
        setDeleteModal({ isOpen: false, userId: null });
        fetchStaff();
      } else {
        toast.error(data?.error || data?.message || "O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error(error);
      toast.error('Server xatosi');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const isTargetDirector = String(s.role || '').toLowerCase() === 'director';

    if (!isCurrentDirector && isTargetDirector) {
      return false;
    }

    const searchStr = `${s.fullName || ''} ${s.username || ''} ${s.phone || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const isSelfEdit = isEditing && formData.login === currentUserLogin;
  const showRoleAndPermissions = !isSelfEdit && isCurrentDirector;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Xodimlar va Direktorlar</h1>
        {isLoading && <Loader2 className="animate-spin text-blue-600" size={24} />}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Xodimni qidirish..."
            className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isCurrentDirector && (
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-colors"
          >
            <Plus size={18} /> Yangi qo'shish
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Xodim (F.I.O)</th>
              <th className="p-4">Telefon</th>
              <th className="p-4">Login</th>
              <th className="p-4 text-center">Lavozim</th>
              <th className="p-4 text-center">Ruxsatlar</th>
              <th className="p-4 text-center">Amallar</th>
            </tr>
          </thead>

          <tbody className="divide-y text-sm">
            {filteredStaff.map((user) => {
              const isTargetDirector = String(user.role || '').toLowerCase() === 'director';
              const canManageThisUser = isCurrentDirector || !isTargetDirector;

              return (
                <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-gray-700 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        user.role === 'director'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {(user.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>{user.fullName}</div>
                  </td>

                  <td className="p-4 text-gray-600">{user.phone || '-'}</td>
                  <td className="p-4 text-blue-600 font-medium">@{user.username || '-'}</td>

                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit mx-auto ${
                        user.role === 'director'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {user.role === 'director' ? <Briefcase size={12} /> : <Shield size={12} />}
                      {user.role === 'director' ? 'DIREKTOR' : 'ADMIN'}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {Array.isArray(user.permissions) ? user.permissions.length : 0} ta
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {canManageThisUser ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, userId: user.id })}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 uppercase">
                        Yopiq
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredStaff.length === 0 && !isLoading && (
          <div className="p-10 text-center text-gray-400">Xodimlar topilmadi</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 scale-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Ma'lumotni tahrirlash" : "Yangi xodim qo'shish"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Azizbek"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Karimov"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+998 90 123 45 67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 font-bold">@</span>
                    <input
                      type="text"
                      className="w-full pl-8 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="login"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value.toLowerCase() })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parol {isEditing && "(O'zgartirish uchun)"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      className="w-full pl-10 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="******"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {showRoleAndPermissions && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lavozim (Rol)</label>
                    <select
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="admin">Admin (Sotuvchi)</option>
                      <option value="director">Direktor</option>
                    </select>
                  </div>

                  {formData.role !== 'director' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckSquare size={18} className="text-blue-600" />
                        <label className="block text-sm font-semibold text-gray-800">
                          Ruxsatlar
                        </label>
                      </div>

                      <div className="space-y-4">
                        {PERMISSION_GROUPS.map((group) => {
                          const colorSet = groupColorClasses[group.color];

                          return (
                            <div
                              key={group.title}
                              className={`rounded-2xl border p-4 ${colorSet.box}`}
                            >
                              <h3 className={`text-sm font-bold mb-3 ${colorSet.title}`}>
                                {group.title}
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {group.items.map((permission) => {
                                  const checked = Array.isArray(formData.permissions)
                                    ? formData.permissions.includes(permission.key)
                                    : false;

                                  return (
                                    <label
                                      key={permission.key}
                                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        checked ? colorSet.checked : colorSet.unchecked
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => togglePermission(permission.key)}
                                        className="w-4 h-4"
                                      />

                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">
                                          {permission.label}
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-mono">
                                          {permission.key}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.role === 'director' && (
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium">
                      Direktor barcha huquqlarga avtomatik ega bo'ladi.
                    </div>
                  )}
                </>
              )}

              {!showRoleAndPermissions && isEditing && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium">
                  Siz o'zingizning profil ma'lumotlaringizni va parolingizni o'zgartira olasiz, lekin role va ruxsatlarni o'zgartira olmaysiz.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 mt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={18} />}
                {isEditing ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-red-50 text-red-500 shadow-lg shadow-red-100 rotate-3">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              O'chirishni tasdiqlang
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-8 px-2 leading-relaxed">
              Haqiqatan ham ushbu xodimni tizimdan o'chirib tashlamoqchimisiz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, userId: null })}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-600 active:scale-95 transition-all uppercase text-xs tracking-widest"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;
