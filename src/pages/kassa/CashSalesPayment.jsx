import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowLeft,
  Plus,
  Calendar,
  Briefcase,
  DollarSign,
  User,
  Receipt,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const CashSalesPayment = () => {
  const [viewMode, setViewMode] = useState('list');
  const [selectedSale, setSelectedSale] = useState(null);

  const [sales, setSales] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentData, setPaymentData] = useState({
    cashboxId: '',
    amount: '',
    note: ''
  });

  const token = sessionStorage.getItem('token');

  const getAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const getJsonAuthHeaders = useCallback(
    () => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }),
    [getAuthHeaders]
  );

  const fetchPendingSales = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      try {
        setLoading(true);

        const [ordersRes, cashboxesRes] = await Promise.all([
          fetch(`${API_URL}/api/orders`, {
            headers: getAuthHeaders(),
            signal
          }),
          fetch(`${API_URL}/api/cashboxes`, {
            headers: getAuthHeaders(),
            signal
          })
        ]);

        const ordersData = await parseJsonSafe(ordersRes);
        const cashboxesData = await parseJsonSafe(cashboxesRes);

        if (ordersRes.ok && Array.isArray(ordersData)) {
          const pendingOrders = ordersData.filter(
            (order) => String(order.status).toUpperCase() === 'PAYMENT_PENDING'
          );
          setSales(pendingOrders);
        } else {
          toast.error(ordersData?.error || "Savdolarni yuklashda xatolik!");
        }

        if (cashboxesRes.ok && Array.isArray(cashboxesData)) {
          setCashboxes(cashboxesData);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch pending sales error:', err);
          toast.error("Server bilan aloqa yo'q");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [token, getAuthHeaders]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPendingSales(controller.signal);
    return () => controller.abort();
  }, [fetchPendingSales]);

  const refreshSelectedSale = useCallback(
    async (orderId) => {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: getAuthHeaders()
      });

      const data = await parseJsonSafe(res);

      if (res.ok && Array.isArray(data)) {
        const found = data.find((item) => item.id === orderId);
        if (found) {
          setSelectedSale(found);
        }
      }
    },
    [getAuthHeaders]
  );

  const totalPaidAmount = useMemo(() => {
    if (!selectedSale || !Array.isArray(selectedSale.payments)) return 0;
    return selectedSale.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [selectedSale]);

  const remainingAmount = useMemo(() => {
    if (!selectedSale) return 0;
    const total = Number(selectedSale.dueAmount ?? 0);
    return Math.max(0, total);
  }, [selectedSale]);

  const openPaymentModal = () => {
    setPaymentData({
      cashboxId: cashboxes[0]?.id || '',
      amount: remainingAmount,
      note: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    const payAmount = Number(paymentData.amount);

    if (!paymentData.cashboxId) {
      return toast.error('Kassani tanlang!');
    }

    if (payAmount <= 0) {
      return toast.error("To'lov summasini to'g'ri kiriting!");
    }

    if (payAmount > remainingAmount) {
      return toast.error(
        `Qarzdorlikdan ortiq summa kiritdingiz! (Maksimum: ${remainingAmount.toLocaleString()} UZS)`
      );
    }

    setIsSubmitting(true);

    try {
      const payload = {
        cashboxId: Number(paymentData.cashboxId),
        amount: payAmount,
        note: paymentData.note.trim() || null
      };

      const res = await fetch(`${API_URL}/api/orders/${selectedSale.id}/payments`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success(data?.message || "To'lov muvaffaqiyatli qabul qilindi!");
        setIsPaymentModalOpen(false);

        if (data?.result?.status === 'COMPLETED') {
          setViewMode('list');
          setSelectedSale(null);
          await fetchPendingSales();
        } else {
          await refreshSelectedSale(selectedSale.id);
          await fetchPendingSales();
        }
      } else {
        toast.error(data?.error || "To'lovni saqlashda xatolik yuz berdi");
      }
    } catch (err) {
      console.error('Save payment error:', err);
      toast.error('Server xatosi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;

    const search = searchTerm.trim().toLowerCase();

    return sales.filter((s) => {
      const customerName = s.customer
        ? `${s.customer.firstName || ''} ${s.customer.lastName || ''}`
        : `${s.otherName || ''}`;

      return (
        customerName.toLowerCase().includes(search) ||
        String(s.id).includes(search) ||
        String(s.orderNumber || '').toLowerCase().includes(search)
      );
    });
  }, [sales, searchTerm]);

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Naqd savdoga to'lov olish
        </h1>

        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Mijoz ismi, order raqami yoki ID bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="p-5">ID</th>
                  <th className="p-5">Order raqam</th>
                  <th className="p-5">Sanasi</th>
                  <th className="p-5">Mijoz</th>
                  <th className="p-5 text-right">Jami summa</th>
                  <th className="p-5 text-right text-emerald-600">To'langan</th>
                  <th className="p-5 text-right text-rose-600">Qolgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-20 text-center text-slate-400 font-medium">
                      To'lov kutilayotgan savdolar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((item) => {
                    const customerName = item.customer
                      ? `${item.customer.lastName || ''} ${item.customer.firstName || ''}`
                      : item.otherName || "Noma'lum";

                    const paid = Number(item.paidAmount || 0);
                    const due = Number(item.dueAmount || 0);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedSale(item);
                          setViewMode('detail');
                        }}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="p-5 text-blue-600 font-black">#{item.id}</td>
                        <td className="p-5 text-slate-800">{item.orderNumber || '-'}</td>
                        <td className="p-5 text-slate-500 font-medium">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="p-5 font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                          {customerName}
                        </td>
                        <td className="p-5 text-right text-slate-800">
                          {Number(item.totalAmount).toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400">UZS</span>
                        </td>
                        <td className="p-5 text-right text-emerald-600">
                          {paid.toLocaleString()}{' '}
                          <span className="text-[10px] text-emerald-400">UZS</span>
                        </td>
                        <td className="p-5 text-right text-rose-600">
                          {due.toLocaleString()}{' '}
                          <span className="text-[10px] text-rose-400">UZS</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const customerName = selectedSale.customer
    ? `${selectedSale.customer.lastName || ''} ${selectedSale.customer.firstName || ''}`
    : selectedSale.otherName || "Noma'lum";

  const phone =
    selectedSale.customer?.phones?.[0]?.phone ||
    selectedSale.otherPhone ||
    selectedSale.customer?.phone ||
    'Kiritilmagan';

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedSale(null);
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">
            {customerName}
          </h1>
        </div>
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedSale(null);
          }}
          className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Orqaga qaytish
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-blue-500 mb-4">
              <Calendar size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Sanasi
              </span>
            </div>
            <div className="text-xl font-black text-slate-800">
              {new Date(selectedSale.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-indigo-500 mb-4">
              <Briefcase size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Savdo raqami
              </span>
            </div>
            <div className="text-xl font-black text-slate-800">
              {selectedSale.orderNumber || selectedSale.id}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-500 mb-4">
              <DollarSign size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Summasi
              </span>
            </div>
            <div className="text-xl font-black text-emerald-600 mb-1">
              {Number(selectedSale.totalAmount).toLocaleString()}{' '}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Tovarlar:{' '}
              <span className="text-slate-700">
                {(selectedSale.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0)} dona
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-purple-500 mb-4">
              <User size={18} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Mijoz
              </span>
            </div>
            <div className="text-sm font-black text-slate-800 mb-1 uppercase truncate" title={customerName}>
              {customerName}
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              Telefon: <span className="text-slate-600 font-mono">{phone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Receipt className="text-blue-500" /> To'lov ma'lumotlari
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-500">
                Jami to'langan:{' '}
                <span className="text-emerald-600 font-black">
                  {totalPaidAmount.toLocaleString()} UZS
                </span>
              </span>
              <span className="text-sm font-bold text-slate-500">
                Qolgan:{' '}
                <span className="text-rose-600 font-black">
                  {remainingAmount.toLocaleString()} UZS
                </span>
              </span>
              <button
                onClick={openPaymentModal}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={18} strokeWidth={3} /> Qo'shish
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Sanasi</th>
                  <th className="p-4 text-right">Summasi</th>
                  <th className="p-4 text-center">Kassa</th>
                  <th className="p-4">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                {!selectedSale.payments || selectedSale.payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">
                      Hali hech qanday to'lov olinmagan
                    </td>
                  </tr>
                ) : (
                  selectedSale.payments.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 text-slate-400 font-mono">#{p.id || i + 1}</td>
                      <td className="p-4 text-slate-500">
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="p-4 text-right text-emerald-600">
                        {Number(p.amount).toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider">
                          {p.method || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 truncate max-w-[240px]" title={p.note}>
                        {p.note || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800">Savdo tovarlari</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Nomi</th>
                  <th className="p-4 text-center">Miqdori</th>
                  <th className="p-4 text-right">Narxi</th>
                  <th className="p-4 text-right pr-6">Summasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                {(selectedSale.items || []).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 text-slate-400 font-mono">
                      #{item.product?.customId || item.productId || '-'}
                    </td>
                    <td className="p-4">{item.product?.name || "Noma'lum tovar"}</td>
                    <td className="p-4 text-center text-blue-600">
                      {Number(item.quantity || 0)} dona
                    </td>
                    <td className="p-4 text-right">
                      {Number(item.unitPrice || 0).toLocaleString()} UZS
                    </td>
                    <td className="p-4 text-right pr-6 text-slate-800">
                      {Number(item.totalAmount || 0).toLocaleString()} UZS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsPaymentModalOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-[450px] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800">Naqd savdoga to'lov olish</h2>
              <button
                disabled={isSubmitting}
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                    To'lanishi kerak (Qoldiq)
                  </div>
                  <div className="text-2xl font-black text-blue-700">
                    {remainingAmount.toLocaleString()} <span className="text-sm font-bold">UZS</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Kassa <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isSubmitting}
                  value={paymentData.cashboxId}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cashboxId: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all disabled:opacity-50"
                >
                  <option value="">Kassani tanlang</option>
                  {cashboxes.map((cashbox) => (
                    <option key={cashbox.id} value={cashbox.id}>
                      {cashbox.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Summa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  disabled={isSubmitting}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full p-4 bg-white border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-black text-emerald-600 text-xl transition-all disabled:opacity-50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Izoh
                </label>
                <textarea
                  disabled={isSubmitting}
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none h-32 transition-all disabled:opacity-50"
                  placeholder="Eslatma qoldirishingiz mumkin..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
              <button
                disabled={isSubmitting}
                onClick={handleSavePayment}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Saqlash'}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashSalesPayment;