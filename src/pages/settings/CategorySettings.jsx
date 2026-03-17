import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Layers,
  Edit,
  X,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
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

const CategorySettings = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: ''
  });

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const token = sessionStorage.getItem('token');
  const canManageCategories = hasPermission(PERMISSIONS.CATEGORY_MANAGE);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const anyModalOpen = deleteModal.isOpen || isSuccessOpen;

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
  }, [deleteModal.isOpen, isSuccessOpen]);

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);

    setTimeout(() => {
      setIsSuccessOpen(false);
    }, 2200);
  };

  const resetForm = () => {
    setNewCategory('');
    setIsEditing(false);
    setEditingId(null);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        if (Array.isArray(data)) {
          setCategories(data);
          sessionStorage.setItem('categoryList', JSON.stringify(data));
        } else {
          setCategories([]);
        }
      } else {
        toast.error(data?.error || "Kategoriyalarni yuklashda xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kategoriyalarni yuklashda xatolik yuz berdi!");
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newCategory.trim()) {
      return toast.error("Kategoriya nomini yozing!");
    }

    if (
      Array.isArray(categories) &&
      categories.some(
        (c) =>
          c.name?.toLowerCase() === newCategory.trim().toLowerCase() &&
          c.id !== editingId
      )
    ) {
      return toast.error("Bu kategoriya allaqachon mavjud!");
    }

    try {
      if (isEditing) {
        const res = await fetch(`${API_URL}/api/categories/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: newCategory.trim() })
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
          resetForm();
          fetchCategories();
          showSuccessModal("Kategoriya muvaffaqiyatli tahrirlandi!");
        } else {
          toast.error(data?.error || "Tahrirlashda xatolik yuz berdi.");
        }
      } else {
        const res = await fetch(`${API_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: newCategory.trim() })
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
          resetForm();
          fetchCategories();
          showSuccessModal("Kategoriya muvaffaqiyatli qo'shildi!");
        } else {
          toast.error(data?.error || "Qo'shishda xatolik yuz berdi.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Server bilan aloqa yo'q!");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setDeleteModal({ isOpen: false, id: null, name: '' });
        fetchCategories();
        showSuccessModal("Kategoriya o'chirildi!");
      } else {
        toast.error(
          data?.error || "O'chirib bo'lmaydi! (Balki bu kategoriyada tovarlar bordir)"
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Server bilan aloqa yo'q!");
    }
  };

  const openEdit = (category) => {
    setIsEditing(true);
    setEditingId(category.id);
    setNewCategory(category.name || '');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Kategoriyalarni boshqarish
      </h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit size={20} className="text-amber-600" />
                    Kategoriyani tahrirlash
                  </>
                ) : (
                  <>
                    <Plus size={20} className="text-blue-600" />
                    Yangi kategoriya
                  </>
                )}
              </h3>

              {isEditing && (
                <button
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Bekor qilish"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {canManageCategories ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nomi
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-blue-500"
                    placeholder="Masalan: Telefonlar"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdate()}
                  />
                </div>

                <button
                  onClick={handleAddOrUpdate}
                  className={`w-full py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    isEditing
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {isEditing ? <Save size={18} /> : <Plus size={18} />}
                  {isEditing ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 font-medium">
                Sizda kategoriyalarni boshqarish huquqi yo'q.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold text-gray-600 flex justify-between">
              <span>
                Mavjud kategoriyalar ({Array.isArray(categories) ? categories.length : 0})
              </span>
              <span className="text-xs font-normal text-gray-400">
                Barcha xodimlar uchun umumiy ro'yxat
              </span>
            </div>

            {!Array.isArray(categories) || categories.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Hozircha kategoriyalar yo'q
              </div>
            ) : (
              <ul className="divide-y">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800 flex items-center gap-2">
                      <Layers size={18} className="text-blue-500" />
                      {cat.name}
                    </span>

                    {canManageCategories && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                          title="Tahrirlash"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              id: cat.id,
                              name: cat.name
                            })
                          }
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

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
              <span className="font-bold text-gray-700">{deleteModal.name}</span> kategoriyasi
              tizimdan o'chiriladi.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
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

export default CategorySettings;