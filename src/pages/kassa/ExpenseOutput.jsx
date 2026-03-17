import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
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

  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    expenseId: null
  });

  const [formData, setFormData] = useState({
    cashboxId: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    const anyModalOpen = isModalOpen || confirmModal.isOpen;

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
  }, [isModalOpen, confirmModal.isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [expensesData, cashboxesData] = await Promise.all([
        apiFetch('/api/expenses'),
        apiFetch('/api/cashboxes')
      ]);

      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCashboxes(Array.isArray(cashboxesData) ? cashboxesData : []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Ma'lumotlarni yuklab bo'lmadi");
      setExpenses([]);
      setCashboxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      cashboxId: '',
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

    setSaving(true);

    try {
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          cashboxId: Number(formData.cashboxId),
          amount: Number(formData.amount),
          note: formData.note.trim()
        })
      });

      toast.success("Xarajat jarayonda holatida yaratildi!");
      setIsModalOpen(false);
      resetForm();
      await fetchData();
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
      await fetchData();
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
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "O'chirishda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return expenses;

    return expenses.filter((item) => {
      const text = `
        ${item.id || ''}
        ${item.cashbox?.name || item.cashboxName || ''}
        ${item.note || ''}
        ${item.status || ''}
        ${item.createdByName || item.userName || ''}
        ${item.approvedByName || ''}
      `.toLowerCase();

      return text.includes(q);
    });
  }, [expenses, searchTerm]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Xarajatga pul chiqim
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Barcha xarajatlar ro'yxati, yaratish va tasdiqlash jarayoni
          </p>
        </div>

        {canCreateExpense && (
          <button
            onClick={openCreateModal}
            className="shrink-0 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Qo'shish
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="ID, kassa yoki izoh bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-4">Sana</th>
                <th className="p-4">Kassa nomi</th>
                <th className="p-4 text-right">Summasi</th>
                <th className="p-4">Izoh</th>
                <th className="p-4 text-center">Holati</th>
                <th className="p-4">Yaratgan</th>
                <th className="p-4">Tasdiqlagan</th>
                <th className="p-4 text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-slate-400">
                    Xarajatlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const isApproved =
                    String(item.status || '').toLowerCase() === 'tasdiqlandi';
                  const isPending =
                    String(item.status || '').toLowerCase() === 'jarayonda';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="p-4 text-slate-700">
                        {item.cashbox?.name || item.cashboxName || '-'}
                      </td>

                      <td className="p-4 text-right font-black text-rose-600">
                        {formatMoney(item.amount)}{' '}
                        <span className="text-[10px] text-slate-400">
                          {item.cashbox?.currency || item.currency || 'UZS'}
                        </span>
                      </td>

                      <td
                        className="p-4 text-slate-700 whitespace-normal break-words min-w-[260px] max-w-[420px]"
                        title={item.note || '-'}
                      >
                        {item.note || '-'}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}
                        >
                          {item.status || 'Jarayonda'}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.createdByName || item.userName || '-'}
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.approvedByName || '-'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canApproveExpense && isPending && (
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'approve',
                                  expenseId: item.id
                                })
                              }
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                              title="Tasdiqlash"
                            >
                              <CheckCircle size={18} />
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
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                              title="O'chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}

                          {isApproved && (
                            <span className="text-slate-300 text-xs font-bold">
                              -
                            </span>
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
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">
                Yangi xarajat
              </h2>

              <button
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Kassa <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={saving}
                  value={formData.cashboxId}
                  onChange={(e) =>
                    setFormData({ ...formData, cashboxId: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
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
                  className="w-full p-4 bg-white border-2 border-rose-200 rounded-xl outline-none focus:border-rose-500 font-black text-rose-600 text-xl"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Izoh <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  disabled={saving}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none"
                  placeholder="Xarajat sababi yoki izoh yozing..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={saving}
                onClick={handleSaveExpense}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 ${
                confirmModal.type === 'approve'
                  ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100'
                  : 'bg-rose-50 text-rose-500 shadow-rose-100'
              }`}
            >
              {confirmModal.type === 'approve' ? (
                <CheckCircle size={40} strokeWidth={2.5} />
              ) : (
                <AlertTriangle size={40} strokeWidth={2.5} />
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2">
              {confirmModal.type === 'approve'
                ? 'Xarajat tasdiqlansinmi?'
                : "Xarajat o'chirilsinmi?"}
            </h3>

            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
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
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
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
                className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
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