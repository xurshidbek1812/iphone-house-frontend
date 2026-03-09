import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
      const fetchContracts = async () => {
          try {
              const res = await fetch('https://iphone-house-api.onrender.com/api/contracts', {
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              setContracts(Array.isArray(data) ? data : []);
          } catch (error) {
              console.error("Xatolik:", error);
          } finally {
              setLoading(false);
          }
      };
      fetchContracts();
  }, [token]);

  const filteredContracts = contracts.filter(c => 
      c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Shartnoma ro'yxati</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Mijoz ismi yoki shartnoma raqamini qidiring..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-blue-500" 
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><LayoutList size={20}/> Ro'yxat</button>
         <button 
            onClick={() => navigate('/shartnoma/qoshish')} 
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
         >
            <Plus size={18} /> Qo'shish
         </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto min-h-[400px]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Raqami</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Mijoz (F.I.SH)</th>
              <th className="p-4">Muddati</th>
              <th className="p-4">Jami summa</th>
              <th className="p-4">Oldindan to'lov</th>
              <th className="p-4">Qolgan qarz</th>
              <th className="p-4">Holati</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
                <tr><td colSpan="9" className="p-6 text-center text-gray-500">Yuklanmoqda...</td></tr>
            ) : filteredContracts.length === 0 ? (
                <tr><td colSpan="9" className="p-10 text-center text-gray-500">Hozircha shartnomalar yo'q.</td></tr>
            ) : (
                filteredContracts.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-bold text-blue-600">{item.contractNumber}</td>
                    <td className="p-4 text-gray-600">{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                    <td className="p-4 font-bold text-gray-800 uppercase">{item.customer?.lastName} {item.customer?.firstName}</td>
                    <td className="p-4 font-medium text-gray-600">{item.durationMonths} oy</td>
                    <td className="p-4 font-bold text-gray-800">{Number(item.totalAmount).toLocaleString()}</td>
                    <td className="p-4 font-bold text-emerald-600">{Number(item.paidAmount).toLocaleString()}</td>
                    <td className="p-4 font-bold text-rose-600">{Number(item.debtAmount).toLocaleString()}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {item.status === 'ACTIVE' ? 'Faol' : 'Yopilgan'}
                        </span>
                    </td>
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

export default ContractList;
