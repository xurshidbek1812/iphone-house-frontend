import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  User,
  X,
  ShoppingCart,
  Save,
  ScanLine,
  Trash2,
  Plus,
  Loader2,
  Package,
  ChevronLeft,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseQrCode } from '../../utils/qrParser';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PRODUCTS_PER_PAGE = 8;

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const SearchableSelect = ({ placeholder, onSelect, customers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers.slice(0, 30);
    const lower = search.toLowerCase();

    return customers.filter((c) => {
      const text =
        `${c.firstName || ''} ${c.lastName || ''} ${c.middleName || ''} ${c.pinfl || ''} ${
          c.document?.number || ''
        } ${c.phone || ''} ${c.phones?.[0]?.phone || ''}`.toLowerCase();

      return text.includes(lower);
    });
  }, [customers, search]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 cursor-text transition-all focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 text-slate-400" size={15} />
        <input
          type="text"
          className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onSelect(customer);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full border-b border-slate-100 p-3 text-left transition-colors last:border-0 hover:bg-blue-50"
              >
                <div className="text-sm font-semibold text-slate-800">
                  {customer.lastName} {customer.firstName} {customer.middleName || ''}
                </div>
                <div className="mt-1 flex gap-3 text-[11px] text-slate-500">
                  <span>JSHSHIR: {customer.pinfl ?? '-'}</span>
                  <span>Tel: {customer.phones?.[0]?.phone || customer.phone || '-'}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm font-medium text-slate-400">Mijoz topilmadi</div>
          )}
        </div>
      )}
    </div>
  );
};

const AddCashSale = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const barcodeInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState(null);

  const [saleData, setSaleData] = useState({
    isAnonymous: false,
    mainCustomer: null,
    otherName: '',
    otherPhone: '+998 ',
    items: [],
    note: ''
  });

  const [productTab, setProductTab] = useState('catalog');
  const [productSearch, setProductSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);

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

  const getCustomerPhone = (customer) => {
    if (!customer) return 'Tel kiritilmagan';
    if (Array.isArray(customer.phones) && customer.phones.length > 0) return customer.phones[0].phone;
    if (typeof customer.phones === 'string' && customer.phones.trim() !== '') return customer.phones;
    if (customer.phone) return customer.phone;
    return 'Tel kiritilmagan';
  };

  const getItemSubtotal = useCallback((item) => {
    return Number(item.salePrice || 0) * Number(item.qty || 0);
  }, []);

  const getItemDiscount = useCallback((item) => {
    return Number(item.discount || 0);
  }, []);

  const getItemTotal = useCallback(
    (item) => Number(item.salePrice || 0) * Number(item.qty || 0) - Number(item.discount || 0),
    []
  );

  const getPerUnitDiscount = useCallback((item) => {
    const qty = Number(item.qty || 0);
    if (!qty) return 0;
    return Number(item.discount || 0) / qty;
  }, []);

  const fetchData = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      try {
        setDataLoading(true);

        const [custRes, prodRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/customers`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal })
        ]);

        if (custRes.status === 'fulfilled' && custRes.value.ok) {
          const cData = await parseJsonSafe(custRes.value);
          if (Array.isArray(cData)) setCustomers(cData);
        }

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const pData = await parseJsonSafe(prodRes.value);

          if (Array.isArray(pData)) {
            const catalogProducts = [];
            const extractedBatches = [];

            pData.forEach((prod) => {
              const productSalePrice = Number(prod.salePrice || 0);

              if (Number(prod.quantity || 0) > 0) {
                catalogProducts.push({
                  id: prod.id,
                  customId: prod.customId,
                  name: prod.name,
                  quantity: Number(prod.quantity || 0),
                  salePrice: productSalePrice,
                  unit: prod.unit || 'Dona'
                });
              }

              if (Array.isArray(prod.batches) && prod.batches.length > 0) {
                prod.batches.forEach((batch) => {
                  if (Number(batch.quantity || 0) > 0 && !batch.isArchived) {
                    extractedBatches.push({
                      id: prod.id,
                      batchId: batch.id,
                      customId: prod.customId,
                      name: prod.name,
                      quantity: Number(batch.quantity || 0),
                      buyPrice: Number(batch.buyPrice || 0),
                      salePrice: productSalePrice,
                      buyCurrency: batch.buyCurrency,
                      unit: prod.unit || 'Dona',
                      scanType: 'BATCH'
                    });
                  }
                });
              }
            });

            setProducts(catalogProducts);
            setAllBatches(extractedBatches);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
        }
      } finally {
        if (!signal?.aborted) setDataLoading(false);
      }
    },
    [token, getAuthHeaders]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.trim().toLowerCase();

    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.customId != null && String(p.customId).includes(search))
    );
  }, [products, productSearch]);

  useEffect(() => {
    setCatalogPage(1);
  }, [productSearch]);

  const totalCatalogPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, catalogPage]);

  const grossTotal = useMemo(() => {
    return saleData.items.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  }, [saleData.items, getItemSubtotal]);

  const totalDiscount = useMemo(() => {
    return saleData.items.reduce((sum, item) => sum + getItemDiscount(item), 0);
  }, [saleData.items, getItemDiscount]);

  const finalAmount = useMemo(() => {
    return saleData.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  }, [saleData.items, getItemTotal]);

  const addBatchToCart = (batch) => {
    if (Number(batch.quantity || 0) <= 0) {
      return toast.error("Ushbu partiyada qoldiq yo'q!");
    }

    const existingItem = saleData.items.find((i) => i.batchId === batch.batchId);

    if (existingItem) {
      if (Number(existingItem.qty || 0) + 1 > Number(batch.quantity || 0)) {
        return toast.error(`Ushbu partiyada faqat ${batch.quantity} ta qolgan!`);
      }

      setSaleData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.batchId === batch.batchId ? { ...item, qty: Number(item.qty || 0) + 1 } : item
        )
      }));

      toast.success('Soni oshirildi');
    } else {
      setSaleData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            ...batch,
            qty: 1,
            discount: 0,
            scanType: 'BATCH'
          }
        ]
      }));

      toast.success("Savatga qo'shildi");
    }
  };

  const removeItem = (batchId) => {
    setSaleData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.batchId !== batchId)
    }));
  };

  const handleProductClick = (product) => {
    const productBatches = allBatches.filter((b) => b.id === product.id);

    if (productBatches.length === 1) {
      addBatchToCart(productBatches[0]);
      return;
    }

    if (productBatches.length > 1) {
      setSelectedProductForBatches(product);
      return;
    }

    toast.error("Ushbu tovar uchun faol partiya topilmadi");
  };

  const updateCartItemQty = (batchId, value) => {
    const numericValue = Number(value);

    if (value === '') {
      setSaleData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.batchId === batchId ? { ...item, qty: '' } : item
        )
      }));
      return;
    }

    if (isNaN(numericValue)) return;

    const targetItem = saleData.items.find((item) => item.batchId === batchId);
    if (!targetItem) return;

    if (numericValue <= 0) {
      toast.error("Mahsulot soni 1 tadan kam bo'lishi mumkin emas!");
      return;
    }

    if (!Number.isInteger(numericValue)) {
      toast.error("Mahsulot soni butun son bo'lishi kerak!");
      return;
    }

    if (numericValue > Number(targetItem.quantity || 0)) {
      toast.error("Ombordagi qoldiqdan ko'p mahsulot soni kiritildi!");
      return;
    }

    const currentDiscount = Number(targetItem.discount || 0);
    const maxDiscount = Number(targetItem.salePrice || 0) * numericValue;

    setSaleData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.batchId === batchId
          ? {
              ...item,
              qty: numericValue,
              discount: currentDiscount > maxDiscount ? maxDiscount : currentDiscount
            }
          : item
      )
    }));
  };

  const updateItemTotalDiscount = (batchId, value) => {
    if (value === '') {
      setSaleData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.batchId === batchId ? { ...item, discount: '' } : item
        )
      }));
      return;
    }

    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    const targetItem = saleData.items.find((item) => item.batchId === batchId);
    if (!targetItem) return;

    const maxDiscount = Number(targetItem.salePrice || 0) * Number(targetItem.qty || 0);

    if (numericValue > maxDiscount) {
      toast.error("Chegirma tovar summasidan katta bo'lishi mumkin emas!");
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.batchId === batchId ? { ...item, discount: numericValue } : item
      )
    }));
  };

  const updateItemPerUnitDiscount = (batchId, value) => {
    if (value === '') {
      setSaleData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.batchId === batchId ? { ...item, discount: '' } : item
        )
      }));
      return;
    }

    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    const targetItem = saleData.items.find((item) => item.batchId === batchId);
    if (!targetItem) return;

    const qty = Number(targetItem.qty || 0);
    const totalDiscountValue = numericValue * qty;
    const maxDiscount = Number(targetItem.salePrice || 0) * qty;

    if (totalDiscountValue > maxDiscount) {
      toast.error("Chegirma tovar summasidan katta bo'lishi mumkin emas!");
      return;
    }

    setSaleData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.batchId === batchId ? { ...item, discount: totalDiscountValue } : item
      )
    }));
  };

  const handleBarcodeScan = (e) => {
    if (e.key !== 'Enter' || !e.target.value.trim()) return;

    const code = e.target.value.trim();
    const parsed = parseQrCode(code);

    const searchKey = parsed.id;
    const batchKey = parsed.batchId;
    const invoiceKey = parsed.invoiceId;

    if (!parsed.isValid || !searchKey) {
      toast.error("QR kod noto'g'ri yoki o'qilmadi");
      e.target.value = '';
      barcodeInputRef.current?.focus();
      return;
    }

    if (invoiceKey) {
      toast.error(
        "Bu QR kod hali tasdiqlanmagan kirimga tegishli. U faqat sanoq bo'limida ishlatiladi."
      );
      e.target.value = '';
      barcodeInputRef.current?.focus();
      return;
    }

    if (!batchKey) {
      toast.error("Savdoda faqat tasdiqlangan partiya QR kodi ishlaydi");
      e.target.value = '';
      barcodeInputRef.current?.focus();
      return;
    }

    const foundBatch = allBatches.find(
      (b) =>
        String(b.batchId) === String(batchKey) &&
        String(b.customId) === String(searchKey)
    );

    if (foundBatch) {
      addBatchToCart(foundBatch);
      setProductTab('cart');
    } else {
      toast.error("QR kod bo'yicha tasdiqlangan partiya topilmadi");
    }

    e.target.value = '';
    barcodeInputRef.current?.focus();
  };

  const handleNext = () => {
    if (step === 1 && !saleData.isAnonymous && !saleData.mainCustomer) {
      return toast.error("Mijozni tanlang yoki 'Boshqa shaxs' ni tanlang");
    }

    if (step === 1 && saleData.isAnonymous && !saleData.otherName.trim()) {
      return toast.error('Xaridor ismini yozing');
    }

    if (step === 2 && saleData.items.length === 0) {
      setProductTab('catalog');
      return toast.error("Savat bo'sh, avval tovar qo'shing");
    }

    if (step < 3) {
      const nextStep = step + 1;
      setStep(nextStep);

      if (nextStep === 2) {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
      return;
    }

    submitSale();
  };

  const submitSale = async () => {
    const invalidQtyItem = saleData.items.find(
      (item) =>
        !Number(item.qty) ||
        Number(item.qty) <= 0 ||
        Number(item.qty) > Number(item.quantity || 0)
    );

    if (invalidQtyItem) {
      return toast.error(
        `${invalidQtyItem.name} uchun ombordagi qoldiqdan ko'p mahsulot soni kiritildi`
      );
    }

    const invalidDiscountItem = saleData.items.find((item) => {
      const subtotal = Number(item.salePrice || 0) * Number(item.qty || 0);
      const discount = Number(item.discount || 0);
      return discount > subtotal;
    });

    if (invalidDiscountItem) {
      return toast.error(
        `${invalidDiscountItem.name} uchun chegirma tovar summasidan katta bo'lishi mumkin emas`
      );
    }

    const invalidBatchItem = saleData.items.find(
      (item) => !item.batchId || String(item.batchId).startsWith('old-')
    );

    if (invalidBatchItem) {
      return toast.error(
        `${invalidBatchItem.name} savdoda faqat tasdiqlangan partiya bilan ishlatilishi kerak`
      );
    }

    setIsLoading(true);

    try {
      const payload = {
        customerId: saleData.isAnonymous ? null : saleData.mainCustomer?.id || null,
        otherName: saleData.isAnonymous ? saleData.otherName.trim() : null,
        otherPhone: saleData.isAnonymous ? saleData.otherPhone.trim() : null,
        note: saleData.note.trim() || null,
        items: saleData.items.map((item) => ({
          productId: item.id,
          quantity: Number(item.qty),
          unitPrice: Number(item.salePrice),
          discountAmount: Number(item.discount || 0),
          batchId: Number(item.batchId),
          scanType: item.scanType || 'BATCH'
        }))
      };

      const requestUrl = `${API_URL}/api/orders/direct`;

      console.log('========== CREATE CASH SALE DEBUG ==========');
      console.log('API_URL:', API_URL);
      console.log('REQUEST URL:', requestUrl);
      console.log('REQUEST METHOD:', 'POST');
      console.log('REQUEST PAYLOAD:', payload);

      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = { rawText };
      }

      console.log('RESPONSE STATUS:', res.status);
      console.log('RESPONSE OK:', res.ok);
      console.log('RESPONSE DATA:', data);
      console.log('===========================================');

      if (res.ok) {
        toast.success("Savdo jarayonda holatida saqlandi");
        navigate('/savdo');
      } else {
        const backendMessage =
          data?.error ||
          data?.message ||
          data?.details ||
          data?.rawText ||
          `Savdoni saqlashda xatolik yuz berdi (${res.status})`;

        toast.error(backendMessage);
      }
    } catch (err) {
      console.error('Create draft sale error:', err);
      toast.error(`Server bilan aloqa yo'q: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const customerDisplayName = saleData.mainCustomer
    ? `${saleData.mainCustomer.lastName || ''} ${saleData.mainCustomer.firstName || ''}`.trim()
    : null;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-col bg-slate-50">
      {selectedProductForBatches && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductForBatches(null);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Partiya tanlash
                </div>
                <div className="mt-1 text-base font-black text-slate-800">
                  {selectedProductForBatches.name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductForBatches(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {allBatches
                .filter((b) => b.id === selectedProductForBatches.id)
                .map((batch) => {
                  const qtyInCart =
                    saleData.items.find((i) => i.batchId === batch.batchId)?.qty || 0;
                  const isFullyAdded = qtyInCart >= Number(batch.quantity || 0);

                  return (
                    <div
                      key={batch.batchId}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="min-w-0">
                        <div className="inline-flex rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                          Partiya P-{batch.batchId}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-800">
                          Sotuv narxi: {Number(batch.salePrice || 0).toLocaleString()} UZS
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Qoldiq: {Number(batch.quantity || 0)} ta
                          {qtyInCart > 0 ? ` · Savatda: ${qtyInCart} ta` : ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isFullyAdded}
                        onClick={() => {
                          addBatchToCart(batch);
                          setSelectedProductForBatches(null);
                          setProductTab('cart');
                        }}
                        className={`h-9 rounded-xl px-4 text-sm font-bold transition-all ${
                          isFullyAdded
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isFullyAdded ? 'To‘ldi' : "Qo'shish"}
                      </button>
                    </div>
                  );
                })}

              {allBatches.filter((b) => b.id === selectedProductForBatches.id).length === 0 && (
                <div className="py-10 text-center font-medium text-slate-400">
                  Ushbu tovar uchun faol partiya topilmadi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-slate-800">Naqd savdo yaratish</h1>
              <p className="text-[11px] font-medium text-slate-500">
                Xaridor, mahsulot va yakuniy tasdiqlash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:inline-flex"
          >
            Bekor qilish
          </button>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-3.5 sm:px-6">
        <div className="flex-1 min-h-0">
          {step === 1 && (
            <div className="h-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex w-fit gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-1.5">
                <button
                  type="button"
                  onClick={() => setSaleData((prev) => ({ ...prev, isAnonymous: false }))}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    !saleData.isAnonymous
                      ? 'border border-slate-200/60 bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Bazada bor mijoz
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSaleData((prev) => ({
                      ...prev,
                      isAnonymous: true,
                      mainCustomer: null
                    }))
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    saleData.isAnonymous
                      ? 'border border-slate-200/60 bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Boshqa shaxs
                </button>
              </div>

              {!saleData.isAnonymous ? (
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Bazada bor mijozni qidiring
                  </label>
                  <SearchableSelect
                    placeholder="Ism, familiya yoki pasport yozing..."
                    onSelect={(c) => setSaleData((prev) => ({ ...prev, mainCustomer: c }))}
                    customers={customers}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Xaridor ism-familiyasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saleData.otherName}
                      onChange={(e) =>
                        setSaleData((prev) => ({ ...prev, otherName: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 p-3 font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Masalan: Alisher"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={saleData.otherPhone}
                      onChange={(e) =>
                        setSaleData((prev) => ({ ...prev, otherPhone: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 p-3 font-mono font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="+998"
                    />
                  </div>
                </div>
              )}

              {(saleData.mainCustomer || saleData.otherName) && (
                <div className="mt-5 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tanlangan xaridor
                  </div>
                  <div className="text-[14px] font-semibold text-slate-800">
                    {saleData.isAnonymous
                      ? saleData.otherName || 'Kiritilmagan'
                      : customerDisplayName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {saleData.isAnonymous
                      ? saleData.otherPhone || '+998'
                      : getCustomerPhone(saleData.mainCustomer)}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[230px_1fr]">
              <div className="space-y-3">
                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    <User size={12} /> Xaridor
                  </div>

                  {saleData.isAnonymous ? (
                    <>
                      <h3 className="mb-1 text-base font-semibold tracking-tight text-slate-800">
                        {saleData.otherName || 'Kiritilmagan'}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">{saleData.otherPhone}</p>
                    </>
                  ) : saleData.mainCustomer ? (
                    <>
                      <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-slate-800">
                        {customerDisplayName}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">
                        {getCustomerPhone(saleData.mainCustomer)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-medium italic text-slate-400">Mijoz tanlanmagan</p>
                  )}
                </div>

                {saleData.items.length > 0 && (
                  <div className="rounded-[28px] bg-slate-900 p-4 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <ShoppingCart size={12} /> Jami savdo
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tovarlar soni:</span>
                        <span className="font-semibold text-white">
                          {saleData.items.reduce((s, i) => s + Number(i.qty || 0), 0)} ta
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-400">Umumiy summa:</span>
                        <span className="font-semibold text-white">
                          {grossTotal.toLocaleString()} UZS
                        </span>
                      </div>

                      {totalDiscount > 0 && (
                        <div className="flex justify-between border-t border-slate-700/50 pt-2 text-amber-300">
                          <span>Chegirma:</span>
                          <span className="font-semibold">- {totalDiscount.toLocaleString()} UZS</span>
                        </div>
                      )}

                      {totalDiscount < 0 && (
                        <div className="flex justify-between border-t border-slate-700/50 pt-2 text-blue-300">
                          <span>Ustama:</span>
                          <span className="font-semibold">
                            + {Math.abs(totalDiscount).toLocaleString()} UZS
                          </span>
                        </div>
                      )}

                      <div className="border-t border-slate-700/50 pt-3">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Yakuniy summa
                        </p>
                        <p className="text-2xl font-semibold tracking-tight text-emerald-400">
                          {finalAmount.toLocaleString()}
                          <span className="ml-1 text-sm font-medium text-emerald-500">UZS</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Izoh
                  </label>
                  <textarea
                    rows="5"
                    value={saleData.note}
                    onChange={(e) =>
                      setSaleData((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="w-full resize-none rounded-2xl border border-slate-200 p-3 font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    placeholder="Savdo haqida izoh..."
                  />
                </div>
              </div>

              <div className="flex h-full min-h-0 flex-col">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4">
                    <div className="relative mx-auto max-w-xl">
                      <ScanLine
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                        size={17}
                      />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Shtrix kodni skanerlang yoki yozing..."
                        onKeyDown={handleBarcodeScan}
                        className="w-full rounded-2xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-colors placeholder:text-sm placeholder:font-medium focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="shrink-0 border-b border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setProductTab('catalog')}
                        className={`py-3 text-sm font-bold transition-all ${
                          productTab === 'catalog'
                            ? 'border-b-2 border-blue-600 bg-white text-blue-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Katalog
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductTab('cart')}
                        className={`relative py-3 text-sm font-bold transition-all ${
                          productTab === 'cart'
                            ? 'border-b-2 border-blue-600 bg-white text-blue-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Tanlangan tovarlar
                        {saleData.items.length > 0 && (
                          <span className="absolute ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white shadow-sm">
                            {saleData.items.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {productTab === 'catalog' && (
                    <div className="flex min-h-0 flex-1 flex-col p-4">
                      <div className="relative mb-3 shrink-0">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={14}
                        />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          placeholder="Mahsulot nomi yoki ID bo‘yicha qidiring..."
                        />
                      </div>

                      <div className="min-h-0 flex-1 overflow-auto pr-1">
                        <div className="grid auto-rows-max grid-cols-1 gap-3 xl:grid-cols-2">
                          {paginatedProducts.map((product) => {
                            const productBatches = allBatches.filter((b) => b.id === product.id);
                            const totalQty = productBatches.reduce(
                              (sum, b) => sum + Number(b.quantity || 0),
                              0
                            );
                            const qtyInCart = saleData.items
                              .filter((i) => i.id === product.id)
                              .reduce((sum, i) => sum + Number(i.qty || 0), 0);

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductClick(product)}
                                className="group min-h-[132px] rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="break-words text-[15px] font-semibold leading-5 tracking-[-0.01em] text-slate-800">
                                      {product.name}
                                    </div>

                                    <div className="mt-1.5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                                      ID: #{product.customId ?? '-'}
                                    </div>
                                  </div>

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors group-hover:bg-slate-100">
                                    <Package size={15} />
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2.5 text-sm">
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Narxi
                                    </div>
                                    <div className="mt-1 font-bold leading-5 tracking-[-0.01em] text-emerald-600">
                                      {Number(product.salePrice || 0).toLocaleString()} UZS
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Ombor
                                    </div>
                                    <div className="mt-1 font-bold text-blue-600">
                                      {totalQty} ta
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Savatda
                                    </div>
                                    <div className="mt-1 font-bold text-rose-500">
                                      {qtyInCart} ta
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {paginatedProducts.length === 0 && (
                          <div className="py-12 text-center font-medium text-slate-400">
                            Mahsulot topilmadi
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {productTab === 'cart' && (
                    <div className="min-h-0 flex-1 overflow-auto p-4 pr-1">
                      <div className="space-y-3">
                        {saleData.items.length > 0 ? (
                          saleData.items.map((item) => (
                            <div
                              key={item.batchId}
                              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[14px] font-semibold text-slate-800">
                                    {item.name}
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    Partiya: #{item.batchId} • Qoldiq: {item.quantity} ta
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(item.batchId)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Soni
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateCartItemQty(
                                          item.batchId,
                                          Math.max(1, Number(item.qty || 1) - 1)
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                                    >
                                      <Minus size={12} />
                                    </button>

                                    <input
                                      value={item.qty}
                                      onChange={(e) =>
                                        updateCartItemQty(item.batchId, e.target.value)
                                      }
                                      className="h-8 flex-1 rounded-xl border border-slate-200 bg-white text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateCartItemQty(
                                          item.batchId,
                                          Math.min(
                                            Number(item.quantity || 0),
                                            Number(item.qty || 0) + 1
                                          )
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Narxi
                                  </label>
                                  <div className="flex h-8 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                                    {Number(item.salePrice || 0).toLocaleString()} UZS
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Chegirma / Ustama (jami)
                                  </label>
                                  <input
                                    value={item.discount}
                                    onChange={(e) =>
                                      updateItemTotalDiscount(item.batchId, e.target.value)
                                    }
                                    className="h-8 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="0"
                                  />
                                  <div className="mt-1 text-[10px] text-slate-400">
                                    manfiy qiymat = ustama
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    1 dona uchun
                                  </label>
                                  <input
                                    value={Number.isFinite(getPerUnitDiscount(item)) ? getPerUnitDiscount(item) : ''}
                                    onChange={(e) =>
                                      updateItemPerUnitDiscount(item.batchId, e.target.value)
                                    }
                                    className="h-8 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="0"
                                  />
                                  <div className="mt-1 text-[10px] text-slate-400">
                                    manfiy qiymat = ustama
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Jami
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-slate-700">
                                    {getItemSubtotal(item).toLocaleString()} UZS
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    O‘zgarish
                                  </div>
                                  <div className="mt-1 text-sm font-semibold text-slate-700">
                                    {Number(item.discount || 0).toLocaleString()} UZS
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Yakuniy
                                  </div>
                                  <div className="mt-1 text-sm font-bold text-slate-900">
                                    {getItemTotal(item).toLocaleString()} UZS
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center font-medium text-slate-400">
                            Savat bo‘sh
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {productTab === 'catalog' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setCatalogPage((prev) => Math.max(1, prev - 1))}
                              disabled={catalogPage <= 1}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              <ChevronLeft size={14} />
                              Oldingi
                            </button>

                            <div className="flex h-9 min-w-[84px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                              {catalogPage} / {totalCatalogPages}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setCatalogPage((prev) => Math.min(totalCatalogPages, prev + 1))
                              }
                              disabled={catalogPage >= totalCatalogPages}
                              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Keyingi
                              <ChevronRight size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="px-2 text-sm font-medium text-slate-400">
                            Tanlangan tovarlar
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                          disabled={isLoading}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <ArrowLeft size={14} />
                          Orqaga
                        </button>

                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={isLoading}
                          className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              Davom etish
                              <ChevronRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-[1fr_290px]">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
                <div className="border-b border-slate-100 px-4 py-3.5">
                  <h2 className="text-sm font-black text-slate-800">Yakuniy tekshiruv</h2>
                </div>

                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="pb-3 font-black">Mahsulot</th>
                        <th className="pb-3 text-center font-black">Soni</th>
                        <th className="pb-3 text-right font-black">Narxi</th>
                        <th className="pb-3 text-right font-black">Chegirma / Ustama</th>
                        <th className="pb-3 text-right font-black">Yakuniy</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {saleData.items.map((item) => (
                        <tr key={item.batchId}>
                          <td className="py-3.5 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-3.5 text-center">{item.qty}</td>
                          <td className="py-3.5 text-right">
                            {getItemSubtotal(item).toLocaleString()} UZS
                          </td>
                          <td className="py-3.5 text-right">
                            {Number(item.discount || 0).toLocaleString()} UZS
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-900">
                            {getItemTotal(item).toLocaleString()} UZS
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {saleData.note?.trim() && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Izoh
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {saleData.note}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-h-[520px] flex-col rounded-[28px] bg-slate-900 p-4 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <h3 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <ShoppingCart size={13} /> Yakuniy hisob
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
                    <span className="text-slate-400">
                      Tovarlar ({saleData.items.reduce((s, i) => s + Number(i.qty || 0), 0)} ta)
                    </span>
                    <span className="font-semibold text-white">{grossTotal.toLocaleString()} UZS</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 text-amber-300">
                      <span>Chegirma:</span>
                      <span className="font-semibold">- {totalDiscount.toLocaleString()} UZS</span>
                    </div>
                  )}

                  {totalDiscount < 0 && (
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 text-blue-300">
                      <span>Ustama:</span>
                      <span className="font-semibold">
                        + {Math.abs(totalDiscount).toLocaleString()} UZS
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Yakuniy summa
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-emerald-400">
                      {finalAmount.toLocaleString()}
                      <span className="ml-1 text-sm font-medium text-emerald-500">UZS</span>
                    </p>
                  </div>

                  {saleData.note?.trim() && (
                    <div className="border-t border-slate-700/50 pt-3">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Izoh
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {saleData.note}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                      disabled={isLoading}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      <ArrowLeft size={14} />
                      Orqaga
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={14} />
                          Saqlash
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30">
            <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
              <div className="flex justify-end">
                <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        Davom etish
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCashSale;