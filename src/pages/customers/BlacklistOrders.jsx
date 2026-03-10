import React, { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, ShieldAlert, CheckSquare, Send, Trash2, Edit2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const BlacklistOrders = () => {
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // <--- Tahrirlash rejimi
  const [editId, setEditId] = useState(null);

  const token = sessionStorage.getItem('token');
  const userRole = sessionStorage.getItem('userRole') || 'admin';
  const currentUserName = sessionStorage.getItem('userName');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchCust, setSearchCust] = useState('');
  const [actionType, setActionType] = useState('ADD'); 
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

  // --- YANGI QO'SHISH YOYI TAHRIRLASH ---
  const handleSaveRequest = async () => {
      if (!isEditMode && (!selectedCustomer || !reason)) return toast.error("Mijozni tanlang va sababni yozing!");
      if (isEditMode && !reason.trim()) return toast.error("Sababni bo'sh qoldirib bo'lmaydi!");

      try {
          const url = isEditMode 
            ? `https://iphone-house-api.onrender.com/api/blacklist-requests/${editId}`
            : 'https://iphone-house-api.onrender.com/api/blacklist-requests';
          
          const method = isEditMode ? 'PUT' : 'POST';
          
          const bodyData = isEditMode 
            ? { reason: reason } // Tahrirlashda faqat sabab ketadi
            : { customerId: selectedCustomer.id, type: actionType, reason: reason, requesterName: currentUserName };

          const res = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(bodyData)
          });
          
          if (res.ok) {
              toast.success(isEditMode ? "Sabab tahrirlandi!" : "Buyurtma yaratildi!");
              setIsModalOpen(false);
              fetchRequests();
          }
      } catch (e) { toast.error("Server bilan aloqa yo'q"); }
  };

  // --- TAHRIRLASH MODALINI OCHISH ---
  const openEditModal = (req) => {
      setIsEditMode(true);
      setEditId(req.id);
      setSelectedCustomer(req.customer); // Kimligi ko'rinib turishi uchun
      setActionType(req.type);
      setReason(req.reason);
      setIsModalOpen(true);
  };

  // --- YANGI BUYURTMA MODALINI OCHISH ---
  const openAddModal = () => {
      setIsEditMode(false);
      setEditId(null);
      setSelectedCustomer(null);
      setSearchCust('');
      setReason('');
      setActionType('ADD');
      setIsModalOpen(true);
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
        <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
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
                            <td className="p-4 text-gray-600 font-medium">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</td>
                            <td className="p-4 font-bold text-gray-800 uppercase">{r.customer?.lastName} {r.customer?.firstName}</td>
                            <td className="p-4 text-center">
                                {r.type === 'ADD' ? 
                                    <span className="flex items-center justify-center gap-1 text-red-600 font-bold bg-red-50 py-1 rounded"><ShieldAlert size={14}/> Qo'shish</span> : 
                                    <span className="flex items-center justify-center gap-1 text-green-600 font-bold bg-green-50 py-1 rounded"><CheckCircle size={14}/> Chiqarish</span>
                                }
                            </td>
                            <td className="p-4 text-gray-600 font-medium">{r.requesterName}</td>
                            <td className="p-4 text-gray-600">{r.approverName || '-'}</td>
                            <td className="p-4 text-xs text-gray-500 leading-relaxed">{r.reason}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${r.status === 'Tasdiqlandi' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Yuborildi' ? 'bg-blue-100 text-blue-700' : r.status === 'Bekor qilindi' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-1">
                                    {r.status === 'Jarayonda' && (
                                        <>
                                            <button onClick={() => openEditModal(r)} className="p-2 text-amber-500 hover:bg-amber-50 rounded" title="Tahrirlash"><Edit2 size={18}/></button>
                                            <button onClick={() => changeStatus(r.id, 'Yuborildi')} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Yuborish"><Send size={18}/></button>
                                            <button onClick={() => deleteRequest(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="O'chirish"><Trash2 size={18}/></button>
                                        </>
                                    )}
                                    
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="flex justify-between items-center p-5 border-b">
                      <h2 className="text-lg font-bold text-gray-800">
                          {isEditMode ? "Sababni tahrirlash" : "Qora ro'yxat so'rovi"}
                      </h2>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      
                      {/* FAQAT YANGI QO'SHISHDA QIDIRUV CHIQADI */}
                      {!isEditMode && (
                          <div className="relative"> {/* MUHIM: Shu relative qidiruv oynasini toshib ketishdan saqlaydi */}
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mijozni qidiring</label>
                              <div className="relative">
                                  <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                                  <input 
                                      type="text" 
                                      value={searchCust} 
                                      onChange={(e) => {setSearchCust(e.target.value); setSelectedCustomer(null);}} 
                                      placeholder="Ism yoki JSHSHIR..." 
                                      className="w-full pl-10 p-2.5 text-sm border rounded-xl outline-blue-500 bg-gray-50"
                                  />
                              </div>
                              
                              {/* RO'YXAT */}
                              {searchCust && !selectedCustomer && (
                                  <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-50 divide-y custom-scrollbar">
                                      {filteredCust.length === 0 ? (
                                          <li className="p-4 text-center text-sm text-gray-500">Mijoz topilmadi</li>
                                      ) : (
                                          filteredCust.map(c => (
                                              <li 
                                                  key={c.id} 
                                                  onClick={() => {setSelectedCustomer(c); setSearchCust(''); setActionType(c.isBlacklisted ? 'REMOVE' : 'ADD');}} 
                                                  className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                                              >
                                                  <div>
                                                      <div className="font-bold text-gray-800 text-sm uppercase">{c.lastName} {c.firstName}</div>
                                                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">{c.pinfl}</div>
                                                  </div>
                                                  {c.isBlacklisted && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">QORA RO'YXATDA</span>}
                                              </li>
                                          ))
                                      )}
                                  </ul>
                              )}
                          </div>
                      )}

                      {/* TANLANGAN MIJOZ KARTOCHKASI (Tahrirlashda ham ko'rinadi) */}
                      {selectedCustomer && (
                          <div className={`p-4 rounded-xl border ${selectedCustomer.isBlacklisted ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'} flex justify-between items-center`}>
                              <div>
                                  <h4 className="font-bold text-gray-800 uppercase text-sm">{selectedCustomer.lastName} {selectedCustomer.firstName}</h4>
                                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">JSHSHIR: {selectedCustomer.pinfl}</p>
                              </div>
                              {selectedCustomer.isBlacklisted ? <ShieldAlert className="text-red-500" size={24}/> : <CheckCircle className="text-green-500" size={24}/>}
                          </div>
                      )}

                      {/* TURI (Tahrirlashda o'zgartirib bo'lmaydi) */}
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                              disabled={isEditMode || !selectedCustomer || selectedCustomer?.isBlacklisted} 
                              onClick={() => setActionType('ADD')} 
                              className={`p-2.5 border rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'ADD' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white text-gray-400 border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                              <ShieldAlert size={16}/> Qo'shish
                          </button>
                          <button 
                              disabled={isEditMode || !selectedCustomer || !selectedCustomer?.isBlacklisted} 
                              onClick={() => setActionType('REMOVE')} 
                              className={`p-2.5 border rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${actionType === 'REMOVE' ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white text-gray-400 border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                              <CheckCircle size={16}/> Chiqarish
                          </button>
                      </div>

                      {/* SABAB Yozish (Har doim ochiq) */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sababni yozing</label>
                          <textarea 
                              value={reason} 
                              onChange={(e) => setReason(e.target.value)} 
                              rows="3" 
                              className="w-full p-3 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                              placeholder="Mijozni qora ro'yxatga kiritish (yoki chiqarish) sababini yozing..."
                          ></textarea>
                      </div>
                  </div>

                  <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border font-bold text-sm text-gray-600 rounded-xl hover:bg-gray-100">Bekor qilish</button>
                      <button onClick={handleSaveRequest} className="px-6 py-2.5 bg-blue-600 font-bold text-sm text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2">
                          <CheckSquare size={16}/> {isEditMode ? 'Yangilash' : 'Saqlash'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BlacklistOrders;
