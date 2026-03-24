import React, { useEffect, useMemo, useState } from "react";
import {
  HandCoins,
  Loader2,
  Phone,
  AlertTriangle,
  Wallet,
  ChevronRight,
  UserRound,
  BadgeDollarSign
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const CollectionTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        setContracts(Array.isArray(data?.pendingContracts) ? data.pendingContracts : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const analytics = useMemo(() => {
    const totalDebt = contracts.reduce(
      (sum, item) => sum + Number(item.debtAmount || 0),
      0
    );

    const criticalContracts = contracts.filter(
      (item) => Number(item.debtAmount || 0) >= 10_000_000
    );

    const withPhone = contracts.filter(
      (item) => item.customer?.phones?.[0]?.phone
    );

    const sortedByDebt = [...contracts]
      .sort((a, b) => Number(b.debtAmount || 0) - Number(a.debtAmount || 0))
      .slice(0, 6);

    const maxDebt = Math.max(
      ...contracts.map((item) => Number(item.debtAmount || 0)),
      0
    );

    return {
      totalDebt,
      criticalCount: criticalContracts.length,
      withPhoneCount: withPhone.length,
      sortedByDebt,
      maxDebt
    };
  }, [contracts]);

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
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <HandCoins size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Undiruv</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Qarzdor mijozlar va undirilishi kerak bo‘lgan summalar
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Faol qarzdorlikdagi shartnomalar:{" "}
              <span className="font-black text-slate-800">
                {contracts.length} ta
              </span>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Umumiy qarzdorlik
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-400">
              {formatMoney(analytics.totalDebt)}{" "}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgeDollarSign size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Jami qarz
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatMoney(analytics.totalDebt)}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Barcha qarzdor shartnomalar summasi
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserRound size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Shartnomalar
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {contracts.length}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            To‘lov kutilayotgan shartnomalar soni
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Katta qarz
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.criticalCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            10 mln va undan katta qarzdorlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Phone size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Telefon bor
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.withPhoneCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Bog‘lanish mumkin bo‘lgan mijozlar
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-emerald-600" size={22} />
            <h3 className="text-lg font-black text-slate-800">
              Eng katta qarzdorlar
            </h3>
          </div>

          {analytics.sortedByDebt.length === 0 ? (
            <div className="text-slate-400 text-sm">Qarzlar yo‘q</div>
          ) : (
            <div className="space-y-4">
              {analytics.sortedByDebt.map((item, index) => {
                const debt = Number(item.debtAmount || 0);
                const percent = analytics.maxDebt
                  ? Math.max(8, (debt / analytics.maxDebt) * 100)
                  : 0;

                const customerName =
                  `${item.customer?.firstName || ""} ${item.customer?.lastName || ""}`.trim() ||
                  "Noma'lum mijoz";

                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <p className="font-bold text-slate-700 leading-snug break-words">
                            {customerName}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 ml-8">
                          {item.contractNumber}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-rose-600">
                          {formatMoney(debt)}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold">UZS</p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500"
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
            <HandCoins className="text-emerald-600" size={22} />
            <h3 className="text-lg font-black text-slate-800">
              Undiruv ro‘yxati
            </h3>
          </div>

          {contracts.length === 0 ? (
            <div className="text-slate-400 text-sm">Qarzlar yo‘q</div>
          ) : (
            <div className="space-y-3">
              {contracts.slice(0, 6).map((c) => {
                const debt = Number(c.debtAmount || 0);
                const customerName =
                  `${c.customer?.firstName || ""} ${c.customer?.lastName || ""}`.trim() ||
                  "Noma'lum mijoz";

                const phone = c.customer?.phones?.[0]?.phone || "-";
                const isCritical = debt >= 10_000_000;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-black text-slate-800 break-words">
                          {customerName}
                        </p>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black ${
                            isCritical
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isCritical ? "Katta qarz" : "Undiruv"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold flex-wrap">
                        <span>{c.contractNumber}</span>
                        <span>•</span>
                        <span>{phone}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-rose-600 text-base">
                        {formatMoney(debt)}
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
              Qarzdor shartnomalar bo‘yicha to‘liq ma’lumot
            </p>
          </div>

          <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
            Ko‘proq
            <ChevronRight size={16} />
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="p-10 text-slate-400">Qarzlar yo‘q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <tr>
                  <th className="p-4">Shartnoma</th>
                  <th className="p-4">Mijoz</th>
                  <th className="p-4">Telefon</th>
                  <th className="p-4 text-right">Qarz</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {contracts.map((c) => {
                  const debt = Number(c.debtAmount || 0);
                  const isCritical = debt >= 10_000_000;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-slate-800">
                          {c.contractNumber}
                        </div>
                      </td>

                      <td className="p-4 min-w-[220px]">
                        <div className="font-bold text-slate-700 break-words">
                          {c.customer?.firstName} {c.customer?.lastName}
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">
                        {c.customer?.phones?.[0]?.phone || "-"}
                      </td>

                      <td className="p-4 text-right">
                        <span
                          className={`font-black ${
                            isCritical ? "text-rose-600" : "text-red-500"
                          }`}
                        >
                          {formatMoney(debt)}{" "}
                          <span className="text-[10px] text-slate-400">UZS</span>
                        </span>
                      </td>
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

export default CollectionTab;