import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  Boxes
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://iphone-house-api.onrender.com';

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeInvoiceForEdit = (invoice) => {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];

  return {
    date: invoice?.date
      ? new Date(invoice.date).toISOString().split('T')[0]
      : invoice?.createdAt
      ? new Date(invoice.createdAt).toISOString().split('T')[0]
      : '',
    supplierName: invoice?.supplierName || invoice?.supplier || '',
    invoiceNumber: invoice?.invoiceNumber || '',
    exchangeRate: String(invoice?.exchangeRate || '12500'),
    status: invoice?.status || 'Jarayonda',
    items: items.map((item, index) => ({
      localId: `${invoice?.id || 'inv'}-${item?.id ?? item?.productId ?? item?.customId ?? index}`,
      id: item?.id ?? null,
      productId: item?.productId ?? null,
      customId: item?.customId ?? '',
      name: item?.name || '',
      unit: item?.unit || 'Dona',
      count: Number(item?.count || 1),
      price: Number(item?.price || 0),
      markup: Number(item?.markup || 0),
      salePrice: Number(item?.salePrice || 0),
      currency: item?.currency || 'UZS',
      total:
        Number(item?.total || 0) ||
        Number(item?.count || 0) * Number(item?.price || 0),
      categoryId: item?.categoryId || null,
      brandId: item?.brandId || null,
      color: item?.color || '',
      memory: item?.memory || '',
      model: item?.model || ''
    }))
  };
};

const createEmptyItem = () => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  id: null,
  productId: null,
  customId: '',
  name: '',
  unit: 'Dona',
  count: 1,
  price: 0,
  markup: 0,
  salePrice: 0,
  currency: 'UZS',
  total: 0,
  categoryId: null,
  brandId: null,
  color: '',
  memory: '',
  model: ''
});

const EditSupplierIncome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = sessionStorage.getItem('token');
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';

  const [date, setDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [exchangeRate, setExchangeRate] = useState('12500');
  const [status, setStatus] = useState('Jarayonda');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [suppliersList, setSuppliersList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice');

  const getAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const getJsonAuthHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),
    [token]
  );

  const getCostInUZS = useCallback(
    (price, currency) => {
      const numPrice = Number(price) || 0;
      const numRate = Number(exchangeRate) || 12500;
      return currency === 'USD' ? numPrice * numRate : numPrice;
    },
    [exchangeRate]
  );

  const getSaleFromMarkup = useCallback(
    (price, currency, markup) => {
      const costUZS = getCostInUZS(price, currency);
      return Math.round(costUZS + (costUZS * (Number(markup) || 0)) / 100);
    },
    [getCostInUZS]
  );

  const getMarkupFromSale = useCallback(
    (price, currency, salePrice) => {
      const costUZS = getCostInUZS(price, currency);
      if (costUZS <= 0) return 0;
      return Number(((((Number(salePrice) || 0) - costUZS) / costUZS) * 100).toFixed(2));
    },
    [getCostInUZS]
  );

  const isSameProduct = useCallback((a, b) => {
    const aCustom = String(a?.customId || '').trim();
    const bCustom = String(b?.customId || '').trim();

    if (aCustom && bCustom) return aCustom === bCustom;

    const aProductId = String(a?.productId || '').trim();
    const bProductId = String(b?.productId || '').trim();

    if (aProductId && bProductId) return aProductId === bProductId;

    return String(a?.name || '').trim().toLowerCase() === String(b?.name || '').trim().toLowerCase();
  }, []);

  const applyInvoiceToForm = useCallback((invoice) => {
    const normalized = normalizeInvoiceForEdit(invoice);
    setDate(normalized.date);
    setSupplierName(normalized.supplierName);
    setInvoiceNumber(normalized.invoiceNumber);
    setExchangeRate(normalized.exchangeRate);
    setStatus(normalized.status);
    setSelectedItems(normalized.items.length ? normalized.items : [createEmptyItem()]);
  }, []);

  const fetchBaseLists = useCallback(async (signal = undefined) => {
    const [prodRes, suppRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
      fetch(`${API_URL}/api/suppliers`, { headers: getAuthHeaders(), signal })
    ]);

    if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
      const productsData = await parseJsonSafe(prodRes.value);
      if (Array.isArray(productsData)) setAllProducts(productsData);
    }

    if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
      const suppliersData = await parseJsonSafe(suppRes.value);
      if (Array.isArray(suppliersData)) setSuppliersList(suppliersData);
    } else {
      const savedSuppliers = JSON.parse(sessionStorage.getItem('suppliersList') || '[]');
      setSuppliersList(savedSuppliers);
    }
  }, [getAuthHeaders]);

  const fetchInvoice = useCallback(async (signal = undefined) => {
    const stateInvoice = location.state?.invoiceData;

    try {
      setLoading(true);
      await fetchBaseLists(signal);

      if (stateInvoice) {
        applyInvoiceToForm(stateInvoice);
        return;
      }

      const directRes = await fetch(`${API_URL}/api/invoices/${id}`, {
        headers: getAuthHeaders(),
        signal
      });

      if (directRes.ok) {
        const invoiceData = await parseJsonSafe(directRes);
        if (invoiceData) {
          applyInvoiceToForm(invoiceData);
          return;
        }
      }

      const listRes = await fetch(`${API_URL}/api/invoices`, {
        headers: getAuthHeaders(),
        signal
      });

      const listData = await parseJsonSafe(listRes);

      const invoices = Array.isArray(listData?.items)
        ? listData.items
        : Array.isArray(listData)
        ? listData
        : [];

      const foundInvoice = invoices.find((inv) => String(inv.id) === String(id));

      if (!foundInvoice) {
        toast.error('Faktura topilmadi!');
        navigate('/ombor/taminotchi-kirim');
        return;
      }

      applyInvoiceToForm(foundInvoice);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Yuklashda xato", error);
        toast.error("Ma'lumotlarni yuklab bo'lmadi");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [location.state, id, navigate, getAuthHeaders, fetchBaseLists, applyInvoiceToForm]);

  useEffect(() => {
    const controller = new AbortController();
    fetchInvoice(controller.signal);
    return () => controller.abort();
  }, [fetchInvoice]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const clean = searchTerm.trim().toLowerCase();

    return allProducts.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(clean) ||
        String(p.customId || '').toLowerCase().includes(clean)
    );
  }, [allProducts, searchTerm]);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name || '');
  };

  const handleAddItem = () => {
    let productToAdd = selectedProduct;

    if (!productToAdd && searchTerm) {
      const cleanSearch = searchTerm.trim().toLowerCase();
      productToAdd = allProducts.find(
        (p) =>
          (p.name || '').toLowerCase() === cleanSearch ||
          String(p.customId || '').toLowerCase() === cleanSearch
      );
    }

    if (!productToAdd) {
      return toast.error("Bazada topilmadi! To'g'ri tanlang.");
    }

    const candidateItem = {
      productId: productToAdd.id,
      customId: productToAdd.customId,
      name: productToAdd.name
    };

    if (selectedItems.some((item) => isSameProduct(item, candidateItem))) {
      return toast.error("Bu mahsulot allaqachon qo'shilgan!");
    }

    const defaultCurrency = productToAdd.buyCurrency || 'UZS';
    const defaultPrice = Number(productToAdd.buyPrice || 0);
    const defaultSalePrice = Number(productToAdd.salePrice || 0);
    const defaultMarkup = defaultSalePrice
      ? getMarkupFromSale(defaultPrice, defaultCurrency, defaultSalePrice)
      : 0;

    const newItem = {
      localId: `added-${Date.now()}-${productToAdd.id}`,
      id: null,
      productId: productToAdd.id,
      customId: productToAdd.customId,
      name: productToAdd.name,
      unit: productToAdd.unit || 'Dona',
      count: 1,
      price: defaultPrice,
      markup: defaultMarkup,
      salePrice: defaultSalePrice,
      currency: defaultCurrency,
      total: defaultPrice,
      categoryId: productToAdd.categoryId || null,
      brandId: productToAdd.brandId || null,
      color: productToAdd.color || '',
      memory: productToAdd.memory || '',
      model: productToAdd.model || ''
    };

    setSelectedItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setSearchTerm('');
    toast.success("Mahsulot qo'shildi");
  };

  const updateItem = (localId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.localId !== localId) return item;

        const updated = { ...item, [field]: value };

        const count = Number(field === 'count' ? value : updated.count) || 0;
        const price = Number(field === 'price' ? value : updated.price) || 0;
        const currency = field === 'currency' ? value : updated.currency;
        const markup = Number(field === 'markup' ? value : updated.markup) || 0;
        const salePrice = Number(field === 'salePrice' ? value : updated.salePrice) || 0;

        updated.total = count * price;

        if (field === 'price' || field === 'currency' || field === 'markup') {
          updated.salePrice = getSaleFromMarkup(price, currency, markup);
        }

        if (field === 'salePrice') {
          updated.markup = getMarkupFromSale(price, currency, salePrice);
        }

        return updated;
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setSelectedItems((prev) => prev.filter((item) => item.localId !== localId));
  };

  const { grandTotalUZS, totalCount } = useMemo(() => {
    let totalUZS = 0;
    let totalUSD = 0;
    let qty = 0;

    selectedItems.forEach((item) => {
      const rowTotal = (Number(item.count) || 0) * (Number(item.price) || 0);
      qty += Number(item.count || 0);

      if (item.currency === 'USD') totalUSD += rowTotal;
      else totalUZS += rowTotal;
    });

    const rate = Number(exchangeRate) || 12500;

    return {
      grandTotalUZS: totalUZS + totalUSD * rate,
      totalCount: qty
    };
  }, [selectedItems, exchangeRate]);

  const handlePreSave = () => {
    const cleanSupplier = supplierName.trim();

    if (!cleanSupplier) return toast.error("Ta'minotchi nomini tanlang!");
    if (!invoiceNumber.trim()) return toast.error("Faktura raqami bo'sh bo'lmasin");
    if (!Number(exchangeRate) || Number(exchangeRate) <= 0) {
      return toast.error("Valyuta kursini to'g'ri kiriting!");
    }
    if (selectedItems.length === 0) return toast.error("Kamida bitta mahsulot qo'shing!");

    const invalidItem = selectedItems.find((item) => {
      const qty = Number(item.count);
      const price = Number(item.price);
      const sale = Number(item.salePrice);

      if (!qty || qty <= 0) return true;
      if (!Number.isFinite(price) || price <= 0) return true;
      if (!Number.isFinite(sale) || sale <= 0) return true;
      if ((item.unit || 'Dona') === 'Dona' && !Number.isInteger(qty)) return true;
      return false;
    });

    if (invalidItem) {
      return toast.error(`Xato: ${invalidItem.name} uchun ma'lumot noto'g'ri`);
    }

    setShowConfirmModal(true);
  };

  const handleSaveInvoice = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        date,
        supplier: supplierName.trim(),
        supplierName: supplierName.trim(),
        invoiceNumber: invoiceNumber.trim(),
        exchangeRate: Number(exchangeRate) || 12500,
        totalSum: grandTotalUZS,
        status,
        userName: currentUserName,
        items: selectedItems.map((item) => ({
          id: item.id,
          productId: item.productId || item.id,
          customId: Number(item.customId) || 0,
          name: item.name,
          count: Number(item.count),
          price: Number(item.price),
          markup: Number(item.markup) || 0,
          salePrice: Number(item.salePrice) || 0,
          currency: item.currency || 'UZS',
          total: (Number(item.count) || 0) * (Number(item.price) || 0),
          categoryId: item.categoryId || null,
          brandId: item.brandId || null,
          color: item.color || '',
          memory: item.memory || '',
          model: item.model || ''
        }))
      };

      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: 'PUT',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success('Faktura muvaffaqiyatli yangilandi!');
        navigate('/ombor/taminotchi-kirim');
      } else {
        toast.error(data?.error || `Yangilashda xatolik yuz berdi (${res.status})`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={36} />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => navigate('/ombor/taminotchi-kirim')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <h1 className="text-xl font-medium text-slate-900">Kirimni tahrirlash</h1>
            <p className="text-sm text-slate-500 mt-0.5">Ma'lumotlarni yangilang</p>
          </div>
        </div>

        <button
          disabled={isSubmitting || selectedItems.length === 0}
          onClick={handlePreSave}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Saqlash
        </button>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'invoice'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Faktura
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === 'products'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mahsulotlar
          </button>
        </div>
      </div>

      {activeTab === 'invoice' && (
        <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-3 flex-1 min-h-0">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-2 text-sm">
                Faktura
              </h3>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Raqam
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={invoiceNumber}
                    className="w-full p-2.5 border rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Ta'minotchi
                  </label>
                  <select
                    disabled={isSubmitting}
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 outline-amber-500"
                  >
                    <option value="" disabled>Tanlang</option>
                    {suppliersList.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    {supplierName &&
                      !suppliersList.find((s) => s.name === supplierName) && (
                        <option value={supplierName}>{supplierName}</option>
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Sana
                  </label>
                  <input
                    type="date"
                    disabled={isSubmitting}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 border rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 outline-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Kurs
                  </label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full p-2.5 border rounded-xl border-amber-300 bg-amber-50 text-sm font-semibold text-amber-700 outline-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Umumiy
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mahsulot:</span>
                  <span className="font-semibold">{selectedItems.length} ta</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Soni:</span>
                  <span className="font-semibold">{totalCount} ta</span>
                </div>

                <div className="pt-2.5 border-t border-slate-700/50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Jami
                  </div>
                  <div className="text-xl font-semibold text-emerald-400">
                    {grandTotalUZS.toLocaleString()}
                    <span className="text-xs ml-1 text-emerald-500">UZS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm">Mahsulot qo'shish</h3>
              <div className="text-xs text-slate-400">Avval mahsulot tanlanadi</div>
            </div>

            <div className="p-3 space-y-3 overflow-auto">
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                  Tovar nomi yoki kod
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 p-2.5 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700"
                    placeholder="Qidirish..."
                  />

                  <button
                    disabled={isSubmitting}
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Plus size={15} />
                    Qo'shish
                  </button>
                </div>

                {filteredProducts.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-64 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <li
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-3 hover:bg-amber-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                        <div className="text-xs text-amber-600 mt-1 font-mono">
                          ID: #{p.customId ?? '-'} | kirim: {p.buyPrice || 0} {p.buyCurrency || 'UZS'} | sotuv: {p.salePrice || 0}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                  Qo'shilgan mahsulotlar
                </div>

                <div className="p-3">
                  {selectedItems.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      Mahsulot tanlanmagan
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {selectedItems.map((item) => (
                        <div
                          key={item.localId}
                          className="rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-800 break-words">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                ID: #{item.customId || '-'}
                              </div>
                            </div>

                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <Package size={15} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Soni
                              </div>
                              <div className="mt-1 font-semibold text-blue-600">
                                {Number(item.count || 0)} {item.unit || 'Dona'}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Jami
                              </div>
                              <div className="mt-1 font-semibold text-slate-800">
                                {(Number(item.count || 0) * Number(item.price || 0)).toLocaleString()}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Kirim
                              </div>
                              <div className="mt-1 font-semibold text-slate-700">
                                {Number(item.price || 0).toLocaleString()} {item.currency}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Sotuv
                              </div>
                              <div className="mt-1 font-semibold text-emerald-600">
                                {Number(item.salePrice || 0).toLocaleString()} UZS
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleRemoveItem(item.localId)}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                              O'chirish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Boxes size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">
              Mahsulot parametrlarini kiriting
            </h3>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {selectedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Avval Faktura bo‘limida mahsulot qo‘shing
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-auto border border-slate-200 rounded-2xl">
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-left">Kod</th>
                        <th className="p-3 text-left">Nomi</th>
                        <th className="p-3 text-center w-[90px]">Soni</th>
                        <th className="p-3 text-right w-[150px]">Kirim narx</th>
                        <th className="p-3 text-center w-[130px]">Valyuta</th>
                        <th className="p-3 text-center w-[140px]">Ustama %</th>
                        <th className="p-3 text-right w-[170px]">Sotuv narx</th>
                        <th className="p-3 text-right w-[150px]">Jami</th>
                        <th className="p-3 text-center w-[80px]">Amal</th>
                      </tr>
                    </thead>

                    <tbody className="text-slate-700">
                      {selectedItems.map((item) => (
                        <tr key={item.localId} className="border-b border-slate-100">
                          <td className="p-2">
                            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 text-center">
                              #{item.customId ?? '-'}
                            </div>
                          </td>

                          <td className="p-2 min-w-[260px]">
                            <div className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-semibold text-slate-700">
                              {item.name}
                            </div>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              disabled={isSubmitting}
                              step={(item.unit || 'Dona') === 'Dona' ? '1' : '0.01'}
                              value={item.count}
                              onChange={(e) => updateItem(item.localId, 'count', e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-lg outline-amber-500 text-sm text-center font-medium text-slate-700"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              disabled={isSubmitting}
                              value={item.price}
                              onChange={(e) => updateItem(item.localId, 'price', e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-lg outline-amber-500 text-sm text-right font-medium text-slate-700"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              disabled={isSubmitting}
                              value={item.currency}
                              onChange={(e) => updateItem(item.localId, 'currency', e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-lg outline-amber-500 text-sm font-medium text-slate-700 bg-white"
                            >
                              <option value="UZS">UZS</option>
                              <option value="USD">USD</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              disabled={isSubmitting}
                              value={item.markup}
                              onChange={(e) => updateItem(item.localId, 'markup', e.target.value)}
                              className="w-full p-2.5 border border-amber-200 bg-amber-50 rounded-lg outline-amber-500 text-sm text-center font-semibold text-amber-700"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              disabled={isSubmitting}
                              value={item.salePrice}
                              onChange={(e) => updateItem(item.localId, 'salePrice', e.target.value)}
                              className="w-full p-2.5 border border-emerald-200 bg-emerald-50 rounded-lg outline-emerald-500 text-sm text-right font-semibold text-emerald-700"
                            />
                          </td>

                          <td className="p-2">
                            <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-right font-semibold text-slate-800">
                              {(Number(item.count || 0) * Number(item.price || 0)).toLocaleString()}
                            </div>
                          </td>

                          <td className="p-2 text-center">
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleRemoveItem(item.localId)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-500">
              <CheckCircle size={30} />
            </div>

            <h3 className="text-lg font-medium text-slate-800 mb-2">
              O'zgarishlarni saqlaysizmi?
            </h3>

            <p className="text-sm text-slate-500 mb-6 leading-6">
              Faktura ma'lumotlari yangilanadi.
            </p>

            <div className="flex gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Bekor qilish
              </button>

              <button
                disabled={isSubmitting}
                onClick={handleSaveInvoice}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSupplierIncome;