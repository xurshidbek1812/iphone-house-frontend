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
        className="flex items-center border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Search className="text-slate-400 mr-2" size={15} />
        <input
          type="text"
          className="w-full outline-none bg-transparent text-slate-700 text-sm font-medium placeholder-slate-400"
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
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
                className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
              >
                <div className="font-semibold text-slate-800 text-sm">
                  {customer.lastName} {customer.firstName} {customer.middleName || ''}
                </div>
                <div className="text-[11px] text-slate-500 flex gap-3 mt-1">
                  <span>JSHSHIR: {customer.pinfl ?? '-'}</span>
                  <span>Tel: {customer.phones?.[0]?.phone || customer.phone || '-'}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-slate-400 text-sm font-medium">Mijoz topilmadi</div>
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
    if (Array.isArray(customer.phones) && customer.phones.length > 0) {
      return customer.phones[0].phone;
    }
    if (typeof customer.phones === 'string' && customer.phones.trim() !== '') {
      return customer.phones;
    }
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

      const res = await fetch(`${API_URL}/api/orders/direct`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success("Savdo jarayonda holatida saqlandi");
        navigate('/savdo');
      } else {
        toast.error(data?.error || `Saqlashda xatolik (${res.status})`);
      }
    } catch (err) {
      console.error('Create draft sale error:', err);
      toast.error("Server bilan aloqa yo'q");
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
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      {selectedProductForBatches && (
        <div
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductForBatches(null);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="text-xs font-black tracking-widest uppercase text-blue-600">
                  Partiya tanlash
                </div>
                <div className="text-base font-black text-slate-800 mt-1">
                  {selectedProductForBatches.name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductForBatches(null)}
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {allBatches
                .filter((b) => b.id === selectedProductForBatches.id)
                .map((batch) => {
                  const qtyInCart =
                    saleData.items.find((i) => i.batchId === batch.batchId)?.qty || 0;
                  const isFullyAdded = qtyInCart >= Number(batch.quantity || 0);

                  return (
                    <div
                      key={batch.batchId}
                      className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] inline-flex px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black uppercase tracking-widest">
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
                        className={`h-9 px-4 rounded-xl font-bold text-sm transition-all ${
                          isFullyAdded
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isFullyAdded ? 'To‘ldi' : "Qo'shish"}
                      </button>
                    </div>
                  );
                })}

              {allBatches.filter((b) => b.id === selectedProductForBatches.id).length === 0 && (
                <div className="py-10 text-center text-slate-400 font-medium">
                  Ushbu tovar uchun faol partiya topilmadi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-black text-slate-800 truncate">
                Naqd savdo yaratish
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Xaridor, mahsulot va yakuniy tasdiqlash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex h-9 px-4 rounded-xl border border-slate-200 bg-white items-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Bekor qilish
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-3.5 flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {step === 1 && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 h-full">
              <div className="flex gap-3 p-1.5 bg-slate-50 border border-slate-200/70 rounded-2xl mb-5 w-fit">
                <button
                  type="button"
                  onClick={() => setSaleData((prev) => ({ ...prev, isAnonymous: false }))}
                  className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                    !saleData.isAnonymous
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
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
                  className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                    saleData.isAnonymous
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Boshqa shaxs
                </button>
              </div>

              {!saleData.isAnonymous ? (
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
                    Bazada bor mijozni qidiring
                  </label>
                  <SearchableSelect
                    placeholder="Ism, familiya yoki pasport yozing..."
                    onSelect={(c) => setSaleData((prev) => ({ ...prev, mainCustomer: c }))}
                    customers={customers}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
                      Xaridor ism-familiyasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saleData.otherName}
                      onChange={(e) =>
                        setSaleData((prev) => ({ ...prev, otherName: e.target.value }))
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 font-medium text-slate-700 transition-all"
                      placeholder="Masalan: Alisher"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={saleData.otherPhone}
                      onChange={(e) =>
                        setSaleData((prev) => ({ ...prev, otherPhone: e.target.value }))
                      }
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 font-medium font-mono text-slate-700 transition-all"
                      placeholder="+998"
                    />
                  </div>
                </div>
              )}

              {(saleData.mainCustomer || saleData.otherName) && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 max-w-xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Tanlangan xaridor
                  </div>
                  <div className="text-[14px] font-semibold text-slate-800">
                    {saleData.isAnonymous
                      ? saleData.otherName || 'Kiritilmagan'
                      : customerDisplayName}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {saleData.isAnonymous
                      ? saleData.otherPhone || '+998'
                      : getCustomerPhone(saleData.mainCustomer)}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 xl:grid-cols-[230px_1fr] gap-4 h-full min-h-0">
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
                    <User size={12} /> Xaridor
                  </div>

                  {saleData.isAnonymous ? (
                    <>
                      <h3 className="font-semibold text-slate-800 text-base tracking-tight mb-1">
                        {saleData.otherName || 'Kiritilmagan'}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">{saleData.otherPhone}</p>
                    </>
                  ) : saleData.mainCustomer ? (
                    <>
                      <h3 className="font-semibold text-slate-800 text-base tracking-tight leading-tight mb-1">
                        {customerDisplayName}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">
                        {getCustomerPhone(saleData.mainCustomer)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 font-medium italic">
                      Mijoz tanlanmagan
                    </p>
                  )}
                </div>

                {saleData.items.length > 0 && (
                  <div className="bg-slate-900 p-4 rounded-3xl shadow-xl text-white">
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
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
                        <div className="flex justify-between text-amber-300 border-t border-slate-700/50 pt-2">
                          <span>Chegirma:</span>
                          <span className="font-semibold">- {totalDiscount.toLocaleString()} UZS</span>
                        </div>
                      )}

                      {totalDiscount < 0 && (
                        <div className="flex justify-between text-blue-300 border-t border-slate-700/50 pt-2">
                          <span>Ustama:</span>
                          <span className="font-semibold">
                            + {Math.abs(totalDiscount).toLocaleString()} UZS
                          </span>
                        </div>
                      )}

                      <div className="border-t border-slate-700/50 pt-3">
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">
                          Yakuniy summa
                        </p>
                        <p className="text-2xl font-semibold text-emerald-400 tracking-tight">
                          {finalAmount.toLocaleString()}
                          <span className="text-sm font-medium text-emerald-500 ml-1">UZS</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
                  <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">
                    Izoh
                  </label>
                  <textarea
                    rows="5"
                    value={saleData.note}
                    onChange={(e) =>
                      setSaleData((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 font-medium text-slate-700 transition-all resize-none"
                    placeholder="Savdo haqida izoh..."
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-slate-100">
                  <div className="relative max-w-xl mx-auto">
                    <ScanLine
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                      size={17}
                    />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Shtrix kodni skanerlang yoki yozing..."
                      onKeyDown={handleBarcodeScan}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 focus:border-blue-500 rounded-2xl outline-none shadow-sm font-mono font-semibold text-sm text-slate-800 transition-colors placeholder:font-sans placeholder:text-sm placeholder:font-medium"
                    />
                  </div>
                </div>

                <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setProductTab('catalog')}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                      productTab === 'catalog'
                        ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Katalog
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductTab('cart')}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all relative ${
                      productTab === 'cart'
                        ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tanlangan tovarlar
                    {saleData.items.length > 0 && (
                      <span className="absolute ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                        {saleData.items.length}
                      </span>
                    )}
                  </button>
                </div>

                {productTab === 'catalog' && (
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <div className="relative mb-3 shrink-0">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                      />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm font-medium text-slate-700"
                        placeholder="Mahsulot nomi yoki ID bo‘yicha qidiring..."
                      />
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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
                              className="text-left rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[124px]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-[14px] font-semibold text-slate-800 leading-5 break-words">
                                    {product.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-1.5">
                                    ID: #{product.customId ?? '-'}
                                  </div>
                                </div>

                                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                  <Package size={15} />
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Narxi
                                  </div>
                                  <div className="mt-1 font-bold text-emerald-600 leading-5">
                                    {Number(product.salePrice || 0).toLocaleString()} UZS
                                  </div>
                                </div>

                                <div className="text-center">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Ombor
                                  </div>
                                  <div className="mt-1 font-bold text-blue-600">
                                    {totalQty} ta
                                  </div>
                                </div>

                                <div className="text-right">
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
                        <div className="py-12 text-center text-slate-400 font-medium">
                          Mahsulot topilmadi
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {productTab === 'cart' && (
                  <div className="p-4 flex-1 min-h-0 overflow-auto">
                    <div className="space-y-3">
                      {saleData.items.length > 0 ? (
                        saleData.items.map((item) => (
                          <div
                            key={item.batchId}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[14px] font-semibold text-slate-800">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Partiya: #{item.batchId} • Qoldiq: {item.quantity} ta
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.batchId)}
                                className="h-8 w-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
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
                                    className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center"
                                  >
                                    <Minus size={12} />
                                  </button>

                                  <input
                                    value={item.qty}
                                    onChange={(e) =>
                                      updateCartItemQty(item.batchId, e.target.value)
                                    }
                                    className="flex-1 h-8 rounded-xl border border-slate-200 bg-white text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
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
                                    className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  Narxi
                                </label>
                                <div className="h-8 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-slate-700">
                                  {Number(item.salePrice || 0).toLocaleString()} UZS
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  Chegirma / Ustama (jami)
                                </label>
                                <input
                                  value={item.discount}
                                  onChange={(e) =>
                                    updateItemTotalDiscount(item.batchId, e.target.value)
                                  }
                                  className="w-full h-8 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                  placeholder="0"
                                />
                                <div className="mt-1 text-[10px] text-slate-400">
                                  manfiy qiymat = ustama
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  1 dona uchun
                                </label>
                                <input
                                  value={Number.isFinite(getPerUnitDiscount(item)) ? getPerUnitDiscount(item) : ''}
                                  onChange={(e) =>
                                    updateItemPerUnitDiscount(item.batchId, e.target.value)
                                  }
                                  className="w-full h-8 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                  placeholder="0"
                                />
                                <div className="mt-1 text-[10px] text-slate-400">
                                  manfiy qiymat = ustama
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Jami
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-700">
                                  {getItemSubtotal(item).toLocaleString()} UZS
                                </div>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  O‘zgarish
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-700">
                                  {Number(item.discount || 0).toLocaleString()} UZS
                                </div>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
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
                        <div className="py-12 text-center text-slate-400 font-medium">
                          Savat bo‘sh
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_290px] gap-4 h-full">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-800">Yakuniy tekshiruv</h2>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="pb-3 font-black">Mahsulot</th>
                        <th className="pb-3 font-black text-center">Soni</th>
                        <th className="pb-3 font-black text-right">Narxi</th>
                        <th className="pb-3 font-black text-right">Chegirma / Ustama</th>
                        <th className="pb-3 font-black text-right">Yakuniy</th>
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
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Izoh
                      </div>
                      <div className="text-sm text-slate-700 leading-6 whitespace-pre-wrap">
                        {saleData.note}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-3xl shadow-xl text-white">
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShoppingCart size={13} /> Yakuniy hisob
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-700/50 pb-2.5">
                    <span className="text-slate-400">
                      Tovarlar ({saleData.items.reduce((s, i) => s + Number(i.qty || 0), 0)} ta)
                    </span>
                    <span className="font-semibold text-white">{grossTotal.toLocaleString()} UZS</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-amber-300 border-b border-slate-700/50 pb-2.5">
                      <span>Chegirma:</span>
                      <span className="font-semibold">- {totalDiscount.toLocaleString()} UZS</span>
                    </div>
                  )}

                  {totalDiscount < 0 && (
                    <div className="flex justify-between items-center text-blue-300 border-b border-slate-700/50 pb-2.5">
                      <span>Ustama:</span>
                      <span className="font-semibold">
                        + {Math.abs(totalDiscount).toLocaleString()} UZS
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">
                      Yakuniy summa
                    </p>
                    <p className="text-2xl font-semibold text-emerald-400 tracking-tight">
                      {finalAmount.toLocaleString()}
                      <span className="text-sm font-medium text-emerald-500 ml-1">UZS</span>
                    </p>
                  </div>

                  {saleData.note?.trim() && (
                    <div className="pt-3 border-t border-slate-700/50">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        Izoh
                      </div>
                      <div className="text-sm text-slate-200 leading-6 whitespace-pre-wrap">
                        {saleData.note}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 shrink-0">
          {step === 2 ? (
            <div className="grid grid-cols-1 xl:grid-cols-[230px_1fr] gap-4">
              <div />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {productTab === 'catalog' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCatalogPage((prev) => Math.max(1, prev - 1))}
                        disabled={catalogPage <= 1}
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <ChevronLeft size={14} />
                        Oldingi
                      </button>

                      <div className="h-9 min-w-[84px] px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 flex items-center justify-center">
                        {catalogPage} / {totalCatalogPages}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCatalogPage((prev) => Math.min(totalCatalogPages, prev + 1))
                        }
                        disabled={catalogPage >= totalCatalogPages}
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        Keyingi
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                    disabled={isLoading}
                    className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <ArrowLeft size={14} />
                    Orqaga
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="h-9 px-5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 transition disabled:opacity-50 bg-slate-900 hover:bg-black"
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
          ) : (
            <div className="flex justify-end">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-2 flex items-center gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                    disabled={isLoading}
                    className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <ArrowLeft size={14} />
                    Orqaga
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className={`h-9 px-5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 transition disabled:opacity-50 ${
                    step === 3 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-black'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : step === 3 ? (
                    <>
                      <Save size={14} />
                      Saqlash
                    </>
                  ) : (
                    <>
                      Davom etish
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCashSale;