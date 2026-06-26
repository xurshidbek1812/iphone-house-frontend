import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Package,
  Lock,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';
import { fuzzyMatchProduct } from '../../utils/fuzzyMatch';

const EditSupplierIncome = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const canSeeAmount = hasPermission(PERMISSIONS.INVENTORY_VIEW_AMOUNTS);

  const [allProducts, setAllProducts] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currencyRate, setCurrencyRate] = useState('12500');
  const [status, setStatus] = useState('Jarayonda');

  const [invoiceItems, setInvoiceItems] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputMarkup, setInputMarkup] = useState('');
  const [inputSalePrice, setInputSalePrice] = useState('');
  const [inputCurrency, setInputCurrency] = useState('UZS');
  const [wantsImei, setWantsImei] = useState(false);
  const [imeiInputs, setImeiInputs] = useState([]);
  const [expandedImeiId, setExpandedImeiId] = useState(null);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  const fetchData = useCallback(
    async (invoiceId) => {
      try {
        setLoading(true);

        const [productsData, suppliersData, warehousesData] = await Promise.all([
          apiFetch('/api/products'),
          apiFetch('/api/suppliers'),
          apiFetch('/api/warehouses?active=true')
        ]);

        const products = Array.isArray(productsData) ? productsData : [];
        setAllProducts(products);
        setSuppliersList(Array.isArray(suppliersData) ? suppliersData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);

        let invoice = null;

        try {
          invoice = await apiFetch(`/api/invoices/${invoiceId}`);
        } catch {
          const listData = await apiFetch('/api/invoices');
          const invoices = Array.isArray(listData?.items)
            ? listData.items
            : Array.isArray(listData)
            ? listData
            : [];
          invoice = invoices.find((inv) => String(inv.id) === String(invoiceId)) || null;
        }

        if (!invoice) {
          toast.error('Faktura topilmadi!');
          navigate('/ombor/taminotchi-kirim');
          return;
        }

        if (invoice.status !== 'Jarayonda') {
          toast.error("Faqat 'Jarayonda' turgan kirimni tahrirlash mumkin!");
          navigate('/ombor/taminotchi-kirim');
          return;
        }

        setDate(
          invoice.date
            ? new Date(invoice.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setSupplierName(invoice.supplierName || invoice.supplier || '');
        setInvoiceNumber(invoice.invoiceNumber || '');
        setCurrencyRate(String(invoice.exchangeRate || '12500'));
        setStatus(invoice.status || 'Jarayonda');
        setWarehouseId(invoice.warehouseId ? String(invoice.warehouseId) : '');

        const items = Array.isArray(invoice.items) ? invoice.items : [];
        setInvoiceItems(
          items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              id: item.productId,
              customId: item.customId ?? product?.customId ?? '',
              name: item.name || product?.name || '',
              unit: product?.unit || 'Dona',
              count: Number(item.count || 0),
              price: Number(item.price || 0),
              markup: Number(item.markup || 0),
              salePrice: Number(item.salePrice || 0),
              currency: item.currency || 'UZS',
              total:
                Number(item.total || 0) ||
                Number(item.count || 0) * Number(item.price || 0),
              imeis:
                Array.isArray(item.imeis) && item.imeis.length
                  ? item.imeis.map((pair) =>
                      typeof pair === 'string' ? { imei: pair, imei2: '' } : pair
                    )
                  : null
            };
          })
        );
      } catch (error) {
        console.error('Yuklashda xato', error);
        toast.error(error.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchData(id);
  }, [fetchData, id]);

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
    setWantsImei(false);
    setImeiInputs([]);
  };

  const handleCountChange = (val) => {
    setInputCount(val);

    if (!wantsImei) return;

    const qty = Math.max(0, Math.floor(Number(val) || 0));
    setImeiInputs((prev) => {
      const next = prev.slice(0, qty);
      while (next.length < qty) next.push({ imei: '', imei2: '' });
      return next;
    });
  };

  const handleToggleImei = () => {
    if (wantsImei) {
      setWantsImei(false);
      setImeiInputs([]);
      return;
    }

    const qty = Math.floor(Number(inputCount) || 0);
    if (!qty || qty <= 0 || !Number.isInteger(Number(inputCount))) {
      return toast.error("Avval sonini butun musbat son qilib kiriting!");
    }

    setWantsImei(true);
    setImeiInputs(Array.from({ length: qty }, () => ({ imei: '', imei2: '' })));
  };

  const handleImeiInputChange = (index, field, val) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 15);
    setImeiInputs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: sanitized } : pair))
    );
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

    let imeis = null;

    if (wantsImei) {
      const trimmed = imeiInputs.map((pair) => ({
        imei: pair.imei.trim(),
        imei2: pair.imei2.trim()
      }));

      if (trimmed.length !== qty) {
        return toast.error("Barcha telefonlar uchun IMEI kiritilishi shart!");
      }

      const flatCodes = trimmed.flatMap((pair) => [pair.imei, pair.imei2]);

      if (flatCodes.some((code) => !code)) {
        return toast.error("Har bir telefon uchun ikkita IMEI ham kiritilishi shart!");
      }

      if (flatCodes.some((code) => !/^\d{15}$/.test(code))) {
        return toast.error("Har bir IMEI aynan 15 ta raqamdan iborat bo'lishi kerak!");
      }

      if (new Set(flatCodes).size !== flatCodes.length) {
        return toast.error("IMEI raqamlari orasida takrorlanish bor!");
      }

      const usedElsewhere = invoiceItems.some(
        (item) =>
          Array.isArray(item.imeis) &&
          item.imeis.some(
            (pair) => flatCodes.includes(pair.imei) || flatCodes.includes(pair.imei2)
          )
      );

      if (usedElsewhere) {
        return toast.error("Bu IMEI raqami fakturada boshqa qatorda allaqachon ishlatilgan!");
      }

      imeis = trimmed;
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
      total: canSeeAmount ? qty * price : 0,
      imeis
    };

    setInvoiceItems((prev) => [...prev, newItem]);
    resetItemInputs();
  };

  const removeFromInvoice = (itemId) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== itemId));
    setExpandedImeiId((prev) => (prev === itemId ? null : prev));
  };

  const toggleImeiExpand = (itemId) => {
    setExpandedImeiId((prev) => (prev === itemId ? null : itemId));
  };

  const updateInvoiceItemField = (itemId, field, rawValue) => {
    setInvoiceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = {
          ...item,
          [field]: field === 'currency' ? rawValue : Number(rawValue) || 0
        };

        const qty = Number(updated.count) || 0;
        const price = canSeeAmount ? Number(updated.price) || 0 : 0;
        const sale = Number(updated.salePrice) || 0;
        const costUZS = getCostInUZS(price, updated.currency, currencyRate);

        updated.total = canSeeAmount ? qty * price : 0;
        updated.markup =
          canSeeAmount && costUZS > 0
            ? Number((((sale - costUZS) / costUZS) * 100).toFixed(2))
            : 0;

        return updated;
      })
    );
  };

  const updateInvoiceItemImei = (itemId, index, field, value) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 15);
    setInvoiceItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              imeis: item.imeis.map((pair, i) =>
                i === index ? { ...pair, [field]: sanitized } : pair
              )
            }
          : item
      )
    );
  };

  const closeImeiExpand = (item) => {
    const trimmed = (item.imeis || []).map((pair) => ({
      imei: pair.imei.trim(),
      imei2: pair.imei2.trim()
    }));

    const flatCodes = trimmed.flatMap((pair) => [pair.imei, pair.imei2]);

    if (flatCodes.some((code) => !code)) {
      return toast.error("Har bir telefon uchun ikkita IMEI ham kiritilishi shart!");
    }

    if (flatCodes.some((code) => !/^\d{15}$/.test(code))) {
      return toast.error("Har bir IMEI aynan 15 ta raqamdan iborat bo'lishi kerak!");
    }

    if (new Set(flatCodes).size !== flatCodes.length) {
      return toast.error("IMEI raqamlari orasida takrorlanish bor!");
    }

    const usedElsewhere = invoiceItems.some(
      (other) =>
        other.id !== item.id &&
        Array.isArray(other.imeis) &&
        other.imeis.some(
          (pair) => flatCodes.includes(pair.imei) || flatCodes.includes(pair.imei2)
        )
    );

    if (usedElsewhere) {
      return toast.error("Bu IMEI raqami boshqa qatorda allaqachon ishlatilgan!");
    }

    setInvoiceItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, imeis: trimmed } : it))
    );
    setExpandedImeiId(null);
  };

  const { grandTotalUZS, totalUZS, totalUSD } = useMemo(() => {
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
    return { grandTotalUZS: totalUZS + totalUSD * rate, totalUZS, totalUSD };
  }, [invoiceItems, currencyRate]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm || selectedProduct) return [];

    return allProducts.filter((p) => fuzzyMatchProduct(searchTerm, p));
  }, [allProducts, searchTerm, selectedProduct]);

  const handleSave = async () => {
    const cleanSupplier = supplierName.trim();

    if (!cleanSupplier) {
      return toast.error("Ta'minotchi nomini tanlang!");
    }

    if (!warehouseId) {
      return toast.error("Omborni tanlang!");
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
        invoiceNumber: invoiceNumber.trim(),
        exchangeRate: finalExchangeRate,
        totalSum: canSeeAmount ? grandTotalUZS : 0,
        status,
        warehouseId: Number(warehouseId),
        items: invoiceItems.map((item) => ({
          productId: item.id,
          customId: Number(item.customId) || 0,
          name: item.name,
          count: Number(item.count),
          price: canSeeAmount ? Number(item.price) : 0,
          markup: canSeeAmount ? Number(item.markup) || 0 : 0,
          salePrice: Number(item.salePrice) || 0,
          currency: item.currency || 'UZS',
          total: canSeeAmount ? Number(item.total) : 0,
          imeis: item.imeis || null
        }))
      };

      await apiFetch(`/api/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      toast.success('Faktura muvaffaqiyatli yangilandi!');
      navigate('/ombor/taminotchi-kirim');
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-xl font-semibold text-slate-900">Kirimni tahrirlash</h1>
            <p className="text-sm text-slate-500 mt-0.5">Ta'minotchi fakturasini tahrirlash</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => navigate('/ombor/taminotchi-kirim')}
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
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
            <div className="lg:col-span-9 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2 text-sm">
                  Asosiy ma'lumotlar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      {supplierName &&
                        !suppliersList.find((s) => s.name === supplierName) && (
                          <option value={supplierName}>{supplierName}</option>
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      Ombor <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                    >
                      <option value="">Tanlang...</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
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
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Tovar nomi / Kod
                    </label>

                    <input
                      type="text"
                      disabled={isSubmitting}
                      className="w-full h-14 px-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base"
                      placeholder="Tovar nomi yoki ID bo‘yicha qidiring..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedProduct(null);
                      }}
                    />

                    {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                      <ul className="absolute z-[9999] w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-2 max-h-[500px] overflow-y-auto">
                        {filteredProducts.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              {p.name}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-xs font-mono text-blue-600">
                                #{p.customId ?? '-'}
                              </div>

                              {canSeeAmount && (
                                <div className="text-xs text-slate-500">
                                  {p.buyPrice || 0} {p.buyCurrency || 'UZS'}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Soni
                      </label>

                      <input
                        type="number"
                        min="0"
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-200 rounded-xl"
                        value={inputCount}
                        onChange={(e) => handleCountChange(e.target.value)}
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
                          className="w-full p-3 border border-slate-200 rounded-xl"
                          value={inputPrice}
                          onChange={(e) => handlePriceChange(e.target.value)}
                        />

                        {inputCurrency === 'USD' && inputPrice && (
                          <div className="text-[11px] font-semibold text-slate-400 mt-1">
                            ≈ {Math.round(
                              getCostInUZS(inputPrice, inputCurrency, currencyRate)
                            ).toLocaleString('uz-UZ')} so'm
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Valyuta
                      </label>

                      <select
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-200 rounded-xl"
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
                          className="w-full p-3 border border-amber-200 bg-amber-50 rounded-xl"
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
                        className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl"
                        value={inputSalePrice}
                        onChange={(e) => handleSalePriceChange(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAddItem}
                        className="w-full h-[46px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2"
                      >
                        <Plus size={18} />
                        Qo‘shish
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleToggleImei}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        wantsImei
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Smartphone size={16} />
                      IMEI raqamlarini kiritish{wantsImei ? `: ${imeiInputs.length} ta` : '?'}
                    </button>

                    {wantsImei && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                        {imeiInputs.map((pair, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5"
                          >
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                              Telefon #{index + 1}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                                  IMEI 1
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={15}
                                  disabled={isSubmitting}
                                  className="w-full p-2 border border-indigo-200 bg-white rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                  value={pair.imei}
                                  onChange={(e) =>
                                    handleImeiInputChange(index, 'imei', e.target.value)
                                  }
                                  placeholder="15 raqamli IMEI"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                                  IMEI 2
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={15}
                                  disabled={isSubmitting}
                                  className="w-full p-2 border border-indigo-200 bg-white rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                  value={pair.imei2}
                                  onChange={(e) =>
                                    handleImeiInputChange(index, 'imei2', e.target.value)
                                  }
                                  placeholder="15 raqamli IMEI"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Jami soni
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {invoiceItems.reduce((sum, item) => sum + Number(item.count || 0), 0)} dona
                  </span>
                </div>
              </div>

              {canSeeAmount && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    Jami summa
                  </div>

                  {(totalUSD > 0 || totalUZS > 0) && (
                    <div className="flex flex-col gap-0.5 mb-2 pb-2 border-b border-slate-100">
                      {totalUSD > 0 && (
                        <div className="text-base font-bold text-blue-600 truncate">
                          {totalUSD.toLocaleString('en-US')}
                          <span className="text-xs text-blue-400 font-semibold ml-1">USD</span>
                        </div>
                      )}
                      {totalUZS > 0 && (
                        <div className="text-base font-bold text-slate-700 truncate">
                          {totalUZS.toLocaleString('uz-UZ')}
                          <span className="text-xs text-slate-400 font-semibold ml-1">UZS</span>
                        </div>
                      )}
                    </div>
                  )}

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

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                <Package size={16} className="text-blue-500" /> Qo'shilgan tovarlar
              </h3>
              <div className="text-sm text-slate-400 font-medium">
                {invoiceItems.length} ta qator
              </div>
            </div>

            <div className="p-5">
              {invoiceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Package size={42} className="mb-3 text-slate-300" />
                  <p className="font-medium text-sm">
                    Faktura bo'sh. Yuqoridan mahsulot qo'shing.
                  </p>
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-auto border border-slate-200 rounded-xl">
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
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-blue-50/20 transition-colors">
                            <td className="p-4 font-mono text-slate-400">
                              #{item.customId ?? '-'}
                            </td>
                            <td className="p-4 text-slate-800">
                              {item.name}
                              {Array.isArray(item.imeis) && item.imeis.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleImeiExpand(item.id)}
                                  title={item.imeis
                                    .map((pair) => `${pair.imei} / ${pair.imei2}`)
                                    .join('\n')}
                                  className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-semibold align-middle hover:bg-indigo-100"
                                >
                                  <Smartphone size={11} />
                                  IMEI: {item.imeis.length} ta
                                  {expandedImeiId === item.id ? (
                                    <ChevronUp size={11} />
                                  ) : (
                                    <ChevronDown size={11} />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="p-4 text-center text-blue-600">
                              {Array.isArray(item.imeis) && item.imeis.length > 0 ? (
                                <span title="IMEI biriktirilgan tovarlar uchun soni o'zgartirilmaydi">
                                  {item.count} {item.unit}
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step={item.unit === 'Dona' ? '1' : 'any'}
                                    disabled={isSubmitting}
                                    value={item.count}
                                    onChange={(e) =>
                                      updateInvoiceItemField(item.id, 'count', e.target.value)
                                    }
                                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-semibold text-blue-600 outline-none focus:ring-2 focus:ring-blue-200"
                                  />
                                  <span className="text-[11px] text-slate-400">{item.unit}</span>
                                </div>
                              )}
                            </td>

                            {canSeeAmount && (
                              <td className="p-4 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  disabled={isSubmitting}
                                  value={item.price}
                                  onChange={(e) =>
                                    updateInvoiceItemField(item.id, 'price', e.target.value)
                                  }
                                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                {item.currency === 'USD' && (
                                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                    ≈ {Math.round(
                                      getCostInUZS(item.price, item.currency, currencyRate)
                                    ).toLocaleString('uz-UZ')} so'm
                                  </div>
                                )}
                              </td>
                            )}

                            {canSeeAmount && (
                              <td className="p-4 text-center">
                                <select
                                  disabled={isSubmitting}
                                  value={item.currency}
                                  onChange={(e) =>
                                    updateInvoiceItemField(item.id, 'currency', e.target.value)
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  <option value="UZS">UZS</option>
                                  <option value="USD">USD</option>
                                </select>
                              </td>
                            )}

                            {canSeeAmount && (
                              <td className="p-4 text-center text-amber-600">{item.markup}%</td>
                            )}

                            <td className="p-4 text-right text-emerald-600">
                              <input
                                type="number"
                                min="0"
                                disabled={isSubmitting}
                                value={item.salePrice}
                                onChange={(e) =>
                                  updateInvoiceItemField(item.id, 'salePrice', e.target.value)
                                }
                                className="w-28 rounded-lg border border-emerald-200 bg-emerald-50/40 px-2 py-1.5 text-right text-sm font-semibold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-200"
                              />
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

                          {expandedImeiId === item.id && Array.isArray(item.imeis) && (
                            <tr className="bg-indigo-50/30">
                              <td colSpan={canSeeAmount ? 9 : 5} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {item.imeis.map((pair, index) => (
                                    <div
                                      key={index}
                                      className="rounded-xl border border-indigo-200 bg-white p-2.5"
                                    >
                                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                                        Telefon #{index + 1}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                                            IMEI 1
                                          </label>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={15}
                                            disabled={isSubmitting}
                                            value={pair.imei}
                                            onChange={(e) =>
                                              updateInvoiceItemImei(
                                                item.id,
                                                index,
                                                'imei',
                                                e.target.value
                                              )
                                            }
                                            className="w-full p-2 border border-indigo-200 bg-indigo-50/30 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                                            IMEI 2
                                          </label>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={15}
                                            disabled={isSubmitting}
                                            value={pair.imei2}
                                            onChange={(e) =>
                                              updateInvoiceItemImei(
                                                item.id,
                                                index,
                                                'imei2',
                                                e.target.value
                                              )
                                            }
                                            className="w-full p-2 border border-indigo-200 bg-indigo-50/30 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex justify-end mt-3">
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => closeImeiExpand(item)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    Saqlash
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSupplierIncome;
