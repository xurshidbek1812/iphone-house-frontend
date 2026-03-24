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
  ChevronRight
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

const getStatusLabel = (status) => {
  const s = String(status || '').toUpperCase();

  if (s === 'DRAFT') return 'Jarayonda';
  if (s === 'PAYMENT_PENDING') return "To'lov kutilmoqda";
  if (s === 'COMPLETED') return 'Yakunlangan';

  return status || '-';
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
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });

  const token = sessionStorage.getItem('token');

  const getAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const getJsonAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),
    [token]
  );

  const fetchSales = useCallback(
    async (
      targetPage = page,
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
      console.error('Delete order error:', err);
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
      console.error('Confirm order error:', err);
      toast.error('Server xatosi!');
    } finally {
      setIsActionLoading(false);
      setSendToPaymentModal({ isOpen: false, id: null });
    }
  };

  const openEditModal = (sale) => {
    setEditModal({
      isOpen: true,
      data: {
        id: sale.id,
        note: sale.note || '',
        items: (sale.items || []).map((item) => ({
          productId: item.productId,
          name: item.product?.name || "Noma'lum tovar",
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount || 0),
          batchId: item.allocations?.[0]?.batchId || null,
          scanType: 'BATCH'
        }))
      }
    });
  };

  const updateEditQty = (productId, newQty) => {
    if (newQty < 1) return;

    setEditModal((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQty }
            : item
        )
      }
    }));
  };

  const updateEditDiscount = (productId, discountAmount) => {
    setEditModal((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        items: prev.data.items.map((item) =>
          item.productId === productId
            ? { ...item, discountAmount }
            : item
        )
      }
    }));
  };

  const saveEdit = async () => {
    const { id, note, items } = editModal.data;

    const invalidBatchItem = items.find(
      (item) => !item.batchId || String(item.scanType || '').toUpperCase() !== 'BATCH'
    );

    if (invalidBatchItem) {
      return toast.error(
        `${invalidBatchItem.name} uchun partiya ma'lumoti topilmadi. Bu savdoni qayta yaratish kerak bo'lishi mumkin.`
      );
    }

    const invalidDiscountItem = items.find((item) => {
      const subtotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
      return Number(item.discountAmount || 0) > subtotal;
    });

    if (invalidDiscountItem) {
      return toast.error("Chegirma summasi jami summadan ko'p bo'lishi mumkin emas!");
    }

    setIsActionLoading(true);

    try {
      const payload = {
        note: note.trim() || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount || 0),
          batchId: item.batchId ? Number(item.batchId) : null,
          scanType: item.scanType || 'BATCH'
        }))
      };

      const res = await fetch(`${API_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success('Savdo muvaffaqiyatli tahrirlandi!');
        setEditModal({ isOpen: false, data: null });
        await fetchSales(page, appliedSearch, filterStatus);
      } else {
        toast.error(data?.error || 'Tahrirlashda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Update order error:', err);
      toast.error('Server xatosi!');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50/50 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Naqd Savdolar
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Yaratilgan savdolar ro'yxati
          </p>
        </div>

        <button
          disabled={isLoading || isActionLoading}
          onClick={() => navigate('/naqd-savdo/qoshish')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Plus size={20} strokeWidth={3} /> Yangi Savdo
        </button>
      </div>

      <div className="flex gap-4 mb-6 flex-col lg:flex-row">
        <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="text-slate-400 ml-1" size={20} />
          <input
            type="text"
            placeholder="Mijoz, order raqami yoki ID bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
          />
          <button
            onClick={handleSearchSubmit}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-black"
          >
            Qidirish
          </button>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 text-sm font-bold text-slate-700 outline-none"
        >
          <option value="ALL">Barchasi</option>
          <option value="DRAFT">Jarayonda</option>
          <option value="PAYMENT_PENDING">To'lov kutilmoqda</option>
          <option value="COMPLETED">Yakunlangan</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[650px] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Mijoz</th>
                <th className="p-4">Status</th>
                <th className="p-4">Summa</th>
                <th className="p-4">Sana</th>
                <th className="p-4 text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="text-sm font-semibold text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-slate-400">
                    Savdolar topilmadi
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const customerName = sale.customer
                    ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim()
                    : `${sale.otherName || 'Anonim mijoz'} ${sale.otherPhone || ''}`.trim();

                  return (
                    <tr
                      key={sale.id}
                      className="border-t hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-black text-slate-800">
                          #{sale.orderNumber || sale.id}
                        </div>
                        <div className="text-xs text-slate-400">ID: {sale.id}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold">{customerName || '-'}</div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                            String(sale.status).toUpperCase() === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : String(sale.status).toUpperCase() === 'PAYMENT_PENDING'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>

                      <td className="p-4 font-black text-slate-800 whitespace-nowrap">
                        {Number(sale.totalAmount || 0).toLocaleString()} UZS
                      </td>

                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {formatDate(sale.createdAt)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDetailsModal({ isOpen: true, sale })}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                            title="Ko'rish"
                          >
                            <Eye size={16} />
                          </button>

                          {String(sale.status).toUpperCase() === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => openEditModal(sale)}
                                className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                                title="Tahrirlash"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                onClick={() =>
                                  setSendToPaymentModal({ isOpen: true, id: sale.id })
                                }
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                title="To'lovga yuborish"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </>
                          )}

                          {String(sale.status).toUpperCase() !== 'COMPLETED' && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, sale })}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
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

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-500">
            Jami: <span className="text-slate-800">{total} ta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSales(page - 1, appliedSearch, filterStatus)}
              disabled={page <= 1 || isLoading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Oldingi
            </button>

            <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-sm min-w-[90px] text-center">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchSales(page + 1, appliedSearch, filterStatus)}
              disabled={page >= totalPages || isLoading || totalPages === 0}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              Keyingi
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {detailsModal.isOpen && detailsModal.sale && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">Savdo tafsiloti</h3>
              <button
                onClick={() => setDetailsModal({ isOpen: false, sale: null })}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm font-semibold text-slate-700">
              <div>
                <span className="text-slate-400">Order:</span>{' '}
                #{detailsModal.sale.orderNumber}
              </div>
              <div>
                <span className="text-slate-400">Mijoz:</span>{' '}
                {detailsModal.sale.customer
                  ? `${detailsModal.sale.customer.firstName || ''} ${detailsModal.sale.customer.lastName || ''}`.trim()
                  : detailsModal.sale.otherName || '-'}
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                {getStatusLabel(detailsModal.sale.status)}
              </div>
              <div>
                <span className="text-slate-400">Jami summa:</span>{' '}
                {Number(detailsModal.sale.totalAmount || 0).toLocaleString()} UZS
              </div>
              <div>
                <span className="text-slate-400">Chegirma:</span>{' '}
                {Number(detailsModal.sale.discountAmount || 0).toLocaleString()} UZS
              </div>
              <div>
                <span className="text-slate-400">Izoh:</span>{' '}
                {detailsModal.sale.note || '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <AlertTriangle className="mx-auto text-rose-500 mb-4" size={40} />
            <h3 className="text-xl font-black text-slate-800 mb-2">Savdo o‘chirilsinmi?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Bu savdo butunlay o‘chiriladi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, sale: null })}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-black"
              >
                {isActionLoading ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  "O‘chirish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendToPaymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <Clock className="mx-auto text-emerald-500 mb-4" size={40} />
            <h3 className="text-xl font-black text-slate-800 mb-2">To‘lovga yuborilsinmi?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Savdo to‘lov kutilmoqda holatiga o‘tadi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSendToPaymentModal({ isOpen: false, id: null })}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isActionLoading}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black"
              >
                {isActionLoading ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  'Tasdiqlash'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">Savdoni tahrirlash</h3>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-auto">
              {editModal.data.items.map((item) => (
                <div key={item.productId} className="p-4 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-800 mb-2">{item.name}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateEditQty(item.productId, Number(e.target.value))
                      }
                      className="p-3 rounded-xl border border-slate-200"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      readOnly
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.discountAmount}
                      onChange={(e) =>
                        updateEditDiscount(item.productId, Number(e.target.value || 0))
                      }
                      className="p-3 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              ))}

              <textarea
                value={editModal.data.note}
                onChange={(e) =>
                  setEditModal((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      note: e.target.value
                    }
                  }))
                }
                rows="4"
                className="w-full p-4 rounded-2xl border border-slate-200"
                placeholder="Izoh..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black"
              >
                Bekor qilish
              </button>
              <button
                onClick={saveEdit}
                disabled={isActionLoading}
                className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-black"
              >
                {isActionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Saqlash'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashSales;