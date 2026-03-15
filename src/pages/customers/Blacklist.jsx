import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Blacklist = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchBlacklist = async () => {
      try {
        const res = await fetch(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        setCustomers(Array.isArray(data) ? data.filter((c) => c.isBlacklisted === true) : []);
      } catch (error) {
        console.error("Xatolik:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlacklist();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <span>Bosh sahifa</span>
        <span className="mx-2">›</span>
        <span>Modullar</span>
        <span className="mx-2">›</span>
        <span>Mijozlar</span>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">Qora ro'yxat</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800">Qora ro'yxat</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Familiya, ism va otasining ismi</th>
                <th className="p-4 font-medium">Tug'ilgan sanasi</th>
                <th className="p-4 font-medium">JSHSHIR raqami</th>
                <th className="p-4 font-medium">Hujjat ma'lumoti</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10">
                    <div className="flex flex-col items-center justify-center text-gray-400 w-full py-10">
                      <Search size={40} className="mb-3 opacity-20" />
                      <span className="text-lg font-medium">Qora ro'yxat bo'sh</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-red-50/50 transition-colors group">
                    <td className="p-4 font-medium text-gray-600">{c.id}</td>
                    <td className="p-4 font-bold text-gray-800">
                      {c.lastName} {c.firstName} {c.middleName}
                    </td>
                    <td className="p-4 text-gray-600">
                      {c.dob ? new Date(c.dob).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className="p-4 text-gray-600 font-mono">{c.pinfl}</td>
                    <td className="p-4 text-gray-800 font-medium">
                      {c.document ? `${c.document.series} ${c.document.number}` : '-'}
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

export default Blacklist;
