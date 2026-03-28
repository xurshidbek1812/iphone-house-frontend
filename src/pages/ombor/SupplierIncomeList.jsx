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
  ChevronRight,
  Pencil
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
    async (targetPage = 1, targetSearch = appliedSearch, targetStatus = statusFilter) => {
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
    if (!d) return '-';
    return new Date(d).toLocaleDateString('uz-UZ');
  };

  const formatDateTime = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('uz-UZ');
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const buildEditPayload = (invoice) => {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || '',
      supplierName: invoice.supplierName || invoice.supplier || '',
      supplier: invoice.supplier || invoice.supplierName || '',
      supplierId: invoice.supplierId || null,
      date: invoice.date || invoice.createdAt || '',
      status: invoice.status || 'Jarayonda',
      note: invoice.note || '',
      userName: invoice.userName || '',
      totalSum: Number(invoice.totalSum || 0),
      items: items.map((item, index) => ({
        localId: `${invoice.id}-${item.customId ?? item.id ?? index}`,
        id: item.id ?? null,
        customId: item.customId ?? '',
        name: item.name || '',
        count: Number(item.count || 0),
        price: Number(item.price || 0),
        salePrice: Number(item.salePrice || 0),
        currency: item.currency || 'UZS',
        barcode: item.barcode || '',
        imei: item.imei || '',
        serialNumber: item.serialNumber || '',
        categoryId: item.categoryId || null,
        brandId: item.brandId || null,
        productId: item.productId || null,
        color: item.color || '',
        memory: item.memory || '',
        model: item.model || ''
      }))
    };
  };

  const openEditPage = (invoice) => {
    if (!invoice) return toast.error('Faktura topilmadi');
    if (invoice.status !== 'Jarayonda') {
      return toast.error("Faqat 'Jarayonda' turgan kirimni tahrirlash mumkin");
    }
    if (!canManageInvoiceDraft) {
      return toast.error("Sizda tahrirlash huquqi yo'q");
    }

    setActiveMenu(null);
    if (viewInvoice?.id === invoice.id) setViewInvoice(null);

    navigate(`/ombor/taminotchi-kirim/tahrirlash/${invoice.id}`, {
      state: {
        mode: 'edit',
        invoiceId: invoice.id,
        invoiceData: buildEditPayload(invoice)
      }
    });
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
      toast.error(err.message || "Tasdiqlashda xatolik");
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

              html,
              body {
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
                gap: 1.8mm;
                min-height: 13.5mm;
              }

              .product-name {
                flex: 1;
                min-width: 0;
                font-size: 2.9mm;
                line-height: 1.1;
                font-weight: 900;
                color: #111827;
                text-transform: uppercase;
                word-break: break-word;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                padding-right: 0.8mm;
              }

              .product-id {
                flex-shrink: 0;
                font-size: 2.05mm;
                line-height: 1;
                font-weight: 800;
                color: #4b5563;
                white-space: nowrap;
                margin-top: 0.8mm;
              }

              .divider {
                width: 100%;
                height: 0.35mm;
                background: #d1d5db;
                margin: 2.4mm 0 2.2mm 0;
              }

              .bottom-row {
                flex: 1;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 2.2mm;
                min-height: 0;
              }

              .price-box {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding-bottom: 0.4mm;
              }

              .price-label {
                font-size: 2.1mm;
                line-height: 1;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 1.3mm;
              }

              .price-value {
                font-size: 5mm;
                line-height: 1.02;
                font-weight: 900;
                color: #111827;
                word-break: break-word;
              }

              .qr-box {
                width: 14.2mm;
                min-width: 14.2mm;
                height: 14.2mm;
                display: flex;
                align-items: center;
                justify-content: center;
                align-self: flex-end;
                border: 0.25mm solid #d1d5db;
                border-radius: 1.2mm;
                padding: 0.7mm;
                background: #fff;
                margin-bottom: 0.4mm;
              }

              .qr-box img,
              .qr-box svg {
                width: 100%;
                height: 100%;
                display: block;
              }

              .print-note {
                display: none;
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

                .print-note {
                  display: block;
                  position: fixed;
                  right: 12px;
                  bottom: 12px;
                  font-size: 12px;
                  color: #666;
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  padding: 8px 10px;
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

    const invoice = invoices.find((i) => i.id === id) || null;

    if (action === 'view') {
      setViewInvoice(invoice);
      return;
    }

    if (action === 'edit') {
      openEditPage(invoice);
      return;
    }

    if (action === 'print') {
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
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      {!canManageInvoiceDraft && !canApproveInvoice && (
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 text-slate-500">
          <Lock size={16} className="text-slate-400" />
          <span className="text-sm font-normal">
            Siz bu bo‘limni ko‘ra olasiz, lekin kirim yaratish, yuborish, tasdiqlash yoki o‘chirish huquqingiz yo‘q.
          </span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-medium text-slate-900">Kirim fakturalar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ta'minotchi kirimlari ro‘yxati</p>
        </div>

        {canManageInvoiceDraft && (
          <button
            onClick={() => navigate('/ombor/taminotchi-kirim/qoshish')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition"
          >
            <Plus size={16} />
            Yangi kirim
          </button>
        )}
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-3 flex-col lg:flex-row">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Ta'minotchi yoki faktura raqami..."
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              onClick={handleSearchSubmit}
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50"
            >
              Qidirish
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none"
          >
            <option value="ALL">Barchasi</option>
            <option value="Jarayonda">Jarayonda</option>
            <option value="Yuborildi">Yuborildi</option>
            <option value="Tasdiqlandi">Tasdiqlandi</option>
            <option value="Bekor qilindi">Bekor qilindi</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50/95 text-left text-[10px] text-slate-500 uppercase tracking-[0.12em] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Faktura</th>
                <th className="px-4 py-3 font-medium">Ta'minotchi</th>
                {canSeeAmount && (
                  <th className="px-4 py-3 font-medium text-right">Summa</th>
                )}
                <th className="px-4 py-3 font-medium text-center">Holat</th>
                <th className="px-4 py-3 font-medium text-center">Amallar</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={canSeeAmount ? 6 : 5} className="px-4 py-14 text-center">
                    <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={canSeeAmount ? 6 : 5}
                    className="px-4 py-14 text-center text-slate-400 text-sm"
                  >
                    Fakturalar topilmadi
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

                  const canEditThisInvoice =
                    canManageInvoiceDraft && inv.status === 'Jarayonda';

                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle whitespace-nowrap text-[14px] text-slate-500 font-normal">
                        {formatDate(inv.date || inv.createdAt)}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="text-[15px] font-semibold text-slate-800 tracking-tight">
                          #{inv.invoiceNumber}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="text-[15px] font-medium text-slate-700 leading-6">
                          {inv.supplierName || inv.supplier || "Noma'lum"}
                        </div>
                      </td>

                      {canSeeAmount && (
                        <td className="px-4 py-3 align-middle whitespace-nowrap text-right">
                          <div className="text-[15px] font-semibold text-slate-800">
                            {Number(inv.totalSum || 0).toLocaleString('uz-UZ')} UZS
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3 align-middle text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-normal leading-none ${
                            inv.status === 'Tasdiqlandi'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : inv.status === 'Yuborildi'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : inv.status === 'Bekor qilindi'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle text-center relative menu-container">
                        <div className="inline-block relative">
                          <button
                            onClick={(e) => toggleMenu(e, inv.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenu === inv.id && (
                            <div className="absolute right-0 top-10 w-52 bg-white shadow-xl border border-slate-200 rounded-xl z-50 overflow-hidden text-sm">
                              <button
                                onClick={() => handleAction('view', inv.id)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-b border-slate-100"
                              >
                                <Eye size={15} /> Ko'rish
                              </button>

                              {canEditThisInvoice && (
                                <button
                                  onClick={() => handleAction('edit', inv.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-indigo-700 flex items-center gap-2 border-b border-slate-100"
                                >
                                  <Pencil size={15} /> Tahrirlash
                                </button>
                              )}

                              <button
                                onClick={() => handleAction('print', inv.id)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-b border-slate-100"
                              >
                                <Printer size={15} /> QR chop etish
                              </button>

                              {canDeleteThisInvoice && (
                                <button
                                  onClick={() => handleAction('delete', inv.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-b border-slate-100"
                                >
                                  <Trash2 size={15} /> O'chirish
                                </button>
                              )}

                              {canApproveThisInvoice && (
                                <button
                                  onClick={() => handleAction('approve', inv.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 border-b border-slate-100"
                                >
                                  <CheckCircle size={15} /> Tasdiqlash
                                </button>
                              )}

                              {canSendThisInvoice && (
                                <button
                                  onClick={() => handleAction('send', inv.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                                >
                                  <Send size={15} /> Yuborish
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Jami: <span className="font-medium text-slate-800">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInvoices(page - 1, appliedSearch, statusFilter)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              Oldingi
            </button>

            <div className="min-w-[84px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-normal text-slate-700">
              {Math.max(page, 1)} / {Math.max(totalPages, 1)}
            </div>

            <button
              onClick={() => fetchInvoices(page + 1, appliedSearch, statusFilter)}
              disabled={page >= totalPages || loading || totalPages === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Keyingi
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {printModalOpen && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                  <Printer size={18} />
                  Yorliq chop etish
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Faktura: #{invoiceToPrint.invoiceNumber}
                </p>
              </div>

              <button
                onClick={() => {
                  setPrintModalOpen(false);
                  setInvoiceToPrint(null);
                  setPrintItems([]);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] text-slate-500 uppercase tracking-[0.12em] border-b border-slate-200">
                    <tr>
                      <th
                        className="p-4 w-12 text-center cursor-pointer"
                        onClick={toggleAllPrintItems}
                      >
                        {printItems.length > 0 && printItems.every((item) => item.isChecked) ? (
                          <CheckSquare size={18} className="text-slate-700 mx-auto" />
                        ) : (
                          <Square size={18} className="mx-auto text-slate-400" />
                        )}
                      </th>
                      <th className="p-4 font-medium">Kod</th>
                      <th className="p-4 font-medium">Nomi</th>
                      <th className="p-4 font-medium text-right">Narxi</th>
                      <th className="p-4 font-medium text-center">Nusxa</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm text-slate-700">
                    {printItems.map((item) => (
                      <tr
                        key={item.rowId}
                        className={`border-b border-slate-100 ${item.isChecked ? 'bg-slate-50/60' : ''}`}
                      >
                        <td
                          className="p-4 text-center cursor-pointer"
                          onClick={() => togglePrintItem(item.rowId)}
                        >
                          {item.isChecked ? (
                            <CheckSquare size={18} className="text-slate-700 mx-auto" />
                          ) : (
                            <Square size={18} className="text-slate-300 mx-auto" />
                          )}
                        </td>

                        <td className="p-4 text-[15px] font-semibold text-slate-800">
                          #{item.customId ?? '-'}
                        </td>
                        <td className="p-4 text-[15px] font-medium text-slate-700">
                          {item.name}
                        </td>

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
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-right outline-none focus:ring-2 focus:ring-slate-200"
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
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-center outline-none focus:ring-2 focus:ring-slate-200"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between items-center gap-4">
                <div className="text-sm text-slate-500">
                  Tanlangan: <span className="font-medium text-slate-800">{checkedPrintCount}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPrintModalOpen(false);
                      setInvoiceToPrint(null);
                      setPrintItems([]);
                    }}
                    className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-normal text-slate-700 hover:bg-slate-200"
                  >
                    Yopish
                  </button>

                  <button
                    onClick={handlePrintAllLabels}
                    disabled={checkedPrintCount === 0 || isPrinting}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    Chop etish ({checkedPrintCount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-slate-900 truncate">
                  Faktura № {viewInvoice.invoiceNumber}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {viewInvoice.supplierName || viewInvoice.supplier || "Noma'lum"}
                </p>
              </div>

              <button
                disabled={isProcessing}
                onClick={() => setViewInvoice(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Faktura
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    #{viewInvoice.invoiceNumber}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Sana
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {formatDateTime(viewInvoice.date || viewInvoice.createdAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Ta'minotchi
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {viewInvoice.supplierName || viewInvoice.supplier || '-'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Holat
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-normal leading-none ${
                        viewInvoice.status === 'Tasdiqlandi'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : viewInvoice.status === 'Yuborildi'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : viewInvoice.status === 'Bekor qilindi'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {viewInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-sm font-medium text-slate-800">
                  Kiritilgan mahsulotlar
                </div>

                <div className="overflow-auto max-h-[46vh]">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Kod</th>
                        <th className="p-4">Nomi</th>
                        <th className="p-4 text-center">Soni</th>
                        {canSeeAmount && <th className="p-4 text-right">Kirim narx</th>}
                        <th className="p-4 text-right">Sotuv narx</th>
                        {canSeeAmount && <th className="p-4 text-right">Jami</th>}
                      </tr>
                    </thead>

                    <tbody className="text-sm text-slate-700">
                      {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).length === 0 ? (
                        <tr>
                          <td colSpan={canSeeAmount ? 6 : 4} className="px-4 py-10 text-center text-slate-400">
                            Mahsulotlar topilmadi
                          </td>
                        </tr>
                      ) : (
                        (Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((item, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="p-4 text-[14px] font-semibold text-slate-800">
                              #{item.customId ?? '-'}
                            </td>
                            <td className="p-4 text-[14px] font-medium text-slate-700">
                              {item.name}
                            </td>
                            <td className="p-4 text-center text-[14px] font-medium text-slate-700">
                              {Number(item.count || 0)}
                            </td>

                            {canSeeAmount && (
                              <td className="p-4 text-right text-[14px] font-medium text-slate-700">
                                {Number(item.price || 0).toLocaleString('uz-UZ')} {item.currency || 'UZS'}
                              </td>
                            )}

                            <td className="p-4 text-right text-[14px] font-medium text-slate-700">
                              {Number(item.salePrice || 0).toLocaleString('uz-UZ')} {item.currency || 'UZS'}
                            </td>

                            {canSeeAmount && (
                              <td className="p-4 text-right text-[14px] font-semibold text-slate-800">
                                {(Number(item.count || 0) * Number(item.price || 0)).toLocaleString('uz-UZ')} {item.currency || 'UZS'}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!!viewInvoice.note && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Izoh
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-6">
                    {viewInvoice.note}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  disabled={isProcessing}
                  onClick={() => setViewInvoice(null)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-normal text-slate-700 hover:bg-slate-200"
                >
                  Yopish
                </button>

                {canManageInvoiceDraft && viewInvoice.status === 'Jarayonda' && (
                  <button
                    disabled={isProcessing}
                    onClick={() => openEditPage(viewInvoice)}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Pencil size={16} />
                    Tahrirlash
                  </button>
                )}

                {canApproveInvoice && viewInvoice.status !== 'Tasdiqlandi' && (
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      setViewInvoice(null);
                      handleAction('approve', viewInvoice.id);
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Tasdiqlanmoqda...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Tasdiqlash
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                confirmModal.type === 'approve'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {confirmModal.type === 'approve' ? (
                <CheckCircle size={30} />
              ) : (
                <AlertTriangle size={30} />
              )}
            </div>

            <h3 className="text-base font-medium text-slate-900 mb-2">
              {confirmModal.type === 'approve'
                ? 'Fakturani tasdiqlaysizmi?'
                : "O'chirilsinmi?"}
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              {confirmModal.type === 'approve'
                ? "Tasdiqlangandan so'ng tovarlar omborga qo'shiladi."
                : "Bu faktura tizimdan butunlay o'chiriladi."}
            </p>

            <div className="flex gap-3">
              <button
                disabled={isProcessing}
                onClick={() => setConfirmModal({ isOpen: false, type: null, invoiceId: null })}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-normal text-slate-700 hover:bg-slate-200"
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
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
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