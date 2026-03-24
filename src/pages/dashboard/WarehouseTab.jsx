import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  Loader2,
  Boxes,
  AlertTriangle,
  Warehouse,
  ChevronRight,
  ShieldAlert,
  Archive
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) => Number(value || 0).toLocaleString("uz-UZ");

const WarehouseTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setInventoryValue(Number(data?.stats?.inventoryValue || 0));
        setProductCount(Number(data?.stats?.productCount || 0));
        setLowStockProducts(Array.isArray(data?.lowStockProducts) ? data.lowStockProducts : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const analytics = useMemo(() => {
    const criticalProducts = lowStockProducts.filter(
      (item) => Number(item.quantity || 0) <= 1
    );

    const warningProducts = lowStockProducts.filter(
      (item) => Number(item.quantity || 0) > 1 && Number(item.quantity || 0) <= 3
    );

    const totalLowStockQty = lowStockProducts.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    const maxQty = Math.max(...lowStockProducts.map((i) => Number(i.quantity || 0)), 0);

    return {
      criticalCount: criticalProducts.length,
      warningCount: warningProducts.length,
      totalLowStockQty,
      maxQty
    };
  }, [lowStockProducts]);

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
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-indigo-50 blur-2xl opacity-70" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                <Warehouse size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Ombor</h2>
                <p className="text-sm text-slate-400 font-medium">
                  Ombor holati, qoldiq va xavfli mahsulotlar nazorati
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              Tizimdagi mahsulotlar soni:{" "}
              <span className="font-black text-slate-800">{productCount} ta</span>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-black mb-1">
              Ombor qiymati
            </div>
            <div className="text-2xl font-black tracking-tight text-blue-400">
              {formatMoney(inventoryValue)}{" "}
              <span className="text-sm text-slate-400">UZS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Boxes size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Mahsulotlar
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {productCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Ombordagi umumiy tovar turlari
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Kam qoldiq
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {lowStockProducts.length}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Tez tugab qolishi mumkin bo‘lgan mahsulotlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Kritik
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.criticalCount}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            1 dona yoki undan kam qolgan mahsulotlar
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Archive size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              Qoldiq jami
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {analytics.totalLowStockQty}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Kam qoldiqdagi mahsulotlar umumiy soni
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-blue-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">Kam qoldiq bo‘yicha reyting</h3>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-slate-400 text-sm">Kam qoldiqdagi mahsulot topilmadi</div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.slice(0, 6).map((item, index) => {
                const qty = Number(item.quantity || 0);
                const percent = analytics.maxQty
                  ? Math.max(10, (qty / analytics.maxQty) * 100)
                  : 0;

                return (
                  <div key={item.id} className="space-y-2">
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
                        <p
                          className={`font-black ${
                            qty <= 1 ? "text-red-600" : "text-amber-500"
                          }`}
                        >
                          {qty} ta
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          qty <= 1
                            ? "bg-gradient-to-r from-red-400 to-rose-500"
                            : "bg-gradient-to-r from-amber-400 to-orange-500"
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

        <div className="xl:col-span-3 bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-amber-500" size={22} />
            <h3 className="text-lg font-black text-slate-800">Diqqat talab qiladigan mahsulotlar</h3>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-slate-400 text-sm">Hozircha xavfli qoldiq yo‘q</div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 6).map((item) => {
                const qty = Number(item.quantity || 0);
                const isCritical = qty <= 1;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-black text-slate-800 break-words">{item.name}</p>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black ${
                            isCritical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {isCritical ? "Kritik" : "Ogohlantirish"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold flex-wrap">
                        <span>ID: #{item.customId ?? "-"}</span>
                        <span>•</span>
                        <span>Sotuv narxi: {formatMoney(item.salePrice)} UZS</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-base ${
                          isCritical ? "text-red-600" : "text-amber-500"
                        }`}
                      >
                        {qty} ta
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold">qoldiq</div>
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
            <h3 className="text-lg font-black text-slate-800">Kam qoldiqdagi mahsulotlar ro‘yxati</h3>
            <p className="text-sm text-slate-400 font-medium">
              Omborda tez tugab qolishi mumkin bo‘lgan mahsulotlar
            </p>
          </div>

          <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
            Ko‘proq
            <ChevronRight size={16} />
          </div>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-10 text-slate-400">Mahsulotlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400 font-black">
                <tr>
                  <th className="p-4">Mahsulot</th>
                  <th className="p-4">Kod</th>
                  <th className="p-4">Holati</th>
                  <th className="p-4 text-right">Qoldiq</th>
                  <th className="p-4 text-right">Sotuv narxi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {lowStockProducts.map((item) => {
                  const qty = Number(item.quantity || 0);
                  const isCritical = qty <= 1;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 min-w-[280px]">
                        <div className="font-black text-slate-800 break-words">
                          {item.name}
                        </div>
                      </td>

                      <td className="p-4 text-slate-500 font-mono">
                        #{item.customId ?? "-"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-black ${
                            isCritical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {isCritical ? "Kritik qoldiq" : "Kam qoldiq"}
                        </span>
                      </td>

                      <td
                        className={`p-4 text-right font-black ${
                          isCritical ? "text-red-600" : "text-amber-500"
                        }`}
                      >
                        {qty} ta
                      </td>

                      <td className="p-4 text-right font-black text-slate-800">
                        {formatMoney(item.salePrice)}{" "}
                        <span className="text-[10px] text-slate-400">UZS</span>
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

export default WarehouseTab;