import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const ExpenseCategorySettings = () => {
  const userRole = String(sessionStorage.getItem('userRole') || '').toLowerCase();

  const canManageExpenseCategories =
    userRole === 'director' ||
    hasPermission(PERMISSIONS.EXPENSE_CATEGORY_MANAGE);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const [searchTerm, setSearchTerm] = useState('');

  const [groupModal, setGroupModal] = useState({
    isOpen: false,
    isEditing: false,
    id: null,
    name: ''
  });

  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    isEditing: false,
    id: null,
    name: '',
    groupId: ''
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // group | category
    id: null,
    title: ''
  });

  useEffect(() => {
    const anyModalOpen =
      groupModal.isOpen || categoryModal.isOpen || deleteModal.isOpen;

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
  }, [groupModal.isOpen, categoryModal.isOpen, deleteModal.isOpen]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/expense-categories/groups');
      const safeData = Array.isArray(data) ? data : [];
      setGroups(safeData);

      setExpandedGroups((prev) => {
        const next = { ...prev };
        safeData.forEach((group) => {
          if (typeof next[group.id] === 'undefined') {
            next[group.id] = true;
          }
        });
        return next;
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Xarajat moddalari yuklanmadi");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const openCreateGroupModal = () => {
    setGroupModal({
      isOpen: true,
      isEditing: false,
      id: null,
      name: ''
    });
  };

  const openEditGroupModal = (group) => {
    setGroupModal({
      isOpen: true,
      isEditing: true,
      id: group.id,
      name: group.name || ''
    });
  };

  const openCreateCategoryModal = (groupId = '') => {
    setCategoryModal({
      isOpen: true,
      isEditing: false,
      id: null,
      name: '',
      groupId: groupId ? String(groupId) : ''
    });
  };

  const openEditCategoryModal = (category, groupId) => {
    setCategoryModal({
      isOpen: true,
      isEditing: true,
      id: category.id,
      name: category.name || '',
      groupId: String(groupId)
    });
  };

  const handleSaveGroup = async () => {
    const name = groupModal.name.trim();

    if (!name) {
      return toast.error('Guruh nomini kiriting!');
    }

    setSaving(true);

    try {
      if (groupModal.isEditing) {
        await apiFetch(`/api/expense-categories/groups/${groupModal.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name })
        });
        toast.success('Guruh yangilandi!');
      } else {
        await apiFetch('/api/expense-categories/groups', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
        toast.success("Yangi guruh qo'shildi!");
      }

      setGroupModal({
        isOpen: false,
        isEditing: false,
        id: null,
        name: ''
      });

      await fetchGroups();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Guruhni saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryModal.name.trim();
    const groupId = Number(categoryModal.groupId);

    if (!groupId) {
      return toast.error('Guruhni tanlang!');
    }

    if (!name) {
      return toast.error('Modda nomini kiriting!');
    }

    setSaving(true);

    try {
      if (categoryModal.isEditing) {
        await apiFetch(`/api/expense-categories/${categoryModal.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            groupId
          })
        });
        toast.success('Xarajat moddasi yangilandi!');
      } else {
        await apiFetch('/api/expense-categories', {
          method: 'POST',
          body: JSON.stringify({
            name,
            groupId
          })
        });
        toast.success("Yangi xarajat moddasi qo'shildi!");
      }

      setCategoryModal({
        isOpen: false,
        isEditing: false,
        id: null,
        name: '',
        groupId: ''
      });

      await fetchGroups();
      setExpandedGroups((prev) => ({ ...prev, [groupId]: true }));
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Xarajat moddasini saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    setSaving(true);

    try {
      if (deleteModal.type === 'group') {
        await apiFetch(`/api/expense-categories/groups/${deleteModal.id}`, {
          method: 'DELETE'
        });
        toast.success("Guruh o'chirildi!");
      } else {
        await apiFetch(`/api/expense-categories/${deleteModal.id}`, {
          method: 'DELETE'
        });
        toast.success("Xarajat moddasi o'chirildi!");
      }

      setDeleteModal({
        isOpen: false,
        type: null,
        id: null,
        title: ''
      });

      await fetchGroups();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "O'chirishda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return groups;

    return groups
      .map((group) => {
        const groupMatch = String(group.name || '').toLowerCase().includes(query);

        const categories = Array.isArray(group.categories)
          ? group.categories.filter((category) =>
              String(category.name || '').toLowerCase().includes(query)
            )
          : [];

        if (groupMatch) {
          return group;
        }

        if (categories.length > 0) {
          return {
            ...group,
            categories
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [groups, searchTerm]);

  if (!canManageExpenseCategories) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <FolderTree size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Ruxsat yo‘q
          </h2>
          <p className="text-slate-500 font-medium">
            Sizda xarajat moddalari bo‘limini boshqarish huquqi yo‘q.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Xarajat moddalari
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Xarajat guruhlari va ularning ichidagi moddalarni boshqarish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateCategoryModal()}
            className="px-5 py-3 bg-white text-slate-700 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Modda qo&apos;shish
          </button>

          <button
            onClick={openCreateGroupModal}
            className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Guruh qo&apos;shish
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Guruh yoki modda nomi bo‘yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto" size={32} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            Xarajat moddalari topilmadi
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredGroups.map((group) => {
              const categories = Array.isArray(group.categories)
                ? group.categories
                : [];

              const isExpanded = !!expandedGroups[group.id];

              return (
                <div key={group.id}>
                  <div className="px-6 py-5 bg-slate-50/70 flex items-center justify-between gap-4">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center gap-3 text-left min-w-0"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {isExpanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-800 truncate">
                          {group.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                          {categories.length} ta modda
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openCreateCategoryModal(group.id)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="Modda qo'shish"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        onClick={() => openEditGroupModal(group)}
                        className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                        title="Guruhni tahrirlash"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            type: 'group',
                            id: group.id,
                            title: group.name
                          })
                        }
                        className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                        title="Guruhni o'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 py-4 bg-white">
                      {categories.length === 0 ? (
                        <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-medium">
                          Bu guruh ichida hali modda yo&apos;q
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">
                                  {category.name}
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                  ID: {category.id}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() =>
                                    openEditCategoryModal(category, group.id)
                                  }
                                  className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                                  title="Moddani tahrirlash"
                                >
                                  <Edit2 size={16} />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      isOpen: true,
                                      type: 'category',
                                      id: category.id,
                                      title: category.name
                                    })
                                  }
                                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                                  title="Moddani o'chirish"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {groupModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setGroupModal({
                isOpen: false,
                isEditing: false,
                id: null,
                name: ''
              });
            }
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">
                {groupModal.isEditing
                  ? 'Guruhni tahrirlash'
                  : 'Yangi guruh'}
              </h2>

              <button
                disabled={saving}
                onClick={() =>
                  setGroupModal({
                    isOpen: false,
                    isEditing: false,
                    id: null,
                    name: ''
                  })
                }
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Guruh nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={groupModal.name}
                  onChange={(e) =>
                    setGroupModal((prev) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                  placeholder="Masalan: Ishchilar uchun xarajatlar"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                disabled={saving}
                onClick={() =>
                  setGroupModal({
                    isOpen: false,
                    isEditing: false,
                    id: null,
                    name: ''
                  })
                }
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={handleSaveGroup}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setCategoryModal({
                isOpen: false,
                isEditing: false,
                id: null,
                name: '',
                groupId: ''
              });
            }
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">
                {categoryModal.isEditing
                  ? 'Moddani tahrirlash'
                  : 'Yangi modda'}
              </h2>

              <button
                disabled={saving}
                onClick={() =>
                  setCategoryModal({
                    isOpen: false,
                    isEditing: false,
                    id: null,
                    name: '',
                    groupId: ''
                  })
                }
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Guruh <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={saving}
                  value={categoryModal.groupId}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      groupId: e.target.value
                    }))
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                >
                  <option value="">Guruhni tanlang</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Modda nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={categoryModal.name}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                  placeholder="Masalan: Yo'l kira uchun xarajat"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                disabled={saving}
                onClick={() =>
                  setCategoryModal({
                    isOpen: false,
                    isEditing: false,
                    id: null,
                    name: '',
                    groupId: ''
                  })
                }
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={handleSaveCategory}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 bg-rose-50 text-rose-500 shadow-rose-100">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2">
              O&apos;chirishni tasdiqlang
            </h3>

            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              Haqiqatan ham{' '}
              <span className="font-black text-slate-700">
                {deleteModal.title}
              </span>{' '}
              ni o&apos;chirmoqchimisiz?
            </p>

            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    type: null,
                    id: null,
                    title: ''
                  })
                }
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={handleDelete}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategorySettings;