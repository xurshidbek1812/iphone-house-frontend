import React, { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  Loader2,
  TrendingDown,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Wallet,
  ChevronRight
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("uz-UZ");
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("uz-UZ");
};

const ExpensesTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const analytics = useMemo(() => {
    const todayStr = new Date().toDateString();

    const totalAmount = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const approved = expenses.filter(
      (item) => String(item.status || "").toLowerCase() === "tasdiqlandi"
    );

    const pending = expenses.filter(
      (item) => String(item.status || "").toLowerCase() === "jarayonda"
    );

    const todayExpenses = expenses.filter(
      (item) => new Date(item.createdAt).toDateString() === todayStr
    );

    const approvedAmount = approved.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const pendingAmount = pending.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const todayAmount = todayExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const grouped = {};
    for (const item of expenses) {
      const key = item.name || "Noma'lum xarajat";
      grouped[key] = (grouped[key] || 0) + Number(item.amount || 0);
    }

    const topCategories = Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const maxCategoryAmount = topCategories[0]?.amount || 0;

    return {
      totalAmount,
      approvedAmount,
      pendingAmount,
      todayAmount,
      approvedCount: approved.length,
      pendingCount: pending.length,
      todayCount: todayExpenses.length,
      topCategories,
      maxCategoryAmount
    };
  }, [expenses]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-red-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-red-50 blur-2xl opacity-80" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-rose-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                <Receipt size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Xarajatlar</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Xarajatlar statistikasi va so‘nggi harakatlar
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Jami yozuvlar soni:{" "}
              <span className="font-black text-slate-800">{expenses.length} ta</span>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Umumiy xarajat
            </div>
            <div className="text-2xl font-black tracking-tight text-red-400">
              {formatMoney(analytics.totalAmount)}{" "}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <TrendingDown size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Jami
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.totalAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">Barcha xarajatlar summasi</div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Tasdiqlangan
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.approvedAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            {analytics.approvedCount} ta tasdiqlangan xarajat
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock3 size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Jarayonda
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.pendingAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            {analytics.pendingCount} ta kutayotgan xarajat
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
            {formatMoney(analytics.todayAmount)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            {analytics.todayCount} ta bugungi xarajat
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-red-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">Eng katta xarajat yo‘nalishlari</h3>
          </div>

          {analytics.topCategories.length === 0 ? (
            <div className="text-slate-400 text-sm">Ma’lumot topilmadi</div>
          ) : (
            <div className="space-y-4">
              {analytics.topCategories.map((item, index) => {
                const percent = analytics.maxCategoryAmount
                  ? Math.max(8, (item.amount / analytics.maxCategoryAmount) * 100)
                  : 0;

                return (
                  <div key={item.name} className="space-y-2">
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
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-800">
                          {formatMoney(item.amount)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold">UZS</p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-3 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="text-slate-700" size={22} />
            <h3 className="text-lg font-black text-slate-800">So‘nggi xarajatlar</h3>
          </div>

          {expenses.length === 0 ? (
            <div className="text-slate-400 text-sm">Xarajatlar topilmadi</div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 6).map((exp) => {
                const isApproved =
                  String(exp.status || "").toLowerCase() === "tasdiqlandi";

                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-800 break-words">
                          {exp.name || "Xarajat"}
                        </p>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {exp.status || "Jarayonda"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold flex-wrap">
                        <span>{exp.user?.fullName || exp.user?.username || "Noma'lum"}</span>
                        <span>•</span>
                        <span>{formatDateTime(exp.createdAt)}</span>
                        {exp.cashbox?.name ? (
                          <>
                            <span>•</span>
                            <span>{exp.cashbox.name}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-red-600 text-base">
                        {formatMoney(exp.amount)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold">UZS</div>
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
            <h3 className="text-lg font-black text-slate-800">Batafsil ro‘yxat</h3>
            <p className="text-sm text-slate-400 font-medium">
              Xarajatlar bo‘yicha batafsil ma’lumot
            </p>
          </div>

          <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
            Ko‘proq
            <ChevronRight size={16} />
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="p-10 text-slate-400">Xarajatlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <tr>
                  <th className="p-4">Xarajat moddasi</th>
                  <th className="p-4">Kassa</th>
                  <th className="p-4">Yaratgan</th>
                  <th className="p-4">Holati</th>
                  <th className="p-4 text-right">Summa</th>
                  <th className="p-4">Sana</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {expenses.map((exp) => {
                  const isApproved =
                    String(exp.status || "").toLowerCase() === "tasdiqlandi";

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 min-w-[260px]">
                        <div className="font-black text-slate-800 break-words">
                          {exp.name || "Xarajat"}
                        </div>
                        <div
                          className="text-xs text-slate-400 mt-1 break-words max-w-[320px]"
                          title={exp.note || "-"}
                        >
                          {exp.note || "-"}
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">
                        {exp.cashbox?.name || "-"}
                      </td>

                      <td className="p-4 text-slate-600">
                        {exp.user?.fullName || exp.user?.username || "-"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-black ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {exp.status || "Jarayonda"}
                        </span>
                      </td>

                      <td className="p-4 text-right font-black text-red-600">
                        {formatMoney(exp.amount)}{" "}
                        <span className="text-[10px] text-slate-400">UZS</span>
                      </td>

                      <td className="p-4 text-slate-500">{formatDate(exp.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesTab;