import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  CheckCircle,
  Eye,
  X,
  AlertTriangle,
  Printer,
  Loader2,
  Send,
  Lock,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';
import { buildInvoiceQr } from '../../utils/qrBuilder';

const SupplierIncomeList = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase() || 'admin';
  const isDirector = userRole === 'director';

  const canApproveInvoice = hasPermission(PERMISSIONS.INVOICE_APPROVE);
  const canSeeAmount = hasPermission(PERMISSIONS.INVENTORY_VIEW_AMOUNTS);

  const canManageInvoiceDraft =
    userRole === 'admin' || userRole === 'director' || canApproveInvoice;

  const canManageSentInvoices = isDirector || canApproveInvoice;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    invoiceId: null
  });

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const [printItems, setPrintItems] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const anyModalOpen = printModalOpen || !!viewInvoice || confirmModal.isOpen;

    if (anyModalOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [printModalOpen, viewInvoice, confirmModal.isOpen]);

  const fetchInvoices = useCallback(
    async (targetPage = page, targetSearch = appliedSearch, targetStatus = statusFilter) => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          page: String(targetPage),
          limit: String(limit),
          search: targetSearch,
          status: targetStatus
        });

        const data = await apiFetch(`/api/invoices?${query.toString()}`);

        setInvoices(Array.isArray(data?.items) ? data.items : []);
        setPage(Number(data?.page || 1));
        setTotalPages(Number(data?.totalPages || 1));
        setTotal(Number(data?.total || 0));
      } catch (error) {
        console.error('Invoices fetch error:', error);
        toast.error(error.message || "Fakturalarni yuklab bo'lmadi");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    },
    [appliedSearch, statusFilter, limit]
  );

  useEffect(() => {
    fetchInvoices(1, appliedSearch, statusFilter);
  }, [fetchInvoices, appliedSearch, statusFilter]);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('uz-UZ');
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const executeApprove = async (id) => {
    if (!canApproveInvoice) {
      return toast.error("Sizda fakturani tasdiqlash huquqi yo'q!");
    }

    setIsProcessing(true);

    try {
      await apiFetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Tasdiqlandi' })
      });

      toast.success("Muvaffaqiyatli tasdiqlandi va omborga tushdi!");
      await fetchInvoices(page, appliedSearch, statusFilter);

      if (viewInvoice) setViewInvoice(null);
    } catch (err) {
      console.error(err);
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  const executeDelete = async (id) => {
    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) return toast.error('Faktura topilmadi!');

    if (invoice.status === 'Jarayonda' && !canManageInvoiceDraft) {
      return toast.error("Bu fakturani o'chirish huquqi yo'q!");
    }

    if (invoice.status === 'Yuborildi' && !canManageSentInvoices) {
      return toast.error(
        "Jo'natilgan fakturani faqat direktor yoki tasdiqlovchi o'chira oladi!"
      );
    }

    if (invoice.status === 'Tasdiqlandi' && !canManageSentInvoices) {
      return toast.error(
        "Tasdiqlangan fakturani faqat direktor yoki tasdiqlovchi o'chira oladi!"
      );
    }

    setIsProcessing(true);

    try {
      const data = await apiFetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      });

      toast.success(data?.message || "Faktura o'chirildi!");

      const nextPage = invoices.length === 1 && page > 1 ? page - 1 : page;
      await fetchInvoices(nextPage, appliedSearch, statusFilter);

      if (viewInvoice) setViewInvoice(null);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "O'chirishda xatolik yuz berdi!");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, invoiceId: null });
    }
  };

  const executeSend = async (id) => {
    if (!canManageInvoiceDraft) {
      return toast.error("Sizda fakturani yuborish huquqi yo'q!");
    }

    setIsProcessing(true);

    try {
      await apiFetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Yuborildi' })
      });

      toast.success('Faktura yuborildi!');
      await fetchInvoices(page, appliedSearch, statusFilter);
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Fakturani yuborib bo'lmadi!");
    } finally {
      setIsProcessing(false);
    }
  };

  const buildQrValue = (item, invoiceId) => {
    return buildInvoiceQr(item.customId ?? '-', invoiceId);
  };

  const escapeHtml = (value) => {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const openPrintModal = (invoice) => {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];

    setInvoiceToPrint(invoice);
    setPrintItems(
      items.map((item, index) => ({
        rowId: `${invoice.id}-${item.customId ?? item.id ?? index}`,
        id: item.id ?? index,
        customId: item.customId ?? '',
        name: item.name || "Noma'lum tovar",
        labelPrice: Number(item.salePrice || 0),
        copies: 1,
        isChecked: true
      }))
    );
    setPrintModalOpen(true);
  };

  const updatePrintItem = (rowId, field, value) => {
    setPrintItems((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, [field]: value } : item))
    );
  };

  const togglePrintItem = (rowId) => {
    setPrintItems((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const toggleAllPrintItems = () => {
    const allChecked =
      printItems.length > 0 && printItems.every((item) => item.isChecked);

    setPrintItems((prev) =>
      prev.map((item) => ({ ...item, isChecked: !allChecked }))
    );
  };

  const handlePrintAllLabels = async () => {
    const itemsToPrint = printItems.filter((item) => item.isChecked);

    if (itemsToPrint.length === 0) {
      return toast.error("Chop etish uchun mahsulot tanlanmagan!");
    }

    setIsPrinting(true);

    try {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        setIsPrinting(false);
        return toast.error(
          "Brauzer yangi oyna ochishga ruxsat bermadi. Iltimos, popup'larni yoqing!"
        );
      }

      let content = '';

      for (const item of itemsToPrint) {
        const copies = Math.max(1, Number(item.copies) || 1);
        const qrValue = buildQrValue(item, invoiceToPrint.id);
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          width: 220,
          margin: 0
        });

        for (let i = 0; i < copies; i++) {
          const safeName = escapeHtml(item.name || '');
          const safeCustomId = escapeHtml(item.customId ?? '-');
          const safePrice = Number(item.labelPrice || 0).toLocaleString('uz-UZ');

          content += `
            <div class="label-card">
              <div class="header-row">
                <div class="product-name">${safeName}</div>
                <div class="product-id">ID: ${safeCustomId}</div>
              </div>

              <div class="divider"></div>

              <div class="bottom-row">
                <div class="price-box">
                  <div class="price-label">Narxi</div>
                  <div class="price-value">${safePrice} so'm</div>
                </div>

                <div class="qr-box">
                  <img src="${qrDataUrl}" alt="QR" />
                </div>
              </div>
            </div>
          `;
        }
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Universal Yorliqlar</title>
            <style>
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              html, body {
                margin: 0;
                padding: 0;
                background: #fff;
                font-family: Arial, Helvetica, sans-serif;
              }

              @page {
                size: 58mm 40mm;
                margin: 0;
              }

              body {
                width: 58mm;
                padding: 0;
                margin: 0;
                display: flex;
                flex-wrap: wrap;
                align-items: flex-start;
                justify-content: flex-start;
              }

              .label-card {
                width: 58mm;
                height: 40mm;
                padding: 2.2mm 2.4mm;
                overflow: hidden;
                page-break-inside: avoid;
                break-inside: avoid;
                display: flex;
                flex-direction: column;
                border: 0.2mm solid #d1d5db;
                background: #fff;
              }

              .header-row {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 2mm;
                min-height: 8.5mm;
              }

              .product-name {
                flex: 1;
                min-width: 0;
                font-size: 3.1mm;
                line-height: 1.15;
                font-weight: 900;
                color: #111827;
                text-transform: uppercase;
                word-break: break-word;
                max-height: 8mm;
                overflow: hidden;
              }

              .product-id {
                flex-shrink: 0;
                font-size: 2.2mm;
                line-height: 1;
                font-weight: 800;
                color: #4b5563;
                white-space: nowrap;
                margin-top: 0.4mm;
              }

              .divider {
                width: 100%;
                height: 0.35mm;
                background: #d1d5db;
                margin: 1.6mm 0 1.8mm 0;
              }

              .bottom-row {
                flex: 1;
                display: flex;
                align-items: stretch;
                justify-content: space-between;
                gap: 2mm;
                min-height: 0;
              }

              .price-box {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .price-label {
                font-size: 2.2mm;
                line-height: 1;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 1.2mm;
              }

              .price-value {
                font-size: 5.4mm;
                line-height: 1.05;
                font-weight: 900;
                color: #111827;
                word-break: break-word;
              }

              .qr-box {
                width: 16.5mm;
                min-width: 16.5mm;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 0.25mm solid #d1d5db;
                border-radius: 1.2mm;
                padding: 0.8mm;
                background: #fff;
              }

              .qr-box img {
                width: 100%;
                height: auto;
                display: block;
              }

              @media screen {
                body {
                  background: #f3f4f6;
                  min-height: 100vh;
                  padding: 10mm;
                  gap: 4mm;
                  width: auto;
                }

                .label-card {
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
                }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      console.error(err);
      toast.error("Chop etishda xatolik yuz berdi");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleAction = (action, id) => {
    setActiveMenu(null);

    if (action === 'view') {
      setViewInvoice(invoices.find((i) => i.id === id) || null);
      return;
    }

    if (action === 'print') {
      const invoice = invoices.find((i) => i.id === id) || null;
      if (invoice) openPrintModal(invoice);
      return;
    }

    if (action === 'approve') {
      setConfirmModal({ isOpen: true, type: 'approve', invoiceId: id });
      return;
    }

    if (action === 'delete') {
      setConfirmModal({ isOpen: true, type: 'delete', invoiceId: id });
      return;
    }

    if (action === 'send') {
      void executeSend(id);
    }
  };

  const checkedPrintCount = printItems.filter((item) => item.isChecked).length;

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Kirim qilingan fakturalar
        </h1>
      </div>

      {!canManageInvoiceDraft && !canApproveInvoice && (
        <div className="bg-white mb-6 p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 text-slate-500">
          <Lock size={18} className="text-slate-400" />
          <span className="font-bold text-sm">
            Siz bu bo‘limni ko‘ra olasiz, lekin kirim yaratish, yuborish, tasdiqlash yoki
            o‘chirish huquqingiz yo‘q.
          </span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 items-center mb-6 flex-col lg:flex-row">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Ta'minotchi yoki Faktura raqami bo'yicha qidirish..."
            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
          >
            <option value="ALL">Barchasi</option>
            <option value="Jarayonda">Jarayonda</option>
            <option value="Yuborildi">Yuborildi</option>
            <option value="Tasdiqlandi">Tasdiqlandi</option>
            <option value="Bekor qilindi">Bekor qilindi</option>
          </select>

          <button
            onClick={handleSearchSubmit}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors"
          >
            Qidirish
          </button>

          {canManageInvoiceDraft && (
            <button
              onClick={() => navigate('/ombor/taminotchi-kirim/qoshish')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} /> Yangi Kirim
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[650px] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={canSeeAmount ? 6 : 5} className="p-10 text-center text-slate-400">
                    Hech qanday faktura topilmadi
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const canDeleteThisInvoice =
                    (inv.status === 'Jarayonda' && canManageInvoiceDraft) ||
                    (inv.status === 'Yuborildi' && canManageSentInvoices) ||
                    (inv.status === 'Tasdiqlandi' && canManageSentInvoices);

                  const canSendThisInvoice =
                    canManageInvoiceDraft && inv.status === 'Jarayonda';

                  const canApproveThisInvoice =
                    canApproveInvoice && inv.status !== 'Tasdiqlandi';

                  return (
                    <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 text-slate-500 font-medium">
                        {formatDate(inv.date || inv.createdAt)}
                      </td>
                      <td className="p-5 font-mono text-blue-600">#{inv.invoiceNumber}</td>
                      <td className="p-5">{inv.supplierName || inv.supplier || "Noma'lum"}</td>

                      {canSeeAmount && (
                        <td className="p-5 text-right text-emerald-600">
                          {Number(inv.totalSum || 0).toLocaleString('uz-UZ')}{' '}
                          <span className="text-[10px] text-slate-400">UZS</span>
                        </td>
                      )}

                      <td className="p-5 text-center">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider ${
                            inv.status === 'Tasdiqlandi'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : inv.status === 'Yuborildi'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : inv.status === 'Bekor qilindi'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
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
                          <div className="absolute right-12 top-8 w-52 bg-white shadow-xl border border-slate-100 rounded-xl z-50 overflow-hidden font-bold text-sm animate-in zoom-in-95">
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

                            {canDeleteThisInvoice && (
                              <button
                                onClick={() => handleAction('delete', inv.id)}
                                className="w-full text-left px-4 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={16} /> O'chirish
                              </button>
                            )}

                            {canApproveThisInvoice && (
                              <button
                                onClick={() => handleAction('approve', inv.id)}
                                className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 flex items-center gap-2 transition-all"
                              >
                                <CheckCircle size={16} /> Tasdiqlash
                              </button>
                            )}

                            {canSendThisInvoice && (
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-500">
            Jami: <span className="text-slate-800">{total} ta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInvoices(page - 1, appliedSearch, statusFilter)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Oldingi
            </button>

            <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-sm min-w-[90px] text-center">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchInvoices(page + 1, appliedSearch, statusFilter)}
              disabled={page >= totalPages || loading || totalPages === 0}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              Keyingi
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {printModalOpen && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[24px] shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1">
                  <Printer className="text-blue-600" /> Yorliq chop etish
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Faktura: #{invoiceToPrint.invoiceNumber} | Holat: {invoiceToPrint.status}
                </p>
              </div>

              <button
                onClick={() => {
                  setPrintModalOpen(false);
                  setInvoiceToPrint(null);
                  setPrintItems([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto mb-6 custom-scrollbar border border-slate-100 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th
                      className="p-4 w-12 text-center cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={toggleAllPrintItems}
                    >
                      {printItems.length > 0 && printItems.every((item) => item.isChecked) ? (
                        <CheckSquare size={18} className="text-blue-600 mx-auto" />
                      ) : (
                        <Square size={18} className="mx-auto" />
                      )}
                    </th>
                    <th className="p-4">Kod</th>
                    <th className="p-4">Nomi</th>
                    <th className="p-4 text-right">Narxi</th>
                    <th className="p-4 text-center">Nusxa</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {printItems.map((item) => (
                    <tr
                      key={item.rowId}
                      className={item.isChecked ? 'bg-blue-50/30' : 'hover:bg-slate-50'}
                    >
                      <td
                        className="p-4 text-center cursor-pointer"
                        onClick={() => togglePrintItem(item.rowId)}
                      >
                        {item.isChecked ? (
                          <CheckSquare size={18} className="text-blue-600 mx-auto" />
                        ) : (
                          <Square size={18} className="text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="p-4 font-mono text-blue-600">#{item.customId ?? '-'}</td>
                      <td className="p-4">{item.name}</td>

                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.labelPrice}
                          onChange={(e) =>
                            updatePrintItem(
                              item.rowId,
                              'labelPrice',
                              Number(e.target.value || 0)
                            )
                          }
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-right font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.copies}
                          onChange={(e) =>
                            updatePrintItem(
                              item.rowId,
                              'copies',
                              Math.max(1, Number(e.target.value || 1))
                            )
                          }
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-center font-black outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center gap-4 pt-2">
              <div className="text-sm font-bold text-slate-500">
                Tanlangan: <span className="text-slate-800">{checkedPrintCount} ta</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPrintModalOpen(false);
                    setInvoiceToPrint(null);
                    setPrintItems([]);
                  }}
                  className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Yopish
                </button>

                <button
                  onClick={handlePrintAllLabels}
                  disabled={checkedPrintCount === 0 || isPrinting}
                  className={`px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all ${
                    checkedPrintCount > 0 && !isPrinting
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isPrinting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Printer size={18} />
                  )}
                  Chop etish ({checkedPrintCount})
                </button>
              </div>
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
                  Faktura:
                  <span className="text-blue-600 px-3 py-1 bg-blue-50 rounded-lg ml-2">
                    № {viewInvoice.invoiceNumber}
                  </span>
                </h2>

                <div className="text-xs text-slate-500 font-bold flex gap-4 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    Ta'minotchi:
                    <span className="text-slate-800">
                      {viewInvoice.supplierName || viewInvoice.supplier}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    Kiritdi:
                    <span className="text-slate-800">
                      {viewInvoice.userName || "Noma’lum"}
                    </span>
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
                    {canSeeAmount && (
                      <th className="p-4 text-right text-slate-800">Jami Kirim Summa</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-slate-400">#{item.customId ?? '-'}</td>
                      <td className="p-4">{item.name}</td>
                      <td className="p-4 text-center text-blue-600">
                        {Number(item.count || 0)}
                      </td>

                      {canSeeAmount && (
                        <td className="p-4 text-right text-amber-700">
                          {Number(item.price || 0).toLocaleString('uz-UZ')}{' '}
                          <span className="text-[10px] text-amber-500">
                            {item.currency || 'UZS'}
                          </span>
                        </td>
                      )}

                      <td className="p-4 text-right text-emerald-600">
                        {Number(item.salePrice || 0).toLocaleString('uz-UZ')}{' '}
                        <span className="text-[10px] text-emerald-400">
                          {item.currency || 'UZS'}
                        </span>
                      </td>

                      {canSeeAmount && (
                        <td className="p-4 text-right font-black text-slate-800">
                          {(Number(item.count || 0) * Number(item.price || 0)).toLocaleString('uz-UZ')}{' '}
                          <span className="text-[10px] text-slate-400">
                            {item.currency || 'UZS'}
                          </span>
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
              {confirmModal.type === 'approve'
                ? 'Fakturani tasdiqlaysizmi?'
                : "O'chirilsinmi?"}
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
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : confirmModal.type === 'approve' ? (
                  'Tasdiqlash'
                ) : (
                  "O'chirish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierIncomeList;