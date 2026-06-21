import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  Smartphone,
  Check,
  Loader2,
  Package,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';
import { fuzzyMatchProduct } from '../../utils/fuzzyMatch';

const WarehouseTransfer = () => {
  const canManageWarehouses = hasPermission(PERMISSIONS.WAREHOUSE_MANAGE);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [selectedImeis, setSelectedImeis] = useState([]);
  const [note, setNote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [productsData, warehousesData, transfersData] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/warehouses?active=true'),
        apiFetch('/api/warehouses/transfers?limit=20')
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      setTransfers(Array.isArray(transfersData?.items) ? transfersData.items : []);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];

    return products.filter((p) => fuzzyMatchProduct(productSearch, p));
  }, [products, productSearch]);

  const productBatches = useMemo(() => {
    if (!selectedProduct) return [];
    return Array.isArray(selectedProduct.batches)
      ? selectedProduct.batches.filter((b) => !b.isArchived)
      : [];
  }, [selectedProduct]);

  const sourceWarehouseOptions = useMemo(() => {
    const ids = new Set(productBatches.filter((b) => Number(b.quantity) > 0).map((b) => b.warehouseId));
    return warehouses.filter((w) => ids.has(w.id));
  }, [productBatches, warehouses]);

  const sourceQuantity = useMemo(() => {
    if (!fromWarehouseId) return 0;
    return productBatches
      .filter((b) => String(b.warehouseId) === String(fromWarehouseId))
      .reduce((sum, b) => sum + Number(b.quantity || 0), 0);
  }, [productBatches, fromWarehouseId]);

  const sourceUnits = useMemo(() => {
    if (!fromWarehouseId) return [];
    return productBatches
      .filter((b) => String(b.warehouseId) === String(fromWarehouseId))
      .flatMap((b) => (Array.isArray(b.units) ? b.units : []))
      .filter((u) => u.status === 'IN_STOCK');
  }, [productBatches, fromWarehouseId]);

  const isImeiTracked = sourceUnits.length > 0;

  const resetForm = () => {
    setSelectedProduct(null);
    setProductSearch('');
    setFromWarehouseId('');
    setToWarehouseId('');
    setBulkQuantity('');
    setSelectedImeis([]);
    setNote('');
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch(product.name || '');
    setFromWarehouseId('');
    setToWarehouseId('');
    setBulkQuantity('');
    setSelectedImeis([]);
  };

  const toggleImeiSelection = (imei) => {
    setSelectedImeis((prev) =>
      prev.includes(imei) ? prev.filter((v) => v !== imei) : [...prev, imei]
    );
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      return toast.error("Mahsulotni tanlang!");
    }

    if (!fromWarehouseId || !toWarehouseId) {
      return toast.error("Qaysi ombordan va qaysi omborga o'tkazilishi tanlanishi shart!");
    }

    if (fromWarehouseId === toWarehouseId) {
      return toast.error("Bir xil ombor orasida o'tkazma qilib bo'lmaydi!");
    }

    const payload = {
      productId: selectedProduct.id,
      fromWarehouseId: Number(fromWarehouseId),
      toWarehouseId: Number(toWarehouseId),
      note: note.trim() || undefined
    };

    if (isImeiTracked) {
      if (selectedImeis.length === 0) {
        return toast.error("Kamida bitta telefon tanlang!");
      }
      payload.imeis = selectedImeis;
    } else {
      const qty = Number(bulkQuantity);
      if (!qty || qty <= 0) {
        return toast.error("O'tkaziladigan miqdorni to'g'ri kiriting!");
      }
      if (qty > sourceQuantity) {
        return toast.error("Omborda yetarli qoldiq yo'q!");
      }
      payload.quantity = qty;
    }

    setIsSubmitting(true);

    try {
      await apiFetch('/api/warehouses/transfer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success("O'tkazma muvaffaqiyatli bajarildi!");
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "O'tkazmada xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageWarehouses) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Ruxsat yo'q</h2>
          <p className="text-slate-500 font-medium">
            Sizda omborlar orasida o'tkazma qilish huquqi yo'q.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-slate-900">Omborlar o'tkazmasi</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tovarni bir ombordan ikkinchisiga o'tkazish
        </p>
      </div>

      {loading ? (
        <div className="flex-1 min-h-0 bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center">
          <Loader2 size={30} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-blue-500" /> Yangi o'tkazma
            </h3>

            <div className="relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Mahsulot
              </label>
              <input
                type="text"
                className="w-full h-12 px-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                placeholder="Mahsulot nomi yoki ID bo'yicha qidiring..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProduct(null);
                }}
              />

              {productSearch && !selectedProduct && filteredProducts.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-2xl mt-2 max-h-[300px] overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {p.name}
                      </span>
                      <span className="text-xs font-mono text-blue-600 shrink-0">
                        #{p.customId ?? '-'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedProduct && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Qaysi ombordan
                    </label>
                    <select
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 disabled:opacity-50 cursor-pointer"
                      value={fromWarehouseId}
                      onChange={(e) => {
                        setFromWarehouseId(e.target.value);
                        setBulkQuantity('');
                        setSelectedImeis([]);
                      }}
                    >
                      <option value="">Tanlang...</option>
                      {sourceWarehouseOptions.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Qaysi omborga
                    </label>
                    <select
                      disabled={isSubmitting}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 disabled:opacity-50 cursor-pointer"
                      value={toWarehouseId}
                      onChange={(e) => setToWarehouseId(e.target.value)}
                    >
                      <option value="">Tanlang...</option>
                      {warehouses
                        .filter((w) => String(w.id) !== String(fromWarehouseId))
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {fromWarehouseId && (
                  <>
                    {isImeiTracked ? (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                          Telefonlarni tanlang ({selectedImeis.length} ta tanlandi)
                        </label>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl p-2">
                          {sourceUnits.map((unit) => {
                            const isSelected = selectedImeis.includes(unit.imei);
                            return (
                              <button
                                key={unit.id}
                                type="button"
                                onClick={() => toggleImeiSelection(unit.imei)}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all ${
                                  isSelected
                                    ? 'border-indigo-400 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Smartphone
                                    size={15}
                                    className={isSelected ? 'text-indigo-600' : 'text-slate-400'}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-mono text-sm font-semibold text-slate-800">
                                      IMEI 1: {unit.imei}
                                    </span>
                                    {unit.imei2 && (
                                      <span className="font-mono text-xs text-slate-500">
                                        IMEI 2: {unit.imei2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <Check size={16} className="text-indigo-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                          Miqdori (qoldiq: {sourceQuantity} ta)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={sourceQuantity}
                          disabled={isSubmitting}
                          className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-50"
                          value={bulkQuantity}
                          onChange={(e) => setBulkQuantity(e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-50"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowLeftRight size={18} />
                  )}
                  O'tkazish
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
              <WarehouseIcon size={16} className="text-blue-500" />
              <h3 className="font-semibold text-slate-700 text-sm">So'nggi o'tkazmalar</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16">
                  <Package size={36} className="mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Hozircha o'tkazmalar yo'q</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {transfers.map((t) => (
                    <li key={t.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {t.product?.name}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(t.createdAt).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          {t.fromWarehouse?.name}
                        </span>
                        <ArrowLeftRight size={12} className="text-slate-400" />
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">
                          {t.toWarehouse?.name}
                        </span>
                        <span className="ml-auto text-blue-600">{t.quantity} ta</span>
                      </div>
                      {Array.isArray(t.imeis) && t.imeis.length > 0 && (
                        <div className="mt-1 text-[11px] text-indigo-500 font-mono truncate">
                          IMEI: {t.imeis.join(', ')}
                        </div>
                      )}
                      {t.note && (
                        <div className="mt-1 text-[11px] text-slate-400">{t.note}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseTransfer;
