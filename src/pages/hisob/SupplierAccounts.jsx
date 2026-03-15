import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupplierAccounts = () => {
  const [suppliersData, setSuppliersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Ta'minotchilar va Fakturalarni (Kirimlar) Backenddan yuklaymiz
        const [suppliersRes, invoicesRes] = await Promise.all([
          fetch(`${API_URL}/api/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/invoices`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!suppliersRes.ok || !invoicesRes.ok) throw new Error("Ma'lumotlarni yuklashda xatolik");

        const suppliers = await suppliersRes.json();
        const incomes = await invoicesRes.json(); // Bu sizning SupplierInvoice laringiz

        // 2. Har bir ta'minotchi uchun hisob-kitobni amalga oshiramiz
        const calculatedData = suppliers.map(supplier => {
            let debtUZS = 0;
            let debtUSD = 0;
            let creditUZS = 0;
            let creditUSD = 0;
            let lastDate = null;

            // A) KIRIMLAR (Fakturalar bo'yicha) - Agar status "Tasdiqlandi" bo'lsa
            const supplierIncomes = incomes.filter(i => i.supplierName === supplier.name && i.status === 'Tasdiqlandi');
            
            supplierIncomes.forEach(inc => {
                // Faktura ichidagi barcha tovarlarni aylanib chiqamiz
                inc.items.forEach(item => {
                    if (item.currency === 'USD') {
                        debtUSD += Number(item.total); // Biz qarz bo'lamiz
                    } else {
                        debtUZS += Number(item.total); // Biz qarz bo'lamiz
                    }
                });
                
                // Oxirgi amaliyot sanasini topish
                if (!lastDate || new Date(inc.date) > new Date(lastDate)) {
                    lastDate = inc.date;
                }
            });

            /*
              B) QAYTARISHLAR VA TO'LOVLAR (Hozircha API da faqat Kirim bor)
              Bu yerga keyinchalik Ta'minotchiga qilingan To'lovlar (Payments) va 
              Ombordan qaytarilgan tovarlar (Returns) ni ayirish mantig'i qo'shiladi.
              Misol uchun: debtUSD -= tolovSummasi
            */

            return {
                ...supplier,
                debtUZS,
                debtUSD,
                creditUZS,
                creditUSD,
                limitUZS: 0, // Hozircha limitlar bazada yo'q
                limitUSD: 0,
                lastDate: lastDate ? new Date(lastDate).toLocaleDateString('uz-UZ') : '-'
            };
        });

        setSuppliersData(calculatedData);
      } catch (err) {
        toast.error("Xatolik yuz berdi");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const filteredSuppliers = suppliersData.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      (s.customId && s.customId.toString().includes(searchTerm))
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ta'minotchilar Hisob-kitobi</h1>
      </div>

      {/* UMUMIY STATISTIKA TEPADA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ArrowDownLeft size={14} className="text-red-500"/> Umumiy Qarzdorlik (UZS)
              </p>
              <h3 className="text-xl font-black text-slate-800">
                  {suppliersData.reduce((acc, curr) => acc + curr.debtUZS, 0).toLocaleString()}
              </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ArrowDownLeft size={14} className="text-red-500"/> Umumiy Qarzdorlik (USD)
              </p>
              <h3 className="text-xl font-black text-slate-800">
                  {suppliersData.reduce((acc, curr) => acc + curr.debtUSD, 0).toLocaleString()}
              </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-green-500"/> Umumiy Haqdorlik (UZS)
              </p>
              <h3 className="text-xl font-black text-slate-800">
                  {suppliersData.reduce((acc, curr) => acc + curr.creditUZS, 0).toLocaleString()}
              </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-green-500"/> Umumiy Haqdorlik (USD)
              </p>
              <h3 className="text-xl font-black text-slate-800">
                  {suppliersData.reduce((acc, curr) => acc + curr.creditUSD, 0).toLocaleString()}
              </h3>
          </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 mb-6">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Ta'minotchi nomi, ID yoki telefon raqami orqali qidiring..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
             <Filter size={18}/> Filtr
         </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="p-5">Ta'minotchi</th>
              <th className="p-5 text-right text-red-500">Qarzdorlik (Biz qarzmiz)</th>
              <th className="p-5 text-right text-green-600">Haqdorlik (Biz haqmiz)</th>
              <th className="p-5 text-right text-amber-500">Limit</th>
              <th className="p-5 text-center">Oxirgi Amaliyot</th>
              <th className="p-5 text-center">Akt-Sverka</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {isLoading ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">Yuklanmoqda...</td></tr>
            ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    
                    <td className="p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-slate-800 text-base">{item.name}</div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md tracking-wider">
                                #{item.customId || "0000"}
                            </span>
                        </div>
                        <div className="font-medium text-slate-400 text-xs">{item.phone || '-'}</div>
                    </td>
                    
                    <td className="p-5 text-right">
                        {item.debtUSD > 0 && <div className="text-red-500 font-black mb-0.5">{item.debtUSD.toLocaleString()} <span className="text-xs">USD</span></div>}
                        {item.debtUZS > 0 && <div className="text-red-500 font-black">{item.debtUZS.toLocaleString()} <span className="text-xs">UZS</span></div>}
                        {item.debtUSD === 0 && item.debtUZS === 0 && <span className="text-slate-300 font-medium">-</span>}
                    </td>

                    <td className="p-5 text-right">
                        {item.creditUSD > 0 && <div className="text-green-600 font-black mb-0.5">{item.creditUSD.toLocaleString()} <span className="text-xs">USD</span></div>}
                        {item.creditUZS > 0 && <div className="text-green-600 font-black">{item.creditUZS.toLocaleString()} <span className="text-xs">UZS</span></div>}
                        {item.creditUSD === 0 && item.creditUZS === 0 && <span className="text-slate-300 font-medium">-</span>}
                    </td>

                    <td className="p-5 text-right">
                        <div className="text-amber-500 font-bold mb-0.5">{item.limitUSD > 0 ? item.limitUSD.toLocaleString() : '0'} <span className="text-[10px]">USD</span></div>
                        <div className="text-amber-500 font-bold">{item.limitUZS > 0 ? item.limitUZS.toLocaleString() : '0'} <span className="text-[10px]">UZS</span></div>
                    </td>

                    <td className="p-5 text-center font-bold text-slate-500">
                        {item.lastDate}
                    </td>

                    <td className="p-5 text-center">
                        <button className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-lg transition-colors inline-flex items-center gap-2 text-xs">
                            <FileText size={14}/> Sverka ko'rish
                        </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">Ta'minotchilar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierAccounts;
