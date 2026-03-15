import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Wallet,
  Loader2,
  AlertTriangle,
  UserCircle,
  CircleDollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
};

const getTransactionTypeBadge = (type) => {
  const safeType = String(type || '').toUpperCase();

  if (safeType === 'TRANSFER_IN') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  if (safeType === 'TRANSFER_OUT') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const getTransactionTypeLabel = (type) => {
  const safeType = String(type || '').toUpperCase();

  if (safeType === 'TRANSFER_IN') return "BOSHQA KASSADAN KIRIM";
  if (safeType === 'TRANSFER_OUT') return "BOSHQA KASSAGA CHIQIM";

  return safeType || 'AMAL';
};

const ManageCash = () => {
  const token = sessionStorage.getItem('token');
  const canManageCashbox = hasPermission(PERMISSIONS.CASHBOX_MANAGE);

  const [cashboxes, setCashboxes] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    cashboxId: null
  });

  const [transactionModal, setTransactionModal] = useState({
    isOpen: false,
    type: 'deposit',
    cashboxId: null,
    cashboxName: ''
  });

  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    cashboxId: null,
    cashboxName: ''
  });

  const [transactions, setTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    note: '',
    selectedCashboxId: ''
  });

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    currency: 'UZS',
    responsibleName: '',
    isActive: true
  });

  const fetchCashboxes = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setCashboxes(Array.isArray(data) ? data : []);
      } else {
        toast.error(data?.error || "Kassalarni yuklab bo'lmadi");
        setCashboxes([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Server bilan ulanishda xatolik");
      setCashboxes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffOptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/simple-list`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setStaffOptions(Array.isArray(data) ? data : []);
      } else {
        setStaffOptions([]);
      }
    } catch (error) {
      console.error('fetchStaffOptions xatosi:', error);
      setStaffOptions([]);
    }
  };

  const fetchTransactions = async (cashboxId) => {
    setHistoryLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes/${cashboxId}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        toast.error(data?.error || "Kassa tarixini yuklab bo'lmadi");
        setTransactions([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Tarixni yuklashda xatolik");
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCashboxes();

    if (canManageCashbox) {
      fetchStaffOptions();
    }
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      name: '',
      currency: 'UZS',
      responsibleName: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cashbox) => {
    setIsEditing(true);
    setFormData({
      id: cashbox.id,
      name: cashbox.name || '',
      currency: cashbox.currency || 'UZS',
      responsibleName: cashbox.responsibleName || '',
      isActive: cashbox.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const openTransactionModal = (cashbox, type) => {
    setTransactionForm({
      amount: '',
      note: '',
      selectedCashboxId: ''
    });

    setTransactionModal({
      isOpen: true,
      type,
      cashboxId: cashbox.id,
      cashboxName: cashbox.name
    });
  };

  const openHistoryModal = async (cashbox) => {
    setHistoryModal({
      isOpen: true,
      cashboxId: cashbox.id,
      cashboxName: cashbox.name
    });

    await fetchTransactions(cashbox.id);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return toast.error("Kassa nomini kiriting!");
    }

    setSaving(true);

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing
      ? `${API_URL}/api/cashboxes/${formData.id}`
      : `${API_URL}/api/cashboxes`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          currency: formData.currency,
          responsibleName: formData.responsibleName,
          isActive: formData.isActive
        })
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success(isEditing ? "Kassa yangilandi!" : "Yangi kassa yaratildi!");
        setIsModalOpen(false);
        fetchCashboxes();
      } else {
        toast.error(data?.error || "Saqlashda xatolik yuz berdi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Serverga ulanib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    const amount = Number(transactionForm.amount);
    const selectedCashboxId = Number(transactionForm.selectedCashboxId);

    if (!amount || amount <= 0) {
      return toast.error("Summani to'g'ri kiriting!");
    }

    if (!selectedCashboxId) {
      return toast.error("Boshqa kassani tanlang!");
    }

    let fromCashboxId = null;
    let toCashboxId = null;

    if (transactionModal.type === 'deposit') {
      fromCashboxId = selectedCashboxId;
      toCashboxId = Number(transactionModal.cashboxId);
    } else {
      fromCashboxId = Number(transactionModal.cashboxId);
      toCashboxId = selectedCashboxId;
    }

    if (!fromCashboxId || !toCashboxId || fromCashboxId === toCashboxId) {
      return toast.error("Kassalar noto'g'ri tanlangan!");
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromCashboxId,
          toCashboxId,
          amount,
          note: transactionForm.note
        })
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success(
          transactionModal.type === 'deposit'
            ? "Boshqa kassadan kirim qilindi!"
            : "Boshqa kassaga chiqim qilindi!"
        );

        setTransactionModal({
          isOpen: false,
          type: 'deposit',
          cashboxId: null,
          cashboxName: ''
        });

        setTransactionForm({
          amount: '',
          note: '',
          selectedCashboxId: ''
        });

        fetchCashboxes();
      } else {
        toast.error(data?.error || "O'tkazmani bajarib bo'lmadi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server bilan ulanishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes/${deleteModal.cashboxId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success("Kassa o'chirildi!");
        setDeleteModal({ isOpen: false, cashboxId: null });
        fetchCashboxes();
      } else {
        toast.error(data?.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server bilan ulanishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const filteredCashboxes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cashboxes;

    return cashboxes.filter((item) => {
      const searchStr =
        `${item.name || ''} ${item.currency || ''} ${item.responsibleName || ''}`.toLowerCase();

      return searchStr.includes(q);
    });
  }, [cashboxes, searchTerm]);

  const selectableCashboxes = useMemo(() => {
    return cashboxes.filter(
      (item) =>
        item.id !== transactionModal.cashboxId &&
        item.isActive === true
    );
  }, [cashboxes, transactionModal.cashboxId]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Kassalarni boshqarish</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Kassa yaratish, tahrirlash, boshqa kassadan kirim va boshqa kassaga chiqim
          </p>
        </div>

        {canManageCashbox && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={18} />
            Yangi kassa
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Kassa nomi, valyuta yoki javobgar shaxs bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nomi</th>
              <th className="p-4">Valyuta</th>
              <th className="p-4">Javobgar shaxs</th>
              <th className="p-4">Balans</th>
              <th className="p-4">Holati</th>
              <th className="p-4 text-center">Amallar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : filteredCashboxes.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-400">
                  Kassa topilmadi
                </td>
              </tr>
            ) : (
              filteredCashboxes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500">{item.id}</td>

                  <td className="p-4 font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-blue-600" />
                      {item.name}
                    </div>
                  </td>

                  <td className="p-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign size={15} className="text-emerald-600" />
                      {item.currency}
                    </div>
                  </td>

                  <td className="p-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <UserCircle size={16} className="text-slate-400" />
                      {item.responsibleName || '-'}
                    </div>
                  </td>

                  <td className="p-4 font-bold text-emerald-600">
                    {formatMoney(item.balance)} {item.currency}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.isActive ? 'FAOL' : 'YOPILGAN'}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => openHistoryModal(item)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Tarix"
                      >
                        <History size={18} />
                      </button>

                      {canManageCashbox && (
                        <>
                          <button
                            onClick={() => openTransactionModal(item, 'deposit')}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Boshqa kassadan kirim"
                          >
                            <ArrowDownCircle size={18} />
                          </button>

                          <button
                            onClick={() => openTransactionModal(item, 'withdraw')}
                            className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Boshqa kassaga chiqim"
                          >
                            <ArrowUpCircle size={18} />
                          </button>

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                cashboxId: item.id
                              })
                            }
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? "Kassani tahrirlash" : "Yangi kassa yaratish"}
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kassa nomi
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masalan: Asosiy kassa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valyuta
                </label>
                <select
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="UZS">UZS</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Javobgar shaxs
                </label>
                <select
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.responsibleName}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibleName: e.target.value })
                  }
                >
                  <option value="">Javobgar shaxsni tanlang</option>
                  {staffOptions.map((user) => (
                    <option key={user.id} value={user.fullName}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value === 'active'
                    })
                  }
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Yopilgan</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                {isEditing ? 'Saqlash' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {transactionModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {transactionModal.type === 'deposit'
                  ? "Boshqa kassadan kirim"
                  : "Boshqa kassaga chiqim"}
              </h2>

              <button
                onClick={() =>
                  setTransactionModal({
                    isOpen: false,
                    type: 'deposit',
                    cashboxId: null,
                    cashboxName: ''
                  })
                }
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600">
              Asosiy kassa: <span className="font-black text-slate-800">{transactionModal.cashboxName}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {transactionModal.type === 'deposit'
                    ? "Qaysi kassadan keladi?"
                    : "Qaysi kassaga o'tadi?"}
                </label>

                <select
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={transactionForm.selectedCashboxId}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      selectedCashboxId: e.target.value
                    })
                  }
                >
                  <option value="">Kassani tanlang</option>

                  {selectableCashboxes.map((cashbox) => (
                    <option key={cashbox.id} value={cashbox.id}>
                      {cashbox.name} ({cashbox.currency}) — {formatMoney(cashbox.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summa
                </label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masalan: 500000"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Izoh
                </label>
                <textarea
                  rows="3"
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ixtiyoriy izoh..."
                  value={transactionForm.note}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, note: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setTransactionModal({
                    isOpen: false,
                    type: 'deposit',
                    cashboxId: null,
                    cashboxName: ''
                  })
                }
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleTransfer}
                className={`flex-1 py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${
                  transactionModal.type === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200'
                }`}
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                {transactionModal.type === 'deposit'
                  ? 'Kirim qilish'
                  : 'Chiqim qilish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Kassa tarixi</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {historyModal.cashboxName}
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoryModal({
                    isOpen: false,
                    cashboxId: null,
                    cashboxName: ''
                  })
                }
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-4">Turi</th>
                    <th className="p-4">Summa</th>
                    <th className="p-4">Izoh</th>
                    <th className="p-4">Kim</th>
                    <th className="p-4">Sana</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {historyLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto" size={24} />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        Hozircha tarix mavjud emas
                      </td>
                    </tr>
                  ) : (
                    transactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getTransactionTypeBadge(item.type)}`}
                          >
                            {getTransactionTypeLabel(item.type)}
                          </span>
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          {formatMoney(item.amount)}
                        </td>

                        <td className="p-4 text-slate-600">
                          {item.note || '-'}
                        </td>

                        <td className="p-4 text-slate-600">
                          {item.user?.fullName || item.user?.username || '-'}
                        </td>

                        <td className="p-4 text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
              Haqiqatan ham ushbu kassani o'chirmoqchimisiz?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, cashboxId: null })}
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

export default ManageCash;