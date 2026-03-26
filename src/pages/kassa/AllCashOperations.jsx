import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Wallet,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User2,
  ReceiptText
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ITEMS_PER_PAGE = 10;

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getOperationMeta = (type) => {
  const safeType = String(type || '').toUpperCase();

  switch (safeType) {
    case 'INCOME':
    case 'DEPOSIT':
      return {
        title: 'Kirim',
        statusLabel: 'Bajarildi',
        statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };

    case 'EXPENSE':
    case 'WITHDRAW':
      return {
        title: 'Xarajat',
        statusLabel: 'Bajarildi',
        statusBadge: 'bg-rose-50 text-rose-700 border-rose-200'
      };

    case 'TRANSFER_OUT':
      return {
        title: "Boshqa kassaga chiqim",
        statusLabel: 'Chiqim',
        statusBadge: 'bg-amber-50 text-amber-700 border-amber-200'
      };

    case 'TRANSFER_IN':
      return {
        title: "Boshqa kassadan kirim",
        statusLabel: 'Kirim',
        statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };

    default:
      return {
        title: type || 'Amaliyot',
        statusLabel: 'Bajarildi',
        statusBadge: 'bg-blue-50 text-blue-700 border-blue-200'
      };
  }
};

const normalizeOperations = (transactions) => {
  const grouped = new Map();
  const singles = [];

  for (const item of transactions) {
    if (item.transferGroupId) {
      if (!grouped.has(item.transferGroupId)) {
        grouped.set(item.transferGroupId, []);
      }
      grouped.get(item.transferGroupId).push(item);
    } else {
      const meta = getOperationMeta(item.type);

      singles.push({
        id: `single-${item.id}`,
        createdAt: item.createdAt,
        type: item.type,
        title: meta.title,
        statusLabel: meta.statusLabel,
        statusBadge: meta.statusBadge,
        cashboxName: item.cashbox?.name || '-',
        targetCashboxName: '-',
        amount: item.amount,
        currency: item.cashbox?.currency || '',
        note: item.note || '-',
        userName: item.user?.fullName || item.user?.username || '-',
        direction: item.cashbox?.name || '-',
        raw: item
      });
    }
  }

  const transfers = [];

  for (const [, items] of grouped.entries()) {
    const outRow = items.find((x) => String(x.type).toUpperCase() === 'TRANSFER_OUT');
    const inRow = items.find((x) => String(x.type).toUpperCase() === 'TRANSFER_IN');
    const firstRow = items[0];

    if (outRow && inRow) {
      transfers.push({
        id: `transfer-${firstRow.transferGroupId}`,
        createdAt: outRow.createdAt || inRow.createdAt,
        type: 'TRANSFER',
        statusLabel: 'Transfer',
        statusBadge: 'bg-violet-50 text-violet-700 border-violet-200',
        title: "Kassalar o'rtasida transfer",
        cashboxName: outRow.cashbox?.name || '-',
        targetCashboxName: inRow.cashbox?.name || '-',
        amount: outRow.amount || inRow.amount,
        currency: outRow.cashbox?.currency || inRow.cashbox?.currency || '',
        note: outRow.note || inRow.note || '-',
        userName:
          outRow.user?.fullName ||
          inRow.user?.fullName ||
          outRow.user?.username ||
          inRow.user?.username ||
          '-',
        direction: `${outRow.cashbox?.name || '-'} → ${inRow.cashbox?.name || '-'}`,
        raw: items
      });
    } else {
      for (const item of items) {
        const meta = getOperationMeta(item.type);

        singles.push({
          id: `single-${item.id}`,
          createdAt: item.createdAt,
          type: item.type,
          title: meta.title,
          statusLabel: meta.statusLabel,
          statusBadge: meta.statusBadge,
          cashboxName: item.cashbox?.name || '-',
          targetCashboxName: '-',
          amount: item.amount,
          currency: item.cashbox?.currency || '',
          note: item.note || '-',
          userName: item.user?.fullName || item.user?.username || '-',
          direction: item.cashbox?.name || '-',
          raw: item
        });
      }
    }
  }

  return [...transfers, ...singles].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
};

const AllCashOperations = () => {
  const [operations, setOperations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [page, setPage] = useState(1);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if (selectedOperation) {
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
  }, [selectedOperation]);

  const fetchOperations = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes/transactions/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        setOperations(normalizeOperations(list));
      } else {
        console.error(data?.error || 'Kassa amaliyotlari yuklanmadi');
        setOperations([]);
      }
    } catch (error) {
      console.error('Kassa amaliyotlarini yuklashda xato:', error);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOperations();
    } else {
      setLoading(false);
    }
  }, [token]);

  const filteredOperations = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();

    if (!q) return operations;

    return operations.filter((item) => {
      const searchStr = `
        ${item.id || ''}
        ${item.title || ''}
        ${item.cashboxName || ''}
        ${item.targetCashboxName || ''}
        ${item.currency || ''}
        ${item.userName || ''}
        ${item.note || ''}
        ${item.direction || ''}
      `.toLowerCase();

      return searchStr.includes(q);
    });
  }, [operations, appliedSearch]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredOperations.length / ITEMS_PER_PAGE));

  const paginatedOperations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOperations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOperations, page]);

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
            Barcha kassa amaliyotlari
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kassalar bo'yicha barcha amaliyotlar va transferlar tarixi
          </p>
        </div>

        <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-sm">
          Jami: {filteredOperations.length} ta
        </div>
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
              placeholder="Amaliyot, kassa, foydalanuvchi yoki izoh bo'yicha izlash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium text-slate-700"
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
                <th className="px-4 py-3">Amaliyot</th>
                <th className="px-4 py-3">Yo'nalish</th>
                <th className="px-4 py-3">Summasi</th>
                <th className="px-4 py-3">Kim bajardi</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3 text-center">Ko'rish</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-14 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : paginatedOperations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={34} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-base">Amaliyotlar topilmadi</p>
                      <p className="text-xs mt-1">
                        Hozircha kassa amaliyotlari mavjud emas yoki qidiruvga mos kelmadi
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOperations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.type === 'TRANSFER' ? (
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                            <ArrowRightLeft size={16} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Wallet size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-[14px]">
                            {item.title}
                          </p>
                          <p className="text-[12px] text-slate-400 mt-0.5 font-medium">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-medium text-[14px]">
                      {item.direction !== '-' ? item.direction : item.cashboxName}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[14px] font-semibold text-slate-800">
                        {formatMoney(item.amount)}
                        <span className="ml-1 text-[10px] text-slate-400 font-medium">
                          {item.currency}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-medium text-[14px]">
                      {item.userName}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${item.statusBadge}`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOperation(item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition"
                        title="Batafsil ko'rish"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Jami: <span className="font-semibold text-slate-800">{filteredOperations.length} ta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Oldingi
            </button>

            <div className="min-w-[84px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700">
              {page} / {totalPages}
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keyingi
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {selectedOperation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-start px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Amaliyot tafsilotlari
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedOperation.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedOperation(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[80vh] overflow-auto">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <ReceiptText size={14} />
                  Amaliyot
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedOperation.title}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Holati
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${selectedOperation.statusBadge}`}
                >
                  {selectedOperation.statusLabel}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Wallet size={14} />
                  Summa
                </div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatMoney(selectedOperation.amount)}
                  <span className="ml-1 text-sm text-slate-400">
                    {selectedOperation.currency}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <User2 size={14} />
                  Kim bajardi
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedOperation.userName}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <CalendarDays size={14} />
                  Sana
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {formatDateTime(selectedOperation.createdAt)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Asosiy kassa
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedOperation.cashboxName}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Yo'nalish
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedOperation.direction}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Izoh
                </div>
                <div className="text-sm text-slate-700 leading-6 whitespace-pre-wrap break-words">
                  {selectedOperation.note || '-'}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setSelectedOperation(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCashOperations;