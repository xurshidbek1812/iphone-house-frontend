import React, { useEffect, useMemo, useState } from 'react';
import { Package, Archive, AlertTriangle, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const WarehouseCard = ({ title, value, icon, color = 'blue', suffix = 'UZS' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100'
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${colorMap[color]}`}>
          {suffix}
        </span>
      </div>

      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-black text-slate-800">
        {typeof value === 'number' ? formatMoney(value) : value}
      </h3>
    </div>
  );
};

const WarehouseTab = () => {
  const token = sessionStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Dashboard yuklanmadi');
        }

        setDashboard(data);
      } catch (error) {
        console.error('WarehouseTab xatosi:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const lowStockProducts = useMemo(() => dashboard?.lowStockProducts || [], [dashboard]);

  const zeroStockCount = useMemo(() => {
    return lowStockProducts.filter((p) => Number(p.quantity || 0) <= 0).length;
  }, [lowStockProducts]);

  if (loading) {
    return (
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm h-[420px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={38} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WarehouseCard
          title="Ombor qiymati"
          value={Number(dashboard?.stats?.inventoryValue || 0)}
          icon={<Package size={22} strokeWidth={2.5} />}
          color="blue"
          suffix="UZS"
        />
        <WarehouseCard
          title="Kam qoldiqli tovarlar"
          value={lowStockProducts.length}
          icon={<AlertTriangle size={22} strokeWidth={2.5} />}
          color="amber"
          suffix="ta"
        />
        <WarehouseCard
          title="0 qoldiqli tovarlar"
          value={zeroStockCount}
          icon={<Archive size={22} strokeWidth={2.5} />}
          color="violet"
          suffix="ta"
        />
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Kam qoldiqli mahsulotlar</h2>
          <p className="text-slate-400 font-medium mt-1">Tez orada tugab qolishi mumkin bo‘lgan tovarlar</p>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="text-slate-400 font-bold text-sm">Kam qoldiqli mahsulotlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="p-4 font-black">Kod</th>
                  <th className="p-4 font-black">Nomi</th>
                  <th className="p-4 font-black text-center">Qoldiq</th>
                  <th className="p-4 font-black text-right">Narxi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{product.customId || product.id}</td>
                    <td className="p-4">{product.name}</td>
                    <td className={`p-4 text-center ${Number(product.quantity) <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {Number(product.quantity || 0)}
                    </td>
                    <td className="p-4 text-right text-emerald-600">
                      {formatMoney(product.salePrice)} UZS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseTab;