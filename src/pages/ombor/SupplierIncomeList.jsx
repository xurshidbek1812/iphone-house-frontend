import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, Send, CheckCircle, Eye, X, AlertTriangle, Printer, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactDOMServer from 'react-dom/server';
import QRCode from "react-qr-code";

const SupplierIncomeList = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const userRole = localStorage.getItem('userRole') || 'admin';
  const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';
  const token = localStorage.getItem('token');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, invoiceId: null });
  
  // --- QR PRINT UCHUN STATE ---
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('supplierInvoices');
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    document.addEventListener('click', (e) => !e.target.closest('.menu-container') && setActiveMenu(null));
  }, []);

  const toggleMenu = (e, id) => { e.stopPropagation(); setActiveMenu(activeMenu === id ? null : id); };

  // --- TASDIQLASH (OMBORGA QO'SHISH) ---
  const executeApprove = async (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return toast.error("Faktura topilmadi!");

    try {
        const itemsToBackend = invoice.items.map(item => ({
            id: item.id,
            customId: item.customId,
            quantity: Number(item.count || item.quantity || item.inputQty), 
            buyPrice: Number(item.price || item.inputPrice || item.buyPrice),
            salePrice: Number(item.salePrice || item.inputSalePrice || 0), // SOTUV NARXI HAM KETDI
            buyCurrency: item.currency || item.inputCurrency || 'UZS',
            supplierName: invoice.supplier,         
            invoiceNumber: invoice.invoiceNumber    
        }));

        const response = await fetch('https://iphone-house-api.onrender.com/api/products/increase-stock', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(itemsToBackend) 
        });

        if (!response.ok) throw new Error("Ombor yangilanmadi!");

        const updatedInvoices = invoices.map(inv => 
            inv.id === id ? { ...inv, status: 'Tasdiqlandi' } : inv
        );
        
        setInvoices(updatedInvoices);
        localStorage.setItem('supplierInvoices', JSON.stringify(updatedInvoices));
        
        toast.success("Muvaffaqiyatli! Tovar yangi narx bilan omborga tushdi.");
        if(viewInvoice) setViewInvoice(null);
    } catch (err) {
        console.error(err);
        toast.error("Xatolik: " + err.message);
    } finally {
        setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  // --- O'CHIRISH ---
  const executeDelete = (id) => {
    const upd = invoices.filter(i => i.id !== id);
    setInvoices(upd);
    localStorage.setItem('supplierInvoices', JSON.stringify(upd));
    toast.success("Faktura o'chirildi!");
    setConfirmModal({ isOpen: false, type: null, invoiceId: null }); 
  };

  // --- QR CHOP ETISH ---
  const executePrintQR = (item, invoice) => {
      // Agar tovar allaqachon tasdiqlangan (Partiyasi bor) bo'lsa, uni boshqa joydan chop etgan ma'qul.
      // Lekin hozir biz tasdiqlanmagan faktura ichidagi tovarlar uchun chop etyapmiz.
      // Format: ID:12345|INV:F-98765|NAME:Telefon
      
      const printWindow = window.open('', '_blank');
      // INV (Invoice ID) bilan belgilaymizki, bu tovar hali asosiy omborda emas, fakturada yotibdi.
      const qrValue = `ID:${item.customId}|INV:${invoice.id}|NAME:${item.name}`;
      
      const qrCodeSvg = ReactDOMServer.renderToString(<QRCode value={qrValue} size={80} level="H"/>);
      const bgUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;
  
      printWindow.document.write(`
          <html><head><title>QR Kod</title><style>
              @page { size: auto; margin: 0mm; } body { margin: 10mm; font-family: Arial, sans-serif; display: flex; justify-content: center; }
              .label-card { width: 320px; border: 2px solid #000; padding: 20px; border-radius: 12px; background: white; }
              .header { font-size: 16px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
              .divider { border-bottom: 2px solid #000; margin-bottom: 12px; }
              .content { display: flex; justify-content: space-between; align-items: flex-end; }
              .product-id { font-size: 34px; font-weight: 900; }
              .batch-tag { font-size: 11px; background: #000; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-top: 5px; display: inline-block; }
              .qr-code-bg { width: 85px; height: 85px; background-image: url('${bgUrl}'); background-size: contain; background-repeat: no-repeat; }
          </style></head><body>
              <div class="label-card"><div class="header">${item.name}</div><div class="divider"></div><div class="content">
              <div><div class="product-id">${item.customId}</div><div class="batch-tag">KIRIM: #${invoice.invoiceNumber}</div></div>
              <div class="qr-code-bg"></div></div></div>
              <script>window.onload = function() { window.print(); window.close(); }</script>
          </body></html>
      `);
      printWindow.document.close();
  };

  // --- MENYU AMALLARI ---
  const handleAction = (action, id) => {
    setActiveMenu(null);
    
    if (action === 'view') {
        const inv = invoices.find(i => i.id === id);
        setViewInvoice(inv);
    }
    
    // Tahrirlash (Edit) - Yozgan AddSupplierIncome sahifamizga o'xshash alohida Edit sahifaga o'tish kerak 
    // Yoki vaqtinchalik ma'lumotlarni localStorage orqali uzatib, o'sha Add sahifani tahrirlash rejimida ochish mumkin.
    // Hozircha uni Add sahifasiga uzatadigan qilamiz.
    if (action === 'edit') {
        // Fakturani tahrirlash uchun id bilan yo'naltirish:
        navigate(`/ombor/taminotchi-kirim/tahrirlash/${id}`); 
        // (Buning uchun App.js da marshrut qo'shish kerak bo'ladi, keyingi qadamda qilamiz)
    }

    if (action === 'print') {
        const inv = invoices.find(i => i.id === id);
        setInvoiceToPrint(inv);
        setPrintModalOpen(true);
    }

    if (action === 'approve') {
        setConfirmModal({ isOpen: true, type: 'approve', invoiceId: id });
    }
    
    if (action === 'delete') {
        setConfirmModal({ isOpen: true, type: 'delete', invoiceId: id });
    }

    if (action === 'send') {
         const upd = invoices.map(i => i.id === id ? { ...i, status: 'Yuborildi' } : i);
         setInvoices(upd);
         localStorage.setItem('supplierInvoices', JSON.stringify(upd));
         toast.success("Faktura yuborildi!");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
      const matchesSearch = (inv.supplier && inv.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (inv.status === 'Jarayonda') {
          return inv.userName === currentUserName || userRole === 'director'; // Direktor baribir ko'rsin
      }
      
      return true;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ta'minotchidan tovar kirim</h1>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center mb-6">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input type="text" placeholder="Qidirish..." className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
         </div>
         <button onClick={() => navigate('/ombor/taminotchi-kirim/qoshish')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg"><Plus size={18} /> Qo'shish</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                    <th className="p-4">Sana</th>
                    <th className="p-4">Faktura №</th>
                    <th className="p-4">Ta'minotchi</th>
                    {userRole === 'director' && <th className="p-4 text-right">Summa (Kirim)</th>}
                    <th className="p-4 text-center">Holat</th>
                    <th className="p-4 text-center">Amal</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-blue-50">
                        <td className="p-4">{inv.date}</td>
                        <td className="p-4 font-bold">{inv.invoiceNumber}</td>
                        <td className="p-4">{inv.supplier}</td>
                        {userRole === 'director' && <td className="p-4 text-right font-bold text-amber-700">{Number(inv.totalSum).toLocaleString()}</td>}
                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'Tasdiqlandi' ? 'bg-emerald-100 text-emerald-700' : (inv.status === 'Yuborildi' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}`}>{inv.status}</span></td>
                        <td className="p-4 text-center relative menu-container">
                            <button onClick={(e) => toggleMenu(e, inv.id)}><MoreVertical size={18}/></button>
                            {activeMenu === inv.id && (
                                <div className="absolute right-8 top-8 w-44 bg-white shadow-xl border rounded-lg z-50 overflow-hidden font-medium">
                                    <button onClick={() => handleAction('view', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"><Eye size={16}/> Ko'rish</button>
                                    
                                    {/* QR Kod Chop etish (Faqat Tasdiqlanmaganlar uchun) */}
                                    {inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('print', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-slate-700 flex items-center gap-2"><Printer size={16}/> QR Chop etish</button>
                                    )}

                                    {/* Tahrirlash */}
                                    {inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('edit', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-amber-600 flex items-center gap-2"><Edit size={16}/> Tahrirlash</button>
                                    )}
                                    
                                    {userRole === 'director' && inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('approve', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-emerald-600 flex items-center gap-2"><CheckCircle size={16}/> Tasdiqlash</button>
                                    )}
                                    
                                    {userRole === 'admin' && inv.status === 'Jarayonda' && (
                                        <button onClick={() => handleAction('send', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 flex items-center gap-2"><Send size={16}/> Yuborish</button>
                                    )}
                                    
                                    {inv.status !== 'Tasdiqlandi' && (
                                        <button onClick={() => handleAction('delete', inv.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-rose-600 flex items-center gap-2"><Trash2 size={16}/> O'chirish</button>
                                    )}
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- QR PRINT MODAL (Fakturadan tovar tanlab chiqarish) --- */}
      {printModalOpen && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between mb-4 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                            <Printer className="text-blue-600"/> QR Kod chiqarish
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">Faktura: #{invoiceToPrint.invoiceNumber} (Hali tasdiqlanmagan)</p>
                    </div>
                    <button onClick={() => setPrintModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full h-fit"><X size={24}/></button>
                </div>
                
                <div className="max-h-[50vh] overflow-y-auto mb-6 custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 border">Kod</th>
                                <th className="p-3 border">Nomi</th>
                                <th className="p-3 border text-center">Soni</th>
                                <th className="p-3 border text-center">Amal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceToPrint.items.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-3 border font-mono text-blue-600 font-bold">{item.customId}</td>
                                    <td className="p-3 border font-medium">{item.name}</td>
                                    <td className="p-3 border font-bold text-center">{item.count || item.quantity}</td>
                                    <td className="p-3 border text-center">
                                        <button 
                                            onClick={() => executePrintQR(item, invoiceToPrint)}
                                            className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            Chop etish
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <button onClick={() => setPrintModalOpen(false)} className="px-6 py-3 border rounded-xl font-bold text-gray-700 hover:bg-gray-50">Yopish</button>
                </div>
            </div>
        </div>
      )}


      {/* --- KATTA FAKTURA KO'RISH MODALI --- */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between mb-4 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                            Faktura: <span className="text-blue-600">№ {viewInvoice.invoiceNumber}</span>
                        </h2>
                        <div className="text-sm text-gray-500 font-medium flex gap-4">
                            <span>Ta'minotchi: <span className="text-gray-800 font-bold">{viewInvoice.supplier}</span></span>
                            <span>•</span>
                            <span>Kiritdi: <span className="text-gray-800">{viewInvoice.userName || "Noma'lum"}</span></span>
                        </div>
                    </div>
                    <button onClick={() => setViewInvoice(null)} className="p-2 hover:bg-gray-100 rounded-full h-fit"><X size={24}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3 border">Kod</th>
                                <th className="p-3 border">Nomi</th>
                                <th className="p-3 border">Soni</th>
                                {userRole === 'director' && <th className="p-3 border text-amber-700">Kirim (UZS)</th>}
                                <th className="p-3 border text-emerald-600">Sotuv (UZS)</th>
                                {userRole === 'director' && <th className="p-3 border text-right">Jami Kirim</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {viewInvoice.items.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-3 border font-mono text-blue-600 font-bold">{item.customId}</td>
                                    <td className="p-3 border font-medium">{item.name}</td>
                                    <td className="p-3 border font-bold text-center">{item.count || item.quantity}</td>
                                    {userRole === 'director' && <td className="p-3 border text-amber-700 font-medium">{Number(item.price || item.buyPrice || 0).toLocaleString()}</td>}
                                    <td className="p-3 border text-emerald-600 font-bold">{Number(item.salePrice || 0).toLocaleString()}</td>
                                    {userRole === 'director' && <td className="p-3 border text-right font-bold">{(Number(item.count || item.quantity) * Number(item.price || item.buyPrice)).toLocaleString()}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setViewInvoice(null)} className="px-6 py-3 border rounded-xl font-bold text-gray-700 hover:bg-gray-50">Yopish</button>
                    {userRole === 'director' && viewInvoice.status !== 'Tasdiqlandi' && (
                        <button onClick={() => { setViewInvoice(null); handleAction('approve', viewInvoice.id); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-2">
                            <CheckCircle size={18}/> Tasdiqlash
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- TASDIQLASH / O'CHIRISH MODALI --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                </div>

                <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                    {confirmModal.type === 'approve' ? "Fakturani tasdiqlaysizmi?" : "O'chirilsinmi?"}
                </h3>
                <p className="text-center text-gray-500 text-sm mb-6">
                    {confirmModal.type === 'approve' 
                        ? "Tasdiqlaganingizdan so'ng tovarlar omborga qo'shiladi va ularni o'zgartirib bo'lmaydi." 
                        : "Bu faktura tizimdan butunlay o'chirib tashlanadi. Buni ortga qaytarib bo'lmaydi."}
                </p>

                <div className="flex gap-3">
                    <button onClick={() => setConfirmModal({ isOpen: false, type: null, invoiceId: null })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Orqaga</button>
                    <button onClick={() => confirmModal.type === 'approve' ? executeApprove(confirmModal.invoiceId) : executeDelete(confirmModal.invoiceId)} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all ${confirmModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}>
                        {confirmModal.type === 'approve' ? 'Tasdiqlash' : "O'chirish"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SupplierIncomeList;
