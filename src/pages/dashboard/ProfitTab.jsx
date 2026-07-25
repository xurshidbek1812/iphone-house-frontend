import React, { useEffect, useMemo, useState } from "react";
import { TrendingUp, Loader2, BarChart2, ArrowUpRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const fmt = (v) =>
  Number(v || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });

const periodOptions = [
  { key: "weekly", label: "7 kun", days: 7 },
  { key: "monthly", label: "30 kun", days: 30 }
];

const SVG_W = 1000;
const SVG_H = 260;
const PAD_X = 24;
const PAD_TOP = 20;
const PAD_BOT = 8;
const USABLE_W = SVG_W - PAD_X * 2;
const USABLE_H = SVG_H - PAD_TOP - PAD_BOT;

const ProfitTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ today: 0, week: 0, month: 0, chart: [] });
  const [period, setPeriod] = useState("weekly");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/reports/profit-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Server xatosi");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const chartData = useMemo(() => {
    const raw = Array.isArray(data.chart) ? data.chart : [];
    const selected = periodOptions.find((p) => p.key === period);
    const tail = raw.slice(-(selected?.days || 7));
    return tail.map((item, i) => {
      const d = new Date(item.date);
      return {
        key: `${period}-${i}`,
        label: d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }),
        profit: Number(item.profit || 0)
      };
    });
  }, [data.chart, period]);

  const svgData = useMemo(() => {
    const maxP = Math.max(...chartData.map((d) => d.profit), 1);

    const getX = (i) =>
      chartData.length <= 1
        ? SVG_W / 2
        : PAD_X + (USABLE_W * i) / (chartData.length - 1);

    const getY = (p) => PAD_TOP + USABLE_H - (Math.max(0, p) / maxP) * USABLE_H;

    const pts = chartData.map((d, i) => ({
      ...d,
      x: getX(i),
      y: getY(d.profit)
    }));

    const lineStr = pts.map((p) => `${p.x},${p.y}`).join(" ");

    const areaStr =
      pts.length >= 2
        ? [
            `M ${pts[0].x},${SVG_H}`,
            ...pts.map((p) => `L ${p.x},${p.y}`),
            `L ${pts[pts.length - 1].x},${SVG_H}`,
            "Z"
          ].join(" ")
        : "";

    return { pts, lineStr, areaStr, maxP };
  }, [chartData]);

  const periodTotals = useMemo(() => {
    if (period === "weekly") return data.week || 0;
    return data.month || 0;
  }, [period, data]);

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

  const hasData = svgData.maxP > 1;

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
              <p className="text-xs font-medium text-slate-400">
                Sotuv narxi − Kirim narxi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Bugun", value: data.today },
              { label: "7 kun", value: data.week },
              { label: "30 kun", value: data.month }
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              >
                <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {label}
                </div>
                <div
                  className="text-lg font-black tabular-nums leading-tight"
                  style={{
                    color: Number(value) >= 0 ? "#34d399" : "#f87171",
                    fontVariantNumeric: "tabular-nums"
                  }}
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart2 className="text-emerald-500" size={20} />
            <div>
              <h3 className="text-base font-black text-slate-800">Kunlik foyda grafigi</h3>
              <p className="text-xs font-medium text-slate-400">
                Tanlangan davr bo'yicha foyda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period total badge */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Jami:&nbsp;
              </span>
              <span className="text-sm font-black tabular-nums text-emerald-700">
                {fmt(periodTotals)} UZS
              </span>
            </div>

            {/* Period toggle */}
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
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
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="rounded-[20px] border border-slate-100 bg-slate-50/60 p-4">
          {!hasData ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Bu davr uchun foyda ma'lumoti topilmadi
            </div>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-full w-full">
                  <defs>
                    <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                      <stop offset="85%" stopColor="#10b981" stopOpacity="0.03" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="profitLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = PAD_TOP + (USABLE_H / 4) * i;
                    return (
                      <line
                        key={i}
                        x1={PAD_X}
                        x2={SVG_W - PAD_X}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Area fill */}
                  {svgData.areaStr && (
                    <path d={svgData.areaStr} fill="url(#profitAreaGrad)" />
                  )}

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="url(#profitLineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgData.lineStr}
                  />

                  {/* Dots */}
                  {svgData.pts.map((pt) => (
                    <g key={pt.key}>
                      <circle cx={pt.x} cy={pt.y} r={5} fill="#fff" />
                      <circle cx={pt.x} cy={pt.y} r={3} fill="#10b981" />
                    </g>
                  ))}
                </svg>
              </div>

              {/* X-axis labels */}
              <div
                className="mt-3 grid gap-1 text-center"
                style={{
                  gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`
                }}
              >
                {chartData.map((item) => (
                  <div key={item.key}>
                    <div className="text-[11px] font-black text-slate-700">{item.label}</div>
                    <div className="mt-0.5 text-[9px] font-bold text-slate-400">
                      {fmt(item.profit)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Peak info */}
        {hasData && (
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
