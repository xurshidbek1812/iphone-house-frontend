import React, { useEffect, useState } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

const ExpensesTab = () => {
  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setExpenses(data.expenses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-7">

      <div className="flex items-center gap-3 mb-6">
        <Receipt className="text-red-500" />
        <h2 className="text-xl font-black text-slate-800">Xarajatlar</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="text-slate-400">Xarajatlar topilmadi</div>
      ) : (
        <table className="w-full">
          <thead className="text-left text-xs text-slate-400 uppercase">
            <tr>
              <th className="p-3">Nomi</th>
              <th className="p-3">Summa</th>
              <th className="p-3">User</th>
              <th className="p-3">Sana</th>
            </tr>
          </thead>

          <tbody className="text-sm font-semibold text-slate-700">
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-t">
                <td className="p-3">{exp.name}</td>
                <td className="p-3 text-red-600">
                  {Number(exp.amount).toLocaleString()} UZS
                </td>
                <td className="p-3">
                  {exp.user?.fullName || exp.user?.username}
                </td>
                <td className="p-3">
                  {new Date(exp.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpensesTab;