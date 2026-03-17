import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  X,
  Eye,
  AlertTriangle,
  Clock,
  User,
  Loader2,
  Edit2,
  CheckCircle
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

const CashSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }),
  [getAuthHeaders]
);

  const fetchSales = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      setIsLoading(true);

      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: getAuthHeaders(),
          signal
        });

        const data = await parseJsonSafe(res);

        if (res.ok && Array.isArray(data)) {
          setSales(data);
        } else {
          toast.error(data?.error || "Savdolarni yuklashda xatolik!");
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
    [token, getAuthHeaders]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchSales(controller.signal);
    return () => controller.abort();
  }, [fetchSales]);

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
        await fetchSales();
      } else {
        toast.error(data?.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error('Delete order error:', err);
      toast.error("Server xatosi!");
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
      await fetchSales();
    } else {
      toast.error(data?.error || "Tasdiqlashda xatolik yuz berdi");
    }
  } catch (err) {
    console.error('Confirm order error:', err);
    toast.error("Server xatosi!");
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
      discountAmount: Number(sale.discountAmount || 0),
      note: sale.note || '',
      items: (sale.items || []).map((item) => ({
        productId: item.productId,
        name: item.product?.name || "Noma'lum tovar",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount || 0)
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

const saveEdit = async () => {
  const { id, discountAmount, note, items } = editModal.data;

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)),
    0
  );

  const totalAmount = Math.max(0, subtotal - Number(discountAmount || 0));

  if (Number(discountAmount) > 0 && (!note || note.trim() === '')) {
    return toast.error("Chegirma uchun izoh majburiy!");
  }

  if (Number(discountAmount) > subtotal) {
    return toast.error("Chegirma summasi jami summadan ko'p bo'lishi mumkin emas!");
  }

  setIsActionLoading(true);

  try {
    const payload = {
      note: note.trim() || null,
      discountAmount: Number(discountAmount || 0),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount || 0)
      }))
    };

    const res = await fetch(`${API_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await parseJsonSafe(res);

    if (res.ok) {
      toast.success("Savdo muvaffaqiyatli tahrirlandi!");
      setEditModal({ isOpen: false, data: null });
      await fetchSales();
    } else {
      toast.error(data?.error || "Tahrirlashda xatolik yuz berdi");
    }
  } catch (err) {
    console.error('Update order error:', err);
    toast.error("Server xatosi!");
  } finally {
    setIsActionLoading(false);
  }
};

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const search = searchTerm.trim().toLowerCase();

      const customerName = sale.customer
        ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`
        : `${sale.otherName || 'anonim mijoz'} ${sale.otherPhone || ''}`;

      const searchString = `${sale.id} ${sale.orderNumber || ''} ${customerName}`.toLowerCase();

      const matchesSearch = searchString.includes(search);
      const matchesStatus =
        filterStatus === 'ALL' || String(sale.status || '').toUpperCase() === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [sales, searchTerm, filterStatus]);

  return (
    <div className="p-6 min-h-screen bg-gray-50/50 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Naqd Savdolar</h1>
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

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="text-slate-400 ml-2" size={20} />
          <input
            type="text"
            placeholder="Mijoz ismi, telefoni, order raqami yoki ID bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-slate-700 font-medium bg-transparent"
          />
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Barchasi
          </button>

          <button
            onClick={() => setFilterStatus('DRAFT')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              filterStatus === 'DRAFT'
                ? 'bg-slate-100 text-slate-700 shadow-inner border border-slate-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Jarayonda
          </button>

          <button
            onClick={() => setFilterStatus('PAYMENT_PENDING')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              filterStatus === 'PAYMENT_PENDING'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'text-slate-500 hover:bg-amber-50'
            }`}
          >
            To'lov kutilmoqda
          </button>

          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'text-slate-500 hover:bg-emerald-50'
            }`}
          >
            Yakunlangan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-black tracking-wider border-b border-slate-100">
            <tr>
              <th className="p-5 text-center">ID</th>
              <th className="p-5">Order raqam</th>
              <th className="p-5">Sana</th>
              <th className="p-5">Mijoz</th>
              <th className="p-5 text-right">Summa</th>
              <th className="p-5 text-center">Holati</th>
              <th className="p-5 text-center">Amallar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                </td>
              </tr>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((sale) => {
                const statusUpper = String(sale.status || '').toUpperCase();

                return (
                  <tr key={sale.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-5 text-center font-black text-slate-400">#{sale.id}</td>

                    <td className="p-5">
                      <div className="text-slate-800">{sale.orderNumber || '-'}</div>
                    </td>

                    <td className="p-5">
                      <div className="text-slate-800">
                        {new Date(sale.createdAt).toLocaleDateString('uz-UZ')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="p-5">
                      {sale.customer ? (
                        <div>
                          <div className="text-slate-800">
                            {sale.customer.lastName} {sale.customer.firstName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <User size={12} /> Bazadan tanlangan
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-slate-800">{sale.otherName || 'Anonim mijoz'}</div>
                          <div className="text-[11px] text-amber-500 mt-0.5 flex items-center gap-1">
                            <User size={12} /> {sale.otherPhone || 'Telefon kiritilmagan'}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-5 text-right">
                      <div className="text-lg font-black text-blue-600">
                        {Number(sale.totalAmount || 0).toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">UZS</span>
                      </div>
                      {Number(sale.discountAmount) > 0 && (
                        <div className="text-[10px] text-rose-500 mt-0.5">
                          Chegirma: {Number(sale.discountAmount).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="p-5 text-center">
                      {statusUpper === 'DRAFT' ? (
                        <span className="inline-flex items-center justify-center w-32 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-slate-200">
                          <Clock size={12} className="mr-1" /> Jarayonda
                        </span>
                      ) : statusUpper === 'PAYMENT_PENDING' ? (
                        <span className="inline-flex items-center justify-center w-32 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-amber-200">
                          To'lov kutilmoqda
                        </span>
                      ) : statusUpper === 'COMPLETED' ? (
                        <span className="inline-flex items-center justify-center w-32 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-emerald-200">
                          Yakunlangan
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-32 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] uppercase font-black tracking-widest border border-slate-200">
                          {sale.status}
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                        <div className="flex justify-center gap-2">
                            <button
                            onClick={() => setDetailsModal({ isOpen: true, sale })}
                            className="p-2 text-slate-400 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                            title="Batafsil ko'rish"
                            >
                            <Eye size={18} />
                            </button>

                            {statusUpper === 'DRAFT' && (
                            <>
                                <button
                                disabled={isActionLoading}
                                onClick={() => openEditModal(sale)}
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                title="Tahrirlash"
                                >
                                <Edit2 size={18} />
                                </button>

                                <button
                                disabled={isActionLoading}
                                onClick={() => setSendToPaymentModal({ isOpen: true, id: sale.id })}
                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                title="Tasdiqlash"
                                >
                                <CheckCircle size={18} />
                                </button>
                            </>
                            )}

                            <button
                            disabled={isActionLoading}
                            onClick={() => setDeleteModal({ isOpen: true, sale })}
                            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all disabled:opacity-50"
                            title="O'chirish"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                      </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-20 text-center text-slate-400 font-bold text-lg">
                  Savdolar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailsModal.isOpen && detailsModal.sale && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailsModal({ isOpen: false, sale: null });
            }
          }}
        >
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Eye className="text-blue-600" /> Savdo batafsil
                </h2>
                <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">
                  ID: #{detailsModal.sale.id} | Sana:{' '}
                  {new Date(detailsModal.sale.createdAt).toLocaleString('uz-UZ')}
                </p>
              </div>

              <button
                onClick={() => setDetailsModal({ isOpen: false, sale: null })}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">
                    Xaridor
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    {detailsModal.sale.customer
                      ? `${detailsModal.sale.customer.lastName} ${detailsModal.sale.customer.firstName}`
                      : detailsModal.sale.otherName || 'Anonim mijoz'}
                  </p>
                  <p className="text-sm font-mono text-slate-500 mt-1">
                    {detailsModal.sale.customer?.phones?.[0]?.phone ||
                      detailsModal.sale.otherPhone ||
                      '-'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border bg-slate-50 border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">
                    Holati
                  </p>
                  <p className="text-lg font-bold text-slate-700">
                    {String(detailsModal.sale.status).toUpperCase() === 'DRAFT'
                      ? 'Jarayonda'
                      : String(detailsModal.sale.status).toUpperCase() === 'PAYMENT_PENDING'
                      ? "To'lov kutilmoqda"
                      : String(detailsModal.sale.status).toUpperCase() === 'COMPLETED'
                      ? 'Yakunlangan'
                      : detailsModal.sale.status}
                  </p>
                </div>
              </div>

              {detailsModal.sale.note && (
                <div
                  className={`p-5 rounded-2xl mb-8 border ${
                    Number(detailsModal.sale.discountAmount) > 0
                      ? 'bg-rose-50 border-rose-100 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1 ${
                      Number(detailsModal.sale.discountAmount) > 0
                        ? 'text-rose-500'
                        : 'text-slate-500'
                    }`}
                  >
                    Izoh
                  </p>
                  <p className="text-sm font-medium leading-relaxed">{detailsModal.sale.note}</p>
                </div>
              )}

              <h3 className="font-black text-slate-700 mb-4 uppercase text-xs tracking-widest">
                Xarid qilingan tovarlar:
              </h3>

              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase">
                    <tr>
                      <th className="p-4">Tovar Nomi</th>
                      <th className="p-4 text-center">Soni</th>
                      <th className="p-4 text-right">Dona narxi</th>
                      <th className="p-4 text-right">Jami</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                    {(detailsModal.sale.items || []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div>{item.product?.name || "Noma'lum tovar"}</div>
                        </td>
                        <td className="p-4 text-center">{item.quantity} ta</td>
                        <td className="p-4 text-right text-slate-500 font-medium">
                          {Number(item.unitPrice).toLocaleString()}
                        </td>
                        <td className="p-4 text-right text-blue-600">
                          {Number(item.totalAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-800 text-white rounded-2xl p-6">
                <div className="flex justify-between text-sm mb-2 text-slate-400">
                  <span>Jami summa:</span>
                  <span className="font-bold">
                    {Number(detailsModal.sale.subtotal || 0).toLocaleString()} UZS
                  </span>
                </div>

                {Number(detailsModal.sale.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm mb-4 text-amber-400 border-b border-slate-600 pb-4">
                    <span>Chegirma:</span>
                    <span className="font-bold">
                      - {Number(detailsModal.sale.discountAmount || 0).toLocaleString()} UZS
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-end">
                  <span className="text-[11px] uppercase tracking-widest text-emerald-400">
                    Yakuniy summa
                  </span>
                  <span className="text-3xl font-black text-emerald-400">
                    {Number(detailsModal.sale.totalAmount || 0).toLocaleString()}{' '}
                    <span className="text-sm font-normal">UZS</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sendToPaymentModal.isOpen && (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
    <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-amber-50 text-amber-500 rotate-3 shadow-lg shadow-amber-100">
        <CheckCircle size={40} strokeWidth={2.5} />
      </div>

      <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
        Tasdiqlaysizmi?
      </h3>

      <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
        Ushbu amal bajarilgach, savdo <b>"To'lov kutilmoqda"</b> holatiga o'tadi.
      </p>

      <div className="flex gap-3">
        <button
          disabled={isActionLoading}
          onClick={() => setSendToPaymentModal({ isOpen: false, id: null })}
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50"
        >
          Bekor qilish
        </button>

        <button
          disabled={isActionLoading}
          onClick={handleConfirmOrder}
          className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Tasdiqlash'}
        </button>
      </div>
    </div>
  </div>
)}

{editModal.isOpen && editModal.data && (
  <div
    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget && !isActionLoading) {
        setEditModal({ isOpen: false, data: null });
      }
    }}
  >
    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Edit2 className="text-blue-600" /> Savdoni tahrirlash
        </h2>
        <button
          disabled={isActionLoading}
          onClick={() => setEditModal({ isOpen: false, data: null })}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"
        >
          <X size={24} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto mb-6 border border-slate-100 rounded-xl custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 sticky top-0 text-[10px] text-slate-400 uppercase font-black">
            <tr>
              <th className="p-3">Tovar</th>
              <th className="p-3 text-center">Soni</th>
              <th className="p-3 text-right">Jami (UZS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {editModal.data.items.map((item) => (
              <tr key={item.productId}>
                <td className="p-3 text-slate-700">{item.name}</td>
                <td className="p-3 w-28">
                  <input
                    type="number"
                    min="1"
                    disabled={isActionLoading}
                    value={item.quantity}
                    onChange={(e) => updateEditQty(item.productId, Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-center outline-blue-500 font-black text-blue-600 bg-slate-50 focus:bg-white disabled:opacity-50"
                  />
                </td>
                <td className="p-3 text-right text-slate-600">
                  {(item.unitPrice * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Chegirma (UZS)
          </label>
          <input
            type="number"
            min="0"
            disabled={isActionLoading}
            value={editModal.data.discountAmount}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                data: {
                  ...prev.data,
                  discountAmount: e.target.value
                }
              }))
            }
            className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl outline-none focus:border-amber-400 font-black text-amber-700 text-lg disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Izoh
          </label>
          <textarea
            disabled={isActionLoading}
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
            className="w-full p-3 border rounded-xl outline-none resize-none h-16 bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-700 disabled:opacity-50"
          ></textarea>
        </div>
      </div>

      <button
        disabled={isActionLoading}
        onClick={saveEdit}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isActionLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <Edit2 size={20} /> O'zgarishlarni saqlash
          </>
        )}
      </button>
    </div>
  </div>
)}

      {deleteModal.isOpen && deleteModal.sale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 text-rose-500 rotate-3 shadow-lg shadow-rose-100">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              O'chiriladimi?
            </h3>

            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              Siz <b>#{deleteModal.sale.id}</b> raqamli savdoni o'chirmoqchisiz.
            </p>

            <div className="flex gap-3">
              <button
                disabled={isActionLoading}
                onClick={() => setDeleteModal({ isOpen: false, sale: null })}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50"
              >
                Yopish
              </button>

              <button
                disabled={isActionLoading}
                onClick={handleDelete}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : "Ha, O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashSales;