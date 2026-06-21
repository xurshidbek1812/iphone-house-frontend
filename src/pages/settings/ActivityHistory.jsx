import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const ENTITY_LABELS = {
  SupplierInvoice: "Ta'minotchi kirim",
  Contract: 'Shartnoma',
  Order: 'Naqd savdo',
  Expense: 'Xarajat',
  BlacklistRequest: "Qora ro'yxat",
  Product: 'Mahsulot',
  ProductBatch: 'Partiya',
  Customer: 'Mijoz',
  Supplier: "Ta'minotchi",
  Cashbox: 'Kassa',
  CashboxTransaction: 'Kassa amaliyoti',
  Category: 'Kategoriya',
  ExpenseCategory: 'Xarajat moddasi',
  ExpenseCategoryGroup: 'Xarajat guruhi',
  User: 'Foydalanuvchi',
  InventoryAct: 'Sanoq'
};

const ACTION_LABELS = {
  CREATE: 'Yaratdi',
  UPDATE: 'Tahrirladi',
  DELETE: "O'chirdi",
  APPROVE: 'Tasdiqladi',
  REJECT: 'Rad etdi',
  SEND: 'Yubordi',
  CONFIRM: 'Tasdiqladi',
  CANCEL: 'Bekor qildi',
  COMPLETE: 'Yakunladi',
  LOGIN: 'Tizimga kirdi',
  ARCHIVE: 'Arxivladi',
  DEPOSIT: 'Kirim qildi',
  WITHDRAW: 'Chiqim qildi',
  TRANSFER: "O'tkazma qildi"
};

const ACTION_BADGE_CLASSES = {
  CREATE: 'bg-blue-50 text-blue-700 border-blue-100',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-100',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-100',
  APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECT: 'bg-rose-50 text-rose-700 border-rose-100',
  SEND: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  CONFIRM: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  CANCEL: 'bg-rose-50 text-rose-700 border-rose-100',
  COMPLETE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  LOGIN: 'bg-slate-100 text-slate-600 border-slate-200',
  ARCHIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  DEPOSIT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  WITHDRAW: 'bg-amber-50 text-amber-700 border-amber-100',
  TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-100'
};

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700'
];

const colorForName = (name) => {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[Math.abs(hash)];
};

