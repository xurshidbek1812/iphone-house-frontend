import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Package,
  Printer,
  Calculator as CalcIcon,
  Filter,
  Info,
  AlertTriangle,
  Layers,
  EyeOff,
  CheckCircle,
  Save,
  Edit2,
  Loader2
} from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import QRCode from 'react-qr-code';
import Calculator from '../../components/Calculator';
import toast from 'react-hot-toast';
import usePermission from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const formatMoney = (value) => Number(value || 0).toLocaleString('uz-UZ');

const Sklad = () => {
  const token = sessionStorage.getItem('token');
  const { can } = usePermission();

  const canViewAmounts = can(PERMISSIONS.INVENTORY_VIEW_AMOUNTS);
  const canManageProducts = can(PERMISSIONS.PRODUCT_MANAGE);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, batchId: null });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    name: '',
    category: '',
    unit: 'Dona',
    buyPrice: '',
    salePrice: ''
  });

  const [editBatch, setEditBatch] = useState({ id: null, salePrice: '' });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [printProduct, setPrintProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [calcInitialPrice, setCalcInitialPrice] = useState('');
  const [calcInitialCurrency, setCalcInitialCurrency] = useState('UZS');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyPrice: '',
    salePrice: '',
    quantity: '0',
    unit: 'Dona',
    buyCurrency: 'USD',
    saleCurrency: 'UZS'
  });

  const [filterValues, setFilterValues] = useState({
    id: '',
    category: '',
    buyPriceFrom: '',
    buyPriceTo: '',
    salePriceFrom: '',
    salePriceTo: '',
    stockStatus: ''
  });

  const getAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const getJsonAuthHeaders = useCallback(
    () => ({
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }),
    [getAuthHeaders]
  );

  const fetchData = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      try {
        setLoading(true);

        const [prodRes, catRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/categories`, { headers: getAuthHeaders(), signal })
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const data = await parseJsonSafe(prodRes.value);
          if (Array.isArray(data)) setProducts(data);
        }

        if (catRes.status === 'fulfilled' && catRes.value.ok) {
          const data = await parseJsonSafe(catRes.value);
          if (Array.isArray(data)) {
            setCategories(data);
            sessionStorage.setItem('categoryList', JSON.stringify(data));
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error("Tarmoq xatosi yuz berdi!");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [token, getAuthHeaders]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  useEffect(() => {
    const anyModalOpen =
      isModalOpen ||
      isCalcOpen ||
      isFilterOpen ||
      isDetailsOpen ||
      isSuccessOpen ||
      deleteModal.isOpen ||
      archiveModal.isOpen ||
      isEditModalOpen ||
      Boolean(printProduct);

    if (anyModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
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
  }, [
    isModalOpen,
    isCalcOpen,
    isFilterOpen,
    isDetailsOpen,
    isSuccessOpen,
    deleteModal.isOpen,
    archiveModal.isOpen,
    isEditModalOpen,
    printProduct
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageProducts) {
      return toast.error("Sizda mahsulot qo'shish huquqi yo'q!");
    }

    if (!formData.name.trim() || !formData.category) {
      return toast.error("Nomi va kategoriyasini kiriting!");
    }

    const qoldiq = Number(formData.quantity) || 0;
    if (formData.unit === 'Dona' && !Number.isInteger(qoldiq)) {
      return toast.error("Dona o'lchov birligi uchun qoldiq butun son bo'lishi shart!");
    }

    const avtomatikId = Math.floor(10000 + Math.random() * 90000).toString();

    const payload = {
      id: Date.now().toString(),
      customId: avtomatikId,
      name: formData.name.trim(),
      category: formData.category,
      quantity: qoldiq,
      buyPrice: Number(formData.buyPrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      unit: formData.unit,
      buyCurrency: formData.buyCurrency,
      saleCurrency: formData.saleCurrency
    };

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        setIsModalOpen(false);
        setIsSuccessOpen(true);
        await fetchData();

        setTimeout(() => {
          setIsSuccessOpen(false);
          setFormData({
            name: '',
            category: '',
            buyPrice: '',
            salePrice: '',
            quantity: '0',
            unit: 'Dona',
            buyCurrency: 'USD',
            saleCurrency: 'UZS'
          });
        }, 2500);
      } else {
        toast.error(data?.error || `Saqlashda xatolik (${res.status})`);
      }
    } catch (err) {
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id) => {
    if (!canManageProducts) {
      return toast.error("Sizda mahsulotni o'chirish huquqi yo'q!");
    }

    setIsActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        toast.success("Tovar o'chirildi!");
        await fetchData();
      } else {
        const data = await parseJsonSafe(res);
        toast.error(data?.error || "O'chirib bo'lmaydi! (Bog'langan ma'lumotlar mavjud)");
      }
    } catch (err) {
      toast.error('Tarmoq xatosi!');
    } finally {
      setIsActionLoading(false);
      setDeleteModal({ isOpen: false, productId: null });
    }
  };

  const handleEditClick = (product) => {
    if (!canManageProducts) {
      return toast.error("Sizda mahsulotni tahrirlash huquqi yo'q!");
    }

    setEditData({
      id: product.id,
      name: product.name,
      category: product.category || '',
      unit: product.unit || 'Dona',
      buyPrice: product.buyPrice,
      salePrice: product.salePrice
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!canManageProducts) {
      return toast.error("Sizda mahsulotni tahrirlash huquqi yo'q!");
    }

    if (!editData.name.trim() || !editData.category) {
      return toast.error("Nomi va Kategoriyasi shart!");
    }

    setIsActionLoading(true);

    try {
      const payload = {
        ...editData,
        buyPrice: Number(editData.buyPrice) || 0,
        salePrice: Number(editData.salePrice) || 0
      };

      const res = await fetch(`${API_URL}/api/products/${editData.id}`, {
        method: 'PUT',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success('Tovar muvaffaqiyatli tahrirlandi!');
        setIsEditModalOpen(false);
        await fetchData();
      } else {
        toast.error(data?.error || `Tahrirlashda xatolik (${res.status})`);
      }
    } catch (error) {
      toast.error("Server bilan aloqa yo'q");
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeArchiveBatch = async () => {
    if (!canManageProducts) {
      return toast.error("Sizda partiyani yashirish huquqi yo'q!");
    }

    const batchId = archiveModal.batchId;
    setIsActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/products/batches/${batchId}/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        toast.success('Partiya muvaffaqiyatli yashirildi!');
        await fetchData();
        setSelectedProduct((prev) =>
          prev
            ? {
                ...prev,
                batches: prev.batches.map((b) =>
                  b.id === batchId ? { ...b, isArchived: true } : b
                )
              }
            : prev
        );
      } else {
        const data = await parseJsonSafe(res);
        toast.error(data?.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      toast.error("Server bilan aloqa yo'q");
    } finally {
      setIsActionLoading(false);
      setArchiveModal({ isOpen: false, batchId: null });
    }
  };

  const handleSaveBatchPrice = async (batchId) => {
    if (!canManageProducts) {
      return toast.error("Sizda partiya narxini o'zgartirish huquqi yo'q!");
    }

    if (!editBatch.salePrice || isNaN(editBatch.salePrice)) {
      return toast.error("Narxni to'g'ri kiriting!");
    }

    setIsActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/products/batches/${batchId}/price`, {
        method: 'PATCH',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify({ salePrice: editBatch.salePrice })
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success('Partiya narxi yangilandi!');
        const newSalePrice = Number(editBatch.salePrice);
        setEditBatch({ id: null, salePrice: '' });
        await fetchData();

        setSelectedProduct((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            batches: prev.batches.map((b) =>
              b.id === batchId ? { ...b, salePrice: newSalePrice } : b
            )
          };
        });
      } else {
        toast.error(data?.error || "Partiya narxini yangilab bo'lmadi");
      }
    } catch (error) {
      toast.error("Server bilan aloqa yo'q");
    } finally {
      setIsActionLoading(false);
    }
  };

  const openCalculator = (price, currency) => {
    setCalcInitialPrice(price);
    setCalcInitialCurrency(currency || 'UZS');
    setIsCalcOpen(true);
  };

  const handleOpenPrintModal = (product) => {
    setPrintProduct(product);
    setSelectedBatch(null);
  };

  const handleFinalPrint = () => {
  if (!printProduct || !selectedBatch) {
    toast.error('Partiyani tanlang!');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Brauzer yangi tab ochishga ruxsat bermadi.');
    return;
  }

  const qrValue = `ID:${printProduct.customId}|BATCH:${selectedBatch.id}|NAME:${printProduct.name}`;
  const qrCodeSvg = ReactDOMServer.renderToString(
    <QRCode value={qrValue} size={160} level="H" />
  );

  const safeName = String(printProduct.name || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>QR Label</title>
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
          height: 40mm;
          overflow: hidden;
        }

        .page {
          width: 58mm;
          height: 40mm;
          padding: 2mm;
        }

        .card {
          width: 100%;
          height: 100%;
          border: 0.35mm solid #bdbdbd;
          border-radius: 3.5mm;
          background: #fff;
          padding: 2.2mm 2.4mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .name {
          width: 100%;
          text-align: center;
          font-size: 3.15mm;
          line-height: 1.15;
          font-weight: 500;
          color: #4b5563;
          min-height: 8.5mm;
          max-height: 8.5mm;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          word-break: break-word;
        }

        .divider {
          width: 100%;
          height: 0.35mm;
          background: #9f9f9f;
          margin-top: 0.8mm;
          margin-bottom: 1.8mm;
          flex-shrink: 0;
        }

        .bottom {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 2mm;
          overflow: hidden;
        }

        .left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding-top: 1.2mm;
        }

        .product-id {
          font-size: 4.6mm;
          line-height: 1;
          font-weight: 800;
          color: #000;
          letter-spacing: 0.02mm;
          margin-bottom: 0.9mm;
          white-space: nowrap;
        }

        .batch {
          font-size: 2.25mm;
          line-height: 1;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
        }

        .qr {
          width: 18mm;
          height: 18mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.2mm;
        }

        .qr svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .print-note {
          display: none;
        }

        @media screen {
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
      <div class="page">
        <div class="card">
          <div class="name">${safeName}</div>

          <div class="divider"></div>

          <div class="bottom">
            <div class="left">
              <div class="product-id">${printProduct.customId}</div>
              <div class="batch">Partiya #${selectedBatch.id}</div>
            </div>

            <div class="qr">
              ${qrCodeSvg}
            </div>
          </div>
        </div>
      </div>

      <div class="print-note">Print oynasi ochilmasa Ctrl+P bosing</div>

      <script>
        setTimeout(() => {
          window.focus();
          window.print();
        }, 300);

        window.onafterprint = () => {
          setTimeout(() => window.close(), 100);
        };
      </script>
    </body>
  </html>
`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setPrintProduct(null);
  setSelectedBatch(null);
};

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        (p.name || '').toLowerCase().includes(search) ||
        (p.customId != null && String(p.customId).includes(search));

      const matchesId = filterValues.id
        ? String(p.customId || '').includes(filterValues.id)
        : true;

      const matchesCategory = filterValues.category
        ? p.category === filterValues.category
        : true;

      let matchesStock = true;
      if (filterValues.stockStatus === 'available') matchesStock = Number(p.quantity || 0) > 0;
      if (filterValues.stockStatus === 'unavailable') matchesStock = Number(p.quantity || 0) <= 0;

      const buyFrom = filterValues.buyPriceFrom ? Number(filterValues.buyPriceFrom) : null;
      const buyTo = filterValues.buyPriceTo ? Number(filterValues.buyPriceTo) : null;
      let matchesBuyPrice = true;
      if (buyFrom !== null && Number(p.buyPrice || 0) < buyFrom) matchesBuyPrice = false;
      if (buyTo !== null && Number(p.buyPrice || 0) > buyTo) matchesBuyPrice = false;

      const saleFrom = filterValues.salePriceFrom ? Number(filterValues.salePriceFrom) : null;
      const saleTo = filterValues.salePriceTo ? Number(filterValues.salePriceTo) : null;
      let matchesSalePrice = true;
      if (saleFrom !== null && Number(p.salePrice || 0) < saleFrom) matchesSalePrice = false;
      if (saleTo !== null && Number(p.salePrice || 0) > saleTo) matchesSalePrice = false;

      return (
        matchesSearch &&
        matchesId &&
        matchesCategory &&
        matchesStock &&
        matchesBuyPrice &&
        matchesSalePrice
      );
    });
  }, [products, searchTerm, filterValues]);

  return (
    <div className="p-6 relative min-h-screen bg-gray-50/50 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Tovarlar qoldig'i
        </h1>

        <div className="flex items-center gap-4">
          <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-100 text-sm font-bold text-slate-500">
            Jami: <span className="text-blue-600">{products.length}</span> ta
          </div>

          {canManageProducts && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
              Tovar qo'shish
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Nomi yoki ID bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-slate-700 font-medium"
          />
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className={`px-6 rounded-2xl border font-bold flex items-center gap-2 transition-all ${
            Object.values(filterValues).some((v) => v !== '')
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={20} /> Filtr
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="p-5">ID (Kod)</th>
              <th className="p-5">Nomi</th>
              <th className="p-5 text-center">Kategoriya</th>
              <th className="p-5 text-center">Birlik</th>
              {canViewAmounts && (
                <th className="p-5 text-right bg-amber-50/50 text-amber-700">Kirim Narxi</th>
              )}
              <th className="p-5 text-right text-emerald-700">Sotuv Narxi</th>
              <th className="p-5 text-center">Ombor (Qoldiq)</th>
              <th className="p-5 text-center">Amallar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50 text-sm font-bold">
            {loading ? (
              <tr>
                <td colSpan={canViewAmounts ? 8 : 7} className="p-20 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto" size={32} />
                </td>
              </tr>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-5 font-mono text-blue-600">#{p.customId ?? '-'}</td>
                  <td className="p-5 text-slate-800">{p.name}</td>

                  <td className="p-5 text-center text-slate-500 font-medium">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider">
                      {p.category || 'Kategoriyasiz'}
                    </span>
                  </td>

                  <td className="p-5 text-center text-slate-400">{p.unit}</td>

                  {canViewAmounts && (
                    <td className="p-5 text-right text-slate-600 bg-amber-50/20">
                      {formatMoney(p.buyPrice || 0)}{' '}
                      <span className="text-[10px] text-slate-400">{p.buyCurrency}</span>
                    </td>
                  )}

                  <td className="p-5 text-right text-emerald-600">
                    {formatMoney(p.salePrice || 0)}{' '}
                    <span className="text-[10px] text-emerald-400">{p.saleCurrency}</span>
                  </td>

                  <td
                    className={`p-5 text-center ${
                      Number(p.quantity || 0) <= 0 ? 'text-rose-500' : 'text-slate-700'
                    }`}
                  >
                    <span
                      className={`px-3 py-1 rounded-lg ${
                        Number(p.quantity || 0) <= 0 ? 'bg-rose-50' : 'bg-slate-100'
                      }`}
                    >
                      {Number(p.quantity || 0)}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openCalculator(p.salePrice, p.saleCurrency)}
                        className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                        title="Kalkulyator"
                      >
                        <CalcIcon size={16} />
                      </button>

                      <button
                        onClick={() => handleOpenPrintModal(p)}
                        className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                        title="QR Kod chiqarish"
                      >
                        <Printer size={16} />
                      </button>

                      {canManageProducts && (
                        <>
                          <button
                            disabled={isActionLoading}
                            onClick={() => handleEditClick(p)}
                            className="p-2 text-amber-500 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                            title="Tahrirlash"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            disabled={isActionLoading}
                            onClick={() => setDeleteModal({ isOpen: true, productId: p.id })}
                            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsDetailsOpen(true);
                        }}
                        className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white rounded-xl transition-all"
                        title="Batafsil ma'lumot"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={canViewAmounts ? 8 : 7}
                  className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm"
                >
                  Mahsulot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFilterOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-[450px] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800">Ma'lumotlarni filtrlash</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Tovar ID (Kod)
                </label>
                <input
                  type="text"
                  value={filterValues.id}
                  onChange={(e) => setFilterValues({ ...filterValues, id: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all"
                  placeholder="Kodni yozing..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Kategoriyasi
                </label>
                <select
                  value={filterValues.category}
                  onChange={(e) => setFilterValues({ ...filterValues, category: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all"
                >
                  <option value="">Barchasi</option>
                  {categories.map((c, i) => (
                    <option key={c.id || i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {canViewAmounts && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Kirim narxi
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        placeholder="Dan"
                        value={filterValues.buyPriceFrom}
                        onChange={(e) =>
                          setFilterValues({ ...filterValues, buyPriceFrom: e.target.value })
                        }
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                      />
                    </div>

                    <div className="text-slate-300">-</div>

                    <div className="flex-1 relative">
                      <input
                        type="number"
                        placeholder="Gacha"
                        value={filterValues.buyPriceTo}
                        onChange={(e) =>
                          setFilterValues({ ...filterValues, buyPriceTo: e.target.value })
                        }
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Sotish narxi
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      placeholder="Dan"
                      value={filterValues.salePriceFrom}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, salePriceFrom: e.target.value })
                      }
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                    />
                  </div>

                  <div className="text-slate-300">-</div>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      placeholder="Gacha"
                      value={filterValues.salePriceTo}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, salePriceTo: e.target.value })
                      }
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-4">
                  Qoldiq holati
                </label>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        filterValues.stockStatus === ''
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 group-hover:border-blue-400'
                      }`}
                    >
                      {filterValues.stockStatus === '' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    <input
                      type="radio"
                      className="hidden"
                      checked={filterValues.stockStatus === ''}
                      onChange={() => setFilterValues({ ...filterValues, stockStatus: '' })}
                    />

                    <span className="font-bold text-slate-700 group-hover:text-slate-900">
                      Barchasi
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        filterValues.stockStatus === 'available'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 group-hover:border-blue-400'
                      }`}
                    >
                      {filterValues.stockStatus === 'available' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    <input
                      type="radio"
                      className="hidden"
                      checked={filterValues.stockStatus === 'available'}
                      onChange={() =>
                        setFilterValues({ ...filterValues, stockStatus: 'available' })
                      }
                    />

                    <span className="font-bold text-slate-700 group-hover:text-slate-900">
                      Qoldiq mavjud
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        filterValues.stockStatus === 'unavailable'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 group-hover:border-blue-400'
                      }`}
                    >
                      {filterValues.stockStatus === 'unavailable' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    <input
                      type="radio"
                      className="hidden"
                      checked={filterValues.stockStatus === 'unavailable'}
                      onChange={() =>
                        setFilterValues({ ...filterValues, stockStatus: 'unavailable' })
                      }
                    />

                    <span className="font-bold text-slate-700 group-hover:text-slate-900">
                      Qoldiq mavjud emas
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50 shrink-0">
              <button
                onClick={() =>
                  setFilterValues({
                    id: '',
                    category: '',
                    buyPriceFrom: '',
                    buyPriceTo: '',
                    salePriceFrom: '',
                    salePriceTo: '',
                    stockStatus: ''
                  })
                }
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
              >
                Tozalash
              </button>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailsOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Package className="text-indigo-600" /> {selectedProduct.name}
                </h2>
                <p className="text-xs text-slate-400 font-black mt-1 uppercase tracking-widest">
                  ID: #{selectedProduct.customId}
                </p>
              </div>

              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <h3 className="font-black text-slate-700 mb-4 uppercase text-xs tracking-widest">
                Aktiv Kirim Partiyalari:
              </h3>

              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-4">Sana</th>
                      <th className="p-4">Ta'minotchi / Faktura</th>
                      <th className="p-4 text-center">Boshlang'ich</th>
                      <th className="p-4 text-center">Qoldiq</th>
                      {canViewAmounts && (
                        <th className="p-4 text-right text-amber-600">Kirim Narxi</th>
                      )}
                      <th className="p-4 text-right text-emerald-600">Sotuv Narxi</th>
                      {canManageProducts && <th className="p-4 text-center">Amal</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50 font-bold">
                    {Array.isArray(selectedProduct.batches) &&
                    selectedProduct.batches.filter((b) => !b.isArchived).length > 0 ? (
                      selectedProduct.batches
                        .filter((b) => !b.isArchived)
                        .map((batch) => (
                          <tr key={batch.id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-500">
                              {new Date(batch.createdAt).toLocaleDateString('uz-UZ')}
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-slate-800">
                                {batch.supplierName || "Boshlang'ich qoldiq"}
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-widest">
                                {batch.invoiceNumber
                                  ? `Faktura: #${batch.invoiceNumber}`
                                  : `Partiya ID: P-${batch.id}`}
                              </div>
                            </td>

                            <td className="p-4 text-center text-slate-400">
                              {batch.initialQty}
                            </td>

                            <td className="p-4 text-center">
                              {batch.quantity === 0 ? (
                                <span className="text-rose-500 text-[10px] bg-rose-50 px-2 py-1 rounded-md uppercase font-black tracking-tighter">
                                  Tugagan
                                </span>
                              ) : (
                                batch.quantity
                              )}
                            </td>

                            {canViewAmounts && (
                              <td className="p-4 text-right text-amber-700 bg-amber-50/20">
                                {formatMoney(batch.buyPrice || 0)}{' '}
                                <span className="text-[10px] text-amber-400">
                                  {batch.buyCurrency || 'UZS'}
                                </span>
                              </td>
                            )}

                            <td className="p-4 text-right">
                              {editBatch.id === batch.id && canManageProducts ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    className="w-24 p-2 border-2 border-emerald-200 rounded-lg text-sm outline-none focus:border-emerald-500 font-black text-emerald-700"
                                    value={editBatch.salePrice}
                                    onChange={(e) =>
                                      setEditBatch({ ...editBatch, salePrice: e.target.value })
                                    }
                                    autoFocus
                                  />

                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => handleSaveBatchPrice(batch.id)}
                                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                                  >
                                    <CheckCircle size={16} />
                                  </button>

                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => setEditBatch({ id: null, salePrice: '' })}
                                    className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 disabled:opacity-50"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end items-center gap-3 group/price">
                                  <span className="font-black text-emerald-600">
                                    {formatMoney(batch.salePrice || selectedProduct.salePrice || 0)}{' '}
                                    <span className="text-[10px] text-emerald-400">UZS</span>
                                  </span>

                                  {canManageProducts && (
                                    <button
                                      onClick={() =>
                                        setEditBatch({
                                          id: batch.id,
                                          salePrice: batch.salePrice || selectedProduct.salePrice
                                        })
                                      }
                                      className="text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover/price:opacity-100"
                                      title="Faqat shu partiyaning sotuv narxini o'zgartirish"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {canManageProducts && (
                              <td className="p-4 text-center">
                                <button
                                  disabled={isActionLoading}
                                  onClick={() =>
                                    setArchiveModal({ isOpen: true, batchId: batch.id })
                                  }
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
                                  title="Ro'yxatdan yashirish"
                                >
                                  <EyeOff size={18} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan={canViewAmounts && canManageProducts ? 7 : canViewAmounts || canManageProducts ? 6 : 5}
                          className="p-10 text-center text-slate-300 uppercase font-black text-xs"
                        >
                          Aktiv partiyalar yo'q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-100 transition-all"
              >
                YOPISH
              </button>
            </div>
          </div>
        </div>
      )}

      {printProduct && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPrintProduct(null);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                  <Printer className="text-blue-600" /> Partiya tanlang
                </h2>
                <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  {printProduct.name}
                </p>
              </div>

              <button
                onClick={() => setPrintProduct(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {Array.isArray(printProduct.batches) &&
              printProduct.batches.filter((b) => b.quantity > 0 && !b.isArchived).length > 0 ? (
                printProduct.batches
                  .filter((b) => b.quantity > 0 && !b.isArchived)
                  .map((batch) => (
                    <div
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center group ${
                        selectedBatch?.id === batch.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-4 ring-blue-50'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl transition-all ${
                            selectedBatch?.id === batch.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}
                        >
                          <Layers size={22} />
                        </div>

                        <div>
                          <div className="font-black text-slate-800 text-base">
                            Partiya ID: #{batch.id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-black uppercase mt-0.5">
                            {new Date(batch.createdAt).toLocaleDateString('uz-UZ')} dagi kirim
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600">
                          {batch.quantity} <span className="text-xs">{printProduct.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 font-black uppercase tracking-tighter">
                          Hozir bor
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <AlertTriangle className="mx-auto text-amber-400 mb-2" size={32} />
                  <p className="text-slate-400 font-bold text-sm">
                    Chop etish uchun aktiv partiya yo'q!
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPrintProduct(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200"
              >
                BEKOR QILISH
              </button>

              <button
                onClick={handleFinalPrint}
                disabled={!selectedBatch}
                className={`flex-1 py-4 rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 transition-all ${
                  selectedBatch
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Printer size={20} /> CHOP ETISH
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && canManageProducts && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">Yangi tovar qo'shish</h2>

              <button
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Tovar nomi *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 disabled:opacity-50"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: iPhone 15 Pro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Kategoriya *
                  </label>
                  <select
                    required
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 disabled:opacity-50"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Tanlang...</option>
                    {categories.map((c, i) => (
                      <option key={c.id || i} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <label className="block text-xs font-black text-amber-700 uppercase mb-2">
                    Kirim Narxi va Valyuta
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900 disabled:opacity-50"
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                      placeholder="0"
                    />
                    <select
                      disabled={isSubmitting}
                      className="w-24 p-3 bg-white border border-amber-200 rounded-xl font-bold text-amber-900 outline-none disabled:opacity-50"
                      value={formData.buyCurrency}
                      onChange={(e) =>
                        setFormData({ ...formData, buyCurrency: e.target.value })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="UZS">UZS</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <label className="block text-xs font-black text-emerald-700 uppercase mb-2">
                    Sotuv Narxi va Valyuta
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900 disabled:opacity-50"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0"
                    />
                    <select
                      disabled={isSubmitting}
                      className="w-24 p-3 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-900 outline-none disabled:opacity-50"
                      value={formData.saleCurrency}
                      onChange={(e) =>
                        setFormData({ ...formData, saleCurrency: e.target.value })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="UZS">UZS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Boshlang'ich soni (Qoldiq)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={formData.unit === 'Dona' ? '1' : '0.01'}
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 disabled:opacity-50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    O'lchov birligi
                  </label>
                  <select
                    disabled={isSubmitting}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 disabled:opacity-50"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="Dona">Dona</option>
                    <option value="Kg">Kg</option>
                    <option value="Metr">Metr</option>
                    <option value="Litr">Litr</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && canManageProducts && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isActionLoading) setIsEditModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Edit2 className="text-amber-500" /> Tovarni tahrirlash
              </h2>

              <button
                disabled={isActionLoading}
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-800 text-xs flex items-start gap-2 mb-4 font-medium">
              <span className="font-black shrink-0">DIQQAT:</span>
              Bu yerdagi Sotuv narxini o'zgartirsangiz, ombordagi barcha aktiv partiyalarning sotuv
              narxi ham o'zgaradi!
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Tovar nomi *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isActionLoading}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 disabled:opacity-50"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Kategoriya *
                  </label>
                  <select
                    required
                    disabled={isActionLoading}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 disabled:opacity-50"
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  >
                    <option value="">Tanlang...</option>
                    {categories.map((c, i) => (
                      <option key={c.id || i} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <label className="block text-xs font-black text-amber-700 uppercase mb-2">
                    Kirim Narxi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      disabled={isActionLoading}
                      className="w-full p-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900 pr-12 disabled:opacity-50"
                      value={editData.buyPrice}
                      onChange={(e) => setEditData({ ...editData, buyPrice: e.target.value })}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">
                      UZS
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <label className="block text-xs font-black text-emerald-700 uppercase mb-2">
                    Umumiy Sotuv Narxi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      disabled={isActionLoading}
                      className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900 pr-12 disabled:opacity-50"
                      value={editData.salePrice}
                      onChange={(e) => setEditData({ ...editData, salePrice: e.target.value })}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">
                      UZS
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  O'lchov birligi
                </label>
                <select
                  disabled={isActionLoading}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 disabled:opacity-50"
                  value={editData.unit}
                  onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                >
                  <option value="Dona">Dona</option>
                  <option value="Kg">Kg</option>
                  <option value="Metr">Metr</option>
                  <option value="Litr">Litr</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full py-4 mt-2 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isActionLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                O'zgarishlarni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && canManageProducts && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 text-rose-500 rotate-3 shadow-lg shadow-rose-100">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              O'chirilsinmi?
            </h3>

            <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed px-2">
              Bu mahsulot tizimdan butunlay o'chib ketadi. Buni ortga qaytarib bo'lmaydi!
            </p>

            <div className="flex gap-3">
              <button
                disabled={isActionLoading}
                onClick={() => setDeleteModal({ isOpen: false, productId: null })}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50"
              >
                Bekor qilish
              </button>

              <button
                disabled={isActionLoading}
                onClick={() => executeDelete(deleteModal.productId)}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70"
              >
                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : "O'CHIRISH"}
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveModal.isOpen && canManageProducts && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-amber-50 text-amber-500 rotate-3 shadow-lg shadow-amber-100">
              <EyeOff size={40} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              Yashirilsinmi?
            </h3>

            <p className="text-slate-400 font-bold text-sm mb-8 leading-relaxed px-2">
              Bu partiya barcha ro'yxatlardan yashiriladi, lekin arxivda saqlanib qoladi.
            </p>

            <div className="flex gap-3">
              <button
                disabled={isActionLoading}
                onClick={() => setArchiveModal({ isOpen: false, batchId: null })}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs disabled:opacity-50"
              >
                BEKOR QILISH
              </button>

              <button
                disabled={isActionLoading}
                onClick={executeArchiveBatch}
                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all uppercase text-xs tracking-widest flex justify-center items-center disabled:opacity-70"
              >
                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : 'YASHIRISH'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-12 border border-slate-100">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-28 h-28 bg-emerald-500 rounded-[35px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 rotate-3 transition-transform">
                <CheckCircle size={56} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">
              Bajarildi!
            </h3>

            <p className="text-slate-400 font-bold text-sm px-4 leading-relaxed uppercase tracking-widest">
              Ombor yangilandi.
            </p>

            <div className="mt-10 px-4">
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full animate-progress-line w-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Calculator
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        initialTotal={calcInitialPrice}
        initialCurrency={calcInitialCurrency}
      />
    </div>
  );
};

export default Sklad;