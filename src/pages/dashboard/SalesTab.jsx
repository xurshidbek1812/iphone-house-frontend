import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  CreditCard,
  Package,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const formatLargeNumber = (num) => {
  const value = Number(num || 0);
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)} mlrd`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)} mln`;
  return value.toLocaleString('uz-UZ');
};

const SalesStatCard = ({ title, value, unit = 'UZS', icon, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${colorMap[color]}`}>
          {unit}
        </span>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-black text-slate-800">
          {typeof value === 'number' ? formatLargeNumber(value) : value}
        </h3>
      </div>
    </div>
  );
};

const SalesTab = () => {
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
        console.error('SalesTab xatosi:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const chartData = useMemo(() => {
    if (!dashboard?.chart) return [];
    return dashboard.chart.map((item) => ({
      name: item.name,
      savdo: Number(item.sales || 0),
      shartnoma: Number(item.contracts || 0),
      tolov: Number(item.payments || 0)
    }));
  }, [dashboard]);

  const topProducts = useMemo(() => {
    return dashboard?.topProducts || [];
  }, [dashboard]);

  if (loading) {
    return (
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm h-[420px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={38} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <SalesStatCard
          title="Bugungi savdo"
          value={Number(dashboard?.today?.salesAmount || 0)}
          icon={<ShoppingCart size={22} strokeWidth={2.5} />}
          color="blue"
        />
        <SalesStatCard
          title="Bugungi shartnomalar"
          value={Number(dashboard?.today?.contractsAmount || 0)}
          icon={<Receipt size={22} strokeWidth={2.5} />}
          color="violet"
        />
        <SalesStatCard
          title="Bugungi to'lovlar"
          value={Number(dashboard?.today?.paymentsAmount || 0)}
          icon={<CreditCard size={22} strokeWidth={2.5} />}
          color="emerald"
        />
        <SalesStatCard
          title="Mahsulot turi"
          value={Number(dashboard?.stats?.productCount || 0)}
          unit="ta"
          icon={<Package size={22} strokeWidth={2.5} />}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Savdo tahlili</h2>
          <p className="text-slate-400 font-medium mt-1">So‘nggi 7 kunlik savdo, shartnoma va to‘lovlar</p>
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
              />

              <Area type="monotone" dataKey="savdo" stroke="#3b82f6" strokeWidth={3} fill="url(#salesBlue)" />
              <Area type="monotone" dataKey="shartnoma" stroke="#8b5cf6" strokeWidth={3} fill="url(#salesViolet)" />
              <Area type="monotone" dataKey="tolov" stroke="#10b981" strokeWidth={3} fill="url(#salesGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Top mahsulotlar</h2>
          <p className="text-slate-400 font-medium mt-1">Eng ko‘p sotilgan mahsulotlar</p>
        </div>

        {topProducts.length === 0 ? (
          <div className="text-slate-400 font-bold text-sm">Hozircha ma’lumot yo‘q</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="p-4 font-black">Kod</th>
                  <th className="p-4 font-black">Nomi</th>
                  <th className="p-4 font-black text-center">Soni</th>
                  <th className="p-4 font-black text-right">Summasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {topProducts.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{item.customId || '-'}</td>
                    <td className="p-4">{item.name}</td>
                    <td className="p-4 text-center text-blue-600">{item.quantity}</td>
                    <td className="p-4 text-right text-emerald-600">
                      {formatMoney(item.totalAmount)} UZS
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

export default SalesTab;