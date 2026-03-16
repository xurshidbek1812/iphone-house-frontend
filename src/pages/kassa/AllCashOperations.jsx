import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Wallet,
  Eye,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      singles.push({
        id: `single-${item.id}`,
        createdAt: item.createdAt,
        type: item.type,
        statusLabel: 'Bajarildi',
        statusClass: 'text-blue-600',
        statusBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        title: item.type || 'Amaliyot',
        cashboxName: item.cashbox?.name || '-',
        targetCashboxName: '-',
        amount: item.amount,
        currency: item.cashbox?.currency || '',
        note: item.note || '-',
        userName: item.user?.fullName || item.user?.username || '-',
        direction: '-',
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
        statusClass: 'text-violet-600',
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
        const isOut = String(item.type).toUpperCase() === 'TRANSFER_OUT';

        singles.push({
          id: `single-${item.id}`,
          createdAt: item.createdAt,
          type: item.type,
          statusLabel: isOut ? 'Chiqim' : 'Kirim',
          statusClass: isOut ? 'text-amber-600' : 'text-emerald-600',
          statusBadge: isOut
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          title: isOut ? "Boshqa kassaga chiqim" : "Boshqa kassadan kirim",
          cashboxName: item.cashbox?.name || '-',
          targetCashboxName: '-',
          amount: item.amount,
          currency: item.cashbox?.currency || '',
          note: item.note || '-',
          userName: item.user?.fullName || item.user?.username || '-',
          direction: '-',
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
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);

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
    const q = searchTerm.trim().toLowerCase();

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
  }, [operations, searchTerm]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Barcha kassa amaliyotlari</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kassalar bo'yicha barcha amaliyotlar va transferlar tarixi
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm">
          Jami: {operations.length} ta
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Amaliyot, kassa, foydalanuvchi yoki izoh bo'yicha izlash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold">
          <Filter size={18} />
          Filtr
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="p-4">Amaliyot</th>
                <th className="p-4">Yo'nalish</th>
                <th className="p-4">Summasi</th>
                <th className="p-4">Kim bajardi</th>
                <th className="p-4">Holati</th>
                <th className="p-4 text-center">Ko'rish</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  </td>
                </tr>
              ) : filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={40} className="mb-3 text-slate-300" />
                      <p className="font-bold text-base">Amaliyotlar topilmadi</p>
                      <p className="text-xs mt-1">
                        Hozircha kassa amaliyotlari mavjud emas yoki qidiruvga mos kelmadi.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOperations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'TRANSFER' ? (
                          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <ArrowRightLeft size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Wallet size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 font-medium">
                      {item.direction !== '-' ? item.direction : item.cashboxName}
                    </td>

                    <td className="p-4 font-black text-slate-800">
                      {formatMoney(item.amount)}{' '}
                      <span className="text-xs text-slate-400">{item.currency}</span>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">
                      {item.userName}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-xl border text-xs font-black ${item.statusBadge}`}>
                        {item.statusLabel}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedOperation(item)}
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="Batafsil ko'rish"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOperation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-start p-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-slate-800">
                  Amaliyot tafsilotlari
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedOperation.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedOperation(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Amaliyot</p>
                <p className="font-black text-slate-800">{selectedOperation.title}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Holati</p>
                <span className={`px-3 py-1.5 rounded-xl border text-xs font-black ${selectedOperation.statusBadge}`}>
                  {selectedOperation.statusLabel}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Summa</p>
                <p className="font-black text-slate-800 text-lg">
                  {formatMoney(selectedOperation.amount)}{' '}
                  <span className="text-sm text-slate-400">{selectedOperation.currency}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Kim bajardi</p>
                <p className="font-bold text-slate-700">{selectedOperation.userName}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sana</p>
                <p className="font-bold text-slate-700">{formatDateTime(selectedOperation.createdAt)}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Asosiy kassa</p>
                <p className="font-bold text-slate-700">{selectedOperation.cashboxName}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Yo'nalish</p>
                <p className="font-bold text-slate-700">{selectedOperation.direction}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Izoh</p>
                <p className="font-medium text-slate-700 leading-relaxed">
                  {selectedOperation.note || '-'}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedOperation(null)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
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