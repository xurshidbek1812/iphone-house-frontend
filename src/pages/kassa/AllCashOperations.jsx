import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, AlertCircle, Loader2, Wallet } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('uz-UZ');
};

const getTypeLabel = (type) => {
  const safeType = String(type || '').toUpperCase();

  if (safeType === 'TRANSFER_IN') return "Boshqa kassadan kirim";
  if (safeType === 'TRANSFER_OUT') return "Boshqa kassaga chiqim";

  return safeType || '-';
};

const getStatusLabel = (type) => {
  const safeType = String(type || '').toUpperCase();

  if (safeType === 'TRANSFER_IN') return 'Qabul qilindi';
  if (safeType === 'TRANSFER_OUT') return 'Yuborildi';

  return 'Bajarildi';
};

const getStatusClass = (type) => {
  const safeType = String(type || '').toUpperCase();

  if (safeType === 'TRANSFER_IN') return 'text-emerald-600';
  if (safeType === 'TRANSFER_OUT') return 'text-amber-600';

  return 'text-blue-600';
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const AllCashOperations = () => {
  const [operations, setOperations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  const fetchOperations = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cashboxes/transactions/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setOperations(Array.isArray(data) ? data : []);
      } else {
        console.error(data?.error || 'Kassa amaliyotlari yuklanmadi');
        setOperations([]);
      }
    } catch (error) {
      console.error('Kassa amaliyotlarini yuklashda xato:', error);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOperations();
    } else {
      setLoading(false);
    }
  }, [token]);

  const filteredOperations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return operations;

    return operations.filter((item) => {
      const searchStr = `
        ${item.id || ''}
        ${item.cashbox?.name || ''}
        ${item.cashbox?.currency || ''}
        ${item.user?.fullName || ''}
        ${item.user?.username || ''}
        ${item.note || ''}
        ${getTypeLabel(item.type)}
      `.toLowerCase();

      return searchStr.includes(q);
    });
  }, [operations, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Barcha kassa amaliyotlari</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kassalar orasidagi barcha kirim va chiqimlar tarixi
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm">
          Jami: {operations.length} ta
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ID, kassa nomi, foydalanuvchi yoki izoh bo'yicha izlash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter size={20} />
          Filtr
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Kassa nomi</th>
              <th className="p-4">Valyuta</th>
              <th className="p-4">Summasi</th>
              <th className="p-4">Amaliyot turi</th>
              <th className="p-4">Izoh</th>
              <th className="p-4">Kim bajardi</th>
              <th className="p-4">Holati</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="9" className="p-10 text-center text-gray-500">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : filteredOperations.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle size={40} className="mb-3 text-gray-300" />
                    <p className="font-bold text-base">Amaliyotlar topilmadi</p>
                    <p className="text-xs mt-1">
                      Hozircha kassa amaliyotlari mavjud emas yoki qidiruvga mos kelmadi.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOperations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500 font-medium">#{item.id}</td>

                  <td className="p-4 text-gray-600">
                    {formatDateTime(item.createdAt)}
                  </td>

                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <Wallet size={15} className="text-blue-600" />
                      {item.cashbox?.name || '-'}
                    </div>
                  </td>

                  <td className="p-4 text-gray-600">
                    {item.cashbox?.currency || '-'}
                  </td>

                  <td className="p-4 font-bold text-gray-800">
                    {formatMoney(item.amount)}{' '}
                    <span className="text-xs text-gray-400">
                      {item.cashbox?.currency || ''}
                    </span>
                  </td>

                  <td className="p-4 font-medium">
                    {getTypeLabel(item.type)}
                  </td>

                  <td className="p-4 text-gray-600 max-w-[260px] truncate">
                    {item.note || '-'}
                  </td>

                  <td className="p-4 text-gray-600">
                    {item.user?.fullName || item.user?.username || '-'}
                  </td>

                  <td className={`p-4 font-bold ${getStatusClass(item.type)}`}>
                    ● {getStatusLabel(item.type)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllCashOperations;