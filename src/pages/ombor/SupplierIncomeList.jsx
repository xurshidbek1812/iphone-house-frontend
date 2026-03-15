import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  CheckCircle,
  Eye,
  X,
  AlertTriangle,
  Printer,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactDOMServer from 'react-dom/server';
import QRCode from "react-qr-code";
import { hasPermission } from '../../utils/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const SupplierIncomeList = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase() || 'admin';
  const token = sessionStorage.getItem('token');

  const canApproveInvoice = hasPermission('invoice.approve');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    invoiceId: null
  });
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getAuthHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`
  }), [token]);

  const getJsonAuthHeaders = useCallback(() => ({
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }), [getAuthHeaders]);

  const fetchInvoices = useCallback(async (signal = undefined) => {
    if (!token) {
      toast.error("Tizimga kirish tokeni topilmadi!");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/invoices`, {
        headers: getAuthHeaders(),
        signal
      });

      if (res.ok) {
        const data = await parseJsonSafe(res);
        if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          setInvoices([]);
          toast.error("Fakturalar ro'yxati noto'g'ri formatda keldi");
        }
      } else {
        const errText = await res.text();
        console.error('Invoices fetch error:', res.status, errText);
        toast.error(`Fakturalarni yuklab bo'lmadi (${res.status})`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error("Tarmoq xatosi yuz berdi!");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token, getAuthHeaders]);

  useEffect(() => {
    const controller = new AbortController();
    fetchInvoices(controller.signal);
    return () => controller.abort();
  }, [fetchInvoices]);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString('uz-UZ');
  };

  const executeApprove = async (id) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return toast.error("Faktura topilmadi!");

    setIsProcessing(true);
    try {
      const itemsToBackend = invoice.items.map((item) => ({
        id: item.productId,
        customId: item.customId,
        quantity: Number(item.count) || 0,
        buyPrice: Number(item.price) || 0,
        salePrice: Number(item.salePrice) || 0,
        buyCurrency: item.currency || 'UZS',
        supplierName: invoice.supplierName || invoice.supplier || "Noma'lum",
        invoiceNumber: invoice.invoiceNumber
      }));

      const stockResponse = await fetch(`${API_URL}/api/products/increase-stock`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(itemsToBackend)
      });

      if (!stockResponse.ok) {
        const errData = await parseJsonSafe(stockResponse);
        throw new Error(errData?.error || "Ombor yangilanmadi!");
      }

      const statusResponse = await fetch(`${API_URL}/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({ status: 'Tasdiqlandi' })
      });

      if (!statusResponse.ok) {
        const errData = await parseJsonSafe(statusResponse);
        throw new Error(errData?.error || "Faktura statusi o'zgarmadi, lekin tovarlar omborga tushgan bo'lishi mumkin!");
      }

      toast.success("Muvaffaqiyatli tasdiqlandi va omborga tushdi!");
      await fetchInvoices();
      if (viewInvoice) setViewInvoice(null);
    } catch (err) {
      console.error(err);
      toast.error("Xatolik: " + err.message);
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  const executeDelete = async (id) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        toast.success("Faktura o'chirildi!");
        await fetchInvoices();
      } else {
        const data = await parseJsonSafe(res);
        toast.error(data?.error || "O'chirishda xatolik yuz berdi!");
      }
    } catch (e) {
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  const executeSend = async (id) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({ status: 'Yuborildi' })
      });
      if (res.ok) {
        toast.success("Faktura yuborildi!");
        await fetchInvoices();
      } else {
        const data = await parseJsonSafe(res);
        toast.error(data?.error || "Fakturani yuborib bo'lmadi!");
      }
    } catch (e) {
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsProcessing(false);
    }
  };

  const executePrintQR = (item, invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return toast.error("Brauzer yangi oyna ochishga ruxsat bermadi. Iltimos, popup'larni yoqing!");
    }

    const qrValue = `ID:${item.customId}|INV:${invoice.id}|NAME:${item.name}`;
    const qrCodeSvg = ReactDOMServer.renderToString(<QRCode value={qrValue} size={80} level="H" />);
    const bgUrl = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`;

    printWindow.document.write(`
      <html><head><title>QR Kod</title><style>
        @page { size: auto; margin: 0mm; } 
        body { margin: 10mm; font-family: Arial, sans-serif; display: flex; justify-content: center; }
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

  const handleAction = (action, id) => {
    setActiveMenu(null);
    if (action === 'view') {
      setViewInvoice(invoices.find((i) => i.id === id));
    }
    if (action === 'print') {
      setInvoiceToPrint(invoices.find((i) => i.id === id));
      setPrintModalOpen(true);
    }
    if (action === 'approve') setConfirmModal({ isOpen: true, type: 'approve', invoiceId: id });
    if (action === 'delete') setConfirmModal({ isOpen: true, type: 'delete', invoiceId: id });
    if (action === 'send') executeSend(id);
  };

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const search = searchTerm.trim().toLowerCase();

    return invoices.filter((inv) => {
      const supplierText = inv.supplierName || inv.supplier || '';
      const supplierMatch = supplierText.toLowerCase().includes(search);
      const invoiceNumMatch = String(inv.invoiceNumber || '').toLowerCase().includes(search);
      return supplierMatch || invoiceNumMatch;
    });
  }, [invoices, searchTerm]);

  const canSeeAmount = userRole === 'director';

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Kirim qilingan fakturalar
        </h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Ta'minotchi yoki Faktura raqami bo'yicha qidirish..."
            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/ombor/taminotchi-kirim/qoshish')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={18} /> Yangi Kirim (Faktura)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="p-5">Sana</th>
              <th className="p-5">Faktura №</th>
              <th className="p-5">Ta'minotchi</th>
              {canSeeAmount && <th className="p-5 text-right">Summa (Kirim)</th>}
              <th className="p-5 text-center">Holat</th>
              <th className="p-5 text-center">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={canSeeAmount ? 6 : 5} className="p-10 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={canSeeAmount ? 6 : 5} className="p-10 text-center text-slate-400">
                  Hech qanday faktura topilmadi
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-5 text-slate-500 font-medium">
                    {formatDate(inv.date || inv.createdAt)}
                  </td>
                  <td className="p-5 font-mono text-blue-600">#{inv.invoiceNumber}</td>
                  <td className="p-5">{inv.supplierName || inv.supplier || "Noma'lum"}</td>
                  {canSeeAmount && (
                    <td className="p-5 text-right text-emerald-600">
                      {Number(inv.totalSum || 0).toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span>
                    </td>
                  )}
                  <td className="p-5 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider ${
                        inv.status === 'Tasdiqlandi'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : inv.status === 'Yuborildi'
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-5 text-center relative menu-container">
                    <button
                      onClick={(e) => toggleMenu(e, inv.id)}
                      className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenu === inv.id && (
                      <div className="absolute right-12 top-8 w-48 bg-white shadow-xl border border-slate-100 rounded-xl z-50 overflow-hidden font-bold text-sm animate-in zoom-in-95">
                        <button
                          onClick={() => handleAction('view', inv.id)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-b border-slate-50 transition-colors"
                        >
                          <Eye size={16} /> Ko'rish
                        </button>

                        <button
                          onClick={() => handleAction('print', inv.id)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-b border-slate-50 transition-colors"
                        >
                          <Printer size={16} /> QR Chop etish
                        </button>

                        {inv.status !== 'Tasdiqlandi' && (
                          <button
                            onClick={() => handleAction('delete', inv.id)}
                            className="w-full text-left px-4 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={16} /> O'chirish
                          </button>
                        )}

                        {canApproveInvoice && inv.status !== 'Tasdiqlandi' && (
                          <button
                            onClick={() => handleAction('approve', inv.id)}
                            className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center gap-2 transition-all"
                          >
                            <CheckCircle size={16} /> Tasdiqlash
                          </button>
                        )}

                        {userRole === 'admin' && inv.status === 'Jarayonda' && (
                          <button
                            onClick={() => handleAction('send', inv.id)}
                            className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center gap-2 transition-all"
                          >
                            <Send size={16} /> Yuborish
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {printModalOpen && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1">
                  <Printer className="text-blue-600" /> QR Kod chiqarish
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Faktura: #{invoiceToPrint.invoiceNumber} | Holat: {invoiceToPrint.status}
                </p>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto mb-6 custom-scrollbar border border-slate-100 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Kod</th>
                    <th className="p-4">Nomi</th>
                    <th className="p-4 text-center">Soni</th>
                    <th className="p-4 text-center">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {(Array.isArray(invoiceToPrint.items) ? invoiceToPrint.items : []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-blue-600">#{item.customId ?? '-'}</td>
                      <td className="p-4">{item.name}</td>
                      <td className="p-4 text-center text-slate-500">{Number(item.count || 0)}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => executePrintQR(item, invoiceToPrint)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          QR Chiqarish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-2 tracking-tight">
                  Faktura: <span className="text-blue-600 px-3 py-1 bg-blue-50 rounded-lg ml-2">№ {viewInvoice.invoiceNumber}</span>
                </h2>
                <div className="text-xs text-slate-500 font-bold flex gap-4 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    Ta'minotchi: <span className="text-slate-800">{viewInvoice.supplierName || viewInvoice.supplier}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    Kiritdi: <span className="text-slate-800">{viewInvoice.userName || "Noma'lum"}</span>
                  </span>
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => setViewInvoice(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto mb-8 border border-slate-100 rounded-2xl custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Kod</th>
                    <th className="p-4">Nomi</th>
                    <th className="p-4 text-center">Soni</th>
                    {canSeeAmount && <th className="p-4 text-right text-amber-600">Kirim Narx</th>}
                    <th className="p-4 text-right text-emerald-600">Sotuv Narx</th>
                    {canSeeAmount && <th className="p-4 text-right text-slate-800">Jami Kirim Summa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                      <td className="p-4">{item.name}</td>
                      <td className="p-4 text-center text-blue-600">{Number(item.count || 0)}</td>
                      {canSeeAmount && (
                        <td className="p-4 text-right text-amber-700">
                          {Number(item.price || 0).toLocaleString()} <span className="text-[10px] text-amber-500">{item.currency || 'UZS'}</span>
                        </td>
                      )}
                      <td className="p-4 text-right text-emerald-600">
                        {Number(item.salePrice || 0).toLocaleString()} <span className="text-[10px] text-emerald-400">{item.currency || 'UZS'}</span>
                      </td>
                      {canSeeAmount && (
                        <td className="p-4 text-right font-black text-slate-800">
                          {(Number(item.count || 0) * Number(item.price || 0)).toLocaleString()} <span className="text-[10px] text-slate-400">{item.currency || 'UZS'}</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-8 -mb-8 p-6 rounded-b-[32px]">
              <button
                disabled={isProcessing}
                onClick={() => setViewInvoice(null)}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Yopish
              </button>

              {canApproveInvoice && viewInvoice.status !== 'Tasdiqlandi' && (
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setViewInvoice(null);
                    handleAction('approve', viewInvoice.id);
                  }}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Tasdiqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} /> Fakturani Tasdiqlash
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 text-center">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 ${
                confirmModal.type === 'approve'
                  ? 'bg-emerald-50 text-emerald-500 shadow-emerald-100'
                  : 'bg-rose-50 text-rose-500 shadow-rose-100'
              }`}
            >
              {confirmModal.type === 'approve' ? (
                <CheckCircle size={40} strokeWidth={2.5} />
              ) : (
                <AlertTriangle size={40} strokeWidth={2.5} />
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              {confirmModal.type === 'approve' ? "Fakturani tasdiqlaysizmi?" : "O'chirilsinmi?"}
            </h3>
            <p className="text-center text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              {confirmModal.type === 'approve'
                ? "Tasdiqlaganingizdan so'ng tovarlar omborga qo'shiladi va bu jarayonni ortga qaytarib bo'lmaydi."
                : "Bu faktura tizimdan butunlay o'chirib tashlanadi. Buni ortga qaytarib bo'lmaydi."}
            </p>

            <div className="flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, invoiceId: null })}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                disabled={isProcessing}
                onClick={() =>
                  confirmModal.type === 'approve'
                    ? executeApprove(confirmModal.invoiceId)
                    : executeDelete(confirmModal.invoiceId)
                }
                className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : confirmModal.type === 'approve' ? 'Tasdiqlash' : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierIncomeList;