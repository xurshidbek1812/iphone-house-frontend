import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Search,
  User,
  X,
  Briefcase,
  Users,
  ShoppingCart,
  Calendar,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  ScanLine,
  Loader2,
  MessageSquare,
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

const SearchableSelect = ({ placeholder, onSelect, excludeIds = [], customers = [] }) => {
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
    if (!search) {
      return customers.filter((c) => !excludeIds.includes(c.id));
    }

    const lowerSearch = search.trim().toLowerCase();

    return customers.filter((c) => {
      if (excludeIds.includes(c.id)) return false;

      const text = `${c.firstName || ''} ${c.lastName || ''} ${c.pinfl || ''} ${c.document?.number || ''}`.toLowerCase();
      return text.includes(lowerSearch);
    });
  }, [customers, search, excludeIds]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 hover:bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all"
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
                  <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {customer.id}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">JSHSHIR: {customer.pinfl || '-'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">Mijoz topilmadi</div>
          )}
        </div>
      )}
    </div>
  );
};

const AddContract = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);

  const token = sessionStorage.getItem('token');
  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase()
;

  const barcodeInputRef = useRef(null);

  const [contractData, setContractData] = useState({
    mainCustomer: null,
    coBorrowers: [],
    staffId: '',
    cashboxId: '',
    items: [],
    duration: 12,
    discountAmount: 0,
    prepayment: 0,
    paymentDay: 15,
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

  const fetchBaseData = useCallback(
    async (signal = undefined) => {
      if (!token) return;

      try {
        setDataLoading(true);

        const [custRes, prodRes, cashboxRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/customers`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/products`, { headers: getAuthHeaders(), signal }),
          fetch(`${API_URL}/api/cashboxes`, { headers: getAuthHeaders(), signal })
        ]);

        let loadedCustomers = [];
        let loadedProducts = [];
        let loadedCashboxes = [];

        if (custRes.status === 'fulfilled' && custRes.value.ok) {
          const d = await parseJsonSafe(custRes.value);
          loadedCustomers = Array.isArray(d) ? d : [];
          setCustomers(loadedCustomers);
        }

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const d = await parseJsonSafe(prodRes.value);
          loadedProducts = Array.isArray(d) ? d : [];
          setProducts(loadedProducts);
        }

        if (cashboxRes.status === 'fulfilled' && cashboxRes.value.ok) {
          const d = await parseJsonSafe(cashboxRes.value);
          loadedCashboxes = Array.isArray(d) ? d : [];
          setCashboxes(loadedCashboxes);
        }

        if (userRole === 'director') {
          const staffRes = await fetch(`${API_URL}/api/users`, {
            headers: getAuthHeaders(),
            signal
          });

          if (staffRes.ok) {
            const d = await parseJsonSafe(staffRes);
            setStaffList(Array.isArray(d) ? d : []);
          }
        } else {
          const meRes = await fetch(`${API_URL}/api/users/me`, {
            headers: getAuthHeaders(),
            signal
          });

          if (meRes.ok) {
            const meData = await parseJsonSafe(meRes);
            if (meData) {
              setStaffList([meData]);
              setContractData((prev) => ({
                ...prev,
                staffId: prev.staffId || meData.id
              }));
            }
          }
        }

        if (isEditMode) {
          const contractRes = await fetch(`${API_URL}/api/contracts/${id}`, {
            headers: getAuthHeaders(),
            signal
          });

          const contract = await parseJsonSafe(contractRes);

          if (!contractRes.ok || !contract) {
            toast.error(contract?.error || "Shartnomani yuklab bo'lmadi");
            navigate('/shartnoma');
            return;
          }

          if (String(contract.status).toUpperCase() !== 'DRAFT') {
            toast.error("Faqat jarayondagi shartnomani tahrirlash mumkin!");
            navigate('/shartnoma');
            return;
          }

          const mainCustomer =
            loadedCustomers.find((c) => c.id === contract.customerId) || contract.customer || null;

          const coBorrowers =
            Array.isArray(contract.coBorrowers)
              ? contract.coBorrowers
                  .map((co) => co.customer)
                  .filter(Boolean)
              : [];

          const mappedItems =
            Array.isArray(contract.items)
              ? contract.items.map((item) => {
                  const matchedProduct =
                    loadedProducts.find((p) => p.id === item.productId) || item.product || {};

                  return {
                    id: item.productId,
                    customId: matchedProduct.customId,
                    name: matchedProduct.name || item.product?.name || "Noma'lum tovar",
                    quantity: Number(matchedProduct.quantity || 0),
                    salePrice: Number(item.unitPrice || matchedProduct.salePrice || 0),
                    qty: Number(item.quantity || 1)
                  };
                })
              : [];

          setContractData({
            mainCustomer,
            coBorrowers,
            staffId: contract.userId || '',
            cashboxId: contract.cashboxId || '',
            items: mappedItems,
            duration: Number(contract.durationMonths || 12),
            discountAmount: Number(contract.discountAmount || 0),
            prepayment: Number(contract.prepayment || 0),
            paymentDay: Number(contract.paymentDay || 15),
            note: contract.note || ''
          });
        } else {
          setContractData((prev) => ({
            ...prev,
            cashboxId: prev.cashboxId || loadedCashboxes[0]?.id || '',
            staffId: prev.staffId || prev.staffId
          }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          toast.error("Ma'lumotlarni yuklashda xatolik!");
        }
      } finally {
        if (!signal?.aborted) {
          setDataLoading(false);
        }
      }
    },
    [token, userRole, getAuthHeaders, isEditMode, id, navigate]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBaseData(controller.signal);
    return () => controller.abort();
  }, [fetchBaseData]);

  const grandTotal = useMemo(() => {
    return contractData.items.reduce((sum, item) => {
      return sum + (Number(item.salePrice || 0) * Number(item.qty || 0));
    }, 0);
  }, [contractData.items]);

  const finalTotal = useMemo(() => {
  return Math.max(0, grandTotal - Number(contractData.discountAmount || 0));
}, [grandTotal, contractData.discountAmount]);

const debtAmount = useMemo(() => {
  return Math.max(0, finalTotal - Number(contractData.prepayment || 0));
}, [finalTotal, contractData.prepayment]);

  const monthlyPayment = useMemo(() => {
    return Number(contractData.duration) > 0
      ? debtAmount / Number(contractData.duration)
      : 0;
  }, [debtAmount, contractData.duration]);

  const generateSchedule = useCallback(() => {
    const schedule = [];
    const duration = Number(contractData.duration || 0);
    const paymentDay = Number(contractData.paymentDay || 1);

    const now = new Date();

    for (let i = 1; i <= duration; i++) {
      const target = new Date(now.getFullYear(), now.getMonth() + i, 1);
      let date = new Date(target.getFullYear(), target.getMonth(), paymentDay);

      if (date.getMonth() !== target.getMonth()) {
        date = new Date(target.getFullYear(), target.getMonth() + 1, 0);
      }

      schedule.push({
        month: i,
        date: date.toLocaleDateString('uz-UZ'),
        amount: monthlyPayment
      });
    }

    return schedule;
  }, [contractData.duration, contractData.paymentDay, monthlyPayment]);

  const selectMainCustomer = (customer) =>
    setContractData((prev) => ({ ...prev, mainCustomer: customer }));

  const addCoBorrower = (customer) =>
    setContractData((prev) => ({
      ...prev,
      coBorrowers: [...prev.coBorrowers, customer]
    }));

  const removeCoBorrower = (customerId) =>
    setContractData((prev) => ({
      ...prev,
      coBorrowers: prev.coBorrowers.filter((c) => c.id !== customerId)
    }));

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const code = e.target.value.trim();

      const foundProduct = products.find(
        (p) => String(p.customId) === code || String(p.id) === code
      );

      if (foundProduct) {
        addProductToCart(foundProduct);
      } else {
        toast.error(`Kod [${code}] bo'yicha tovar topilmadi!`);
      }

      e.target.value = '';
      barcodeInputRef.current?.focus();
    }
  };

  const addProductToCart = (product) => {
    if (Number(product.quantity) <= 0) {
      return toast.error("Bazada qoldiq yo'q!");
    }

    const existingItem = contractData.items.find((i) => i.id === product.id);

    if (existingItem) {
      if (existingItem.qty + 1 > Number(product.quantity)) {
        return toast.error("Ombordagi qoldiqdan oshib ketdi!");
      }

      setContractData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }));

      toast.success(`${product.name} soni oshirildi`);
    } else {
      setContractData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            ...product,
            qty: 1
          }
        ]
      }));

      toast.success(`${product.name} savatga qo'shildi`);
    }
  };

  const updateItemQty = (id, newQty) => {
    const product = products.find((p) => p.id === id);

    if (!product) return;

    if (newQty > Number(product.quantity)) {
      return toast.error(`Bazada faqat ${product.quantity} ta bor!`);
    }

    if (newQty < 1) return;

    setContractData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, qty: newQty } : item
      )
    }));
  };

  const removeItem = (id) =>
    setContractData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id)
    }));

  const handleNext = () => {
    if (step === 1 && (!contractData.mainCustomer || !contractData.staffId || !contractData.cashboxId)) {
      return toast.error("Asosiy mijoz, xodim va tashkilotni tanlang!");
    }

    if (step === 2 && contractData.items.length === 0) {
      return toast.error("Kamida 1 ta tovar tanlang!");
    }

    if (step === 3 && Number(contractData.discountAmount || 0) > grandTotal) {
        return toast.error("Chegirma umumiy summadan ko'p bo'lolmaydi!");
    }

    if (step === 3 && Number(contractData.prepayment) > finalTotal) {
        return toast.error("Oldindan to'lov yakuniy summadan ko'p bo'lolmaydi!");
    }

    if (step < 4) {
      setStep(step + 1);

      if (step === 1) {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    } else {
      submitContract();
    }
  };

  const submitContract = async () => {
    try {
      setIsLoading(true);

      const payload = {
        customerId: contractData.mainCustomer.id,
        cashboxId: Number(contractData.cashboxId),
        staffId: Number(contractData.staffId),
        durationMonths: Number(contractData.duration),
        discountAmount: Number(contractData.discountAmount) || 0,
        prepayment: Number(contractData.prepayment) || 0,
        paymentDay: Number(contractData.paymentDay) || 15,
        note: contractData.note.trim() || null,
        coBorrowers: contractData.coBorrowers.map((c) => ({
            customerId: c.id
        })),
        items: contractData.items.map((i) => ({
            productId: i.id,
            quantity: Number(i.qty),
            unitPrice: Number(i.salePrice)
        }))
        };

      const url = isEditMode
        ? `${API_URL}/api/contracts/${id}`
        : `${API_URL}/api/contracts`;

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Xatolik yuz berdi');
      }

      toast.success(
        isEditMode
          ? "Shartnoma muvaffaqiyatli tahrirlandi!"
          : "Shartnoma muvaffaqiyatli saqlandi!"
      );

      navigate('/shartnoma');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Server bilan aloqa yo'q!");
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

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in fade-in duration-300">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            disabled={isLoading}
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">
            {isEditMode ? "Shartnomani tahrirlash" : "Yangi shartnoma rasmiylashtirish"}
          </h1>
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
          {contractData.mainCustomer && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group animate-in fade-in slide-in-from-left-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 z-0"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                    <User size={14} /> Asosiy Mijoz
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded">
                    ID: {contractData.mainCustomer.id}
                  </span>
                </div>
                <h3 className="font-black text-gray-800 text-lg leading-tight uppercase mb-4">
                  {contractData.mainCustomer.lastName} <br />
                  {contractData.mainCustomer.firstName}
                </h3>
              </div>
            </div>
          )}

          {contractData.coBorrowers.map((co, idx) => (
            <div
              key={co.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 relative overflow-hidden animate-in fade-in"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest">
                  <Users size={14} /> Qarz oluvchi #{idx + 1}
                </div>
                <button
                  disabled={isLoading}
                  onClick={() => removeCoBorrower(co.id)}
                  className="text-gray-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
              <h3 className="font-bold text-gray-800 text-sm uppercase">
                {co.lastName} {co.firstName}
              </h3>
            </div>
          ))}

          {contractData.items.length > 0 && (
            <div className="bg-gray-900 p-6 rounded-3xl shadow-xl text-white animate-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-gray-800">
                <ShoppingCart size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShoppingCart size={14} /> Shartnoma summasi
                </h3>

                <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Jami tovarlar:</span>
                        <span className="font-bold">
                        {contractData.items.reduce((s, i) => s + i.qty, 0)} ta
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Jami summa:</span>
                        <span className="font-bold">{grandTotal.toLocaleString()} UZS</span>
                    </div>

                    {Number(contractData.discountAmount) > 0 && (
                        <div className="flex justify-between text-sm text-amber-400">
                        <span className="font-medium">Chegirma:</span>
                        <span className="font-black">
                            - {Number(contractData.discountAmount).toLocaleString()} UZS
                        </span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Yakuniy summa:</span>
                        <span className="font-bold">{finalTotal.toLocaleString()} UZS</span>
                    </div>

                    {step >= 3 && Number(contractData.prepayment) > 0 && (
                        <div className="flex justify-between text-sm text-emerald-400 border-t border-gray-700/50 pt-3">
                        <span className="font-medium">Oldindan to'lov:</span>
                        <span className="font-black">
                            - {Number(contractData.prepayment).toLocaleString()} UZS
                        </span>
                        </div>
                    )}
                    </div>

                <div className="border-t border-gray-700/50 pt-4 mt-2">
                  <p className="text-gray-400 text-[10px] font-black uppercase mb-1 tracking-widest">
                    Qolgan qarz miqdori
                  </p>
                  <p
                    className="text-3xl font-black text-white truncate"
                    title={`${debtAmount.toLocaleString()} UZS`}
                  >
                    {debtAmount.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-gray-500">UZS</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-gray-100 rounded-full -z-10 -translate-y-1/2"></div>
              <div
                className="absolute top-1/2 left-6 h-1.5 rounded-full bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>

              {[
                { num: 1, icon: User, label: 'Mijoz' },
                { num: 2, icon: ShoppingCart, label: 'Tovarlar' },
                { num: 3, icon: Calendar, label: 'Muddat' },
                { num: 4, icon: CheckCircle, label: 'Tasdiq' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-xl text-sm font-black border-4 transition-all duration-300 ${
                      step === s.num
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : step > s.num
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {step > s.num ? <Check size={20} strokeWidth={3} /> : <s.icon size={20} />}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      step >= s.num ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">
                Shartnoma subyektlari
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    1. Asosiy mijozni tanlang <span className="text-red-500 text-base leading-none">*</span>
                  </label>

                  {!contractData.mainCustomer ? (
                    <SearchableSelect
                      placeholder="Ism yoki JSHSHIR bo'yicha qidiring..."
                      onSelect={selectMainCustomer}
                      excludeIds={contractData.coBorrowers.map((c) => c.id)}
                      customers={customers}
                    />
                  ) : (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center text-emerald-800 font-medium">
                      <div className="flex items-center gap-3 font-bold">
                        <CheckCircle className="text-emerald-500" size={24} />
                        Mijoz tanlandi
                      </div>
                      <button
                        onClick={() =>
                          setContractData((prev) => ({ ...prev, mainCustomer: null }))
                        }
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-black underline transition-colors"
                      >
                        Boshqa tanlash
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    2. Birgalikda qarz oluvchilar (Ixtiyoriy)
                  </label>
                  <SearchableSelect
                    placeholder="Qo'shimcha javobgarlarni qidiring va qo'shing..."
                    onSelect={addCoBorrower}
                    excludeIds={[
                      contractData.mainCustomer?.id,
                      ...contractData.coBorrowers.map((c) => c.id)
                    ].filter(Boolean)}
                    customers={customers}
                  />
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    3. Tashkilot / kassa <span className="text-red-500 text-base leading-none">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      className="w-full pl-12 pr-4 py-4 border rounded-2xl outline-none font-bold transition-colors border-gray-200 bg-gray-50 text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-4 ring-blue-50 appearance-none cursor-pointer"
                      value={contractData.cashboxId}
                      onChange={(e) =>
                        setContractData((prev) => ({
                          ...prev,
                          cashboxId: Number(e.target.value)
                        }))
                      }
                    >
                      <option value="">Tashkilotni tanlang...</option>
                      {cashboxes.map((cashbox) => (
                        <option key={cashbox.id} value={cashbox.id}>
                          {cashbox.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                    4. Jalb qilgan xodim (Sotuvchi) <span className="text-red-500 text-base leading-none">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      disabled={userRole !== 'director'}
                      className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none font-bold transition-colors ${
                        contractData.staffId
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 bg-gray-50 text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-4 ring-blue-50'
                      } ${userRole !== 'director' ? 'opacity-80 cursor-not-allowed' : 'appearance-none cursor-pointer'}`}
                      value={contractData.staffId}
                      onChange={(e) =>
                        setContractData((prev) => ({
                          ...prev,
                          staffId: Number(e.target.value)
                        }))
                      }
                    >
                      {userRole === 'director' && <option value="">Ro'yxatdan xodimni tanlang...</option>}
                      {staffList.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px] animate-in slide-in-from-right-8 duration-300">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-200">
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
                  className={`flex-1 py-4 text-sm font-black transition-colors ${
                    productTab === 'catalog'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Katalog (Qidiruv)
                </button>
                <button
                  onClick={() => setProductTab('cart')}
                  className={`flex-1 py-4 text-sm font-black transition-colors relative ${
                    productTab === 'cart'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Savat{' '}
                  <span className="absolute ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    {contractData.items.length}
                  </span>
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
                          <th className="p-4">Nomi va Kod</th>
                          <th className="p-4 text-center">Qoldiq</th>
                          <th className="p-4 text-right">Narxi (UZS)</th>
                          <th className="p-4 text-center">Amal</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                        {filteredProducts.map((p) => {
                          const isAdded = contractData.items.some((i) => i.id === p.id);

                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-blue-50/50 transition-colors ${
                                isAdded ? 'bg-blue-50/30' : ''
                              }`}
                            >
                              <td className="p-4">
                                <div className="text-gray-800">{p.name}</div>
                                <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-widest">
                                  #{p.customId ?? '-'}
                                </div>
                              </td>

                              <td className="p-4 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-xs ${
                                    Number(p.quantity) > 0
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-rose-50 text-rose-500'
                                  }`}
                                >
                                  {Number(p.quantity || 0)}
                                </span>
                              </td>

                              <td className="p-4 text-right text-gray-600">
                                {Number(p.salePrice || 0).toLocaleString()}
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  disabled={Number(p.quantity) <= 0}
                                  onClick={() => addProductToCart(p)}
                                  className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 ${
                                    isAdded
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                      : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-500'
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                  {isAdded ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
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
                  {contractData.items.length === 0 ? (
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
                            <th className="p-4 pl-6">Nomi</th>
                            <th className="p-4 w-28 text-center">Soni</th>
                            <th className="p-4 text-right">Dona Narxi</th>
                            <th className="p-4 text-right">Jami (UZS)</th>
                            <th className="p-4 text-center w-16">X</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                          {contractData.items.map((item) => (
                            <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                              <td className="p-4 pl-6 text-gray-800">{item.name}</td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={item.qty}
                                  onChange={(e) => updateItemQty(item.id, Number(e.target.value))}
                                  className="w-full p-2.5 border border-gray-200 rounded-xl text-center outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 font-black text-blue-600 bg-blue-50 focus:bg-white transition-all"
                                />
                              </td>
                              <td className="p-4 text-right text-gray-500 font-medium">
                                {Number(item.salePrice).toLocaleString()}
                              </td>
                              <td className="p-4 text-right font-black text-gray-800">
                                {(Number(item.salePrice) * item.qty).toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
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
              <h2 className="text-xl font-black text-gray-800 mb-8 tracking-tight">
                To'lov grafigini sozlash
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">
                      Necha oy muddatga?
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[3, 6, 9, 12, 15, 18].map((m) => (
                        <button
                          key={m}
                          onClick={() =>
                            setContractData((prev) => ({
                              ...prev,
                              duration: m
                            }))
                          }
                          className={`py-3 rounded-xl font-black transition-all ${
                            contractData.duration === m
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600'
                          }`}
                        >
                          {m}
                        </button>
                      ))}

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Boshqa"
                          value={contractData.duration}
                          onChange={(e) =>
                            setContractData((prev) => ({
                              ...prev,
                              duration: Number(e.target.value)
                            }))
                          }
                          className="w-full h-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center font-black text-gray-700 bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-6">
                    <div>
                      <label className="block text-[11px] font-black tracking-widest text-emerald-600/70 uppercase mb-2">
                        Boshlang'ich to'lov (UZS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={contractData.prepayment}
                        onChange={(e) =>
                          setContractData((prev) => ({
                            ...prev,
                            prepayment: Number(e.target.value)
                          }))
                        }
                        className="w-full p-4 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 ring-emerald-50 font-black text-xl text-emerald-600 transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black tracking-widest text-amber-600/70 uppercase mb-2">
                            Chegirma (UZS)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max={grandTotal}
                            value={contractData.discountAmount}
                            onChange={(e) =>
                            setContractData((prev) => ({
                                ...prev,
                                discountAmount: Number(e.target.value)
                            }))
                            }
                            className="w-full p-4 bg-white border border-amber-200 rounded-xl outline-none focus:border-amber-500 focus:ring-4 ring-amber-50 font-black text-xl text-amber-600 transition-all shadow-sm"
                            placeholder="0"
                        />
                        </div>

                    <div>
                      <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2">
                        To'lov sanasi (Har oyning)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={contractData.paymentDay}
                          onChange={(e) =>
                            setContractData((prev) => ({
                              ...prev,
                              paymentDay: Number(e.target.value)
                            }))
                          }
                          className="w-24 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-center text-gray-700 shadow-sm"
                        />
                        <span className="font-bold text-gray-500">- sanasi</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-1.5 rounded-3xl border border-gray-200 flex flex-col h-full max-h-[480px]">
                  <div className="p-5 border-b border-gray-200 bg-white rounded-t-[20px] flex justify-between items-center shadow-sm">
                    <span className="font-black text-gray-800 tracking-tight">Grafik</span>
                    <span className="text-[11px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
                      Oylik: {Math.round(monthlyPayment).toLocaleString()} UZS
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-gray-400 font-black uppercase tracking-widest sticky top-0 bg-gray-50 z-10">
                        <tr>
                          <th className="py-3 px-4 border-b border-gray-200">Oy</th>
                          <th className="py-3 px-4 border-b border-gray-200">Sana</th>
                          <th className="py-3 px-4 text-right border-b border-gray-200">Summa</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                        {generateSchedule().map((row) => (
                          <tr key={row.month} className="hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-blue-500">{row.month}</td>
                            <td className="py-3 px-4">{row.date}</td>
                            <td className="py-3 px-4 text-right text-gray-800">
                              {Math.round(row.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 animate-in slide-in-from-right-8 duration-300 text-center">
              <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner rotate-3">
                <CheckCircle size={48} strokeWidth={2.5} />
              </div>

              <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
                Yakuniy tasdiq
              </h2>
              <p className="text-gray-500 font-medium mb-8">
                Barcha ma'lumotlar, muddat va to'lov grafigi to'g'riligiga ishonch hosil qiling.
              </p>

              <div className="max-w-md mx-auto space-y-6 text-left">
                <div>
                  <label className="block text-[11px] font-black tracking-widest text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} /> Maxsus izoh (Ixtiyoriy)
                  </label>
                  <textarea
                    disabled={isLoading}
                    value={contractData.note}
                    onChange={(e) =>
                      setContractData((prev) => ({
                        ...prev,
                        note: e.target.value
                      }))
                    }
                    rows="4"
                    className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white font-medium text-gray-700 resize-none transition-all disabled:opacity-50"
                    placeholder="Shartnoma yoki mijoz haqida eslatmalar..."
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            {step > 1 && (
              <button
                disabled={isLoading}
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-colors disabled:opacity-50 uppercase tracking-widest text-sm"
              >
                Orqaga
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`px-10 py-4 rounded-2xl font-black flex items-center justify-center min-w-[220px] gap-2 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm ${
                step === 4
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : step === 4 ? (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  {isEditMode ? "O'zgarishlarni saqlash" : 'Shartnomani Saqlash'}
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

export default AddContract;