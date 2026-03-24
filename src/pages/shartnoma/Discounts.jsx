import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Image as ImageIcon, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);

      const data = await apiFetch('/api/orders');

      if (!Array.isArray(data)) {
        setDiscounts([]);
        return;
      }

      const discountedOrders = data
        .filter((order) => Number(order.discountAmount || 0) > 0)
        .map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];

          const productNames =
            items.length > 0
              ? items
                  .map((item) => item.product?.name || item.name || "Noma'lum tovar")
                  .join(', ')
              : "Noma'lum tovar";

          const totalQty = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
          );

          const subtotal = items.reduce(
            (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
            0
          );

          const discountAmount = items.reduce(
            (sum, item) => sum + Number(item.discountAmount || 0),
            0
          );

          return {
            id: order.id,
            orderNumber: order.orderNumber || order.id,
            date: order.createdAt,
            productName: productNames,
            qty: totalQty,
            salePrice: subtotal,
            discountAmount,
            userName:
              order.user?.fullName ||
              order.userName ||
              order.staff?.fullName ||
              "Noma'lum xodim",
            note: order.note || '-'
          };
        })
        .filter((item) => Number(item.discountAmount) > 0);

      setDiscounts(discountedOrders);
    } catch (error) {
      console.error('Discounts fetch error:', error);
      toast.error(error.message || "Chegirmalarni yuklab bo'lmadi");
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const filteredDiscounts = useMemo(() => {
    if (!searchTerm) return discounts;

    const search = searchTerm.trim().toLowerCase();

    return discounts.filter((item) => {
      return (
        String(item.id || '').includes(search) ||
        String(item.orderNumber || '').toLowerCase().includes(search) ||
        (item.productName || '').toLowerCase().includes(search) ||
        (item.userName || '').toLowerCase().includes(search) ||
        (item.note || '').toLowerCase().includes(search)
      );
    });
  }, [discounts, searchTerm]);

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
        <Tag className="text-amber-500" /> Berilgan chegirmalar
      </h1>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Order ID, tovar nomi, xodim yoki izoh bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
          />
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Filter size={18} /> Filtr
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="p-5 text-center">Order ID</th>
                <th className="p-5">Sanasi</th>
                <th className="p-5 min-w-[280px]">Tovar nomi (savat)</th>
                <th className="p-5 text-center">Miqdori</th>
                <th className="p-5 text-right">Umumiy narx</th>
                <th className="p-5 text-right text-amber-600">Chegirma summasi</th>
                <th className="p-5">Chegirma qilgan xodim</th>
                <th className="p-5">Izoh</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-20 text-center text-slate-400">
                    <Tag size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-sm">
                      Hozircha hech qanday chegirma qilinmagan.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((item, index) => {
                  const discountAmt = Number(item.discountAmount || 0);
                  const salePrice = Number(item.salePrice || 0);
                  const percent =
                    salePrice > 0 ? ((discountAmt / salePrice) * 100).toFixed(2) : '0.00';

                  return (
                    <tr key={item.id || index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 text-center font-black text-blue-600">
                        #{item.orderNumber || item.id || '-'}
                      </td>

                      <td className="p-5 text-slate-500 font-medium">
                        {formatDate(item.date)}
                      </td>

                      <td className="p-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                            <ImageIcon size={18} />
                          </div>
                          <span
                            className="truncate w-64 text-slate-800"
                            title={item.productName}
                          >
                            {item.productName}
                          </span>
                        </div>
                      </td>

                      <td className="p-5 text-center bg-slate-50/50">
                        {item.qty} dona
                      </td>

                      <td className="p-5 text-right font-black text-slate-800">
                        {salePrice.toLocaleString('uz-UZ')}{' '}
                        <span className="text-[10px] text-slate-400 font-bold">UZS</span>
                      </td>

                      <td className="p-5 text-right">
                        <div className="text-amber-600 font-black">
                          {discountAmt.toLocaleString('uz-UZ')}{' '}
                          <span className="text-[10px]">UZS</span>
                        </div>
                        <div className="text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1">
                          {percent}%
                        </div>
                      </td>

                      <td className="p-5">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs tracking-wide">
                          {item.userName}
                        </span>
                      </td>

                      <td
                        className="p-5 text-rose-500 font-bold max-w-[220px] truncate"
                        title={item.note}
                      >
                        {item.note || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredDiscounts.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center z-20 text-sm font-bold text-slate-500">
            <div>
              Ko'rsatkichlar soni:{' '}
              <span className="text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg ml-2">
                {filteredDiscounts.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discounts;