const initialsFor = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ActivityHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityTypes, setEntityTypes] = useState([]);
  const [actors, setActors] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [limitInput, setLimitInput] = useState('20');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [entityType, setEntityType] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [actorId, setActorId] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expandedId, setExpandedId] = useState(null);

  const fetchFilters = useCallback(async () => {
    try {
      const [typesData, actorsData] = await Promise.all([
        apiFetch('/api/activity-logs/entity-types'),
        apiFetch('/api/activity-logs/actors')
      ]);
      setEntityTypes(Array.isArray(typesData) ? typesData : []);
      setActors(Array.isArray(actorsData) ? actorsData : []);
    } catch (error) {
      console.error('Filtrlarni yuklashda xato', error);
    }
  }, []);

  const fetchLogs = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          page: String(targetPage),
          limit: String(limit),
          entityType,
          action,
          ...(actorId !== 'ALL' ? { actorId } : {}),
          ...(appliedSearch ? { search: appliedSearch } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {})
        });

        const data = await apiFetch(`/api/activity-logs?${query.toString()}`);

        setLogs(Array.isArray(data?.items) ? data.items : []);
        setPage(Number(data?.page || 1));
        setTotalPages(Number(data?.totalPages || 1));
        setTotal(Number(data?.total || 0));
      } catch (error) {
        console.error('Faoliyat tarixini yuklashda xato', error);
        toast.error(error.message || "Faoliyat tarixini yuklab bo'lmadi");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [limit, entityType, action, actorId, appliedSearch, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearchSubmit = () => setAppliedSearch(searchTerm.trim());

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const commitLimitChange = () => {
    const parsed = Math.min(100, Math.max(1, Number(limitInput) || 20));
    setLimitInput(String(parsed));
    setLimit(parsed);
  };

  const handleLimitKeyDown = (e) => {
    if (e.key === 'Enter') commitLimitChange();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setEntityType('ALL');
    setAction('ALL');
    setActorId('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    appliedSearch || entityType !== 'ALL' || action !== 'ALL' || actorId !== 'ALL' || dateFrom || dateTo;

  const availableActions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => set.add(l.action));
    Object.keys(ACTION_LABELS).forEach((a) => set.add(a));
    return Array.from(set);
  }, [logs]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <History size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Faoliyat tarixi</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Tizimdagi barcha amallar — kim, qachon, nima qildi
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Foydalanuvchi, obyekt yoki izoh bo'yicha qidirish..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              onClick={handleSearchSubmit}
              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
            >
              Qidirish
            </button>
          </div>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Barcha turlar</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {ENTITY_LABELS[t] || t}
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Barcha amallar</option>
            {availableActions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a] || a}
              </option>
            ))}
          </select>

          <select
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Barcha foydalanuvchilar</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm font-medium text-slate-700 outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm font-medium text-slate-700 outline-none"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-2.5 flex items-center justify-between">
            <div className="text-xs text-slate-400">Filtrlar qo'llanildi</div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <RotateCcw size={12} />
              Tozalash
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-[980px]">
            <thead className="sticky top-0 z-10 bg-slate-50/95 text-left text-[10px] text-slate-500 uppercase tracking-[0.12em] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium w-44">Vaqt</th>
                <th className="px-4 py-3 font-medium w-56">Foydalanuvchi</th>
                <th className="px-4 py-3 font-medium w-36">Amal</th>
                <th className="px-4 py-3 font-medium">Obyekt</th>
                <th className="px-4 py-3 font-medium">Izoh</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400 text-sm">
                    Hech qanday amal topilmadi
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 align-middle whitespace-nowrap text-[13px] text-slate-500 font-normal">
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${colorForName(
                              log.actorName
                            )}`}
                          >
                            {initialsFor(log.actorName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-slate-800 truncate">
                              {log.actorName}
                            </div>
                            {log.actorRole && (
                              <div className="text-[11px] text-slate-400 capitalize">
                                {log.actorRole}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none border ${
                            ACTION_BADGE_CLASSES[log.action] || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="text-[14px] font-medium text-slate-700">
                          {log.entityLabel || `#${log.entityId ?? '-'}`}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ENTITY_LABELS[log.entityType] || log.entityType}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-[13px] text-slate-500 max-w-[260px] truncate">
                        {log.note || (log.fromStatus && log.toStatus ? `${log.fromStatus} → ${log.toStatus}` : '—')}
                      </td>

                      <td className="px-4 py-3 align-middle text-center text-slate-400">
                        {expandedId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>

                    {expandedId === log.id && (
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                Holat o'zgarishi
                              </div>
                              <div className="font-medium text-slate-700">
                                {log.fromStatus || log.toStatus
                                  ? `${log.fromStatus || '—'} → ${log.toStatus || '—'}`
                                  : "O'zgarish yo'q"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                Obyekt ID
                              </div>
                              <div className="font-medium text-slate-700">
                                {log.entityId ?? '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                Izoh
                              </div>
                              <div className="font-medium text-slate-700">{log.note || '-'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                Qo'shimcha
                              </div>
                              {log.metadata ? (
                                <div className="space-y-0.5">
                                  {Object.entries(log.metadata).map(([k, v]) => (
                                    <div key={k} className="font-medium text-slate-700">
                                      <span className="text-slate-400">{k}:</span> {String(v)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="font-medium text-slate-400">Yo'q</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              Jami: <span className="font-medium text-slate-800">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Sahifada:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                onBlur={commitLimitChange}
                onKeyDown={handleLimitKeyDown}
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Oldingi
            </button>

            <div className="min-w-[84px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-normal text-slate-700">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading || totalPages === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keyingi
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistory;
