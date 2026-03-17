import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutList,
  Loader2,
  Edit2,
  CheckCircle,
  Trash2,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const formatDate = (dateValue) => {
  if (!dateValue) return '-';

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('uz-UZ');
};

const getStatusBadge = (status) => {
  const upper = String(status || '').toUpperCase();

  if (upper === 'DRAFT') {
    return {
      text: 'Jarayonda',
      className: 'bg-amber-50 text-amber-600 border border-amber-200'
    };
  }

  if (upper === 'PAYMENT_PENDING') {
    return {
      text: "To'lov kutilmoqda",
      className: 'bg-blue-50 text-blue-600 border border-blue-200'
    };
  }

  if (upper === 'COMPLETED') {
    return {
      text: 'Yopilgan',
      className: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    };
  }

  if (upper === 'CANCELLED') {
    return {
      text: 'Bekor qilingan',
      className: 'bg-rose-50 text-rose-600 border border-rose-200'
    };
  }

  return {
    text: status || '-',
    className: 'bg-slate-100 text-slate-600 border border-slate-200'
  };
};

const ContractList = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    contract: null
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    contract: null
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    contract: null
  });
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/contracts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Shartnomalarni yuklab bo'lmadi");
      }

      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Contract fetch xatosi:', error);
      toast.error(error.message || "Shartnomalarni yuklashda xatolik");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchContracts();
    }
  }, [token, fetchContracts]);

  const filteredContracts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return contracts;

    return contracts.filter((c) => {
      const customerName = `${c.customer?.lastName || ''} ${c.customer?.firstName || ''}`.toLowerCase();
      const contractNumber = String(c.contractNumber || '').toLowerCase();
      const phone =
        c.customer?.phones?.[0]?.phone?.toLowerCase() ||
        c.customer?.phone?.toLowerCase() ||
        '';

      return (
        customerName.includes(q) ||
        contractNumber.includes(q) ||
        phone.includes(q)
      );
    });
  }, [contracts, searchTerm]);

  const openConfirmModal = (contract) => {
    setConfirmModal({
      isOpen: true,
      contract
    });
  };

  const closeConfirmModal = () => {
    if (actionLoading) return;
    setConfirmModal({
      isOpen: false,
      contract: null
    });
  };

  const openDeleteModal = (contract) => {
    setDeleteModal({
      isOpen: true,
      contract
    });
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;
    setDeleteModal({
      isOpen: false,
      contract: null
    });
  };

  const handleConfirmContract = async () => {
    if (!confirmModal.contract) return;

    try {
      setActionLoading(true);

      const res = await fetch(`${API_URL}/api/contracts/${confirmModal.contract.id}/confirm`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Tasdiqlashda xatolik');
      }

      toast.success(data?.message || "Shartnoma tasdiqlandi!");
      setConfirmModal({ isOpen: false, contract: null });
      await fetchContracts();
    } catch (error) {
      toast.error(error.message || 'Tasdiqlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!deleteModal.contract) return;

    try {
      setActionLoading(true);

      const res = await fetch(`${API_URL}/api/contracts/${deleteModal.contract.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "O'chirishda xatolik");
      }

      toast.success(data?.message || "Shartnoma o'chirildi!");
      setDeleteModal({ isOpen: false, contract: null });
      await fetchContracts();
    } catch (error) {
      toast.error(error.message || "O'chirishda xatolik");
    } finally {
      setActionLoading(false);
    }
  };

const handleOpenDetail = async (contractId) => {
  try {
    setDetailLoading(true);

    const res = await fetch(`${API_URL}/api/contracts/${contractId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Shartnoma ma'lumotlarini yuklab bo'lmadi");
    }

    setDetailModal({
      isOpen: true,
      contract: data
    });
  } catch (error) {
    toast.error(error.message || "Xatolik yuz berdi");
  } finally {
    setDetailLoading(false);
  }
};

const getScheduleStatusText = (status) => {
  const s = String(status || '').trim().toUpperCase();

  if (s === 'KUTILMOQDA') return "Kutilmoqda";
  if (s === 'TOLANDI') return "To'landi";
  if (s === 'QISMAN_TOLANDI') return "Qisman to'landi";
  if (s === 'KECIKDI') return "Kechikdi";

  return status || '-';
};

  const openDetailModal = async (contractId) => {
  try {
    setDetailLoading(true);

    const res = await fetch(`${API_URL}/api/contracts/${contractId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      throw new Error(data?.error || "Shartnoma ma'lumotini olib bo'lmadi");
    }

    setDetailModal({
      isOpen: true,
      contract: data
    });
  } catch (error) {
    toast.error(error.message || "Xatolik yuz berdi");
  } finally {
    setDetailLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Shartnoma ro'yxati</h1>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Mijoz ismi yoki shartnoma raqamini qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter size={20} /> Filtr
        </button>

        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <LayoutList size={20} /> Ro'yxat
        </button>

        <button
          onClick={() => navigate('/shartnoma/qoshish')}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
        >
          <Plus size={18} /> Qo'shish
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="p-4 w-[130px]">Raqami</th>
                <th className="p-4 w-[140px]">Sanasi</th>
                <th className="p-4">Mijoz (F.I.SH)</th>
                <th className="p-4 w-[110px]">Muddati</th>
                <th className="p-4 w-[170px]">Holati</th>
                <th className="p-4 w-[170px] text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={28} />
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    Hozircha shartnomalar yo'q.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const statusUpper = String(item.status || '').toUpperCase();

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-bold text-blue-600">
                        {item.contractNumber}
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatDate(item.createdAt || item.date)}
                      </td>

                      <td
                        className="p-4 font-bold text-gray-800 uppercase truncate"
                        title={`${item.customer?.lastName || ''} ${item.customer?.firstName || ''}`}
                      >
                        {item.customer?.lastName || ''} {item.customer?.firstName || ''}
                      </td>

                      <td className="p-4 font-medium text-gray-600">
                        {item.durationMonths || 0} oy
                      </td>

                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                          <button
                            onClick={() => handleOpenDetail(item.id)}
                            disabled={detailLoading}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            title="Ko'rish"
                          >
                            <Eye size={18} />
                          </button>

                          {statusUpper === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => navigate(`/shartnoma/tahrirlash/${item.id}`)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-500 hover:text-blue-700"
                                title="Tahrirlash"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                onClick={() => openConfirmModal(item)}
                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-500 hover:text-emerald-700"
                                title="Tasdiqlash"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-500 hover:text-rose-700"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {detailModal.isOpen && detailModal.contract && (
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-2"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setDetailModal({ isOpen: false, contract: null });
      }
    }}
  >
    <div className="bg-white w-[98vw] h-[96vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Shartnoma ma'lumotlari</h2>
          <p className="text-sm text-gray-500 mt-1">
            Raqam: {detailModal.contract.contractNumber}
          </p>
        </div>

        <button
          onClick={() => setDetailModal({ isOpen: false, contract: null })}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <X size={22} />
        </button>
      </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* ASOSIY MIJOZ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Asosiy mijoz
                  </div>
                  <div className="font-black text-slate-800 uppercase">
                    {detailModal.contract.customer?.lastName}{" "}
                    {detailModal.contract.customer?.firstName}{" "}
                    {detailModal.contract.customer?.middleName || ""}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Telefon
                  </div>
                  <div className="font-bold text-slate-700">
                    {detailModal.contract.customer?.phones?.[0]?.phone || "-"}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Holati
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                      getStatusBadge(detailModal.contract.status).className
                    }`}
                  >
                    {getStatusBadge(detailModal.contract.status).text}
                  </span>
                </div>
              </div>

              {/* BIRGA QARZ OLUVCHILAR */}
              {Array.isArray(detailModal.contract.coBorrowers) &&
                detailModal.contract.coBorrowers.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-black text-slate-800">
                      Birga qarz oluvchilar
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailModal.contract.coBorrowers.map((co) => {
                        const person = co.customer || co;

                        return (
                          <div
                            key={co.id || person.id}
                            className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                          >
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                              F.I.SH
                            </div>
                            <div className="font-black text-slate-800 uppercase">
                              {person.lastName} {person.firstName}{" "}
                              {person.middleName || ""}
                            </div>

                            <div className="mt-3 text-xs text-slate-400 font-bold uppercase mb-1">
                              Telefon
                            </div>
                            <div className="font-bold text-slate-700">
                              {person.phones?.[0]?.phone || person.phone || "-"}
                            </div>

                            {person.pinfl && (
                              <>
                                <div className="mt-3 text-xs text-slate-400 font-bold uppercase mb-1">
                                  JSHSHIR
                                </div>
                                <div className="font-mono text-slate-700 font-bold">
                                  {person.pinfl}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* SHARTNOMA MA'LUMOTLARI */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Sanasi
                  </div>
                  <div className="font-bold text-slate-800">
                    {formatDate(detailModal.contract.createdAt)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Muddat
                  </div>
                  <div className="font-bold text-slate-800">
                    {detailModal.contract.durationMonths} oy
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    To'lov kuni
                  </div>
                  <div className="font-bold text-slate-800">
                    Har oyning {detailModal.contract.paymentDay || "-"}-sanasi
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Jami summa
                  </div>
                  <div className="font-bold text-slate-800">
                    {Number(detailModal.contract.totalAmount || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Chegirma
                  </div>
                  <div className="font-bold text-amber-600">
                    {Number(detailModal.contract.discountAmount || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Oldindan to'lov
                  </div>
                  <div className="font-bold text-emerald-600">
                    {Number(detailModal.contract.prepayment || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Qolgan qarz
                  </div>
                  <div className="font-bold text-rose-600">
                    {Number(detailModal.contract.debtAmount || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Oylik to'lov
                  </div>
                  <div className="font-bold text-blue-600">
                    {Number(detailModal.contract.monthlyPayment || 0).toLocaleString()} UZS
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Tashkilot / Kassa
                  </div>
                  <div className="font-bold text-slate-800">
                    {detailModal.contract.cashbox?.name || "-"}
                  </div>
                </div>
              </div>

              {/* TOVARLAR */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-black text-slate-800">
                  Tovarlar
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="p-4 text-left">Tovar</th>
                      <th className="p-4 text-center">Soni</th>
                      <th className="p-4 text-right">Narxi</th>
                      <th className="p-4 text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailModal.contract.items || []).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-4">{item.product?.name || "Noma'lum tovar"}</td>
                        <td className="p-4 text-center">{item.quantity}</td>
                        <td className="p-4 text-right">
                          {Number(item.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {Number(item.totalAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TO'LOV GRAFIGI */}
              {Array.isArray(detailModal.contract.schedules) &&
                detailModal.contract.schedules.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-black text-slate-800">
                      To'lov grafigi
                    </div>

                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                          <th className="p-4 text-left">Oy</th>
                          <th className="p-4 text-left">Sana</th>
                          <th className="p-4 text-right">Summa</th>
                          <th className="p-4 text-right">To'langan</th>
                          <th className="p-4 text-center">Holat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailModal.contract.schedules.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="p-4">{row.monthNumber}</td>
                            <td className="p-4">{formatDate(row.date)}</td>
                            <td className="p-4 text-right">
                              {Number(row.amount || 0).toLocaleString()}
                            </td>
                            <td className="p-4 text-right text-emerald-600">
                              {Number(row.paid || 0).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {getScheduleStatusText(row.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* IZOH */}
              {detailModal.contract.note && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-xs text-amber-600 font-bold uppercase mb-1">
                    Izoh
                  </div>
                  <div className="text-slate-700 font-medium">
                    {detailModal.contract.note}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={22} />
            <span className="font-bold text-slate-700">Yuklanmoqda...</span>
          </div>
        </div>
      )}

      {confirmModal.isOpen && confirmModal.contract && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirmModal();
          }}
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
              <CheckCircle size={32} />
            </div>

            <h3 className="text-2xl font-black text-gray-800 text-center mb-2">
              Tasdiqlaysizmi?
            </h3>

            <p className="text-center text-gray-500 text-sm leading-relaxed mb-6">
              <span className="font-bold text-gray-700 block mb-1">
                Shartnoma raqami: {confirmModal.contract.contractNumber}
              </span>
              Ushbu amal bajarilgach, shartnoma <b>"To'lov kutilmoqda"</b> holatiga o'tadi.
            </p>

            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={closeConfirmModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={actionLoading}
                onClick={handleConfirmContract}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && deleteModal.contract && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-600">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-2xl font-black text-gray-800 text-center mb-2">
              O‘chirishni tasdiqlang
            </h3>

            <p className="text-center text-gray-500 text-sm leading-relaxed mb-6">
              <span className="font-bold text-gray-700 block mb-1">
                Shartnoma raqami: {deleteModal.contract.contractNumber}
              </span>
              Haqiqatan ham ushbu shartnomani o‘chirmoqchimisiz?
            </p>

            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={closeDeleteModal}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={actionLoading}
                onClick={handleDeleteContract}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;