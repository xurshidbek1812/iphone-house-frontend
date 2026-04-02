import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  X,
  Eye,
  AlertTriangle,
  Clock,
  Loader2,
  Edit2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Calendar,
  Receipt,
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
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString()} UZS`;
};

const getStatusLabel = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'DRAFT') return 'Jarayonda';
  if (s === 'PAYMENT_PENDING') return "To'lov kutilmoqda";
  if (s === 'COMPLETED') return 'Yakunlangan';
  return status || '-';
};

const getStatusClasses = (status) => {
  const s = String(status || '').toUpperCase();

  if (s === 'COMPLETED') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  }

  if (s === 'PAYMENT_PENDING') {
    return 'bg-amber-50 text-amber-700 border border-amber-100';
  }

  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const getAdjustmentMeta = (value) => {
  const amount = Number(value || 0);

  if (amount < 0) {
    return {
      label: 'Ustama',
      absValue: Math.abs(amount),
      textClass: 'text-rose-600'
    };
  }

  return {
    label: 'Chegirma',
    absValue: amount,
    textClass: 'text-amber-600'
  };
};

const CashSales = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [detailsModal, setDetailsModal] = useState({ isOpen: false, sale: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sale: null });
  const [sendToPaymentModal, setSendToPaymentModal] = useState({ isOpen: false, id: null });

  const token = sessionStorage.getItem('token');

  const getAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const getCustomerName = (sale) => {
    return sale.customer
      ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim()
      : `${sale.otherName || 'Anonim mijoz'} ${sale.otherPhone || ''}`.trim();
  };

  const getSaleSubtotal = (sale) => {
    if (sale?.subtotal != null) return Number(sale.subtotal || 0);
    return (sale.items || []).reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0
    );
  };

  const getSaleDiscount = (sale) => {
    if (sale?.discountAmount != null) return Number(sale.discountAmount || 0);
    return (sale.items || []).reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  };

  const getSaleFinal = (sale) => {
    if (sale?.totalAmount != null) return Number(sale.totalAmount || 0);
    return getSaleSubtotal(sale) - getSaleDiscount(sale);
  };

  const fetchSales = useCallback(
    async (
      targetPage = 1,
      targetSearch = appliedSearch,
      targetStatus = filterStatus,
      signal = undefined
    ) => {
      if (!token) return;

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(limit),
          search: targetSearch,
          status: targetStatus
        });

        const res = await fetch(`${API_URL}/api/orders?${params.toString()}`, {
          headers: getAuthHeaders(),
          signal
        });

        const data = await parseJsonSafe(res);

        if (res.ok) {
          setSales(Array.isArray(data?.items) ? data.items : []);
          setPage(Number(data?.page || 1));
          setTotalPages(Number(data?.totalPages || 1));
          setTotal(Number(data?.total || 0));
        } else {
          toast.error(data?.error || 'Savdolarni yuklashda xatolik!');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch orders error:', err);
          toast.error("Server bilan aloqa yo'q!");
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [token, getAuthHeaders, appliedSearch, filterStatus, limit]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchSales(1, appliedSearch, filterStatus, controller.signal);
    return () => controller.abort();
  }, [appliedSearch, filterStatus, fetchSales]);

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const openEditPage = (sale) => {
    navigate(`/naqd-savdo/tahrirlash/${sale.id}`, {
      state: {
        saleData: sale
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.sale) return;

    const id = deleteModal.sale.id;
    setIsActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success("Savdo o'chirildi!");
        const nextPage = sales.length === 1 && page > 1 ? page - 1 : page;
        await fetchSales(nextPage, appliedSearch, filterStatus);
      } else {
        toast.error(data?.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      toast.error('Server xatosi!');
    } finally {
      setIsActionLoading(false);
      setDeleteModal({ isOpen: false, sale: null });
    }
  };

  const handleConfirmOrder = async () => {
    const id = sendToPaymentModal.id;
    if (!id) return;

    setIsActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/confirm`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success("Savdo to'lov kutilmoqda holatiga o'tdi!");
        await fetchSales(page, appliedSearch, filterStatus);
      } else {
        toast.error(data?.error || 'Tasdiqlashda xatolik yuz berdi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server xatosi!');
    } finally {
      setIsActionLoading(false);
      setSendToPaymentModal({ isOpen: false, id: null });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Naqd savdolar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Savdolar ro‘yxati va boshqaruvi</p>
        </div>

        <button
          disabled={isLoading || isActionLoading}
          onClick={() => navigate('/naqd-savdo/qoshish')}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
        >
          <Plus size={16} />
          Yangi savdo
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-3 flex-col lg:flex-row">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Mijoz, order raqami yoki ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
            <button
              onClick={handleSearchSubmit}
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Qidirish
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Barchasi</option>
            <option value="DRAFT">Jarayonda</option>
            <option value="PAYMENT_PENDING">To'lov kutilmoqda</option>
            <option value="COMPLETED">Yakunlangan</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50/95 text-left text-[10px] text-slate-500 uppercase tracking-[0.12em] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Mijoz</th>
                <th className="px-4 py-3 font-semibold text-center">Holat</th>
                <th className="px-4 py-3 font-semibold">Summa</th>
                <th className="px-4 py-3 font-semibold">Sana</th>
                <th className="px-4 py-3 font-semibold text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-14 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-14 text-center text-slate-400 text-sm">
                    Savdolar topilmadi
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const customerName = getCustomerName(sale);
                  const saleSubtotal = getSaleSubtotal(sale);
                  const saleDiscount = getSaleDiscount(sale);
                  const saleFinal = getSaleFinal(sale);
                  const adjustmentMeta = getAdjustmentMeta(saleDiscount);

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="text-[15px] font-semibold text-slate-800 tracking-tight">
                          #{sale.orderNumber || sale.id}
                        </div>
                        <div className="text-[12px] text-slate-400 mt-0.5 font-medium">
                          ID: {sale.id}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="text-[15px] font-medium text-slate-700 leading-6">
                          {customerName || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${getStatusClasses(
                            sale.status
                          )}`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="text-[15px] font-semibold text-slate-800">
                          {formatMoney(saleFinal)}
                        </div>

                        {saleDiscount !== 0 && (
                          <div className={`text-[12px] mt-0.5 font-medium ${adjustmentMeta.textClass}`}>
                            {adjustmentMeta.label}: {formatMoney(adjustmentMeta.absValue)}
                          </div>
                        )}

                        {saleSubtotal !== saleFinal && saleDiscount === 0 && (
                          <div className="text-[12px] text-slate-400 mt-0.5 font-medium">
                            Umumiy: {formatMoney(saleSubtotal)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle whitespace-nowrap text-slate-500 text-[14px] font-medium">
                        {formatDate(sale.createdAt)}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailsModal({ isOpen: true, sale })}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
                            title="Ko‘rish"
                          >
                            <Eye size={15} />
                          </button>

                          {String(sale.status).toUpperCase() === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => openEditPage(sale)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition"
                                title="Tahrirlash"
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  setSendToPaymentModal({ isOpen: true, id: sale.id })
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                                title="To‘lovga yuborish"
                              >
                                <CheckCircle size={15} />
                              </button>
                            </>
                          )}

                          {String(sale.status).toUpperCase() !== 'COMPLETED' && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, sale })}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                              title="O‘chirish"
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
            Jami: <span className="font-semibold text-slate-800">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSales(page - 1, appliedSearch, filterStatus)}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Oldingi
            </button>

            <div className="min-w-[84px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchSales(page + 1, appliedSearch, filterStatus)}
              disabled={page >= totalPages || isLoading || totalPages === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keyingi
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {detailsModal.isOpen && detailsModal.sale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Savdo tafsiloti</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  #{detailsModal.sale.orderNumber || detailsModal.sale.id}
                </p>
              </div>

              <button
                onClick={() => setDetailsModal({ isOpen: false, sale: null })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[85vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">
                    <Receipt size={14} />
                    Order
                  </div>
                  <div className="text-base font-semibold text-slate-800">
                    #{detailsModal.sale.orderNumber || detailsModal.sale.id}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">
                    <User size={14} />
                    Mijoz
                  </div>
                  <div className="text-sm font-semibold text-slate-800 leading-6">
                    {getCustomerName(detailsModal.sale)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">
                    <Calendar size={14} />
                    Sana
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDate(detailsModal.sale.createdAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">
                    <Wallet size={14} />
                    Holat
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        detailsModal.sale.status
                      )}`}
                    >
                      {getStatusLabel(detailsModal.sale.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-900 text-white p-4">
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black">
                    Umumiy summa
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {formatMoney(getSaleSubtotal(detailsModal.sale))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-amber-600 font-black">
                    Chegirma
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-amber-700">
                    {formatMoney(Math.max(0, Number(getSaleDiscount(detailsModal.sale) || 0)))}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-rose-600 font-black">
                    Ustama
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-rose-700">
                    {formatMoney(
                      Math.abs(Math.min(0, Number(getSaleDiscount(detailsModal.sale) || 0)))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-600 font-black">
                    Yakuniy summa
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-700">
                    {formatMoney(getSaleFinal(detailsModal.sale))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-800">Sotib olingan mahsulotlar</h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {(detailsModal.sale.items || []).length === 0 ? (
                    <div className="p-6 text-sm text-slate-400 text-center">
                      Mahsulotlar topilmadi
                    </div>
                  ) : (
                    detailsModal.sale.items.map((item, index) => {
                      const rowSubtotal =
                        Number(item.unitPrice || 0) * Number(item.quantity || 0);
                      const adjustmentMeta = getAdjustmentMeta(item.discountAmount);
                      const rowTotal = rowSubtotal - Number(item.discountAmount || 0);

                      return (
                        <div
                          key={`${item.productId || 'item'}-${index}`}
                          className="p-4 grid grid-cols-1 md:grid-cols-[1.6fr_.6fr_.9fr_.9fr_1fr] gap-3 items-center"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              {item.product?.name || "Noma'lum tovar"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              ID: #{item.product?.customId || item.productId || '-'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                              Miqdor
                            </div>
                            <div className="mt-1 text-sm font-semibold text-blue-600">
                              {Number(item.quantity || 0)} dona
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                              Narxi
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-800">
                              {formatMoney(item.unitPrice)}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                              {adjustmentMeta.label}
                            </div>
                            <div className={`mt-1 text-sm font-semibold ${adjustmentMeta.textClass}`}>
                              {formatMoney(adjustmentMeta.absValue)}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                              Yakuniy
                            </div>
                            <div className="mt-1 text-sm font-semibold text-emerald-600">
                              {formatMoney(rowTotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
                  Izoh
                </div>
                <div className="text-sm text-slate-700 leading-6">
                  {detailsModal.sale.note || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 text-center">
            <AlertTriangle className="mx-auto text-rose-500 mb-4" size={32} />
            <h3 className="text-base font-semibold text-slate-900 mb-2">Savdo o‘chirilsinmi?</h3>
            <p className="text-sm text-slate-500 mb-6">Bu savdo butunlay o‘chiriladi.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, sale: null })}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isActionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "O‘chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendToPaymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 text-center">
            <Clock className="mx-auto text-emerald-600 mb-4" size={32} />
            <h3 className="text-base font-semibold text-slate-900 mb-2">To‘lovga yuborilsinmi?</h3>
            <p className="text-sm text-slate-500 mb-6">Savdo to‘lov kutilmoqda holatiga o‘tadi.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSendToPaymentModal({ isOpen: false, id: null })}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isActionLoading}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isActionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashSales;