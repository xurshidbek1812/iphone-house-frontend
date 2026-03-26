import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Loader2,
  DollarSign,
  Package
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

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
      localId: `${invoice?.id || 'inv'}-${item?.id ?? item?.productId ?? index}`,
      id: item?.id ?? null,
      productId: item?.productId ?? item?.id ?? null,
      customId: item?.customId ?? '',
      name: item?.name || '',
      unit: item?.unit || 'Dona',
      count: Number(item?.count || 0),
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
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputMarkup, setInputMarkup] = useState('');
  const [inputSalePrice, setInputSalePrice] = useState('');
  const [inputCurrency, setInputCurrency] = useState('UZS');
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
      if (Array.isArray(productsData)) {
        setAllProducts(productsData);
      }
    }

    if (suppRes.status === 'fulfilled' && suppRes.value.ok) {
      const suppliersData = await parseJsonSafe(suppRes.value);
      if (Array.isArray(suppliersData)) {
        setSuppliersList(suppliersData);
      }
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

  const getCostInUZS = (price, currency, rate) => {
    const numPrice = Number(price) || 0;
    const numRate = Number(rate) || 12500;
    return currency === 'USD' ? numPrice * numRate : numPrice;
  };

  const resetAddInputs = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputMarkup('');
    setInputSalePrice('');
    setInputCurrency('UZS');
  };

  const handlePriceChange = (val) => {
    setInputPrice(val);
    const costUZS = getCostInUZS(val, inputCurrency, exchangeRate);

    if (inputMarkup !== '' && val !== '') {
      const sale = costUZS + costUZS * (Number(inputMarkup) / 100);
      setInputSalePrice(Math.round(sale));
    } else if (!val) {
      setInputSalePrice('');
    }
  };

  const handleMarkupChange = (val) => {
    setInputMarkup(val);
    const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);

    if (inputPrice && val !== '') {
      const sale = costUZS + costUZS * (Number(val) / 100);
      setInputSalePrice(Math.round(sale));
    } else if (val === '') {
      setInputSalePrice('');
    }
  };

  const handleSalePriceChange = (val) => {
    setInputSalePrice(val);
    const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);

    if (inputPrice && val && costUZS > 0) {
      const markup = ((Number(val) - costUZS) / costUZS) * 100;
      setInputMarkup(markup.toFixed(2));
    } else if (!val) {
      setInputMarkup('');
    }
  };

  const handleCurrencyChange = (val) => {
    setInputCurrency(val);
    const costUZS = getCostInUZS(inputPrice, val, exchangeRate);

    if (inputPrice && inputMarkup !== '') {
      const sale = costUZS + costUZS * (Number(inputMarkup) / 100);
      setInputSalePrice(Math.round(sale));
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name || '');
    setInputPrice(prod.buyPrice || '');
    setInputCurrency(prod.buyCurrency || 'UZS');

    const costUZS = getCostInUZS(prod.buyPrice, prod.buyCurrency || 'UZS', exchangeRate);

    if (costUZS > 0 && prod.salePrice) {
      setInputSalePrice(prod.salePrice);
      const markup = ((prod.salePrice - costUZS) / costUZS) * 100;
      setInputMarkup(markup.toFixed(2));
    } else {
      setInputSalePrice('');
      setInputMarkup('');
    }
  };

  const handleAddItem = () => {
    let productToAdd = selectedProduct;

    if (!productToAdd && searchTerm) {
      const cleanSearch = searchTerm.trim().toLowerCase();
      productToAdd = allProducts.find(
        (p) =>
          (p.name || '').toLowerCase() === cleanSearch ||
          String(p.customId || '') === cleanSearch
      );
    }

    if (!productToAdd) {
      return toast.error("Bazada topilmadi! To'g'ri tanlang.");
    }

    if (selectedItems.some((item) => String(item.productId || item.id) === String(productToAdd.id))) {
      return toast.error("Bu tovar allaqachon qo'shilgan!");
    }

    const qty = Number(inputCount);
    const price = Number(inputPrice);
    const sale = Number(inputSalePrice);

    if (!qty || qty <= 0) {
      return toast.error("Sonini to'g'ri kiriting!");
    }

    if ((productToAdd.unit || 'Dona') === 'Dona' && !Number.isInteger(qty)) {
      return toast.error("Dona o'lchov birligi uchun miqdor butun son bo'lishi shart!");
    }

    if (!price || price <= 0) {
      return toast.error("Kirim narxini to'g'ri kiriting!");
    }

    if (!sale || sale <= 0) {
      return toast.error("Sotuv narxini to'g'ri kiriting!");
    }

    const newItem = {
      localId: `added-${Date.now()}-${productToAdd.id}`,
      id: productToAdd.id,
      productId: productToAdd.id,
      customId: productToAdd.customId,
      name: productToAdd.name,
      unit: productToAdd.unit || 'Dona',
      count: qty,
      price,
      markup: Number(inputMarkup) || 0,
      salePrice: sale,
      currency: inputCurrency || 'UZS',
      total: qty * price,
      categoryId: productToAdd.categoryId || null,
      brandId: productToAdd.brandId || null,
      color: productToAdd.color || '',
      memory: productToAdd.memory || '',
      model: productToAdd.model || ''
    };

    setSelectedItems((prev) => [...prev, newItem]);
    resetAddInputs();
  };

  const updateItem = (localId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.localId !== localId) return item;

        const updatedItem = { ...item, [field]: value };

        const currentCurrency = field === 'currency' ? value : updatedItem.currency;
        const currentPrice = field === 'price' ? Number(value) || 0 : Number(updatedItem.price) || 0;
        const currentCount = field === 'count' ? Number(value) || 0 : Number(updatedItem.count) || 0;

        const costUZS = getCostInUZS(currentPrice, currentCurrency, exchangeRate);

        if (field === 'price' || field === 'currency' || field === 'count') {
          updatedItem.total = currentCount * currentPrice;
          if (updatedItem.markup !== '' && updatedItem.markup != null) {
            updatedItem.salePrice = Math.round(
              costUZS + costUZS * (Number(updatedItem.markup) / 100)
            );
          }
        }

        if (field === 'markup') {
          updatedItem.salePrice = Math.round(
            costUZS + costUZS * ((Number(value) || 0) / 100)
          );
        }

        if (field === 'salePrice') {
          if (costUZS > 0) {
            updatedItem.markup = Number(
              ((((Number(value) || 0) - costUZS) / costUZS) * 100).toFixed(2)
            );
          }
        }

        return updatedItem;
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setSelectedItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.localId !== localId);
    });
  };

  const { grandTotalUZS, totalCount } = useMemo(() => {
    let totalUZS = 0;
    let totalUSD = 0;
    let qty = 0;

    selectedItems.forEach((item) => {
      qty += Number(item.count || 0);
      if (item.currency === 'USD') totalUSD += Number(item.total) || 0;
      else totalUZS += Number(item.total) || 0;
    });

    const rate = Number(exchangeRate) || 12500;
    return {
      grandTotalUZS: totalUZS + totalUSD * rate,
      totalCount: qty
    };
  }, [selectedItems, exchangeRate]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm || selectedProduct) return [];
    const cleanSearch = searchTerm.trim().toLowerCase();

    return allProducts.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(cleanSearch) ||
        (p.customId != null && p.customId.toString().includes(cleanSearch))
    );
  }, [allProducts, searchTerm, selectedProduct]);

  const handlePreSave = () => {
    const cleanSupplier = supplierName.trim();

    if (!cleanSupplier) return toast.error("Ta'minotchi nomini tanlang!");
    if (selectedItems.length === 0) return toast.error("Fakturaga tovar qo'shing!");
    if (!invoiceNumber.trim()) return toast.error("Faktura raqami bo'sh bo'lmasin");
    if (!Number(exchangeRate) || Number(exchangeRate) <= 0)
      return toast.error("Valyuta kursini to'g'ri kiriting!");

    const invalidItem = selectedItems.find((item) => {
      const qty = Number(item.count);
      const price = Number(item.price);
      const sale = Number(item.salePrice);

      if (!item.name?.trim()) return true;
      if (!qty || qty <= 0) return true;
      if (item.unit === 'Dona' && !Number.isInteger(qty)) return true;
      if (Number.isNaN(price) || price < 0) return true;
      if (Number.isNaN(sale) || sale < 0) return true;

      return false;
    });

    if (invalidItem) {
      return toast.error(`Xato: ${invalidItem.name || 'Mahsulot'} uchun ma'lumot noto'g'ri!`);
    }

    setShowConfirmModal(true);
  };

  const handleSaveInvoice = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        date,
        supplier: supplierName.trim(),
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
          total: Number(item.total) || 0,
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
            <p className="text-sm text-slate-500 mt-0.5">
              Eski ma'lumotlar bilan tahrirlash
            </p>
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
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
                Faktura ma'lumoti
              </h3>

              <div className="space-y-3">
                <input
                  type="text"
                  readOnly
                  className="w-full p-3 border rounded-xl border-slate-200 bg-slate-50 outline-none text-sm font-semibold text-slate-700"
                  placeholder="Faktura raqami"
                  value={invoiceNumber}
                />

                <select
                  disabled={isSubmitting}
                  className="w-full p-3 border rounded-xl border-slate-200 bg-white outline-amber-500 text-sm font-medium text-slate-700"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                >
                  <option value="" disabled>Ta'minotchini tanlang</option>
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

                <input
                  type="date"
                  disabled={isSubmitting}
                  className="w-full p-3 border rounded-xl border-slate-200 bg-white outline-amber-500 text-sm font-medium text-slate-700"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <input
                  type="number"
                  disabled={isSubmitting}
                  className="w-full p-3 border rounded-xl border-amber-300 bg-amber-50 outline-amber-500 text-sm font-semibold text-amber-700"
                  placeholder="1 USD kursi"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">
                Umumiy hisob
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tovar soni:</span>
                  <span className="font-semibold">{totalCount} ta</span>
                </div>

                <div className="border-t border-slate-700/50 pt-3">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    Jami
                  </p>
                  <p className="text-2xl font-semibold text-emerald-400 tracking-tight">
                    {grandTotalUZS.toLocaleString()}
                    <span className="text-sm font-medium text-emerald-500 ml-1">UZS</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-700">
                Tovarni tanlash va narxlash
              </h3>
            </div>

            <div className="p-4 space-y-4 overflow-auto">
              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_.7fr_.7fr_.6fr_.7fr_.7fr_auto] gap-3 items-start">
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Tovar nomi / Kod
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700"
                    placeholder="Qidirish..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedProduct(null);
                    }}
                  />

                  {filteredProducts.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-3 hover:bg-amber-50 cursor-pointer text-sm border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-slate-800">{p.name}</div>
                          <div className="text-amber-600 font-mono text-xs mt-1">
                            ID: #{p.customId ?? '-'} | {p.buyPrice} {p.buyCurrency}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Soni
                  </label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700"
                    placeholder="0"
                    value={inputCount}
                    onChange={(e) => setInputCount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Kirim narx
                  </label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700"
                    placeholder="0"
                    value={inputPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Valyuta
                  </label>
                  <select
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700 bg-white"
                    value={inputCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Ustama %
                  </label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-amber-500 text-sm font-medium text-slate-700"
                    placeholder="0"
                    value={inputMarkup}
                    onChange={(e) => handleMarkupChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    Sotuv narx
                  </label>
                  <input
                    type="number"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl outline-emerald-500 text-sm font-semibold text-emerald-700"
                    placeholder="0"
                    value={inputSalePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                  />
                </div>

                <div className="pt-6">
                  <button
                    disabled={isSubmitting}
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Qo'shish
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                  Fakturadagi mahsulotlar
                </div>

                <div className="overflow-auto max-h-[48vh]">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-left">Kod</th>
                        <th className="p-3 text-left">Nomi</th>
                        <th className="p-3 text-center">Soni</th>
                        <th className="p-3 text-right">Kirim</th>
                        <th className="p-3 text-center">Valyuta</th>
                        <th className="p-3 text-center">Ustama</th>
                        <th className="p-3 text-right">Sotuv</th>
                        <th className="p-3 text-right">Jami</th>
                        <th className="p-3 text-center">Amal</th>
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
                            <input
                              type="text"
                              disabled={isSubmitting}
                              value={item.name}
                              onChange={(e) => updateItem(item.localId, 'name', e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-lg outline-amber-500 text-sm font-medium text-slate-700"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              disabled={isSubmitting}
                              step={item.unit === 'Dona' ? '1' : '0.01'}
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
                              onChange={(e) =>
                                updateItem(item.localId, 'salePrice', e.target.value)
                              }
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
                              disabled={isSubmitting || selectedItems.length === 1}
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
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Package size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Mahsulotlar ro'yxati</h3>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {selectedItems.map((item) => (
                <div
                  key={item.localId}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
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
                      disabled={isSubmitting || selectedItems.length === 1}
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