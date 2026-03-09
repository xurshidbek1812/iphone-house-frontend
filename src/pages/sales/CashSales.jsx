import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CashSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
      const fetchSales = async () => {
          try {
              const res = await fetch('https://iphone-house-api.onrender.com/api/cash-sales', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              setSales(Array.isArray(data) ? data : []);
          } catch (error) {
              console.error("Xatolik:", error);
          } finally {
              setLoading(false);
          }
      };
      fetchSales();
  }, [token]);

  const filteredSales = sales.filter(s => {
      const custName = s.customer ? `${s.customer.lastName} ${s.customer.firstName}` : s.otherName || "Boshqa shaxs";
      return custName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.id.toString().includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Naqd savdolar ro'yxati</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="ID yoki Mijoz ismi orqali izlang..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-blue-500" 
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button 
            onClick={() => navigate('/naqd-savdo/qoshish')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium hover:bg-blue-700 shadow-md shadow-blue-200"
         >
            <Plus size={20}/> Qo'shish
         </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto min-h-[400px]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Savdo ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Sotuvchi</th>
              <th className="p-4">Savdo qilgan mijoz</th>
              <th className="p-4">Telefon raqami</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Holati</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
                <tr><td colSpan="8" className="p-10 text-center text-gray-500">Yuklanmoqda...</td></tr>
            ) : filteredSales.length === 0 ? (
                <tr><td colSpan="8" className="p-10 text-center text-gray-500">Savdolar topilmadi</td></tr>
            ) : (
                filteredSales.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">#{item.id}</td>
                    <td className="p-4 text-gray-600">{new Date(item.date).toLocaleString('ru-RU')}</td>
                    <td className="p-4 font-medium text-gray-600">{item.user?.fullName || '-'}</td>
                    <td className="p-4 font-bold text-gray-800 uppercase">
                        {item.customer ? `${item.customer.lastName} ${item.customer.firstName}` : item.otherName || 'Noma\'lum'}
                    </td>
                    <td className="p-4 font-mono text-gray-600">
                        {item.customer?.phones?.[0]?.phone || item.otherPhone || '-'}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">{Number(item.totalAmount).toLocaleString()} UZS</td>
                    <td className="p-4"><span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-xs font-bold">Yakunlangan</span></td>
                    <td className="p-4"><MoreVertical size={16} className="text-gray-400 cursor-pointer hover:text-gray-800"/></td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CashSales;
