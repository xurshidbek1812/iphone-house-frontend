import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const CashCard = ({ title, value, icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>

      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-black text-slate-800">
        {formatMoney(value)} UZS
      </h3>
    </div>
  );
};

const CashTab = () => {
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
        console.error('CashTab xatosi:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const cashboxes = useMemo(() => dashboard?.cashboxes || [], [dashboard]);

  const chartData = useMemo(() => {
    if (!dashboard?.chart) return [];
    return dashboard.chart.map((item) => ({
      name: item.name,
      tushum: Number(item.payments || 0)
    }));
  }, [dashboard]);

  const totalCash = useMemo(() => {
    return cashboxes.reduce((sum, box) => sum + Number(box.balance || 0), 0);
  }, [cashboxes]);

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
        <CashCard
          title="Jami kassa qoldig‘i"
          value={totalCash}
          icon={<Wallet size={22} strokeWidth={2.5} />}
          color="emerald"
        />
        <CashCard
          title="Bugungi tushum"
          value={Number(dashboard?.today?.paymentsAmount || 0)}
          icon={<ArrowDownCircle size={22} strokeWidth={2.5} />}
          color="blue"
        />
        <CashCard
          title="Jami aktiv kassa"
          value={cashboxes.length}
          icon={<ArrowUpCircle size={22} strokeWidth={2.5} />}
          color="rose"
        />
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Kassa tushumlari</h2>
          <p className="text-slate-400 font-medium mt-1">So‘nggi 7 kunlik tushum dinamikasi</p>
        </div>

        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cashGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
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

              <Area
                type="monotone"
                dataKey="tushum"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#cashGreen)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Kassalar ro‘yxati</h2>
          <p className="text-slate-400 font-medium mt-1">Barcha kassalar holati</p>
        </div>

        {cashboxes.length === 0 ? (
          <div className="text-slate-400 font-bold text-sm">Kassalar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="p-4 font-black">Kassa nomi</th>
                  <th className="p-4 font-black">Valyuta</th>
                  <th className="p-4 font-black text-right">Balans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {cashboxes.map((box) => (
                  <tr key={box.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">{box.name}</td>
                    <td className="p-4 text-slate-500">{box.currency}</td>
                    <td className="p-4 text-right text-emerald-600">
                      {formatMoney(box.balance)} {box.currency}
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

export default CashTab;