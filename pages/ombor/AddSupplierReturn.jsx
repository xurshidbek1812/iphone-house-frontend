import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, ArrowLeft, CheckCircle, AlertTriangle, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const AddSupplierReturn = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [allBatches, setAllBatches] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [invoicesHistory, setInvoicesHistory] = useState([]); 
  
  const [returnItems, setReturnItems] = useState([]);
  const [supplierId, setSupplierId] = useState(''); 
  const [note, setNote] = useState('');
  
  const [currencyRate, setCurrencyRate] = useState(localStorage.getItem('globalExchangeRate') || '12500');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- MA'LUMOTLARNI YUKLASH ---
  useEffect(() => {
    const savedSuppliers = JSON.parse(localStorage.getItem('suppliersList') || "[]");
    setSuppliersList(savedSuppliers);

    const savedInvoices = JSON.parse(localStorage.getItem('supplierInvoices') || "[]");
    setInvoicesHistory(savedInvoices);

    const fetchProducts = async () => {
      try {
        const res = await fetch('https://iphone-house-api.onrender.com/api/products');
        const apiData = await res.json();

        let extractedBatches = [];
        
        apiData.forEach(prod => {
            if (prod.batches && prod.batches.length > 0) {
                prod.batches.forEach(batch => {
                    if (batch.quantity > 0) {
                        extractedBatches.push({
                            id: prod.id,                 
                            batchId: batch.id,           
                            customId: prod.customId,
                            name: prod.name,
                            quantity: batch.quantity,    
                            buyPrice: batch.buyPrice,    
                            buyCurrency: batch.buyCurrency,
                            inputQty: 1,
                            inputPrice: batch.buyPrice,
                            inputCurrency: batch.buyCurrency
                        });
                    }
                });
            } else if (prod.quantity > 0) {
                extractedBatches.push({
                    id: prod.id,
                    batchId: `old-${prod.id}`,
                    customId: prod.customId,
                    name: prod.name,
                    quantity: prod.quantity,
                    buyPrice: prod.buyPrice,
                    buyCurrency: prod.buyCurrency || 'USD',
                    inputQty: 1,
                    inputPrice: prod.buyPrice,
                    inputCurrency: prod.buyCurrency || 'USD'
                });
            }
        });

        setAllBatches(extractedBatches);
      } catch (err) { 
        console.error(err); 
        toast.error("Server bilan aloqa yo'q!");
      }
    };
    fetchProducts();
  }, []);

  const handleProductInputChange = (batchId, field, value) => {
    setAllBatches(allBatches.map(b => 
        b.batchId === batchId ? { ...b, [field]: value } : b
    ));
  };

  // --- QAYTARISHGA QO'SHISH ---
  const addToReturn = (batchItem) => {
    if (!supplierId) return toast.error("Iltimos, avval Ta'minotchini tanlang!");

    const quantityToAdd = Number(batchItem.inputQty);
    if (quantityToAdd <= 0) return toast.error("Sonini to'g'ri kiriting!");

    const alreadyInCart = returnItems
        .filter(item => item.batchId === batchItem.batchId)
        .reduce((sum, item) => sum + Number(item.inputQty), 0);

    const totalRequested = alreadyInCart + quantityToAdd;

    if (totalRequested > batchItem.quantity) {
        return toast.error(`Xatolik! Bu narxdagi tovardan omborda faqat ${batchItem.quantity} dona bor.`);
    }

    const newItem = {
      ...batchItem,
      uid: Date.now() + Math.random(),
      inputQty: quantityToAdd,
      inputPrice: Number(batchItem.inputPrice),
      inputCurrency: batchItem.inputCurrency,
      totalSum: quantityToAdd * Number(batchItem.inputPrice)
    };
    
    setReturnItems([...returnItems, newItem]);
    toast.success("Ro'yxatga qo'shildi!");
  };

  const updateReturnItem = (uid, field, value) => {
    setReturnItems(prevItems => {
        return prevItems.map(item => {
            if (item.uid === uid) {
                let newValue = Number(value);
                
                if (field === 'inputQty') {
                    const otherRowsQty = prevItems
                        .filter(i => i.batchId === item.batchId && i.uid !== uid)
                        .reduce((sum, i) => sum + Number(i.inputQty), 0);
                    
                    if ((newValue + otherRowsQty) > item.quantity) {
                        toast.error(`Maksimum ruxsat: ${item.quantity} dona!`);
                        newValue = item.quantity - otherRowsQty; 
                        if (newValue < 0) newValue = 0;
                    }
                }

                const updatedItem = { ...item, [field]: newValue };
                updatedItem.totalSum = Number(updatedItem.inputQty) * Number(updatedItem.inputPrice);
                return updatedItem;
            }
            return item;
        });
    });
  };

  const removeFromReturn = (uid) => {
    setReturnItems(returnItems.filter(item => item.uid !== uid));
  };

  const totalQty = returnItems.reduce((acc, item) => acc + Number(item.inputQty), 0);
  const totalUZS = returnItems.filter(item => item.inputCurrency === 'UZS').reduce((acc, item) => acc + item.totalSum, 0);
  const totalUSD = returnItems.filter(item => item.inputCurrency === 'USD').reduce((acc, item) => acc + item.totalSum, 0);

  const handlePreSave = () => {
    if (!supplierId) return toast.error("Iltimos, Ta'minotchini tanlang!");
    if (returnItems.length === 0) return toast.error("Qaytariladigan tovarlarni qo'shmadingiz!");
    setShowConfirmModal(true);
  };

