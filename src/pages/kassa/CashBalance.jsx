import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Wallet,
  AlertCircle,
  UserCircle,
  CircleDollarSign
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatSum = (num) => Number(num || 0).toLocaleString('uz-UZ');

const CashBalance = () => {
  const [cashboxes, setCashboxes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchCashboxes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cashboxes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setCashboxes(Array.isArray(data) ? data : []);
        } else {
          setCashboxes([]);
        }
      } catch (error) {
        console.error("Kassalarni yuklashda xato:", error);
        setCashboxes([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCashboxes();
    } else {
      setLoading(false);
    }
  }, [token]);

  const filteredCashboxes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return cashboxes;

    return cashboxes.filter((box) => {
      const searchStr = `${box.name || ''} ${box.currency || ''} ${box.responsibleName || ''}`.toLowerCase();
      return searchStr.includes(q);
    });
  }, [cashboxes, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Wallet className="text-blue-600" /> Kassalar qoldig'i
        </h1>

        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold shadow-sm border border-blue-100">
          Jami kassalar: {cashboxes.length} ta
        </span>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Kassa nomi, valyuta yoki javobgar shaxs bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Kassa nomi</th>
                <th className="p-4">Valyuta</th>
                <th className="p-4">Javobgar shaxs</th>
                <th className="p-4 text-center">Holati</th>
                <th className="p-4 text-right pr-6">Qoldig'i</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500 font-bold">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredCashboxes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={40} className="mb-3 text-slate-300" />
                      <p className="font-bold text-base">Kassalar topilmadi</p>
                      <p className="text-xs mt-1">
                        Hozircha tizimda kassa mavjud emas yoki qidiruvga mos kelmadi.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCashboxes.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 pl-6 text-slate-400 font-bold">#{item.id}</td>

                    <td className="p-4 font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-blue-600" />
                        {item.name}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign size={16} className="text-emerald-600" />
                        {item.currency}
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <UserCircle size={16} className="text-slate-400" />
                        {item.responsibleName || '-'}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.isActive ? 'FAOL' : 'YOPILGAN'}
                      </span>
                    </td>

                    <td className="p-4 text-right pr-6">
                      <span className="font-black text-blue-600 text-base">
                        {formatSum(item.balance)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">
                        {item.currency}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashBalance;