import React, { useState, useEffect } from 'react';
import { Search, Plus, X, CheckCircle, ShieldAlert, CheckSquare, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BlacklistOrders = () => {
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || 'admin';
  const currentUserName = localStorage.getItem('userName');

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchCust, setSearchCust] = useState('');
  const [actionType, setActionType] = useState('ADD'); // 'ADD' yoki 'REMOVE'
  const [reason, setReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://iphone-house-api.onrender.com/api/blacklist-requests', { headers: { 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      setRequests(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
      try {
          const res = await fetch('https://iphone-house-api.onrender.com/api/customers', { headers: { 'Authorization': `Bearer ${token}` }});
          setCustomers(await res.json());
      } catch (e) {}
  };

  useEffect(() => {
    fetchRequests();
    fetchCustomers();
  }, []);

  const handleCreateRequest = async () => {
      if (!selectedCustomer || !reason) return toast.error("Mijozni tanlang va sababni yozing!");
      try {
          const res = await fetch('https://iphone-house-api.onrender.com/api/blacklist-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                  customerId: selectedCustomer.id,
                  type: actionType,
                  reason: reason,
                  requesterName: currentUserName
              })
          });
          if (res.ok) {
              toast.success("Buyurtma yaratildi!");
              setIsModalOpen(false);
              fetchRequests();
          }
      } catch (e) { toast.error("Xatolik"); }
  };

  const changeStatus = async (id, newStatus) => {
      try {
          await fetch(`https://iphone-house-api.onrender.com/api/blacklist-requests/${id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: newStatus, approverName: newStatus === 'Tasdiqlandi' ? currentUserName : null })
          });
          toast.success("Holat o'zgardi");
          fetchRequests();
      } catch (e) {}
  };

  const deleteRequest = async (id) => {
      try {
          await fetch(`https://iphone-house-api.onrender.com/api/blacklist-requests/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
          toast.success("O'chirildi");
          fetchRequests();
      } catch (e) {}
  };

  const filteredCust = searchCust ? customers.filter(c => 
      c.firstName.toLowerCase().includes(searchCust.toLowerCase()) || 
      c.lastName.toLowerCase().includes(searchCust.toLowerCase()) ||
      c.pinfl.includes(searchCust)
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Qora ro'yxat buyurtmalari</h1>
        <button onClick={() => { setIsModalOpen(true); setSelectedCustomer(null); setReason(''); setSearchCust(''); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
            <Plus size={18} /> Yangi buyurtma
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px] overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                        <th className="p-4">Sanasi</th>
                        <th className="p-4">Mijoz</th>
                        <th className="p-4 text-center">Turi</th>
                        <th className="p-4">Buyurtmachi</th>
                        <th className="p-4">Tasdiqlovchi</th>
                        <th className="p-4 w-48">Sababi</th>
                        <th className="p-4 text-center">Holati</th>
                        <th className="p-4 text-right">Amal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? <tr><td colSpan="8" className="p-6 text-center text-gray-500">Yuklanmoqda...</td></tr> : 
                     requests.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                            <td className="p-4">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</td>
                            <td className="p-4 font-bold text-gray-800 uppercase">{r.customer?.lastName} {r.customer?.firstName}</td>
                            <td className="p-4 text-center">
                                {r.type === 'ADD' ? 
                                    <span className="flex items-center justify-center gap-1 text-red-600 font-bold bg-red-50 py-1 rounded"><ShieldAlert size={14}/> Qo'shish</span> : 
                                    <span className="flex items-center justify-center gap-1 text-green-600 font-bold bg-green-50 py-1 rounded"><CheckCircle size={14}/> Chiqarish</span>
                                }
                            </td>
                            <td className="p-4 text-gray-600">{r.requesterName}</td>
                            <td className="p-4 text-gray-600">{r.approverName || '-'}</td>
                            <td className="p-4 text-xs text-gray-500">{r.reason}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[11px] font-bold ${r.status === 'Tasdiqlandi' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Yuborildi' ? 'bg-blue-100 text-blue-700' : r.status === 'Bekor qilindi' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {r.status === 'Jarayonda' && <button onClick={() => changeStatus(r.id, 'Yuborildi')} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Yuborish"><Send size={18}/></button>}
                                    {r.status === 'Jarayonda' && <button onClick={() => deleteRequest(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="O'chirish"><Trash2 size={18}/></button>}
                                    
                                    {userRole === 'director' && r.status === 'Yuborildi' && (
                                        <>
                                            <button onClick={() => changeStatus(r.id, 'Tasdiqlandi')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded" title="Tasdiqlash"><CheckSquare size={18}/></button>
                                            <button onClick={() => changeStatus(r.id, 'Bekor qilindi')} className="p-2 text-rose-600 hover:bg-rose-50 rounded" title="Bekor qilish"><X size={18}/></button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="flex justify-between items-center p-5 border-b">
                      <h2 className="text-xl font-bold text-gray-800">Qora ro'yxat bo'yicha so'rov</h2>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mijozni qidirish (Ism yoki JSHSHIR)</label>
                          <input type="text" value={searchCust} onChange={(e) => {setSearchCust(e.target.value); setSelectedCustomer(null);}} placeholder="Qidirish..." className="w-full p-3 border rounded-lg outline-blue-500 bg-gray-50"/>
                          {searchCust && !selectedCustomer && (
                              <ul className="mt-1 border rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg absolute w-[85%] z-10">
                                  {filteredCust.map(c => (
                                      <li key={c.id} onClick={() => {setSelectedCustomer(c); setSearchCust(''); setActionType(c.isBlacklisted ? 'REMOVE' : 'ADD');}} className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm">
                                          <div className="font-bold">{c.lastName} {c.firstName}</div>
                                          <div className="text-xs text-gray-500 font-mono">{c.pinfl} {c.isBlacklisted && <span className="text-red-500 ml-2 font-bold">(Qora ro'yxatda)</span>}</div>
                                      </li>
                                  ))}
                              </ul>
                          )}
                      </div>

                      {selectedCustomer && (
                          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                              <h4 className="font-bold text-gray-800 uppercase">{selectedCustomer.lastName} {selectedCustomer.firstName}</h4>
                              <p className="text-xs text-gray-500 font-mono mt-1">Holati: {selectedCustomer.isBlacklisted ? <span className="text-red-500 font-bold">Qora ro'yxatda</span> : <span className="text-green-500 font-bold">Toza</span>}</p>
                          </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setActionType('ADD')} disabled={!selectedCustomer || selectedCustomer?.isBlacklisted} className={`p-3 border rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'ADD' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white text-gray-400 border-gray-200'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                              <ShieldAlert size={18}/> Qo'shish
                          </button>
                          <button onClick={() => setActionType('REMOVE')} disabled={!selectedCustomer || !selectedCustomer?.isBlacklisted} className={`p-3 border rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'REMOVE' ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white text-gray-400 border-gray-200'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                              <CheckCircle size={18}/> Chiqarish
                          </button>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sababni yozing</label>
                          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="3" className="w-full p-3 border rounded-lg outline-blue-500" placeholder="Masalan: Shartnoma to'lamay qochib ketgan..."></textarea>
                      </div>
                  </div>

                  <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border font-bold text-gray-600 rounded-lg">Bekor qilish</button>
                      <button onClick={handleCreateRequest} className="px-5 py-2.5 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 shadow-md">Saqlash</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BlacklistOrders;
