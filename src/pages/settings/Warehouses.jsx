import React, { useState, useEffect } from 'react';
import {
  Plus,
  Warehouse as WarehouseIcon,
  Edit,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { apiFetch } from '../../utils/api';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [toggleModal, setToggleModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    nextActive: true
  });

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canManageWarehouses = hasPermission(PERMISSIONS.WAREHOUSE_MANAGE);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const anyModalOpen = toggleModal.isOpen || isSuccessOpen;

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
  }, [toggleModal.isOpen, isSuccessOpen]);

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setIsSuccessOpen(true);

    setTimeout(() => {
      setIsSuccessOpen(false);
    }, 2200);
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setIsEditing(false);
    setEditingId(null);
  };

  const fetchWarehouses = async () => {
    try {
      const data = await apiFetch('/api/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Omborlarni yuklashda xatolik yuz berdi!");
      setWarehouses([]);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!name.trim()) {
      return toast.error("Ombor nomini yozing!");
    }

    if (
      warehouses.some(
        (w) => w.name?.toLowerCase() === name.trim().toLowerCase() && w.id !== editingId
      )
    ) {
      return toast.error("Bu nomdagi ombor allaqachon mavjud!");
    }

    try {
      if (isEditing) {
        await apiFetch(`/api/warehouses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: name.trim(), address: address.trim() || null })
        });
        resetForm();
        fetchWarehouses();
        showSuccessModal("Ombor muvaffaqiyatli tahrirlandi!");
      } else {
        await apiFetch('/api/warehouses', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), address: address.trim() || null })
        });
        resetForm();
        fetchWarehouses();
        showSuccessModal("Ombor muvaffaqiyatli qo'shildi!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Saqlashda xatolik yuz berdi.");
    }
  };

  const handleToggleActive = async () => {
    try {
      await apiFetch(`/api/warehouses/${toggleModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: toggleModal.nextActive })
      });
      setToggleModal({ isOpen: false, id: null, name: '', nextActive: true });
      fetchWarehouses();
      showSuccessModal(
        toggleModal.nextActive ? "Ombor faollashtirildi!" : "Ombor yopildi!"
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Holatni o'zgartirishda xatolik yuz berdi.");
    }
  };

  const openEdit = (warehouse) => {
    setIsEditing(true);
    setEditingId(warehouse.id);
    setName(warehouse.name || '');
    setAddress(warehouse.address || '');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Omborlarni boshqarish</h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit size={20} className="text-amber-600" />
                    Omborni tahrirlash
                  </>
                ) : (
                  <>
                    <Plus size={20} className="text-blue-600" />
                    Yangi ombor
                  </>
                )}
              </h3>

              {isEditing && (
                <button
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Bekor qilish"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {canManageWarehouses ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nomi</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-blue-500"
                    placeholder="Masalan: Filial 2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdate()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Manzil</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-blue-500"
                    placeholder="Manzil (ixtiyoriy)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdate()}
                  />
                </div>

                <button
                  onClick={handleAddOrUpdate}
                  className={`w-full py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    isEditing
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  }`}
                >
                  {isEditing ? <Save size={18} /> : <Plus size={18} />}
                  {isEditing ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 font-medium">
                Sizda omborlarni boshqarish huquqi yo'q.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold text-gray-600 flex justify-between">
              <span>Mavjud omborlar ({warehouses.length})</span>
            </div>

            {warehouses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Hozircha omborlar yo'q</div>
            ) : (
              <ul className="divide-y">
                {warehouses.map((w) => (
                  <li
                    key={w.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          w.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <WarehouseIcon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {w.name}
                          {!w.isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wide">
                              Yopiq
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {w.address || 'Manzil kiritilmagan'}
                          {' • '}
                          {w.productCount} xil mahsulot, {w.totalQuantity} dona
                        </div>
                      </div>
                    </div>

                    {canManageWarehouses && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(w)}
                          className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                          title="Tahrirlash"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() =>
                            setToggleModal({
                              isOpen: true,
                              id: w.id,
                              name: w.name,
                              nextActive: !w.isActive
                            })
                          }
                          disabled={w.name === 'Asosiy' && w.isActive}
                          title={
                            w.name === 'Asosiy' && w.isActive
                              ? "Asosiy omborni yopib bo'lmaydi"
                              : w.isActive
                              ? 'Yopish'
                              : 'Faollashtirish'
                          }
                          className={`p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            w.isActive
                              ? 'text-red-500 bg-red-50 hover:bg-red-500 hover:text-white'
                              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {toggleModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                toggleModal.nextActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              {toggleModal.nextActive ? 'Omborni faollashtirasizmi?' : 'Omborni yopasizmi?'}
            </h3>

            <p className="text-center text-gray-500 text-sm mb-6">
              <span className="font-bold text-gray-700">{toggleModal.name}</span>
              {toggleModal.nextActive
                ? ' ombori qaytadan faol bo\'ladi.'
                : ' ombori yopiladi va undan yangi kirim/savdo qilib bo\'lmaydi. Mavjud tovarlar saqlanib qoladi.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setToggleModal({ isOpen: false, id: null, name: '', nextActive: true })
                }
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Orqaga
              </button>

              <button
                onClick={handleToggleActive}
                className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all ${
                  toggleModal.nextActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                }`}
              >
                {toggleModal.nextActive ? 'Faollashtirish' : 'Yopish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>

              <div className="relative w-24 h-24 bg-emerald-500 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-emerald-200 rotate-3">
                <CheckCircle size={44} strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              Muvaffaqiyatli!
            </h3>

            <p className="text-slate-500 font-bold text-sm px-4 leading-relaxed">
              {successMessage}
            </p>

            <div className="mt-8 px-4">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full animate-progress-line w-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
