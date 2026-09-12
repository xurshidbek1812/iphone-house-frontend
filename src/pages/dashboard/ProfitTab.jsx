import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, Loader2, BarChart2, ArrowUpRight, CalendarSearch } from "lucide-react";
import DateRangePicker from "../../components/DateRangePicker";

const API_URL = import.meta.env.VITE_API_URL;

const fmt = (v) =>
  Number(v || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });

const todayIso = () => new Date().toISOString().slice(0, 10);

const periodOptions = [
  { key: "weekly",    label: "7 kun",      days: 7  },
  { key: "monthly",   label: "30 kun",     days: 30 },
  { key: "thismonth", label: "Shu oy"               },
  { key: "lastmonth", label: "O'tgan oy"            },
  { key: "custom",    label: "Tanlangan"             },
];

const SVG_W    = 1000;
const SVG_H    = 290;
const PAD_X    = 24;
const PAD_TOP  = 22;
const PAD_BOT  = 32;
const USABLE_W = SVG_W - PAD_X * 2;
const USABLE_H = SVG_H - PAD_TOP - PAD_BOT;

const toChartItems = (raw, prefix) =>
  raw.map((item, i) => {
    const d = new Date(item.date);
    return {
      key: `${prefix}-${i}`,
      index: i,
      label: d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }),
      profit: Number(item.profit || 0),
    };
  });

const ProfitTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [data, setData]                 = useState({ today: 0, week: 0, month: 0, thisMonth: 0, lastMonth: 0, chart: [], thisMonthChart: [], lastMonthChart: [] });
  const [period, setPeriod]             = useState("weekly");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Custom range state
  const [customRange, setCustomRange]   = useState({ start: todayIso(), end: todayIso() });
  const [customData, setCustomData]     = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/reports/profit-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Server xatosi");
        }
        setData(await res.json());
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const fetchCustomRange = useCallback(async (start, end) => {
    const diffDays = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      setCustomError("Maksimal davr 30 kun bo'lishi mumkin!");
      setCustomData(null);
      return;
    }
    setCustomError(null);
    setCustomLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/reports/profit-range?from=${start}&to=${end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Server xatosi");
      }
      setCustomData(await res.json());
    } catch (err) {
      setCustomError(err.message);
      setCustomData(null);
    } finally {
      setCustomLoading(false);
    }
  }, [token]);

  const handleCustomRangeChange = useCallback((start, end) => {
    setCustomRange({ start, end });
    fetchCustomRange(start, end);
  }, [fetchCustomRange]);

  const chartData = useMemo(() => {
    if (period === "thismonth")
      return toChartItems(Array.isArray(data.thisMonthChart) ? data.thisMonthChart : [], "thismonth");
    if (period === "lastmonth")
      return toChartItems(Array.isArray(data.lastMonthChart) ? data.lastMonthChart : [], "lastmonth");
    if (period === "custom")
      return toChartItems(customData?.chart ?? [], "custom");

    const raw = Array.isArray(data.chart) ? data.chart : [];
    const days = periodOptions.find((p) => p.key === period)?.days || 7;
    return toChartItems(raw.slice(-days), period);
  }, [data, customData, period]);

  const svgData = useMemo(() => {
    const maxP = Math.max(...chartData.map((d) => d.profit), 1);
    const getX = (i) =>
      chartData.length <= 1 ? SVG_W / 2 : PAD_X + (USABLE_W * i) / (chartData.length - 1);
    const getY = (p) => PAD_TOP + USABLE_H - (Math.max(0, p) / maxP) * USABLE_H;
    const pts = chartData.map((d, i) => ({ ...d, x: getX(i), y: getY(d.profit) }));
    const lineStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const areaStr =
      pts.length >= 2
        ? [`M ${pts[0].x},${PAD_TOP + USABLE_H}`, ...pts.map((p) => `L ${p.x},${p.y}`),
           `L ${pts[pts.length - 1].x},${PAD_TOP + USABLE_H}`, "Z"].join(" ")
        : "";
    return { pts, lineStr, areaStr, maxP };
  }, [chartData]);

  useEffect(() => { setHoveredPoint(null); }, [period]);

  const periodTotals =
    period === "weekly"    ? (data.week      || 0) :
    period === "monthly"   ? (data.month     || 0) :
    period === "thismonth" ? (data.thisMonth || 0) :
    period === "lastmonth" ? (data.lastMonth || 0) :
                             (customData?.total || 0);

  const hasData     = svgData.maxP > 1;
  const hitRadius   = chartData.length > 10 ? 18 : 22;
  const customReady = period === "custom" && !customData && !customLoading;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[22px] border border-red-100 p-8 text-center text-red-400 text-sm font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-slate-900 px-6 py-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-emerald-300/8 blur-2xl" />

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Foyda tahlili</h2>
              <p className="text-xs font-medium text-slate-400">Sotuv narxi − Kirim narxi − Chegirma</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {[
              { label: "Bugun",     value: data.today     },
              { label: "7 kun",     value: data.week      },
              { label: "30 kun",    value: data.month     },
              { label: "Shu oy",    value: data.thisMonth },
              { label: "O'tgan oy", value: data.lastMonth },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {label}
                </div>
                <div
                  className="text-lg font-black leading-tight tabular-nums"
                  style={{ color: Number(value) >= 0 ? "#34d399" : "#f87171" }}
                >
                  {fmt(value)}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">UZS</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart card ── */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart2 className="text-emerald-500" size={20} />
            <div>
              <h3 className="text-base font-black text-slate-800">Kunlik foyda grafigi</h3>
              <p className="text-xs font-medium text-slate-400">
                Grafik nuqtasiga suring — summani ko'rasiz
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {period !== "custom" && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Jami:&nbsp;
                </span>
                <span className="text-sm font-black tabular-nums text-emerald-700">
                  {fmt(periodTotals)} UZS
                </span>
              </div>
            )}

            <div className="inline-flex flex-wrap rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {periodOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPeriod(opt.key)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    period === opt.key
                      ? "border border-slate-200 bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.key === "custom" ? (
                    <span className="flex items-center gap-1">
                      <CalendarSearch size={12} />
                      {opt.label}
                    </span>
                  ) : opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom date range picker */}
        {period === "custom" && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <DateRangePicker
              startDate={customRange.start}
              endDate={customRange.end}
              onChange={handleCustomRangeChange}
            />
            {customLoading && <Loader2 size={16} className="animate-spin text-emerald-500" />}
            {customError && (
              <span className="text-xs font-semibold text-red-500">{customError}</span>
            )}
            {customData && !customLoading && (
              <div className="ml-auto rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Jami:&nbsp;
                </span>
                <span className="text-sm font-black tabular-nums text-emerald-700">
                  {fmt(customData.total)} UZS
                </span>
              </div>
            )}
          </div>
        )}

        {/* Chart area */}
        <div className="rounded-[20px] border border-slate-100 bg-slate-50/60 p-4">
          {customReady ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <CalendarSearch size={28} className="opacity-40" />
              <span className="text-sm">Davr tanlang (maksimal 30 kun)</span>
            </div>
          ) : !hasData ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Bu davr uchun foyda ma'lumoti topilmadi
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="h-full w-full"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity="0.28" />
                    <stop offset="85%"  stopColor="#10b981" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"    />
                  </linearGradient>
                  <linearGradient id="profitLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((i) => {
                  const y = PAD_TOP + (USABLE_H / 4) * i;
                  return (
                    <line key={i} x1={PAD_X} x2={SVG_W - PAD_X} y1={y} y2={y}
                      stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                  );
                })}

                {svgData.areaStr && <path d={svgData.areaStr} fill="url(#profitAreaGrad)" />}

                <polyline fill="none" stroke="url(#profitLineGrad)" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round" points={svgData.lineStr} />

                {svgData.pts.map((pt, i) => {
                  const total = svgData.pts.length;
                  const show = total <= 7 ? true : i % 5 === 0 || i === total - 1;
                  if (!show) return null;
                  return (
                    <text key={`tick-${pt.key}`} x={pt.x} y={SVG_H - 8}
                      textAnchor="middle" fill="#94a3b8" fontSize="11"
                      fontFamily="system-ui,sans-serif">
                      {pt.label}
                    </text>
                  );
                })}

                {svgData.pts.map((pt) => (
                  <g key={`dot-${pt.key}`}>
                    <circle cx={pt.x} cy={pt.y} r={5} fill="#fff" />
                    <circle cx={pt.x} cy={pt.y} r={3}
                      fill={hoveredPoint?.key === pt.key ? "#059669" : "#10b981"} />
                  </g>
                ))}

                {svgData.pts.map((pt) => (
                  <circle key={`hit-${pt.key}`} cx={pt.x} cy={pt.y} r={hitRadius}
                    fill="transparent" style={{ cursor: "crosshair" }}
                    onMouseEnter={() => setHoveredPoint(pt)} />
                ))}

                {hoveredPoint && (() => {
                  const TW = 200, TH = 46;
                  const showAbove = hoveredPoint.y > PAD_TOP + TH + 12;
                  const ty = showAbove ? hoveredPoint.y - TH - 10 : hoveredPoint.y + 10;
                  const tx = Math.max(TW / 2 + PAD_X, Math.min(SVG_W - TW / 2 - PAD_X, hoveredPoint.x));
                  return (
                    <g style={{ pointerEvents: "none" }}>
                      <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={PAD_TOP} y2={PAD_TOP + USABLE_H}
                        stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                      <rect x={tx - TW / 2} y={ty} width={TW} height={TH} rx={10}
                        fill="#0f172a" opacity={0.93} />
                      <text x={tx} y={ty + 17} fill="#94a3b8" fontSize="11"
                        textAnchor="middle" fontFamily="system-ui,sans-serif">
                        {hoveredPoint.label}
                      </text>
                      <text x={tx} y={ty + 35} fill="#34d399" fontSize="14"
                        fontWeight="700" textAnchor="middle" fontFamily="system-ui,sans-serif">
                        {fmt(hoveredPoint.profit)} UZS
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>

        {hasData && !customReady && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Eng yuqori kunlik foyda
              </div>
              <div className="mt-0.5 text-sm font-black text-emerald-600">
                {fmt(svgData.maxP)} UZS
              </div>
            </div>
            <ArrowUpRight className="text-emerald-400" size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitTab;