const executeSave = () => {
    const supplierName = suppliersList.find(s => String(s.id) === String(supplierId))?.name || "Noma'lum";
    // Tizimga kirgan xodimning ismini olamiz
    const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';

    const newReturn = {
        id: Date.now(),
        supplierId,
        supplier: supplierName,
        note, 
        items: returnItems,
        totalSumUZS: totalUZS,
        totalSumUSD: totalUSD,
        totalSum: totalUZS + (totalUSD * Number(currencyRate)), 
        status: 'Jarayonda',
        date: new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        // SHU QATOR QO'SHILDI:
        userName: currentUserName
    };

    const existingReturns = JSON.parse(localStorage.getItem('supplierReturns') || "[]");
    localStorage.setItem('supplierReturns', JSON.stringify([newReturn, ...existingReturns]));

    setShowConfirmModal(false);
    toast.success("Qaytarish hujjati saqlandi!");
    navigate('/ombor/taminotchi-qaytarish');
  };

  // =========================================================================
  // --- ENG MUHIM QISM: TA'MINOTCHI BO'YICHA QAT'IY FILTRLASH MANTIQI ---
  // =========================================================================
// =========================================================================
  // --- ENG MUHIM QISM: TA'MINOTCHI BO'YICHA QAT'IY FILTRLASH MANTIQI ---
  // =========================================================================
  const selectedSupplier = suppliersList.find(s => String(s.id) === String(supplierId));

  const filteredBatches = allBatches.filter(batch => {
    // 1. Qidiruv matniga mosligini tekshirish
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          batch.customId.toString().includes(searchTerm);
    
    // Agar qidiruvga tushmasa, qolganini tekshirib o'tirishdan foyda yo'q
    if (!matchesSearch) return false;

    // 2. Agar ta'minotchi tanlanmagan bo'lsa, hech nima chiqmaydi
    if (!selectedSupplier) return false;

    // 3. Shu ta'minotchi obkegan barcha fakturalarni tarixidan qidiramiz
    const validInvoices = invoicesHistory.filter(inv => inv.supplier === selectedSupplier.name);

    // QAT'IY SHART: Agar bu ta'minotchidan umuman faktura bo'lmasa -> QAT'IY FALSE (Bo'sh ro'yxat)
    if (validInvoices.length === 0) return false;

    // Agar fakturalari bo'lsa, o'sha fakturalar ichida rostdan ham shu tovar bormi tekshiramiz
    const isFromThisSupplier = validInvoices.some(inv => 
        inv.items.some(item => 
            String(item.id) === String(batch.id) || 
            String(item.customId) === String(batch.customId)
        )
    );

    return isFromThisSupplier;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
            <h1 className="text-xl font-bold text-gray-800">Tovar qaytarish</h1>
        </div>
        <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600">Bekor qilish</button>
            <button onClick={handlePreSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                <Save size={18}/> Saqlash
            </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
         <div className="col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ta'minotchi nomi <span className="text-red-500">*</span></label>
                <select 
                    className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold ${!supplierId ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white'}`}
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                >
                    <option value="">Ta'minotchini tanlang...</option>
                    {suppliersList.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Izoh (Sabab)</label>
                    <input type="text" className="w-full p-2.5 bg-white border rounded-lg outline-blue-500" placeholder="Masalan: Sifatsiz chiqdi..." value={note} onChange={(e)=>setNote(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Bugungi Kurs (1 USD)</label>
                    <input type="number" className="w-full p-2.5 bg-blue-50 text-blue-800 font-bold border border-blue-200 rounded-lg outline-none" value={currencyRate} onChange={(e)=>setCurrencyRate(e.target.value)} />
                </div>
            </div>
         </div>

         <div className="col-span-4 grid grid-rows-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="text-gray-500 text-sm font-medium mb-1">Qaytarilayotgan Tovar</div>
                <div className="text-3xl font-bold text-red-500">{totalQty} <span className="text-lg text-gray-400 font-normal">dona</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="text-gray-500 text-sm font-medium mb-1">Qaytarish Summasi</div>
                <div className="flex flex-col">
                    <div className="text-2xl font-bold text-green-600">{totalUZS.toLocaleString()} <span className="text-sm text-gray-400 font-normal">UZS</span></div>
                    {totalUSD > 0 && <div className="text-2xl font-bold text-blue-600">{totalUSD.toLocaleString()} <span className="text-sm text-gray-400 font-normal">USD</span></div>}
                </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
        <div className="flex border-b">
            <button onClick={() => setActiveTab('products')} className={`px-8 py-4 font-bold text-sm transition-all ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>Mavjud mahsulotlar</button>
            <button onClick={() => setActiveTab('invoice')} className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'invoice' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                Qaytariladiganlar
                {returnItems.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{returnItems.length}</span>}
            </button>
        </div>

        {activeTab === 'products' && (
            <div className="p-6 flex flex-col h-full animate-in fade-in">
                {/* 1. TA'MINOTCHI TANLANMAGAN HOLAT */}
                {!supplierId ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 border-2 border-dashed rounded-xl border-gray-200">
                        <AlertTriangle className="text-yellow-500 mb-3" size={48} />
                        <h3 className="text-lg font-bold text-gray-700">Ta'minotchini tanlang</h3>
                        <p className="text-sm mt-1">Tovarlarni ko'rish uchun avval tepadan ta'minotchini tanlashingiz kerak.</p>
                    </div>
                ) : 
                
                /* 2. TA'MINOTCHIDAN TOVAR KELMAGAN (YOKI QIDIRUVDA TOPILMAGAN) HOLAT */
                filteredBatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white border rounded-xl">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <PackageX className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Hech qanday tovar topilmadi</h3>
                        <p className="text-sm text-gray-400 mt-1 text-center max-w-sm">
                            Bu ta'minotchi bizga hali hech qanday tovar olib kelmagan yoki tovarlar ro'yxati bo'sh.
                        </p>
                    </div>
                ) : 
                
                /* 3. TOVARLAR RO'YXATI */
                (
                    <>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                            <input type="text" className="w-full pl-12 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="Qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                        <div className="overflow-auto flex-1 border rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="p-4">Nomi</th>
                                        <th className="p-4 text-center">Partiya Qoldig'i</th>
                                        <th className="p-4 w-32">Qaytarish Soni</th>
                                        <th className="p-4 w-40">Kirim Narxi</th>
                                        <th className="p-4 w-28">Valyuta</th>
                                        <th className="p-4 text-center w-20">Qo'shish</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {filteredBatches.map(batch => (
                                        <tr key={batch.batchId} className="hover:bg-gray-50 group">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-800">{batch.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">ID: {batch.customId}</div>
                                            </td>
                                            <td className="p-4 text-center text-blue-600 font-bold bg-blue-50/50">{batch.quantity}</td>
                                            <td className="p-4"><input type="number" className="w-full p-2 border rounded-lg text-center outline-blue-500 font-bold" value={batch.inputQty} onChange={(e) => handleProductInputChange(batch.batchId, 'inputQty', e.target.value)} /></td>
                                            <td className="p-4"><input type="number" className="w-full p-2 border rounded-lg text-right outline-blue-500" value={batch.inputPrice} onChange={(e) => handleProductInputChange(batch.batchId, 'inputPrice', e.target.value)} /></td>
                                            <td className="p-4">
                                                <select className="w-full p-2 border rounded-lg outline-blue-500 bg-white" value={batch.inputCurrency} onChange={(e) => handleProductInputChange(batch.batchId, 'inputCurrency', e.target.value)}>
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center"><button onClick={() => addToReturn(batch)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors active:scale-95"><Plus size={20}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        )}

        {activeTab === 'invoice' && (
             <div className="p-6 flex flex-col h-full animate-in fade-in">
                {returnItems.length === 0 ? <p className="text-center text-gray-400 mt-10">Ro'yxat bo'sh. Mahsulot qo'shing.</p> : (
                    <div className="overflow-auto border rounded-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-4">Nomi</th>
                                    <th className="p-4 w-32 text-center">Miqdor</th>
                                    <th className="p-4 w-40 text-right">Narx</th>
                                    <th className="p-4 w-28">Valyuta</th>
                                    <th className="p-4 text-right">Jami</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {returnItems.map(item => (
                                    <tr key={item.uid} className="hover:bg-red-50 transition-colors">
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4"><input type="number" className="w-full p-2 border rounded-lg text-center outline-red-400 font-bold" value={item.inputQty} onChange={(e) => updateReturnItem(item.uid, 'inputQty', e.target.value)}/></td>
                                        <td className="p-4"><input type="number" className="w-full p-2 border rounded-lg text-right outline-red-400" value={item.inputPrice} onChange={(e) => updateReturnItem(item.uid, 'inputPrice', e.target.value)}/></td>
                                        <td className="p-4">
                                            <select className="w-full p-2 border rounded-lg bg-white outline-red-400" value={item.inputCurrency} onChange={(e) => updateReturnItem(item.uid, 'inputCurrency', e.target.value)}>
                                                <option value="UZS">UZS</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-800">{item.totalSum.toLocaleString()}</td>
                                        <td className="p-4 text-center"><button onClick={() => removeFromReturn(item.uid)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
             </div>
        )}
      </div>

      {showConfirmModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                      <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Hujjatni saqlaysizmi?</h3>
                  <p className="text-center text-gray-500 text-sm mb-6">
                      Barcha qaytarilayotgan tovarlar soni to'g'ri kiritilganligini tasdiqlang.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Orqaga</button>
                      <button onClick={executeSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-transform">Tasdiqlash</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AddSupplierReturn;