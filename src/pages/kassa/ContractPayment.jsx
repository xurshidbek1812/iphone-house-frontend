import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  MessageSquare,
  Send,
  Loader2,
  X,
  Plus
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

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

const ContractPayment = () => {
  const token = sessionStorage.getItem('token');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [leftTab, setLeftTab] = useState('PAYMENT_PENDING');
  const [rightTab, setRightTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);

  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    note: ''
  });

  const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return `${d.toLocaleDateString('uz-UZ')} ${d.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  const getPhone = (customer) => {
    if (!customer) return '-';
    if (Array.isArray(customer.phones) && customer.phones.length > 0) {
      return customer.phones[0].phone;
    }
    return customer.phone || '-';
  };

  const getContractStatusText = (status) => {
    const s = normalizeStatus(status);
    if (s === 'DRAFT') return 'Jarayonda';
    if (s === 'PAYMENT_PENDING') return "To'lov kutilmoqda";
    if (s === 'COMPLETED') return 'Yopilgan';
    if (s === 'CANCELLED') return 'Bekor qilingan';
    return status || '-';
  };

  const getScheduleStatusText = (status) => {
    const s = normalizeStatus(status);
    if (s === 'KUTILMOQDA') return "Kutilmoqda";
    if (s === 'TOLANDI') return "To'landi";
    if (s === 'QISMAN_TOLANDI') return "Qisman to'landi";
    if (s === 'KECIKDI') return "Kechikdi";
    return status || '-';
  };

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/api/contracts`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
        });

        const data = await parseJsonSafe(res);

        if (!res.ok) {
        throw new Error(data?.error || "Shartnomalarni yuklashda xatolik");
        }

        const list = Array.isArray(data) ? data : [];
        setContracts(list);
    } catch (error) {
        toast.error(error.message || "Server bilan aloqa yo'q");
    } finally {
        setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
  if (!selectedContract) return;

  const refreshed = contracts.find(
    (c) => Number(c.id) === Number(selectedContract.id)
  );

  if (refreshed) {
    const oldJson = JSON.stringify(selectedContract);
    const newJson = JSON.stringify(refreshed);

    if (oldJson !== newJson) {
      setSelectedContract(refreshed);
    }
  }
}, [contracts]);

  const filteredContracts = useMemo(() => {
    const base = contracts.filter(
      (c) => normalizeStatus(c.status) === normalizeStatus(leftTab)
    );

    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;

    return base.filter((c) => {
      const contractNumber = String(c.contractNumber || '').toLowerCase();
      const customerName =
        `${c.customer?.lastName || ''} ${c.customer?.firstName || ''} ${c.customer?.middleName || ''}`.toLowerCase();
      const pinfl = String(c.customer?.pinfl || '').toLowerCase();
      const phone = String(getPhone(c.customer) || '').toLowerCase();

      return (
        contractNumber.includes(q) ||
        customerName.includes(q) ||
        pinfl.includes(q) ||
        phone.includes(q) ||
        String(c.id).includes(q)
      );
    });
  }, [contracts, leftTab, searchTerm]);

  const totalPaid = useMemo(() => {
    if (!selectedContract || !Array.isArray(selectedContract.payments)) return 0;
    return selectedContract.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [selectedContract]);

  const remainingDebt = useMemo(() => {
    if (!selectedContract) return 0;
    return Math.max(0, Number(selectedContract.debtAmount || 0));
  }, [selectedContract]);

  const openPaymentModal = () => {
    if (!selectedContract) return;
    setPaymentForm({
      amount: String(remainingDebt || ''),
      note: ''
    });
    setPaymentModalOpen(true);
  };

const handleSavePayment = async () => {
  if (!selectedContract) return;

  const amount = Number(paymentForm.amount);

  if (isNaN(amount) || amount <= 0) {
    return toast.error("To'lov summasini to'g'ri kiriting!");
  }

  if (amount > remainingDebt) {
    return toast.error("To'lov summasi qolgan qarzdan katta bo'lishi mumkin emas!");
  }

  setIsSubmittingPayment(true);
  try {
    const res = await fetch(`${API_URL}/api/contracts/${selectedContract.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount,
        note: paymentForm.note.trim() || null
      })
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `To'lovni saqlashda xatolik yuz berdi (${res.status})`
      );
    }

    toast.success(data?.message || "To'lov muvaffaqiyatli qabul qilindi!");
    setPaymentModalOpen(false);

    setPaymentForm({
      amount: '',
      note: ''
    });

    await fetchContracts();

    if (data?.result?.contract) {
      setSelectedContract(data.result.contract);
    }
  } catch (error) {
    toast.error(error.message || "Server xatosi");
  } finally {
    setIsSubmittingPayment(false);
  }
};

  const handleAddComment = async () => {
    if (!selectedContract || !newComment.trim()) return;

    setIsCommentLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/contracts/${selectedContract.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: newComment.trim()
        })
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.error || "Izoh saqlanmadi");
      }

      setNewComment('');
      toast.success("Izoh qo'shildi!");
      await fetchContracts();
    } catch (error) {
      toast.error(error.message || "Server bilan xatolik");
    } finally {
      setIsCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight">
        Shartnomaga to'lov olish
      </h1>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Shartnoma raqami, mijoz F.I.O, JSHSHIR yoki telefon..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[720px]">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-black text-slate-800 mb-4">Shartnomalar</h3>

            <div className="flex bg-slate-50 p-1 rounded-xl mb-4 text-sm font-bold text-slate-500 border border-slate-100">
              <button
                onClick={() => {
                  setLeftTab('PAYMENT_PENDING');
                  setSelectedContract(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  leftTab === 'PAYMENT_PENDING'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'hover:text-slate-700'
                }`}
              >
                To'lov kutilmoqda
              </button>

              <button
                onClick={() => {
                  setLeftTab('COMPLETED');
                  setSelectedContract(null);
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  leftTab === 'COMPLETED'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'hover:text-slate-700'
                }`}
              >
                Yopilgan
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-black text-slate-400 tracking-widest sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="py-4 pl-6 pr-2">Raqam</th>
                  <th className="p-4">Mijoz</th>
                  <th className="py-4 pr-6 pl-2 text-right">Qarz</th>
                </tr>
              </thead>

              <tbody className="font-bold text-slate-700 divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-10 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={28} />
                    </td>
                  </tr>
                ) : filteredContracts.length > 0 ? (
                  filteredContracts.map((contract) => {
                    const paid = Array.isArray(contract.payments)
                      ? contract.payments.reduce((s, p) => s + Number(p.amount || 0), 0)
                      : 0;
                    const debt = Math.max(0, Number(contract.debtAmount || 0) - paid);

                    return (
                      <tr
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className={`cursor-pointer transition-colors ${
                          selectedContract?.id === contract.id
                            ? 'bg-blue-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td
                          className={`py-4 pl-6 pr-2 ${
                            selectedContract?.id === contract.id
                              ? 'text-blue-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {contract.contractNumber}
                        </td>

                        <td className="p-4">
                          <div className="text-slate-800">
                            {contract.customer?.lastName} {contract.customer?.firstName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {getPhone(contract.customer)}
                          </div>
                        </td>

                        <td className={`py-4 pr-6 pl-2 text-right ${debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {formatMoney(debt)} UZS
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-10 text-slate-400 font-medium">
                      Bu bo'limda shartnomalar yo'q.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-[720px] overflow-hidden">
          {!selectedContract ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Shartnoma tanlanmagan</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Chap paneldan shartnomani tanlang.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Shartnoma ma'lumotlari</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest uppercase">
                      Raqam: {selectedContract.contractNumber}
                    </p>
                  </div>

                  {normalizeStatus(selectedContract.status) === 'PAYMENT_PENDING' && (
                    <button
                      onClick={openPaymentModal}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      To'lov qabul qilish
                    </button>
                  )}
                </div>

                <div className="flex gap-6 mt-4 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setRightTab('general')}
                    className={`py-2 text-sm font-bold whitespace-nowrap border-b-2 ${
                      rightTab === 'general'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    Umumiy ma'lumotlar
                  </button>
                  <button
                    onClick={() => setRightTab('payments')}
                    className={`py-2 text-sm font-bold whitespace-nowrap border-b-2 ${
                      rightTab === 'payments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    To'lovlar
                  </button>
                  <button
                    onClick={() => setRightTab('schedule')}
                    className={`py-2 text-sm font-bold whitespace-nowrap border-b-2 ${
                      rightTab === 'schedule'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    Grafik jadval
                  </button>
                  <button
                    onClick={() => setRightTab('items')}
                    className={`py-2 text-sm font-bold whitespace-nowrap border-b-2 ${
                      rightTab === 'items'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    Tovarlar
                  </button>
                  <button
                    onClick={() => setRightTab('comments')}
                    className={`py-2 text-sm font-bold whitespace-nowrap border-b-2 ${
                      rightTab === 'comments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400'
                    }`}
                  >
                    Izohlar
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                {rightTab === 'general' && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-blue-500 mb-3">
                        <Calendar size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Sana</span>
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {new Date(selectedContract.createdAt).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-blue-500 mb-3">
                        <Clock size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Muddati</span>
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {selectedContract.durationMonths || 0} oy
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-blue-500 mb-3">
                        <DollarSign size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Umumiy summa</span>
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {formatMoney(selectedContract.totalAmount)} UZS
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-amber-500 mb-3">
                        <DollarSign size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Chegirma</span>
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {formatMoney(selectedContract.discountAmount)} UZS
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-emerald-500 mb-3">
                        <CreditCard size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Oldindan to'lov</span>
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {formatMoney(selectedContract.prepayment)} UZS
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 border-l-4 border-l-rose-500">
                      <div className="flex items-center gap-2 text-rose-500 mb-3">
                        <DollarSign size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Qolgan qarz</span>
                      </div>
                      <div className="text-xl font-black text-slate-800">
                        {formatMoney(remainingDebt)} UZS
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 col-span-2 lg:col-span-3">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                        Holati
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                        normalizeStatus(selectedContract.status) === 'PAYMENT_PENDING'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {getContractStatusText(selectedContract.status)}
                      </span>
                    </div>
                  </div>
                )}

                {rightTab === 'payments' && (
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                        <tr>
                          <th className="p-4 text-center">ID</th>
                          <th className="p-4">Sanasi</th>
                          <th className="p-4 text-center">Turi</th>
                          <th className="p-4 text-right">Summasi</th>
                          <th className="p-4">Izoh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                        {selectedContract.payments?.length > 0 ? (
                          selectedContract.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-4 text-center text-slate-400">#{p.id}</td>
                              <td className="p-4 text-slate-500">{formatDate(p.paidAt || p.createdAt)}</td>
                              <td className="p-4 text-center">{p.method || '-'}</td>
                              <td className="p-4 text-right text-emerald-600">
                                {formatMoney(p.amount)} UZS
                              </td>
                              <td className="p-4 text-slate-500">{p.note || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-10 text-center text-slate-400">
                              Hozircha to'lovlar yo'q
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {rightTab === 'schedule' && (
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                        <tr>
                          <th className="p-4 text-center">Oy</th>
                          <th className="p-4">To'lov sanasi</th>
                          <th className="p-4 text-right">Oylik to'lov</th>
                          <th className="p-4 text-right">To'langan</th>
                          <th className="p-4 text-center">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                        {selectedContract.schedules?.length > 0 ? (
                          selectedContract.schedules.map((row) => (
                            <tr key={row.id}>
                              <td className="p-4 text-center">{row.monthNumber}</td>
                              <td className="p-4 text-slate-500">
                                {new Date(row.date).toLocaleDateString('uz-UZ')}
                              </td>
                              <td className="p-4 text-right">{formatMoney(row.amount)} UZS</td>
                              <td className="p-4 text-right text-emerald-500">{formatMoney(row.paid)} UZS</td>
                              <td className="p-4 text-center">
                                {getScheduleStatusText(row.status)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-10 text-center text-slate-400">
                              Grafik shakllanmagan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {rightTab === 'items' && (
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                        <tr>
                          <th className="p-4 text-center">Kod</th>
                          <th className="p-4">Nomi</th>
                          <th className="p-4 text-center">Miqdor</th>
                          <th className="p-4 text-right">Narx</th>
                          <th className="p-4 text-right">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                        {selectedContract.items?.length > 0 ? (
                          selectedContract.items.map((item) => (
                            <tr key={item.id}>
                              <td className="p-4 text-center text-slate-400">
                                {item.product?.customId || item.productId}
                              </td>
                              <td className="p-4">{item.product?.name || "Noma'lum tovar"}</td>
                              <td className="p-4 text-center text-blue-600">{item.quantity}</td>
                              <td className="p-4 text-right text-slate-500">
                                {formatMoney(item.unitPrice)} UZS
                              </td>
                              <td className="p-4 text-right">
                                {formatMoney(item.totalAmount)} UZS
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-10 text-center text-slate-400">
                              Tovarlar topilmadi
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {rightTab === 'comments' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                      {selectedContract.comments?.length > 0 ? (
                        selectedContract.comments.map((c) => (
                          <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                {c.authorName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {formatDate(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">
                              {c.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <MessageSquare size={40} className="mb-2 opacity-20" />
                          <p className="font-bold text-sm">Hali izohlar yo'q</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-end gap-2 shrink-0">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Yangi izoh yozing..."
                        className="flex-1 p-3 bg-transparent outline-none resize-none h-12 text-sm font-medium text-slate-700"
                        disabled={isCommentLoading}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={isCommentLoading || !newComment.trim()}
                        className={`p-3 rounded-xl transition-colors shrink-0 ${
                          isCommentLoading || !newComment.trim()
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {paymentModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">To'lov qabul qilish</h2>
              <button
                disabled={isSubmittingPayment}
                onClick={() => setPaymentModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">
                  Qolgan qarz
                </p>
                <p className="text-2xl font-black text-blue-700">
                  {formatMoney(remainingDebt)} UZS
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  To'lov summasi
                </label>
                <input
                  type="number"
                  min="0"
                  max={remainingDebt}
                  disabled={isSubmittingPayment}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-4 bg-white border-2 border-emerald-200 rounded-2xl outline-none focus:border-emerald-500 font-black text-emerald-600 text-xl disabled:opacity-50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Izoh
                </label>
                <textarea
                  disabled={isSubmittingPayment}
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28 disabled:opacity-50"
                  placeholder="To'lov haqida izoh..."
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                disabled={isSubmittingPayment}
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                disabled={isSubmittingPayment}
                onClick={handleSavePayment}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isSubmittingPayment ? <Loader2 size={18} className="animate-spin" /> : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractPayment;