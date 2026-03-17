import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Phone,
  User,
  MapPin,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Edit
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const SupplierList = () => {
  const token = sessionStorage.getItem('token');
  const canManageSuppliers = hasPermission(PERMISSIONS.SUPPLIER_MANAGE);

  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const anyModalOpen = isModalOpen || deleteModal.isOpen || isSuccessOpen;

    if (anyModalOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isModalOpen, deleteModal.isOpen, isSuccessOpen]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setSuppliers(list);
        sessionStorage.setItem('suppliersList', JSON.stringify(list));
      } else {
        console.error('Server xatosi:', data);
      }
    } catch (err) {
      console.error('Xatolik:', err);
      const saved = JSON.parse(sessionStorage.getItem('suppliersList') || '[]');
      setSuppliers(saved);
    }
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);

    setTimeout(() => {
      setIsSuccessOpen(false);
    }, 2500);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setNameError(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setIsEditing(true);
    setEditingId(supplier.id);
    setName(supplier.name || '');
    setPhone(supplier.phone || '');
    setAddress(supplier.address || '');
    setNameError(false);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError(true);
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(`${API_URL}/api/suppliers/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            phone,
            address
          })
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
          await fetchSuppliers();
          setIsModalOpen(false);
          resetForm();
          showSuccessModal("Ta'minotchi muvaffaqiyatli tahrirlandi!");
        } else {
          console.error(data);
        }
      } else {
        const avtomatikId = Math.floor(1000 + Math.random() * 9000).toString();

        const res = await fetch(`${API_URL}/api/suppliers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customId: avtomatikId,
            name,
            phone,
            address
          })
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
          await fetchSuppliers();
          setIsModalOpen(false);
          resetForm();
          showSuccessModal("Yangi ta'minotchi muvaffaqiyatli qo'shildi!");
        } else {
          console.error(data);
        }
      }
    } catch (err) {
      console.error('Server bilan aloqa yo‘q!', err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/suppliers/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        await fetchSuppliers();
        setDeleteModal({ isOpen: false, id: null });
        showSuccessModal("Ta'minotchi ro'yxatdan o'chirildi!");
      } else {
        console.error(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.customId && s.customId.toString().includes(searchTerm))
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ta'minotchilar ro'yxati</h1>

        {canManageSuppliers && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={3} />
            Ta'minotchi qo'shish
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Ism yoki ID orqali qidirish..."
            className="w-full pl-12 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors font-medium text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSuppliers.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <User size={24} />
                </div>

                <div className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-1 rounded-md tracking-widest shadow-sm border border-blue-200">
                  #{item.customId || '0000'}
                </div>
              </div>

              {canManageSuppliers && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Tahrirlash"
                  >
                    <Edit size={20} />
                  </button>

                  <button
                    onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="O'chirish"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-lg font-black text-gray-800 mb-4 truncate">{item.name}</h3>

            <div className="space-y-3 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                {item.phone || 'Kiritilmagan'}
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.address || 'Kiritilmagan'}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold text-lg">
            Hech qanday ma'lumot topilmadi...
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Ta'minotchini tahrirlash" : "Yangi ta'minotchi"}
              </h2>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Ism / Kompaniya <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  className={`w-full p-3.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
                    nameError ? 'border-red-400 focus:ring-red-400 bg-red-50' : ''
                  }`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(false);
                  }}
                  placeholder="Masalan: Artel Electronics"
                />

                {nameError && (
                  <p className="text-xs text-red-500 font-bold mt-1">
                    Iltimos, ismini kiriting!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Telefon raqam
                </label>

                <input
                  type="text"
                  className="w-full p-3.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Manzil
                </label>

                <input
                  type="text"
                  className="w-full p-3.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Toshkent sh, Yunusobod..."
                />
              </div>

              {!isEditing && (
                <div className="text-[11px] text-blue-600 bg-blue-50 p-3 rounded-xl flex gap-2 items-center font-bold border border-blue-100 mt-2">
                  <User size={16} className="shrink-0" />
                  Tizim bu ta'minotchiga avtomatik tarzda 4 xonali maxsus ID biriktiradi.
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Save size={20} />
                {isEditing ? "Saqlash" : "Qo'shish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 text-red-600">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              Haqiqatan ham o'chirasizmi?
            </h3>

            <p className="text-center text-gray-500 text-sm mb-6">
              Bu ta'minotchi tizimdan butunlay o'chirib tashlanadi. Buni ortga qaytarib bo'lmaydi.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Orqaga
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>

              <div className="relative w-24 h-24 bg-emerald-500 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-emerald-200 rotate-3">
                <CheckCircle size={44} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              Muvaffaqiyatli!
            </h3>

            <p className="text-slate-500 font-bold text-sm px-4 leading-relaxed">
              {successMessage}
            </p>

            <div className="mt-8 px-4">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full animate-progress-line w-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;