import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Loader2,
  TrendingUp,
  Package,
  BarChart3,
  ChevronRight,
  Receipt,
  Banknote
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const SalesTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState({
    salesAmount: 0,
    contractsAmount: 0,
    paymentsAmount: 0,
    contractsCount: 0
  });
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setToday(data?.today || {});
        setChart(Array.isArray(data?.chart) ? data.chart : []);
        setTopProducts(Array.isArray(data?.topProducts) ? data.topProducts : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const analytics = useMemo(() => {
    const totalWeeklySales = chart.reduce(
      (sum, item) => sum + Number(item.sales || 0),
      0
    );

    const totalWeeklyContracts = chart.reduce(
      (sum, item) => sum + Number(item.contracts || 0),
      0
    );

    const totalWeeklyPayments = chart.reduce(
      (sum, item) => sum + Number(item.payments || 0),
      0
    );

    const maxChartValue = Math.max(
      ...chart.map((item) =>
        Math.max(
          Number(item.sales || 0),
          Number(item.contracts || 0),
          Number(item.payments || 0)
        )
      ),
      0
    );

    const topProductsTotal = topProducts.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    const topProductMax = Math.max(
      ...topProducts.map((item) => Number(item.quantity || 0)),
      0
    );

    return {
      totalWeeklySales,
      totalWeeklyContracts,
      totalWeeklyPayments,
      maxChartValue,
      topProductsTotal,
      topProductMax
    };
  }, [chart, topProducts]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-blue-50 blur-2xl opacity-80" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-cyan-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Savdo</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Savdo, to‘lov va faol mahsulotlar statistikasi
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Bugungi to‘lovlar:{" "}
              <span className="font-black text-slate-800">
                {formatMoney(today.paymentsAmount)} UZS
              </span>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Bugungi savdo
            </div>
            <div className="text-2xl font-black tracking-tight text-blue-400">
              {formatMoney(today.salesAmount)}{" "}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Bugun
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(today.salesAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugungi yakunlangan savdolar summasi
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Banknote size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              To‘lov
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(today.paymentsAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugun tushgan real to‘lovlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Receipt size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Nasiya
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(today.contractsAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugungi nasiya shartnomalari summasi
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Package size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Shartnomalar
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {today.contractsCount || 0}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugun ochilgan shartnomalar soni
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-blue-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">So‘nggi 7 kunlik harakat</h3>
          </div>

          {chart.length === 0 ? (
            <div className="text-slate-400 text-sm">Grafik uchun ma’lumot topilmadi</div>
          ) : (
            <div className="space-y-5">
              {chart.map((item) => {
                const sales = Number(item.sales || 0);
                const contracts = Number(item.contracts || 0);
                const payments = Number(item.payments || 0);

                const salesPercent = analytics.maxChartValue
                  ? Math.max(6, (sales / analytics.maxChartValue) * 100)
                  : 0;

                const contractsPercent = analytics.maxChartValue
                  ? Math.max(6, (contracts / analytics.maxChartValue) * 100)
                  : 0;

                const paymentsPercent = analytics.maxChartValue
                  ? Math.max(6, (payments / analytics.maxChartValue) * 100)
                  : 0;

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-16 shrink-0 text-sm font-black text-slate-700">
                        {item.name}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>Savdo</span>
                            <span>{formatMoney(sales)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"
                              style={{ width: `${salesPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>Nasiya</span>
                            <span>{formatMoney(contracts)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
                              style={{ width: `${contractsPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>To‘lov</span>
                            <span>{formatMoney(payments)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                              style={{ width: `${paymentsPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-amber-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">Top mahsulotlar</h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-slate-400 text-sm">Sotuv bo‘yicha mahsulot topilmadi</div>
          ) : (
            <div className="space-y-4">
              {topProducts.slice(0, 6).map((item, index) => {
                const qty = Number(item.quantity || 0);
                const percent = analytics.topProductMax
                  ? Math.max(8, (qty / analytics.topProductMax) * 100)
                  : 0;

                return (
                  <div key={`${item.productId}-${index}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <p className="font-bold text-slate-700 leading-snug break-words">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 ml-8">
                          ID: #{item.customId ?? "-"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-800">{qty} ta</p>
                        <p className="text-[11px] text-slate-400 font-bold">
                          {formatMoney(item.totalAmount)} UZS
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">Haftalik ko‘rsatkichlar</h3>
            <p className="text-sm text-slate-400 font-medium">
              Oxirgi 7 kun bo‘yicha umumiy natijalar
            </p>
          </div>

          <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
            Ko‘proq
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
              Haftalik savdo
            </div>
            <div className="text-3xl font-black text-blue-600 tracking-tight">
              {formatMoney(analytics.totalWeeklySales)}
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">
              Yakunlangan savdolar bo‘yicha umumiy summa
            </div>
          </div>

          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
              Haftalik nasiya
            </div>
            <div className="text-3xl font-black text-indigo-600 tracking-tight">
              {formatMoney(analytics.totalWeeklyContracts)}
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">
              Ochilgan shartnomalar bo‘yicha umumiy summa
            </div>
          </div>

          <div className="p-6">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
              Haftalik to‘lov
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatMoney(analytics.totalWeeklyPayments)}
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">
              Tushgan to‘lovlar bo‘yicha umumiy summa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTab;