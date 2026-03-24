import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Loader2,
  Landmark,
  Banknote,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  CreditCard,
  CircleDollarSign
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const CashTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [cashboxes, setCashboxes] = useState([]);
  const [chart, setChart] = useState([]);
  const [today, setToday] = useState({
    paymentsAmount: 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setCashboxes(Array.isArray(data?.cashboxes) ? data.cashboxes : []);
        setChart(Array.isArray(data?.chart) ? data.chart : []);
        setToday(data?.today || { paymentsAmount: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const analytics = useMemo(() => {
    const totalBalance = cashboxes.reduce(
      (sum, cashbox) => sum + Number(cashbox.balance || 0),
      0
    );

    const activeCashboxes = cashboxes.filter((cashbox) => cashbox.isActive);
    const inactiveCashboxes = cashboxes.filter((cashbox) => !cashbox.isActive);

    const maxBalance = Math.max(
      ...cashboxes.map((cashbox) => Number(cashbox.balance || 0)),
      0
    );

    const totalWeeklyPayments = chart.reduce(
      (sum, item) => sum + Number(item.payments || 0),
      0
    );

    const maxChartValue = Math.max(
      ...chart.map((item) => Number(item.payments || 0)),
      0
    );

    return {
      totalBalance,
      activeCount: activeCashboxes.length,
      inactiveCount: inactiveCashboxes.length,
      maxBalance,
      totalWeeklyPayments,
      maxChartValue
    };
  }, [cashboxes, chart]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-50 blur-2xl opacity-80" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-green-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Kassa</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Kassalar holati, balans va tushum statistikasi
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Faol kassalar soni:{" "}
              <span className="font-black text-slate-800">
                {analytics.activeCount} ta
              </span>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Umumiy balans
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-400">
              {formatMoney(analytics.totalBalance)}{" "}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CircleDollarSign size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Balans
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.totalBalance)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Barcha kassalardagi umumiy mablag‘
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Landmark size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Faol
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.activeCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Hozir ishlayotgan kassalar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Nofaol
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.inactiveCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Hozir yopiq yoki ishlamayotgan kassalar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <CalendarDays size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Bugun
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(today.paymentsAmount || 0)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bugun kassaga tushgan to‘lovlar
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-emerald-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">
              So‘nggi 7 kunlik tushum
            </h3>
          </div>

          {chart.length === 0 ? (
            <div className="text-slate-400 text-sm">
              To‘lov grafigi uchun ma’lumot topilmadi
            </div>
          ) : (
            <div className="space-y-4">
              {chart.map((item) => {
                const value = Number(item.payments || 0);
                const percent = analytics.maxChartValue
                  ? Math.max(6, (value / analytics.maxChartValue) * 100)
                  : 0;

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-16 shrink-0 text-sm font-black text-slate-700">
                        {item.name}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                          <span>Tushum</span>
                          <span>{formatMoney(value)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                            style={{ width: `${percent}%` }}
                          />
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
            <Banknote className="text-emerald-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">
              Kassalar balansi
            </h3>
          </div>

          {cashboxes.length === 0 ? (
            <div className="text-slate-400 text-sm">Kassalar topilmadi</div>
          ) : (
            <div className="space-y-4">
              {cashboxes.map((cashbox, index) => {
                const balance = Number(cashbox.balance || 0);
                const percent = analytics.maxBalance
                  ? Math.max(8, (balance / analytics.maxBalance) * 100)
                  : 0;

                return (
                  <div key={cashbox.id || index} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <p className="font-bold text-slate-700 leading-snug break-words">
                            {cashbox.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 ml-8">
                          {cashbox.currency || "UZS"} •{" "}
                          {cashbox.isActive ? "Faol" : "Nofaol"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-800">
                          {formatMoney(balance)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold">
                          {cashbox.currency || "UZS"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cashbox.isActive
                            ? "bg-gradient-to-r from-emerald-400 to-green-500"
                            : "bg-gradient-to-r from-slate-300 to-slate-400"
                        }`}
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
            <h3 className="text-lg font-black text-slate-800">
              Kassalar ro‘yxati
            </h3>
            <p className="text-sm text-slate-400 font-medium">
              Har bir kassa bo‘yicha joriy balans va holat
            </p>
          </div>

          <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
            Ko‘proq
            <ChevronRight size={16} />
          </div>
        </div>

        {cashboxes.length === 0 ? (
          <div className="p-10 text-slate-400">Kassalar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <tr>
                  <th className="p-4">Kassa nomi</th>
                  <th className="p-4">Valyuta</th>
                  <th className="p-4">Holati</th>
                  <th className="p-4 text-right">Balans</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {cashboxes.map((cashbox) => (
                  <tr key={cashbox.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 min-w-[260px]">
                      <div className="font-black text-slate-800 break-words">
                        {cashbox.name}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      {cashbox.currency || "UZS"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-black ${
                          cashbox.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {cashbox.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>

                    <td className="p-4 text-right font-black text-emerald-600">
                      {formatMoney(cashbox.balance)}{" "}
                      <span className="text-[10px] text-slate-400">
                        {cashbox.currency || "UZS"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
              Haftalik tushum
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatMoney(analytics.totalWeeklyPayments)}
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">
              Oxirgi 7 kun ichida kassaga tushgan jami mablag‘
            </div>
          </div>

          <div className="p-6">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-2">
              Bugungi tushum
            </div>
            <div className="text-3xl font-black text-blue-600 tracking-tight">
              {formatMoney(today.paymentsAmount || 0)}
            </div>
            <div className="text-sm text-slate-400 font-medium mt-1">
              Bugun olingan to‘lovlar bo‘yicha jami tushum
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashTab;