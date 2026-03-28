import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  DollarSign,
  Package,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';

const SupplierIncome = () => {
  const navigate = useNavigate();
  const currentUserName = sessionStorage.getItem('userName') || 'Hodim';
  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase() || 'admin';

  const canSeeAmount = hasPermission(PERMISSIONS.INVENTORY_VIEW_AMOUNTS);
  const canApproveInvoice = hasPermission(PERMISSIONS.INVOICE_APPROVE);

  const canManageInvoiceDraft =
    userRole === 'admin' || userRole === 'director' || canApproveInvoice;

  const [allProducts, setAllProducts] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currencyRate, setCurrencyRate] = useState(
    sessionStorage.getItem('globalExchangeRate') || '12500'
  );

  const [invoiceItems, setInvoiceItems] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputMarkup, setInputMarkup] = useState('');
  const [inputSalePrice, setInputSalePrice] = useState('');
  const [inputCurrency, setInputCurrency] = useState('UZS');

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [productsData, suppliersData] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/suppliers')
      ]);

      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setSuppliersList(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error('Yuklashda xato', error);
      toast.error(error.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
      setAllProducts([]);
      setSuppliersList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setInvoiceNumber(Date.now().toString().slice(-6));
  }, [fetchData]);

  const getCostInUZS = (price, currency, rate) => {
    const numPrice = Number(price) || 0;
    const numRate = Number(rate) || 12500;
    return currency === 'USD' ? numPrice * numRate : numPrice;
  };

  const handlePriceChange = (val) => {
    setInputPrice(val);

    if (!canSeeAmount) return;

    const costUZS = getCostInUZS(val, inputCurrency, currencyRate);
    if (inputMarkup && val) {
      const sale = costUZS + costUZS * (Number(inputMarkup) / 100);
      setInputSalePrice(String(Math.round(sale)));
    }
  };

  const handleMarkupChange = (val) => {
    setInputMarkup(val);

    if (!canSeeAmount) return;

    const costUZS = getCostInUZS(inputPrice, inputCurrency, currencyRate);

    if (inputPrice && val) {
      const sale = costUZS + costUZS * (Number(val) / 100);
      setInputSalePrice(String(Math.round(sale)));
    } else if (!val) {
      setInputSalePrice('');
    }
  };

  const handleSalePriceChange = (val) => {
    setInputSalePrice(val);

    if (!canSeeAmount) return;

    const costUZS = getCostInUZS(inputPrice, inputCurrency, currencyRate);
    if (inputPrice && val && costUZS > 0) {
      const markup = ((Number(val) - costUZS) / costUZS) * 100;
      setInputMarkup(markup.toFixed(2));
    } else if (!val) {
      setInputMarkup('');
    }
  };

  const handleCurrencyChange = (val) => {
    setInputCurrency(val);

    if (!canSeeAmount) return;

    const costUZS = getCostInUZS(inputPrice, val, currencyRate);
    if (inputPrice && inputMarkup) {
      const sale = costUZS + costUZS * (Number(inputMarkup) / 100);
      setInputSalePrice(String(Math.round(sale)));
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name || '');
    setInputCurrency(prod.buyCurrency || 'UZS');

    if (canSeeAmount) {
      setInputPrice(prod.buyPrice != null ? String(prod.buyPrice) : '');

      const costUZS = getCostInUZS(
        prod.buyPrice,
        prod.buyCurrency || 'UZS',
        currencyRate
      );

      if (costUZS > 0 && prod.salePrice) {
        setInputSalePrice(String(prod.salePrice));
        const markup = ((prod.salePrice - costUZS) / costUZS) * 100;
        setInputMarkup(markup.toFixed(2));
      } else {
        setInputSalePrice('');
        setInputMarkup('');
      }
    } else {
      setInputPrice('');
      setInputMarkup('');
      setInputSalePrice('');
    }
  };

  const resetItemInputs = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputMarkup('');
    setInputSalePrice('');
    setInputCurrency('UZS');
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

    if (invoiceItems.some((item) => item.id === productToAdd.id)) {
      return toast.error("Bu tovar allaqachon qo'shilgan!");
    }

    const qty = Number(inputCount);
    const price = canSeeAmount ? Number(inputPrice) : 0;
    const sale = Number(inputSalePrice);

    if (!qty || qty <= 0) {
      return toast.error("Sonini to'g'ri kiriting!");
    }

    if (productToAdd.unit === 'Dona' && !Number.isInteger(qty)) {
      return toast.error("Dona o'lchov birligi uchun miqdor butun son bo'lishi shart!");
    }

    if (canSeeAmount) {
      if (!price || price <= 0) {
        return toast.error("Kirim narxini to'g'ri kiriting!");
      }
    }

    if (!sale || sale <= 0) {
      return toast.error("Sotuv narxini to'g'ri kiriting!");
    }

    const newItem = {
      id: productToAdd.id,
      customId: productToAdd.customId,
      name: productToAdd.name,
      unit: productToAdd.unit || 'Dona',
      count: qty,
      price,
      markup: canSeeAmount ? Number(inputMarkup) || 0 : 0,
      salePrice: sale,
      currency: inputCurrency || 'UZS',
      total: canSeeAmount ? qty * price : 0
    };

    setInvoiceItems((prev) => [...prev, newItem]);
    resetItemInputs();
  };

  const removeFromInvoice = (id) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const { grandTotalUZS } = useMemo(() => {
    let totalUZS = 0;
    let totalUSD = 0;

    invoiceItems.forEach((item) => {
      if (item.currency === 'USD') {
        totalUSD += Number(item.total) || 0;
      } else {
        totalUZS += Number(item.total) || 0;
      }
    });

    const rate = Number(currencyRate) || 12500;
    return { grandTotalUZS: totalUZS + totalUSD * rate };
  }, [invoiceItems, currencyRate]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm || selectedProduct) return [];

    const cleanSearch = searchTerm.trim().toLowerCase();

    return allProducts.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(cleanSearch) ||
        (p.customId != null && String(p.customId).includes(cleanSearch))
    );
  }, [allProducts, searchTerm, selectedProduct]);

  const handleSave = async () => {
    if (!canManageInvoiceDraft) {
      return toast.error("Sizda kirim yaratish huquqi yo'q!");
    }

    const cleanSupplier = supplierName.trim();

    if (!cleanSupplier) {
      return toast.error("Ta'minotchi nomini tanlang!");
    }

    if (invoiceItems.length === 0) {
      return toast.error("Fakturaga tovar qo'shing!");
    }

    if (!Number(currencyRate) || Number(currencyRate) <= 0) {
      return toast.error("Valyuta kursini to'g'ri kiriting!");
    }

    if (canSeeAmount) {
      const hasInvalidPrice = invoiceItems.some(
        (item) => !Number(item.price) || Number(item.price) <= 0
      );
      if (hasInvalidPrice) {
        return toast.error("Kirim narxlarida xatolik bor!");
      }
    }

    const hasInvalidSalePrice = invoiceItems.some(
      (item) => !Number(item.salePrice) || Number(item.salePrice) <= 0
    );

    if (hasInvalidSalePrice) {
      return toast.error("Sotuv narxlarida xatolik bor!");
    }

    setIsSubmitting(true);

    try {
      const finalExchangeRate = Number(currencyRate);

      const payload = {
        date,
        supplier: cleanSupplier,
        invoiceNumber: invoiceNumber.trim() || Date.now().toString().slice(-6),
        exchangeRate: finalExchangeRate,
        totalSum: canSeeAmount ? grandTotalUZS : 0,
        status: 'Jarayonda',
        userName: currentUserName,
        items: invoiceItems.map((item) => ({
          id: item.id,
          customId: Number(item.customId) || 0,
          name: item.name,
          count: Number(item.count),
          price: canSeeAmount ? Number(item.price) : 0,
          markup: canSeeAmount ? Number(item.markup) || 0 : 0,
          salePrice: Number(item.salePrice) || 0,
          currency: item.currency || 'UZS',
          total: canSeeAmount ? Number(item.total) : 0
        }))
      };

      await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success("Kirim 'Jarayonda' holatida saqlandi!");
      navigate('/ombor/taminotchi-kirim');
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageInvoiceDraft) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Ruxsat yo‘q
          </h2>
          <p className="text-slate-500 font-medium">
            Sizda yangi kirim yaratish huquqi yo‘q.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Yangi Kirim</h1>
            <p className="text-sm text-slate-500 mt-0.5">Ta'minotchi fakturasi yaratish</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Bekor qilish
          </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting || invoiceItems.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saqlanmoqda...
              </>
            ) : (
              <>
                <Save size={16} /> Saqlash
              </>
            )}
          </button>
        </div>
      </div>

      {!canSeeAmount && (
        <div className="bg-white mb-3 p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 text-slate-500">
          <Lock size={16} className="text-slate-400 shrink-0" />
          <span className="font-medium text-sm">
            Siz kirim summalarini ko‘rmaysiz. Shu sabab kirim narxi va jami summa yashirilgan.
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center">
          <Loader2 size={30} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            <div className="lg:col-span-9 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2 text-sm">
                  Asosiy ma'lumotlar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Faktura Raqami
                    </label>
                    <input
                      type="number"
                      disabled={isSubmitting}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="123456"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Ta'minotchi <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    >
                      <option value="">Tanlang...</option>
                      {suppliersList.map((s, i) => (
                        <option key={s.id || i} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Sana
                    </label>
                    <input
                      type="date"
                      disabled={isSubmitting}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  {canSeeAmount && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        Valyuta kursi
                      </label>
                      <input
                        type="number"
                        disabled={isSubmitting}
                        className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700 outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
                        value={currencyRate}
                        onChange={(e) => setCurrencyRate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2 text-sm">
                  Tovarni tanlash va narxlash
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_90px_110px_100px_110px_120px_auto] gap-3 items-start">
                    <div className="relative min-w-0">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Tovar nomi / Kod
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm disabled:bg-gray-50"
                        placeholder="Qidirish..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSelectedProduct(null);
                        }}
                      />

                      {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                        <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                          {filteredProducts.map((p) => (
                            <li
                              key={p.id}
                              onClick={() => handleSelectProduct(p)}
                              className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b transition-colors"
                            >
                              <div className="font-semibold text-gray-800">{p.name}</div>
                              <div className="text-blue-600 font-mono font-semibold text-xs mt-1">
                                ID: #{p.customId ?? '-'}
                                {canSeeAmount && <> | {p.buyPrice} {p.buyCurrency}</>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Soni
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-center font-medium text-sm disabled:bg-gray-50"
                        value={inputCount}
                        onChange={(e) => setInputCount(e.target.value)}
                      />
                    </div>

                    {canSeeAmount && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                          Kirim narx
                        </label>
                        <input
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                          className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 font-medium text-sm disabled:bg-gray-50"
                          value={inputPrice}
                          onChange={(e) => handlePriceChange(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Valyuta
                      </label>
                      <select
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-blue-500 text-sm font-medium bg-white disabled:bg-gray-50 cursor-pointer"
                        value={inputCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                      >
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    {canSeeAmount && (
                      <div>
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 block">
                          Ustama %
                        </label>
                        <input
                          type="number"
                          disabled={isSubmitting}
                          className="w-full p-3 border border-amber-200 bg-amber-50 rounded-xl outline-amber-500 font-semibold text-amber-700 text-sm text-center disabled:opacity-50"
                          placeholder="10"
                          value={inputMarkup}
                          onChange={(e) => handleMarkupChange(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">
                        Sotuv narx
                      </label>
                      <input
                        type="number"
                        disabled={isSubmitting}
                        className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl outline-emerald-500 font-semibold text-emerald-700 text-sm disabled:opacity-50"
                        placeholder={canSeeAmount ? 'Avtomat' : 'Kiriting'}
                        value={inputSalePrice}
                        onChange={(e) => handleSalePriceChange(e.target.value)}
                      />
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAddItem}
                        className="w-full h-[46px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center shadow-sm font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-4"
                      >
                        <Plus size={18} /> Qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                  Pozitsiyalar
                </div>
                <div className="text-3xl font-black text-blue-600">
                  {invoiceItems.length}
                  <span className="text-sm text-slate-400 font-semibold ml-1">xil</span>
                </div>
              </div>

              {canSeeAmount && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    Jami summa
                  </div>
                  <div
                    className="text-2xl font-black text-emerald-500 truncate"
                    title={`${grandTotalUZS.toLocaleString('uz-UZ')} UZS`}
                  >
                    {grandTotalUZS.toLocaleString('uz-UZ')}
                    <span className="text-sm text-emerald-600/60 font-semibold ml-1">UZS</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                <Package size={16} className="text-blue-500" /> Qo'shilgan tovarlar
              </h3>
              <div className="text-sm text-slate-400 font-medium">
                {invoiceItems.length} ta qator
              </div>
            </div>

            <div className="flex-1 min-h-0 p-5">
              {invoiceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Package size={42} className="mb-3 text-slate-300" />
                  <p className="font-medium text-sm">
                    Faktura bo'sh. Yuqoridan mahsulot qo'shing.
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-auto border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[880px] text-left whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Nomi</th>
                        <th className="p-4 w-24 text-center">Soni</th>
                        {canSeeAmount && <th className="p-4 w-32 text-right">Kirim</th>}
                        {canSeeAmount && <th className="p-4 w-24 text-center">Valyuta</th>}
                        {canSeeAmount && (
                          <th className="p-4 w-24 text-center text-amber-600">Ustama %</th>
                        )}
                        <th className="p-4 w-36 text-right text-emerald-600">Sotuv</th>
                        {canSeeAmount && <th className="p-4 w-32 text-right">Jami</th>}
                        <th className="p-4 w-16 text-center">X</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                      {invoiceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="p-4 font-mono text-slate-400">
                            #{item.customId ?? '-'}
                          </td>
                          <td className="p-4 text-slate-800">{item.name}</td>
                          <td className="p-4 text-center text-blue-600">
                            {item.count} {item.unit}
                          </td>

                          {canSeeAmount && (
                            <td className="p-4 text-right">
                              {Number(item.price || 0).toLocaleString('uz-UZ')}
                            </td>
                          )}

                          {canSeeAmount && (
                            <td className="p-4 text-center text-slate-400">{item.currency}</td>
                          )}

                          {canSeeAmount && (
                            <td className="p-4 text-center text-amber-600">{item.markup}%</td>
                          )}

                          <td className="p-4 text-right text-emerald-600">
                            {Number(item.salePrice || 0).toLocaleString('uz-UZ')}
                          </td>

                          {canSeeAmount && (
                            <td className="p-4 text-right font-bold text-slate-800">
                              {Number(item.total || 0).toLocaleString('uz-UZ')}
                            </td>
                          )}

                          <td className="p-4 text-center">
                            <button
                              disabled={isSubmitting}
                              onClick={() => removeFromInvoice(item.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                              title="O'chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierIncome;