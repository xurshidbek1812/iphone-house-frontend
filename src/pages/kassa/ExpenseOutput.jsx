import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
  CalendarDays,
  User2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');
const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
};

const getStatusClasses = (status) => {
  const s = String(status || '').toLowerCase();

  if (s === 'tasdiqlandi') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  }

  return 'bg-blue-50 text-blue-700 border border-blue-100';
};

const ExpenseOutput = () => {
  const userRole = String(sessionStorage.getItem('userRole') || '').toLowerCase();

  const canCreateExpense =
    userRole === 'director' || hasPermission(PERMISSIONS.EXPENSE_CREATE);

  const canApproveExpense =
    userRole === 'director' || hasPermission(PERMISSIONS.EXPENSE_APPROVE);

  const [expenses, setExpenses] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenseGroups, setExpenseGroups] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    expense: null
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    expenseId: null
  });

  const [formData, setFormData] = useState({
    cashboxId: '',
    expenseCategoryId: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    const anyModalOpen =
      isModalOpen || confirmModal.isOpen || detailModal.isOpen;

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
  }, [isModalOpen, confirmModal.isOpen, detailModal.isOpen]);

  const fetchData = useCallback(async (targetPage = page, targetSearch = appliedSearch) => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        page: String(targetPage),
        limit: String(limit),
        search: targetSearch
      });

      const [expensesData, cashboxesData, groupsData] = await Promise.all([
        apiFetch(`/api/expenses?${query.toString()}`),
        apiFetch('/api/cashboxes'),
        apiFetch('/api/expense-categories/groups')
      ]);

      setExpenses(Array.isArray(expensesData?.items) ? expensesData.items : []);
      setPage(Number(expensesData?.page || 1));
      setTotalPages(Number(expensesData?.totalPages || 1));
      setTotal(Number(expensesData?.total || 0));

      setCashboxes(Array.isArray(cashboxesData) ? cashboxesData : []);
      setExpenseGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Ma'lumotlarni yuklab bo'lmadi");
      setExpenses([]);
      setCashboxes([]);
      setExpenseGroups([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, limit]);

  useEffect(() => {
    fetchData(1, appliedSearch);
  }, [appliedSearch, fetchData]);

  const resetForm = () => {
    setFormData({
      cashboxId: '',
      expenseCategoryId: '',
      amount: '',
      note: ''
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!formData.cashboxId) {
      return toast.error('Kassani tanlang!');
    }

    if (!Number(formData.amount) || Number(formData.amount) <= 0) {
      return toast.error("Summani to'g'ri kiriting!");
    }

    if (!formData.note.trim()) {
      return toast.error('Izoh kiritish majburiy!');
    }

    if (!formData.expenseCategoryId) {
      return toast.error("Xarajat moddasini tanlang!");
    }

    setSaving(true);

    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          cashboxId: Number(formData.cashboxId),
          expenseCategoryId: Number(formData.expenseCategoryId),
          amount: Number(formData.amount),
          note: formData.note.trim()
        })
      });

      toast.success("Xarajat jarayonda holatida yaratildi!");
      setIsModalOpen(false);
      resetForm();
      await fetchData(page, appliedSearch);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Xarajatni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const executeApprove = async (expenseId) => {
    setSaving(true);

    try {
      await apiFetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PATCH'
      });

      toast.success('Xarajat tasdiqlandi!');
      setConfirmModal({ isOpen: false, type: null, expenseId: null });
      await fetchData(page, appliedSearch);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Tasdiqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (expenseId) => {
    setSaving(true);

    try {
      await apiFetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      });

      toast.success("Xarajat o'chirildi!");
      setConfirmModal({ isOpen: false, type: null, expenseId: null });

      const nextPage = expenses.length === 1 && page > 1 ? page - 1 : page;
      await fetchData(nextPage, appliedSearch);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "O'chirishda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Xarajatga pul chiqim
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Xarajatlar ro'yxati, yaratish va tasdiqlash jarayoni
          </p>
        </div>

        {canCreateExpense && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={16} />
            Qo'shish
          </button>
        )}
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-3 flex-col lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              type="text"
              placeholder="ID, kassa, izoh yoki user bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-slate-700"
            />
          </div>

          <button
            onClick={handleSearchSubmit}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Qidirish
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50/95 text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Kassa nomi</th>
                <th className="px-4 py-3 text-right">Summasi</th>
                <th className="px-4 py-3">Xarajat moddasi</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Yaratgan</th>
                <th className="px-4 py-3 text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-14 text-center text-slate-400 text-sm">
                    Xarajatlar topilmadi
                  </td>
                </tr>
              ) : (
                expenses.map((item) => {
                  const isApproved =
                    String(item.status || '').toLowerCase() === 'tasdiqlandi';
                  const isPending =
                    String(item.status || '').toLowerCase() === 'jarayonda';

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-[13px] font-medium text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-[14px] font-medium text-slate-700">
                        {item.cashbox?.name || '-'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="text-[14px] font-semibold text-rose-600">
                          {formatMoney(item.amount)}
                          <span className="ml-1 text-[10px] text-slate-400 font-medium">
                            {item.cashbox?.currency || 'UZS'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-[260px] text-[14px] font-medium text-slate-700 whitespace-normal break-words">
                        {item.expenseCategory?.group?.name
                          ? `${item.expenseCategory.group.name} / ${item.expenseCategory.name}`
                          : item.expenseCategory?.name || '-'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {item.status || 'Jarayonda'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-[13px] font-medium text-slate-600">
                        {item.createdByName || '-'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setDetailModal({
                                isOpen: true,
                                expense: item
                              })
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
                            title="Ko'rish"
                          >
                            <Eye size={15} />
                          </button>

                          {canApproveExpense && isPending && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'approve',
                                  expenseId: item.id
                                })
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              title="Tasdiqlash"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {canApproveExpense && !isApproved && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'delete',
                                  expenseId: item.id
                                })
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="O'chirish"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Jami: <span className="font-semibold text-slate-800">{total} ta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(page - 1, appliedSearch)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Oldingi
            </button>

            <div className="min-w-[84px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchData(page + 1, appliedSearch)}
              disabled={page >= totalPages || loading || totalPages === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keyingi
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Yangi xarajat</h2>
                <p className="text-sm text-slate-500 mt-0.5">Xarajat ma'lumotlarini kiriting</p>
              </div>

              <button
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Kassa <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={saving}
                  value={formData.cashboxId}
                  onChange={(e) =>
                    setFormData({ ...formData, cashboxId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kassani tanlang</option>
                  {cashboxes
                    .filter((c) => c.isActive)
                    .map((cashbox) => (
                      <option key={cashbox.id} value={cashbox.id}>
                        {cashbox.name} ({cashbox.currency})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Summasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={saving}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-rose-200 bg-white px-3 py-3 text-lg font-semibold text-rose-600 outline-none focus:border-rose-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Xarajat moddasi <span className="text-red-500">*</span>
                </label>

                <select
                  disabled={saving}
                  value={formData.expenseCategoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseCategoryId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Xarajat moddasini tanlang</option>

                  {expenseGroups.map((group) => (
                    <optgroup key={group.id} label={group.name}>
                      {(group.categories || []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Izoh <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  disabled={saving}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Xarajat sababi yoki izoh yozing..."
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-slate-200 bg-white">
              <button
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={handleSaveExpense}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModal.isOpen && detailModal.expense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Xarajat tafsiloti</h3>
                <p className="text-sm text-slate-500 mt-0.5">Batafsil ma'lumot</p>
              </div>
              <button
                onClick={() => setDetailModal({ isOpen: false, expense: null })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Wallet size={14} />
                    Kassa
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {detailModal.expense.cashbox?.name || '-'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Receipt size={14} />
                    Xarajat moddasi
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {detailModal.expense.expenseCategory?.group?.name
                      ? `${detailModal.expense.expenseCategory.group.name} / ${detailModal.expense.expenseCategory.name}`
                      : detailModal.expense.expenseCategory?.name || '-'}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-rose-500 font-black mb-2">
                    Summa
                  </div>
                  <div className="text-xl font-semibold text-rose-600">
                    {formatMoney(detailModal.expense.amount)} UZS
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">
                    Holati
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      detailModal.expense.status
                    )}`}
                  >
                    {detailModal.expense.status || 'Jarayonda'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <User2 size={14} />
                    Yaratgan
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {detailModal.expense.createdByName || '-'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <CheckCircle size={14} />
                    Tasdiqlagan
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {detailModal.expense.approvedByName || '-'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <CalendarDays size={14} />
                    Sana
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDateTime(detailModal.expense.createdAt)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">
                  Izoh
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-6">
                  {detailModal.expense.note || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                confirmModal.type === 'approve'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {confirmModal.type === 'approve' ? (
                <CheckCircle size={30} />
              ) : (
                <AlertTriangle size={30} />
              )}
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {confirmModal.type === 'approve'
                ? 'Xarajat tasdiqlansinmi?'
                : "Xarajat o'chirilsinmi?"}
            </h3>

            <p className="text-sm text-slate-500 mb-6 leading-6">
              {confirmModal.type === 'approve'
                ? "Tasdiqlangandan keyin bu xarajat kassadan ayiriladi."
                : "Bu xarajat butunlay o'chiriladi."}
            </p>

            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={() =>
                  setConfirmModal({ isOpen: false, type: null, expenseId: null })
                }
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={() =>
                  confirmModal.type === 'approve'
                    ? executeApprove(confirmModal.expenseId)
                    : executeDelete(confirmModal.expenseId)
                }
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-70 ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {confirmModal.type === 'approve' ? 'Tasdiqlash' : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseOutput;