import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowLeft,
  Plus,
  Calendar,
  Briefcase,
  User,
  Receipt,
  X,
  Loader2,
  BadgePercent,
  Wallet
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';

  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const formatOnlyDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ru-RU');
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

  const normalizeOrderAmounts = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const payments = Array.isArray(order?.payments) ? order.payments : [];

    const subtotalFromItems =
      Number(order?.subtotal ?? 0) ||
      items.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0
      );

    const discountFromItems =
      Number(order?.discountAmount ?? 0) ||
      items.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);

    const totalAmount =
      Number(order?.totalAmount ?? 0) || Math.max(0, subtotalFromItems - discountFromItems);

    const paidAmount =
      Number(order?.paidAmount ?? 0) ||
      payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const dueAmountRaw = Number(order?.dueAmount ?? totalAmount - paidAmount);
    const dueAmount = dueAmountRaw > 0 ? dueAmountRaw : 0;

    return {
      ...order,
      subtotal: subtotalFromItems,
      discountAmount: discountFromItems,
      totalAmount,
      paidAmount,
      dueAmount,
      payments
    };
  };

  const fetchPendingSales = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      try {
        setLoading(true);

        const [ordersResult, cashboxesResult] = await Promise.allSettled([
          fetch(`${API_URL}/api/orders`, {
            headers: getAuthHeaders(),
            signal
          }),
          fetch(`${API_URL}/api/cashboxes`, {
            headers: getAuthHeaders(),
            signal
          })
        ]);

        if (ordersResult.status === 'fulfilled') {
          const ordersRes = ordersResult.value;
          const ordersData = await parseJsonSafe(ordersRes);

          if (ordersRes.ok && Array.isArray(ordersData?.items)) {
            const normalizedOrders = ordersData.items.map(normalizeOrderAmounts);
            const pendingOrders = normalizedOrders.filter((order) => {
              const status = String(order?.status || '').toUpperCase();
              return status === 'PAYMENT_PENDING' || Number(order?.dueAmount || 0) > 0;
            });

            setSales(pendingOrders);
          } else {
            toast.error(ordersData?.error || "Savdolarni yuklashda xatolik!");
            setSales([]);
          }
        } else if (ordersResult.reason?.name !== 'AbortError') {
          console.error('Orders fetch error:', ordersResult.reason);
          toast.error("Savdolarni yuklashda xatolik yuz berdi");
          setSales([]);
        }

        if (cashboxesResult.status === 'fulfilled') {
          const cashboxesRes = cashboxesResult.value;
          const cashboxesData = await parseJsonSafe(cashboxesRes);

          if (cashboxesRes.ok && Array.isArray(cashboxesData)) {
            setCashboxes(cashboxesData);
          } else {
            setCashboxes([]);
          }
        } else if (cashboxesResult.reason?.name !== 'AbortError') {
          console.error('Cashboxes fetch error:', cashboxesResult.reason);
          setCashboxes([]);
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

      if (res.ok && Array.isArray(data?.items)) {
        const found = data.items.map(normalizeOrderAmounts).find((item) => item.id === orderId);
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
    return Math.max(0, Number(selectedSale.dueAmount ?? 0));
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
    if (!selectedSale) return;

    const payAmount = Number(paymentData.amount);

    if (!paymentData.cashboxId) {
      return toast.error('Kassani tanlang!');
    }

    if (!Number.isFinite(payAmount) || payAmount <= 0) {
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

        if (String(data?.result?.status || '').toUpperCase() === 'COMPLETED') {
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
      <div className="space-y-4 p-4 md:p-5 bg-slate-50 min-h-screen animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Naqd savdoga to'lov olish
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Mijoz ismi, order raqami yoki ID bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-220px)]">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Order raqam</th>
                  <th className="p-4">Sanasi</th>
                  <th className="p-4">Mijoz</th>
                  <th className="p-4 text-right">Jami summa</th>
                  <th className="p-4 text-right text-emerald-600">To'langan</th>
                  <th className="p-4 text-right text-rose-600">Qolgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-16 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={30} />
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-16 text-center text-slate-400 font-medium">
                      To'lov kutilayotgan savdolar topilmadi
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
                        <td className="p-4 text-blue-600 font-bold">#{item.id}</td>
                        <td className="p-4 text-slate-800">{item.orderNumber || '-'}</td>
                        <td className="p-4 text-slate-500 font-medium">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="p-4 font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {customerName}
                        </td>
                        <td className="p-4 text-right text-slate-800">
                          {Number(item.totalAmount || 0).toLocaleString()} UZS
                        </td>
                        <td className="p-4 text-right text-emerald-600">
                          {paid.toLocaleString()} UZS
                        </td>
                        <td className="p-4 text-right text-rose-600">
                          {due.toLocaleString()} UZS
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

  if (!selectedSale) {
    return (
      <div className="p-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
          Savdo topilmadi
        </div>
      </div>
    );
  }

  const customerName = selectedSale.customer
    ? `${selectedSale.customer.lastName || ''} ${selectedSale.customer.firstName || ''}`
    : selectedSale.otherName || "Noma'lum";

  const subtotalAmount = Number(selectedSale.subtotal || 0);
  const discountAmount = Number(selectedSale.discountAmount || 0);
  const totalAmount = Number(selectedSale.totalAmount || 0);

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedSale(null);
              }}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-black text-slate-800 truncate uppercase">
                {customerName}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Naqd savdoga to'lov olish
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setViewMode('list');
              setSelectedSale(null);
            }}
            className="hidden sm:inline-flex h-9 px-4 rounded-xl border border-slate-200 bg-white items-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Orqaga qaytish
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Calendar size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Sanasi
              </span>
            </div>
            <div className="text-lg font-black text-slate-800">
              {formatOnlyDate(selectedSale.createdAt)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Briefcase size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Savdo raqami
              </span>
            </div>
            <div className="text-lg font-black text-slate-800">
              {selectedSale.orderNumber || selectedSale.id}
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <User size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Mijoz
              </span>
            </div>
            <div className="text-sm font-black text-slate-800 uppercase truncate" title={customerName}>
              {customerName}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 bg-slate-50/50">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Receipt className="text-blue-500" size={18} />
              To'lov ma'lumotlari
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">
                Jami to'langan:{' '}
                <span className="text-emerald-600 font-black">
                  {totalPaidAmount.toLocaleString()} UZS
                </span>
              </span>

              <span className="text-sm font-semibold text-slate-500">
                Qolgan:{' '}
                <span className="text-rose-600 font-black">
                  {remainingAmount.toLocaleString()} UZS
                </span>
              </span>

              <button
                onClick={openPaymentModal}
                className="h-10 px-5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={3} />
                Qo'shish
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-5">ID</th>
                  <th className="p-4">Sanasi</th>
                  <th className="p-4 text-right">Summasi</th>
                  <th className="p-4 text-center">Kassa</th>
                  <th className="p-4">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                {!selectedSale.payments || selectedSale.payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">
                      Hali hech qanday to'lov olinmagan
                    </td>
                  </tr>
                ) : (
                  selectedSale.payments.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-5 text-slate-400 font-mono">#{p.id || i + 1}</td>
                      <td className="p-4 text-slate-500">
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="p-4 text-right text-emerald-600 font-bold">
                        {Number(p.amount).toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold">
                          {p.cashbox?.name || p.method || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-[260px] truncate" title={p.note}>
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
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <h2 className="text-base font-black text-slate-800">Savdo tovarlari</h2>

            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              <span className="text-slate-500">
                Umumiy summa:{' '}
                <span className="text-slate-800 font-black">
                  {subtotalAmount.toLocaleString()} UZS
                </span>
              </span>

              <span className="text-amber-600 flex items-center gap-1 font-black">
                <BadgePercent size={14} />
                Chegirma: {discountAmount.toLocaleString()} UZS
              </span>

              <span className="text-emerald-600 font-black">
                Yakuniy: {totalAmount.toLocaleString()} UZS
              </span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-5">ID</th>
                  <th className="p-4">Nomi</th>
                  <th className="p-4 text-center">Miqdori</th>
                  <th className="p-4 text-right">Narxi</th>
                  <th className="p-4 text-right">Chegirma</th>
                  <th className="p-4 text-right pr-5">Yakuniy summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-semibold text-slate-700">
                {(selectedSale.items || []).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                      Tovarlar topilmadi
                    </td>
                  </tr>
                ) : (
                  (selectedSale.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-5 text-slate-400 font-mono">
                        #{item.product?.customId || item.productId || '-'}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {item.product?.name || "Noma'lum tovar"}
                      </td>
                      <td className="p-4 text-center text-blue-600 font-bold">
                        {Number(item.quantity || 0)} dona
                      </td>
                      <td className="p-4 text-right">
                        {Number(item.unitPrice || 0).toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-right text-amber-600 font-bold">
                        {Number(item.discountAmount || 0).toLocaleString()} UZS
                      </td>
                      <td className="p-4 text-right pr-5 text-slate-800 font-bold">
                        {Number(item.totalAmount || 0).toLocaleString()} UZS
                      </td>
                    </tr>
                  ))
                )}
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
          <div className="bg-white w-full max-w-[430px] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800">
                Naqd savdoga to'lov olish
              </h2>
              <button
                disabled={isSubmitting}
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                    To'lanishi kerak
                  </div>
                  <div className="text-2xl font-black text-blue-700">
                    {remainingAmount.toLocaleString()} <span className="text-sm font-bold">UZS</span>
                  </div>
                </div>
                <Wallet className="text-blue-400" size={24} />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-2">
                  Kassa <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isSubmitting}
                  value={paymentData.cashboxId}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cashboxId: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 transition-all disabled:opacity-50"
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
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-2">
                  Summa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  disabled={isSubmitting}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full p-3 bg-white border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-black text-emerald-600 text-lg transition-all disabled:opacity-50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase mb-2">
                  Izoh
                </label>
                <textarea
                  disabled={isSubmitting}
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none h-28 transition-all disabled:opacity-50"
                  placeholder="Eslatma qoldirishingiz mumkin..."
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50 shrink-0">
              <button
                disabled={isSubmitting}
                onClick={handleSavePayment}
                className="flex-1 h-11 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Saqlash'}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
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