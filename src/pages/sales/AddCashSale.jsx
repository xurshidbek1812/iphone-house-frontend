import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Search,
  User,
  X,
  ShoppingCart,
  Save,
  ScanLine,
  Trash2,
  Plus,
  Clock,
  Tag,
  MessageSquare,
  Loader2,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const lowerSearch = search.toLowerCase();
    return customers.filter((c) => {
      const text = `${c.firstName} ${c.lastName} ${c.pinfl} ${c.document?.number || ''}`.toLowerCase();
      return text.includes(lowerSearch);
    });
  }, [customers, search]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:bg-gray-50 cursor-text focus-within:ring-2 focus-within:ring-blue-500 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Search className="text-gray-400 mr-2" size={20} />
        <input
          type="text"
          className="w-full outline-none bg-transparent text-gray-700 font-medium placeholder-gray-400"
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  onSelect(customer);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="font-bold text-gray-800 uppercase text-sm">
                  {customer.lastName} {customer.firstName} {customer.middleName || ''}
                </div>
                <div className="text-[11px] font-mono text-gray-500 flex gap-3 mt-1">
                  <span>JSHSHIR: {customer.pinfl ?? '-'}</span>
                  <span>Tel: {customer.phones?.[0]?.phone || customer.phone || '-'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm font-medium">Mijoz topilmadi</div>
          )}
        </div>
      )}
    </div>
  );
};

const AddCashSale = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [allBatches, setAllBatches] = useState([]);

  const [selectedProductForBatches, setSelectedProductForBatches] = useState(null);

  const token = sessionStorage.getItem('token');
  const barcodeInputRef = useRef(null);

  const [saleData, setSaleData] = useState({
    isAnonymous: false,
    mainCustomer: null,
    otherName: '',
    otherPhone: '+998 ',
    items: [],
    discount: '',
    note: ''
  });

  const [productTab, setProductTab] = useState('catalog');
  const [productSearch, setProductSearch] = useState('');

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
        setDataLoading(true);

        const [custRes, prodRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/customers`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal })
        ]);

        if (custRes.status === 'fulfilled' && custRes.value.ok) {
          const data = await parseJsonSafe(custRes.value);
          if (Array.isArray(data)) setCustomers(data);
        }

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const data = await parseJsonSafe(prodRes.value);

          if (Array.isArray(data)) {
            const extractedBatches = [];
            const catalogProducts = [];

            data.forEach((prod) => {
              if (Number(prod.quantity) > 0) {
                catalogProducts.push({
                  id: prod.id,
                  customId: prod.customId,
                  name: prod.name,
                  quantity: prod.quantity,
                  salePrice: prod.salePrice,
                  unit: prod.unit
                });
              }

              if (prod.batches && prod.batches.length > 0) {
                prod.batches.forEach((batch) => {
                  if (Number(batch.quantity) > 0 && !batch.isArchived) {
                    extractedBatches.push({
                      id: prod.id,
                      batchId: batch.id,
                      customId: prod.customId,
                      name: prod.name,
                      quantity: batch.quantity,
                      buyPrice: batch.buyPrice,
                      salePrice: batch.salePrice || prod.salePrice,
                      buyCurrency: batch.buyCurrency,
                      unit: prod.unit
                    });
                  }
                });
              } else if (Number(prod.quantity) > 0) {
                extractedBatches.push({
                  id: prod.id,
                  batchId: `old-${prod.id}`,
                  customId: prod.customId,
                  name: prod.name,
                  quantity: prod.quantity,
                  buyPrice: prod.buyPrice,
                  salePrice: prod.salePrice,
                  buyCurrency: prod.buyCurrency || 'USD',
                  unit: prod.unit
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

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const code = e.target.value.trim();
      let searchKey = code;
      let batchKey = '';

      if (code.includes('|')) {
        const parts = code.split('|');
        searchKey = parts.find((p) => p.startsWith('ID:'))?.replace('ID:', '').trim() || searchKey;
        batchKey = parts.find((p) => p.startsWith('BATCH:'))?.replace('BATCH:', '').trim() || '';
      }

      if (batchKey) {
        const foundBatch = allBatches.find(
          (b) => String(b.batchId) === batchKey && String(b.customId) === searchKey
        );

        if (foundBatch) {
          addBatchToCart(foundBatch);
        } else {
          toast.error(`Kod bo'yicha aktiv partiya topilmadi!`);
        }
      } else {
        const foundProduct = products.find(
          (p) => String(p.customId) === searchKey || String(p.id) === searchKey
        );

        if (foundProduct) {
          setSelectedProductForBatches(foundProduct);
        } else {
          toast.error(`Kod bo'yicha tovar topilmadi!`);
        }
      }

      e.target.value = '';
      barcodeInputRef.current?.focus();
    }
  };

  const grandTotal = useMemo(() => {
    return saleData.items.reduce(
      (sum, item) => sum + (Number(item.salePrice || 0) * Number(item.qty || 1)),
      0
    );
  }, [saleData.items]);

  const finalAmount = useMemo(() => {
    return Math.max(0, grandTotal - (Number(saleData.discount) || 0));
  }, [grandTotal, saleData.discount]);

  const addBatchToCart = (batch) => {
    if (Number(batch.quantity) <= 0) {
      return toast.error("Ushbu partiyada qoldiq yo'q!");
    }

    const existingItem = saleData.items.find((i) => i.batchId === batch.batchId);

    if (existingItem) {
      if (existingItem.qty + 1 > batch.quantity) {
        return toast.error(`Ushbu partiyada faqat ${batch.quantity} ta qolgan!`);
      }

      setSaleData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.batchId === batch.batchId ? { ...item, qty: item.qty + 1 } : item
        )
      }));

      toast.success(`Soni oshirildi`);
    } else {
      setSaleData((prev) => ({
        ...prev,
        items: [...prev.items, { ...batch, qty: 1 }]
      }));

      toast.success(`Savatga qo'shildi`);
    }
  };

  const removeItem = (batchId) => {
    setSaleData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.batchId !== batchId)
    }));
  };

  const handleNext = () => {
    if (step === 1 && !saleData.isAnonymous && !saleData.mainCustomer) {
      return toast.error("Mijozni tanlang yoki 'Boshqa shaxs' ni tanlang!");
    }

    if (step === 1 && saleData.isAnonymous && !saleData.otherName.trim()) {
      return toast.error("Xaridor ismini yozing!");
    }

    if (step === 2 && saleData.items.length === 0) {
      return toast.error("Savat bo'sh! Tovar qo'shing.");
    }

    if (step < 3) {
      setStep(step + 1);
      if (step === 1) {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    } else {
      submitSale();
    }
  };

  const submitSale = async () => {
    const disc = Number(saleData.discount) || 0;

    if (disc > 0 && (!saleData.note || saleData.note.trim() === '')) {
      return toast.error("Chegirma berilganda sababini (izoh) yozish majburiy!");
    }

    if (disc > grandTotal) {
      return toast.error("Chegirma summasi tovarlar narxidan ko'p bo'lishi mumkin emas!");
    }

    setIsLoading(true);

    try {
      const payload = {
        customerId: saleData.isAnonymous ? null : (saleData.mainCustomer?.id || null),
        otherName: saleData.isAnonymous ? saleData.otherName.trim() : null,
        otherPhone: saleData.isAnonymous ? saleData.otherPhone.trim() : null,
        note: saleData.note.trim() || null,
        discountAmount: disc,
        items: saleData.items.map(item => ({
            productId: item.id,
            quantity: Number(item.qty),
            unitPrice: Number(item.salePrice),
            discountAmount: 0
        }))
      };

      const res = await fetch(`${API_URL}/api/orders/direct`, {
        method: 'POST',
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (res.ok) {
        toast.success("Savdo jarayonda holatida saqlandi!");
        navigate('/savdo');
      } else {
        toast.error(data?.error || `Saqlashda xatolik (${res.status})`);
      }
    } catch (err) {
      console.error('Create draft sale error:', err);
      toast.error("Server bilan aloqa yo'q!");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const search = productSearch.trim().toLowerCase();

    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.customId != null && String(p.customId).includes(search))
    );
  }, [products, productSearch]);

  const getCustomerPhone = (customer) => {
    if (!customer) return 'Tel kiritilmagan';
    if (Array.isArray(customer.phones) && customer.phones.length > 0) return customer.phones[0].phone;
    if (typeof customer.phones === 'string' && customer.phones.trim() !== '') return customer.phones;
    if (customer.phone) return customer.phone;
    return 'Tel kiritilmagan';
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in fade-in duration-300 relative">
      {selectedProductForBatches && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductForBatches(null);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80">
              <div>
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <Layers className="text-blue-500" size={24} /> Partiyani tanlang
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {selectedProductForBatches.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductForBatches(null)}
                className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-500 border border-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {allBatches
                  .filter((b) => b.id === selectedProductForBatches.id)
                  .map((batch) => {
                    const qtyInCart = saleData.items.find((i) => i.batchId === batch.batchId)?.qty || 0;
                    const isFullyAdded = qtyInCart >= batch.quantity;

                    return (
                      <div
                        key={batch.batchId}
                        className={`flex justify-between items-center p-5 border-2 rounded-2xl transition-all ${
                          isFullyAdded
                            ? 'border-gray-100 bg-gray-50/50'
                            : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[11px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg">
                              {!String(batch.batchId).startsWith('old-')
                                ? `Partiya: P-${batch.batchId}`
                                : 'Eski tovar'}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-600 mt-2 flex items-center gap-4">
                            <span>
                              Qoldiq: <span className="text-blue-600 font-black">{batch.quantity} ta</span>
                            </span>
                            {qtyInCart > 0 && (
                              <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                                Savatda: {qtyInCart} ta
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              Sotuv narxi
                            </p>
                            <p className="font-black text-emerald-600 text-lg">
                              {Number(batch.salePrice).toLocaleString()} <span className="text-xs">UZS</span>
                            </p>
                          </div>

                          <button
                            disabled={isFullyAdded}
                            onClick={() => addBatchToCart(batch)}
                            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all shadow-sm active:scale-95 ${
                              qtyInCart > 0 && !isFullyAdded
                                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200'
                                : 'bg-white border-2 border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            {isFullyAdded ? <Check size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={2.5} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            disabled={isLoading}
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Naqd savdo yaratish</h1>
        </div>

        <button
          disabled={isLoading}
          onClick={() => navigate(-1)}
          className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          Bekor qilish
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100/50 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-blue-50 opacity-50">
              <User size={100} />
            </div>

            <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-widest mb-4 relative z-10">
              <User size={14} /> Xaridor
            </div>

            {saleData.isAnonymous ? (
              <div className="relative z-10">
                <h3 className="font-black text-gray-800 text-xl tracking-tight mb-1">
                  {saleData.otherName || 'Kiritilmagan'}
                </h3>
                <p className="text-sm font-bold text-gray-400">{saleData.otherPhone}</p>
              </div>
            ) : saleData.mainCustomer ? (
              <div className="relative z-10">
                <h3 className="font-black text-gray-800 text-xl tracking-tight leading-tight mb-2">
                  {saleData.mainCustomer.lastName} <br />
                  {saleData.mainCustomer.firstName}
                </h3>
                <p className="text-sm font-bold text-gray-400">{getCustomerPhone(saleData.mainCustomer)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium italic relative z-10">Mijoz tanlanmagan</p>
            )}
          </div>

          {saleData.items.length > 0 && (
            <div className="bg-gray-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-gray-800">
                <ShoppingCart size={120} />
              </div>

              <div className="relative z-10">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShoppingCart size={14} /> Jami Savdo
                </h3>

                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-400 font-medium">Tovarlar soni:</span>
                  <span className="font-black text-white">
                    {saleData.items.reduce((s, i) => s + i.qty, 0)} ta
                  </span>
                </div>

                {Number(saleData.discount) > 0 && (
                  <div className="flex justify-between text-sm mb-3 text-amber-400 border-t border-gray-700/50 pt-3">
                    <span className="font-medium">Chegirma:</span>
                    <span className="font-black">- {Number(saleData.discount).toLocaleString()} UZS</span>
                  </div>
                )}

                <div className="border-t border-gray-700/50 pt-4 mt-2">
                  <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-widest">
                    Yakuniy summa
                  </p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tight">
                    {finalAmount.toLocaleString()} <span className="text-sm font-bold text-emerald-600/50">UZS</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-center items-center relative max-w-sm mx-auto">
              <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-gray-100 rounded-full -z-10 -translate-y-1/2"></div>
              <div
                className="absolute top-1/2 left-4 h-1.5 rounded-full bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>

              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-black border-4 transition-all mx-auto bg-white ${
                    step >= s ? 'border-blue-600 text-blue-600 shadow-md shadow-blue-100' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {step > s ? <Check size={16} strokeWidth={3} /> : s}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8 duration-300">
              <div className="flex gap-4 p-1.5 bg-gray-50 border border-gray-200/50 rounded-2xl mb-8 w-fit">
                <button
                  onClick={() => setSaleData((prev) => ({ ...prev, isAnonymous: false }))}
                  className={`px-6 py-3 rounded-xl font-bold transition-all text-sm ${
                    !saleData.isAnonymous
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bazada bor Mijoz
                </button>

                <button
                  onClick={() => setSaleData((prev) => ({ ...prev, isAnonymous: true }))}
                  className={`px-6 py-3 rounded-xl font-bold transition-all text-sm ${
                    saleData.isAnonymous
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Boshqa shaxs (Anonim)
                </button>
              </div>

              {!saleData.isAnonymous ? (
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    Bazada bor mijozni qidiring
                  </label>
                  <SearchableSelect
                    placeholder="Ism, familiya yoki pasport yozing..."
                    onSelect={(c) => setSaleData((prev) => ({ ...prev, mainCustomer: c }))}
                    customers={customers}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                      Xaridor ism-familiyasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={saleData.otherName}
                      onChange={(e) => setSaleData((prev) => ({ ...prev, otherName: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 font-bold text-gray-700 transition-all"
                      placeholder="Masalan: Alisher"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                      Telefon raqami (Ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={saleData.otherPhone}
                      onChange={(e) => setSaleData((prev) => ({ ...prev, otherPhone: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 font-bold font-mono text-gray-700 transition-all"
                      placeholder="+998"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px] animate-in slide-in-from-right-8 duration-300">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100">
                <div className="relative max-w-xl mx-auto">
                  <ScanLine className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Shtrix kodni skanerlang yoki yozing..."
                    onKeyDown={handleBarcodeScan}
                    className="w-full pl-14 pr-6 py-4 bg-white border-2 border-blue-200 focus:border-blue-500 rounded-2xl outline-none shadow-sm font-mono font-bold text-xl text-gray-800 transition-colors placeholder:font-sans placeholder:text-base placeholder:font-medium"
                  />
                </div>
              </div>

              <div className="flex border-b border-gray-100 bg-slate-50/50">
                <button
                  onClick={() => setProductTab('catalog')}
                  className={`flex-1 py-4 text-sm font-black transition-all ${
                    productTab === 'catalog'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Katalog (Qidiruv)
                </button>

                <button
                  onClick={() => setProductTab('cart')}
                  className={`flex-1 py-4 text-sm font-black transition-all relative ${
                    productTab === 'cart'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
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
                <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white">
                  <div className="relative mb-6 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Nomi bo'yicha tezkor qidiruv..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 transition-all"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-2xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 sticky top-0 text-[10px] text-gray-400 uppercase font-black tracking-widest z-10 shadow-sm border-b border-gray-100">
                        <tr>
                          <th className="p-4">Tovar Nomi</th>
                          <th className="p-4 text-center">Umumiy Qoldiq</th>
                          <th className="p-4 text-right">Sotuv Narxi</th>
                          <th className="p-4 text-center">Tanlash</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                        {filteredProducts.map((product) => {
                          const qtyInCart = saleData.items
                            .filter((i) => i.id === product.id)
                            .reduce((s, i) => s + i.qty, 0);

                          return (
                            <tr
                              key={product.id}
                              className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                              onClick={() => setSelectedProductForBatches(product)}
                            >
                              <td className="p-4">
                                <div className="text-gray-800 group-hover:text-blue-700 transition-colors">
                                  {product.name}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">
                                  ID: #{product.customId ?? '-'}
                                </div>
                              </td>

                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-md text-xs bg-blue-50 text-blue-600">
                                    {Number(product.quantity || 0)} ta
                                  </span>
                                  {qtyInCart > 0 && (
                                    <span className="text-[9px] text-rose-500 mt-1">
                                      Savatda: {qtyInCart} ta
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-right text-emerald-600">
                                {Number(product.salePrice || 0).toLocaleString()}
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  className="p-2 rounded-xl transition-all shadow-sm active:scale-95 bg-white border border-gray-200 text-blue-500 hover:border-blue-500 hover:bg-blue-50 group-hover:bg-blue-500 group-hover:text-white"
                                  title="Partiyalarni ko'rish"
                                >
                                  <Layers size={18} strokeWidth={2.5} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-16 text-center text-gray-400 font-medium">
                              Hech narsa topilmadi
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {productTab === 'cart' && (
                <div className="p-6 flex flex-col flex-1 overflow-hidden bg-slate-50/50">
                  {saleData.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                      <ShoppingCart size={56} strokeWidth={1.5} className="mb-4 text-gray-300" />
                      <p className="font-bold text-gray-500">Savat bo'sh</p>
                      <p className="text-sm mt-1">Shtrix kod ishlating yoki katalogdan tanlang.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar border bg-white border-gray-100 rounded-3xl shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 sticky top-0 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-100 z-10">
                          <tr>
                            <th className="p-4 pl-6">Nomi va Partiyasi</th>
                            <th className="p-4 w-28 text-center">Soni</th>
                            <th className="p-4 text-right">Dona Narxi</th>
                            <th className="p-4 text-right">Jami (UZS)</th>
                            <th className="p-4 text-center w-16">X</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                          {saleData.items.map((item) => (
                            <tr key={item.batchId} className="hover:bg-rose-50/30 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="text-gray-800">{item.name}</div>
                                <div className="text-[10px] text-indigo-500 mt-1 uppercase font-black bg-indigo-50 w-fit px-2 py-0.5 rounded">
                                  Partiya:{' '}
                                  {!String(item.batchId).startsWith('old-')
                                    ? `P-${item.batchId}`
                                    : 'ESKI TOVAR'}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="w-full p-2.5 border border-gray-200 rounded-xl text-center font-black text-blue-600 bg-blue-50">
                                  {item.qty}
                                </div>
                              </td>

                              <td className="p-4 text-right text-gray-500 font-medium">
                                {Number(item.salePrice).toLocaleString()}
                              </td>

                              <td className="p-4 text-right font-black text-gray-800">
                                {(Number(item.salePrice) * item.qty).toLocaleString()}
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  onClick={() => removeItem(item.batchId)}
                                  className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
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
              )}
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-[20px] flex items-center justify-center shadow-inner">
                    <Clock size={32} strokeWidth={2.5} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-gray-800 mb-1 tracking-tight">
                      Qo'shimcha va Saqlash
                    </h2>
                    <p className="text-gray-400 text-sm font-medium">
                      Savdoni jarayonda holatida saqlashdan oldin chegirma va izoh kiritishingiz mumkin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Tag size={12} /> Chegirma berish (UZS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      disabled={isLoading}
                      value={saleData.discount}
                      onChange={(e) => setSaleData({ ...saleData, discount: e.target.value })}
                      className="w-full p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl outline-none focus:border-amber-400 font-black text-amber-600 text-xl transition-colors disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>

                  {Number(saleData.discount) > 0 ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Chegirma sababi (Izoh){' '}
                        <span className="text-rose-500 text-base leading-none">*</span>
                      </label>
                      <textarea
                        disabled={isLoading}
                        value={saleData.note}
                        onChange={(e) => setSaleData({ ...saleData, note: e.target.value })}
                        className="w-full p-4 bg-rose-50/50 border border-rose-200 rounded-2xl outline-none focus:border-rose-400 focus:ring-4 ring-rose-50 text-rose-800 font-bold resize-none h-28 transition-all disabled:opacity-50"
                        placeholder="Nima uchun chegirma qilinganini yozish majburiy..."
                      ></textarea>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Savdo uchun izoh (ixtiyoriy)
                      </label>
                      <textarea
                        disabled={isLoading}
                        value={saleData.note}
                        onChange={(e) => setSaleData({ ...saleData, note: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-400 focus:ring-4 ring-blue-50 text-gray-700 font-medium resize-none h-28 transition-all disabled:opacity-50"
                        placeholder="Eslatma qoldirishingiz mumkin..."
                      ></textarea>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 rounded-[32px] p-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-8 -top-8 text-gray-800">
                    <ShoppingCart size={180} />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center text-gray-400 text-sm">
                      <span className="font-bold">
                        Tovarlar ({saleData.items.reduce((s, i) => s + i.qty, 0)} ta):
                      </span>
                      <span className="font-black text-white text-lg">{grandTotal.toLocaleString()} UZS</span>
                    </div>

                    {Number(saleData.discount) > 0 && (
                      <div className="flex justify-between items-center text-amber-400 text-sm border-b border-gray-700/50 pb-5">
                        <span className="font-bold">Chegirma:</span>
                        <span className="font-black text-lg">
                          - {Number(saleData.discount).toLocaleString()} UZS
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">
                        Yakuniy summa
                      </p>
                      <p
                        className="text-4xl lg:text-5xl font-black text-emerald-400 tracking-tighter truncate"
                        title={`${finalAmount.toLocaleString()} UZS`}
                      >
                        {finalAmount.toLocaleString()} <span className="text-lg font-bold text-emerald-600">UZS</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            {step > 1 && (
              <button
                disabled={isLoading}
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ORQAGA
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`px-10 py-4 rounded-2xl font-black flex items-center justify-center min-w-[200px] gap-2 transition-all shadow-xl active:scale-95 uppercase tracking-widest ${
                step === 3
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                  : 'bg-gray-800 hover:bg-black text-white shadow-gray-300'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : step === 3 ? (
                <>
                  <Save size={20} strokeWidth={2.5} /> Saqlash
                </>
              ) : (
                <>
                  Davom etish <ChevronRight size={20} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCashSale;