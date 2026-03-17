import React, { useEffect, useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { apiFetch } from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL;

const CollectionTab = () => {

  const token = sessionStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {

    const load = async () => {

      try {

        const res = await fetch(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        setContracts(data.pendingContracts || []);

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
        <HandCoins className="text-emerald-600" />
        <h2 className="text-xl font-black text-slate-800">Undiruv</h2>
      </div>

      {contracts.length === 0 ? (
        <div className="text-slate-400">Qarzlar yo'q</div>
      ) : (
        <table className="w-full">
          <thead className="text-left text-xs text-slate-400 uppercase">
            <tr>
              <th className="p-3">Shartnoma</th>
              <th className="p-3">Mijoz</th>
              <th className="p-3">Qarz</th>
              <th className="p-3">Telefon</th>
            </tr>
          </thead>

          <tbody className="text-sm font-semibold text-slate-700">
            {contracts.map((c) => (
              <tr key={c.id} className="border-t">

                <td className="p-3">{c.contractNumber}</td>

                <td className="p-3">
                  {c.customer?.firstName} {c.customer?.lastName}
                </td>

                <td className="p-3 text-red-600">
                  {Number(c.debtAmount).toLocaleString()} UZS
                </td>

                <td className="p-3">
                  {c.customer?.phones?.[0]?.phone || "-"}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CollectionTab;