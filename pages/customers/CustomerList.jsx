import React, { useState, useEffect } from 'react';
// DIQQAT: Edit2 ni shu yerda import qildik
import { Search, Filter, Plus, MoreVertical, X, Check, RefreshCw, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Qidiruv va Filtr State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    passportSeries: '',
    passportNumber: '',
    pinfl: '',
    dob: '',
    phone: ''
  });

  // --- TELEFON FORMATLASH FUNKSIYASI ---
  const formatPhoneNumber = (value) => {
    if (!value) return "+998";
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return "+998";
    if (phoneNumberLength < 6) return `+998 (${phoneNumber.slice(3, 5)}`;
    if (phoneNumberLength < 9) return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}`;
    if (phoneNumberLength < 11) return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8, 10)}`;
    return `+998 (${phoneNumber.slice(3, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8, 10)}-${phoneNumber.slice(10, 12)}`;
  };

  // Filtr ishlatildimi?
  const isFilterActive = Object.values(filters).some(val => val !== '');

  // --- API: MIJOZLARNI OLIB KELISH ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filters.passportSeries) params.append('passportSeries', filters.passportSeries);
      if (filters.passportNumber) params.append('passportNumber', filters.passportNumber);
      if (filters.pinfl) params.append('pinfl', filters.pinfl);
      if (filters.dob) params.append('dob', filters.dob);
      
      if (filters.phone && filters.phone !== "+998") {
          params.append('phone', filters.phone);
      }

      const res = await fetch(`https://iphone-house-api.onrender.com/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search yozilganda yoki Filtr o'zgarganda yuklash
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  // Filtrni tozalash
  const clearFilters = () => {
    setFilters({
      passportSeries: '',
      passportNumber: '',
      pinfl: '',
      dob: '',
      phone: ''
    });
    setSearchTerm('');
    setIsFilterOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <span>Bosh sahifa</span><span className="mx-2">›</span>
        <span>Modullar</span><span className="mx-2">›</span>
        <span>Mijozlar</span><span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">Mijozlar ro'yxati</span>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mijozlar ro'yxati</h1>
      </div>

      {/* ACTION BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 justify-between items-center">
        {/* Qidiruv */}
        <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Izlash (Ism, Familiya...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
        </div>

        {/* Tugmalar */}
        <div className="flex gap-2">
            {isFilterActive && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors font-medium animate-in fade-in"
                >
                    <RefreshCw size={18} /> Tozalash
                </button>
            )}

            <button 
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium
                    ${isFilterActive ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
                <Filter size={18} /> Filtr
            </button>
            
            <button 
                onClick={() => navigate('/mijozlar/qoshish')} 
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
            >
                <Plus size={18} /> Qo'shish
            </button>
        </div>
      </div>

      {/* --- JADVAL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                        <th className="p-4 font-medium">ID</th>
                        <th className="p-4 font-medium">Ism, familiya</th>
                        <th className="p-4 font-medium">Tug'ilgan sanasi</th>
                        <th className="p-4 font-medium">JSHSHIR</th>
                        <th className="p-4 font-medium">Telefon</th>
                        <th className="p-4 font-medium">Hujjat</th>
                        <th className="p-4 font-medium text-right">Amallar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {loading ? (
                        <tr><td colSpan="7" className="p-6 text-center text-gray-500">Yuklanmoqda...</td></tr>
                    ) : customers.length === 0 ? (
                        <tr><td colSpan="7" className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
                            <Search size={40} className="mb-2 opacity-20"/>
                            Ma'lumot topilmadi
                        </td></tr>
                    ) : (
                        customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-4 font-medium text-gray-600">{customer.id}</td>
                                <td className="p-4 font-bold text-gray-800 uppercase">
                                    {customer.lastName} {customer.firstName}
                                </td>
                                <td className="p-4 text-gray-600">
                                    {new Date(customer.dob).toLocaleDateString('ru-RU')}
                                </td>
                                <td className="p-4 text-gray-600 font-mono">{customer.pinfl}</td>
                                <td className="p-4 text-gray-600 font-mono">
                                    {customer.phones?.[0]?.phone || '-'}
                                </td>
                                <td className="p-4 text-gray-800 font-medium">
                                    {customer.document ? 
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
                                            {customer.document.series} {customer.document.number}
                                        </span> 
                                    : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    {/* --- TAHRIRLASH TUGMASI --- */}
                                    <button 
                                        onClick={() => navigate(`/mijozlar/tahrirlash/${customer.id}`)}
                                        className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Tahrirlash"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- FILTR MODAL --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsFilterOpen(false)}
            ></div>

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Ma'lumotlarni filtrlash</h2>
                    <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pasport seriyasi</label>
                        <input 
                            type="text" 
                            value={filters.passportSeries}
                            onChange={(e) => setFilters({...filters, passportSeries: e.target.value.toUpperCase()})}
                            placeholder="AA"
                            maxLength={2}
                            className="w-full p-3 border rounded-lg outline-none focus:border-blue-500 uppercase"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pasport raqami</label>
                        <input 
                            type="text" 
                            value={filters.passportNumber}
                            onChange={(e) => setFilters({...filters, passportNumber: e.target.value})}
                            placeholder="1234567"
                            maxLength={7}
                            className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">JSHSHIR raqami</label>
                        <input 
                            type="text" 
                            value={filters.pinfl}
                            onChange={(e) => setFilters({...filters, pinfl: e.target.value})}
                            placeholder="14 ta raqam"
                            maxLength={14}
                            className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tug'ilgan sana</label>
                        <input 
                            type="date" 
                            value={filters.dob}
                            onChange={(e) => setFilters({...filters, dob: e.target.value})}
                            className="w-full p-3 border rounded-lg outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
                        <input 
                            type="text" 
                            value={filters.phone}
                            onChange={(e) => setFilters({...filters, phone: formatPhoneNumber(e.target.value)})}
                            maxLength={19}
                            placeholder="+998"
                            className="w-full p-3 border rounded-lg outline-none focus:border-blue-500 font-mono tracking-wide"
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={clearFilters}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                    >
                        Tozalash
                    </button>
                    <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        Tasdiqlash
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;