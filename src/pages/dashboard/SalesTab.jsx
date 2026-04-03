import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Loader2,
  TrendingUp,
  CalendarRange,
  LineChart as LineChartIcon
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const periodOptions = [
  { key: "weekly", label: "Haftalik", days: 7 },
  { key: "monthly", label: "Oylik", days: 30 }
];

const SalesTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");

  const [today, setToday] = useState({
    salesAmount: 0
  });

  const [chart, setChart] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setToday(data?.today || {});
        setChart(Array.isArray(data?.chart) ? data.chart : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const chartData = useMemo(() => {
    const selected = periodOptions.find((p) => p.key === period);
    const daysCount = selected?.days || 7;

    const raw = Array.isArray(chart) ? chart : [];
    const tail = raw.slice(-daysCount);

    return tail.map((item, index) => {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() - (tail.length - 1 - index));

      const parsedDate =
        item?.date || item?.createdAt || item?.day
          ? new Date(item.date || item.createdAt || item.day)
          : fallbackDate;

      const safeDate = Number.isNaN(parsedDate.getTime()) ? fallbackDate : parsedDate;

      return {
        key: `${period}-${index}`,
        label: safeDate.toLocaleDateString("uz-UZ", {
          day: "2-digit",
          month: "2-digit"
        }),
        sales: Number(item?.sales || 0)
      };
    });
  }, [chart, period]);

  const analytics = useMemo(() => {
    const totalSales = chartData.reduce((sum, item) => sum + Number(item.sales || 0), 0);
    const averageSales = chartData.length ? totalSales / chartData.length : 0;
    const maxSales = Math.max(...chartData.map((item) => Number(item.sales || 0)), 0);

    return {
      totalSales,
      averageSales,
      maxSales
    };
  }, [chartData]);

  const linePoints = useMemo(() => {
    if (!chartData.length || analytics.maxSales === 0) return "";

    const width = 1000;
    const height = 260;
    const paddingX = 28;
    const paddingTop = 18;
    const paddingBottom = 28;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingTop - paddingBottom;

    return chartData
      .map((item, index) => {
        const x =
          chartData.length === 1
            ? width / 2
            : paddingX + (usableWidth * index) / (chartData.length - 1);

        const y =
          paddingTop +
          usableHeight -
          (Number(item.sales || 0) / analytics.maxSales) * usableHeight;

        return `${x},${y}`;
      })
      .join(" ");
  }, [chartData, analytics.maxSales]);

  const pointPositions = useMemo(() => {
    if (!chartData.length || analytics.maxSales === 0) return [];

    const width = 1000;
    const height = 260;
    const paddingX = 28;
    const paddingTop = 18;
    const paddingBottom = 28;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingTop - paddingBottom;

    return chartData.map((item, index) => {
      const x =
        chartData.length === 1
          ? width / 2
          : paddingX + (usableWidth * index) / (chartData.length - 1);

      const y =
        paddingTop +
        usableHeight -
        (Number(item.sales || 0) / analytics.maxSales) * usableHeight;

      return {
        ...item,
        x,
        y
      };
    });
  }, [chartData, analytics.maxSales]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm px-5 py-4 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-blue-50 blur-2xl opacity-80" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-cyan-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Savdo</h2>
                <p className="text-xs text-slate-400 font-medium">
                  Faqat sotuv statistikasi
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Bugungi savdo:{" "}
              <span className="font-black text-slate-800">
                {formatMoney(today.salesAmount)} UZS
              </span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Bugungi natija
            </div>
            <div className="text-xl font-black tracking-tight text-blue-400">
              {formatMoney(today.salesAmount)}{" "}
              <span className="text-xs text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Jami
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.totalSales)}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            Tanlangan davrdagi umumiy savdo
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CalendarRange size={18} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              O‘rtacha
            </span>
          </div>
          <div className="text-xl font-black text-slate-800 tracking-tight">
            {formatMoney(Math.round(analytics.averageSales))}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            Tanlangan davrdagi kunlik o‘rtacha savdo
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <LineChartIcon className="text-blue-500" size={20} />
            <div>
              <h3 className="text-base font-black text-slate-800">Savdo grafigi</h3>
              <p className="text-xs text-slate-400 font-medium">
                Haftalik va oylik sotuv ko‘rinishi
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {periodOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPeriod(option.key)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  period === option.key
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-slate-400 text-sm">Grafik uchun ma’lumot topilmadi</div>
        ) : analytics.maxSales === 0 ? (
          <div className="text-slate-400 text-sm">Savdo ma’lumoti topilmadi</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="h-[300px] w-full">
                <svg viewBox="0 0 1000 260" className="w-full h-full">
                  <defs>
                    <linearGradient id="salesLineGradient" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = 18 + (214 / 4) * i;
                    return (
                      <line
                        key={i}
                        x1="28"
                        x2="972"
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  <polyline
                    fill="none"
                    stroke="url(#salesLineGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />

                  {pointPositions.map((point) => (
                    <g key={point.key}>
                      <circle cx={point.x} cy={point.y} r="6" fill="#ffffff" />
                      <circle cx={point.x} cy={point.y} r="4" fill="#2563eb" />
                    </g>
                  ))}
                </svg>
              </div>

              <div
                className="mt-3 grid gap-2 text-center"
                style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
              >
                {chartData.map((item) => (
                  <div key={item.key}>
                    <div className="text-[11px] font-black text-slate-700">{item.label}</div>
                    <div className="mt-1 text-[10px] font-bold text-slate-400">
                      {formatMoney(item.sales)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">
                Eng yuqori nuqta
              </div>
              <div className="text-sm font-black text-blue-600">
                {formatMoney(analytics.maxSales)} UZS
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTab;