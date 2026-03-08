import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const AddSupplierIncome = () => {
  const navigate = useNavigate();
  
  // ROL VA ISMNI OLISH (YANGI)
  const userRole = localStorage.getItem('userRole') || 'admin';
  const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';
  const token = localStorage.getItem('token');
  
  // 1. FAKTURA RAQAMI (Faqat sonlar: 100000 dan 999999 gacha)
  const generateInvoiceNumber = () => `${Math.floor(100000 + Math.random() * 900000)}`;

  // --- STATE ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber()); 
  const [exchangeRate, setExchangeRate] = useState(''); 

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  
  const [suppliersList, setSuppliersList] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // INPUTLAR
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inputCount, setInputCount] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputCurrency, setInputCurrency] = useState('UZS');

  // INPUT XATOLIKLARI UCHUN
  const [countError, setCountError] = useState(false);
  const [priceError, setPriceError] = useState(false);

  // --- 1. MA'LUMOTLARNI YUKLASH ---
  useEffect(() => {
    fetch('https://iphone-house-api.onrender.com/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
          if (!res.ok) throw new Error("Server xatosi");
          return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => {
          console.error("Xatolik:", err);
          toast.error("Server bilan aloqa yo'q yoki Token eskirgan!");
      });

    const savedSuppliers = JSON.parse(localStorage.getItem('suppliersList') || "[]");
    setSuppliersList(savedSuppliers);

    const globalRate = localStorage.getItem('globalExchangeRate');
    if (globalRate) setExchangeRate(globalRate);
  }, []);

  // --- 2. TOVARNI TANLASH ---
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name); 
    setInputPrice(prod.buyPrice || '');
    setInputCurrency('UZS'); 
    
    setCountError(false);
    setPriceError(false);
  };

  // --- 3. JADVALGA QO'SHISH ---
  const handleAddItem = () => {
    let productToAdd = selectedProduct;

    if (!productToAdd && searchTerm) {
        const cleanSearch = String(searchTerm).trim().toLowerCase();
        productToAdd = products.find(p => {
            const cleanCode = String(p.customId).trim().toLowerCase();
            const cleanName = String(p.name).trim().toLowerCase();
            return cleanCode === cleanSearch || cleanName === cleanSearch;
        });
    }

    if (!productToAdd) {
        toast.error(`"${searchTerm}" bazada topilmadi! Iltimos, to'g'ri tanlang.`);
        return;
    }

    const isCountValid = inputCount && Number(inputCount) > 0;
    const isPriceValid = inputPrice && Number(inputPrice) > 0;

    setCountError(!isCountValid);
    setPriceError(!isPriceValid);

    if (!isCountValid || !isPriceValid) return;

    const newItem = {
        id: productToAdd.id,
        customId: productToAdd.customId,
        name: productToAdd.name,
        category: productToAdd.category || '-',
        count: Number(inputCount),
        price: Number(inputPrice),
        currency: inputCurrency,
        total: Number(inputCount) * Number(inputPrice)
    };

    setSelectedItems([...selectedItems, newItem]);
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputCurrency('UZS');
    setCountError(false);
    setPriceError(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = Number(updatedItem.count) * Number(updatedItem.price);
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    let totalUZS = 0;
    let totalUSD = 0;
    let totalQuantity = 0;

    selectedItems.forEach(item => {
        totalQuantity += Number(item.count);
        if (item.currency === 'USD') totalUSD += item.total;
        else totalUZS += item.total;
    });
    const rate = Number(exchangeRate) || 0;
    const grandTotalUZS = totalUZS + (totalUSD * rate);
    return { grandTotalUZS, totalQuantity };
  };

  const { grandTotalUZS, totalQuantity } = calculateTotals();

  const filteredProducts = products.filter(p => {
    if (!p) return false;
    const search = String(searchTerm || '').toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const code = String(p.customId || '').toLowerCase();
    return name.includes(search) || code.includes(search);
  });

  // --- 4. SAQLASHDAN OLDINGI TEKSHIRUV (MODALNI OCHISH) ---
  const handlePreSave = () => {
    setIsSubmitted(true);

    if (!invoiceNumber.trim()) return toast.error("Faktura raqamini kiritish majburiy!");
    if (!supplier) return toast.error("Iltimos, Ta'minotchini tanlang!");
    if (selectedItems.length === 0) return toast.error("Jadval bo'sh! Kamida bitta tovar qo'shing.");

    setShowConfirmModal(true);
  };

  // --- 5. HAQIQIY SAQLASH ---
  const handleSaveInvoice = () => {
    const newInvoice = {
      id: Date.now(),
      date,
      supplier,
      invoiceNumber,
      items: selectedItems,
      totalSum: grandTotalUZS,
      status: 'Jarayonda', 
      exchangeRate,
      userName: currentUserName // Yaratgan odamning ismi yoziladi
    };

    const existingInvoices = JSON.parse(localStorage.getItem('supplierInvoices') || "[]");
    localStorage.setItem(
      'supplierInvoices',
      JSON.stringify([newInvoice, ...existingInvoices])
    );

    setShowConfirmModal(false); 
    toast.success("Faktura muvaffaqiyatli saqlandi!");
    navigate('/ombor/taminotchi-kirim');
  };

  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-lg border hover:bg-gray-100"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-bold text-gray-800">Yangi kirim qilish</h1>
            </div>
            <button 
                onClick={handlePreSave} 
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
            >
                <Save size={20}/> Fakturani saqlash
            </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
            {/* O'ZGARTIRISH: Admin bo'lsa butun ekranni egallaydi, Direktor bo'lsa 8 ta ustunni egallaydi */}
            <div className={`space-y-6 ${userRole === 'director' ? 'col-span-8' : 'col-span-12'}`}>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Asosiy ma'lumotlar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="date" className="w-full p-3 border rounded-lg outline-blue-500" value={date} onChange={e=>setDate(e.target.value)}/>
                        
                        <div className={isSubmitted && !invoiceNumber ? "border-red-500 rounded-lg border-2 animate-pulse" : ""}>
                            <input 
                                type="number" 
                                className={`w-full p-3 border rounded-lg outline-blue-500 font-bold text-gray-700 ${isSubmitted && !invoiceNumber ? 'text-red-500 placeholder-red-300 bg-red-50' : ''}`} 
                                placeholder="Faktura №" 
                                value={invoiceNumber} 
                                onChange={e=>setInvoiceNumber(e.target.value)}
                            />
                        </div>

                        <div className={isSubmitted && !supplier ? "border-red-500 rounded-lg border-2 animate-pulse col-span-2 md:col-span-1" : "col-span-2 md:col-span-1"}>
                            <select 
                                className={`w-full p-3 border rounded-lg bg-white outline-blue-500 ${isSubmitted && !supplier ? 'text-red-500 font-bold bg-red-50' : ''}`}
                                value={supplier} 
                                onChange={(e) => setSupplier(e.target.value)}
                            >
                                <option value="">Ta'minotchi tanlang...</option>
                                {suppliersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <input type="number" className="w-full p-3 border rounded-lg border-blue-300 bg-blue-50 outline-blue-500 col-span-2 md:col-span-1" placeholder="Kurs (12500)" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)}/>
                    </div>
                    {isSubmitted && !supplier && <p className="text-xs text-red-500 font-bold mt-1">Ta'minotchi tanlash majburiy!</p>}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Tovarni tanlash</h3>
                    <div className="grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-4 relative">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Tovar nomi / Kod</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-lg outline-blue-500 font-bold" 
                                placeholder="Nomini yoki Kodini yozing..." 
                                value={searchTerm} 
                                onChange={e => { setSearchTerm(e.target.value); setSelectedProduct(null); }}
                            />
                            {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <li key={p.id} onClick={() => handleSelectProduct(p)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b flex justify-between items-center">
                                            <div><div className="font-bold text-gray-800">{p.name}</div></div>
                                            <div className="text-blue-600 font-mono font-bold">{p.customId}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Soni</label>
                            <input 
                                type="number" 
                                className={`w-full p-3 border rounded-lg outline-blue-500 ${countError ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}`} 
                                value={inputCount} 
                                onChange={e => { setInputCount(e.target.value); setCountError(false); }}
                            />
                        </div>

                        <div className="col-span-3">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Kirim Narxi</label>
                            <input 
                                type="number" 
                                className={`w-full p-3 border rounded-lg outline-blue-500 ${priceError ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}`} 
                                value={inputPrice} 
                                onChange={e => { setInputPrice(e.target.value); setPriceError(false); }}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Valyuta</label>
                            <select className="w-full p-3 border rounded-lg outline-blue-500" value={inputCurrency} onChange={e=>setInputCurrency(e.target.value)}>
                                <option value="UZS">UZS</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        
                        <div className="col-span-1 pt-6">
                            <button onClick={handleAddItem} className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all flex justify-center items-center">
                                <Plus size={24}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* O'ZGARTIRISH: STATISTIKA QUTISI FAQAT DIREKTOR UCHUN KO'RINADI */}
            {userRole === 'director' && (
                <div className="col-span-4 grid grid-rows-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="text-gray-500 text-sm font-medium mb-1">Jami Tovar soni</div>
                        <div className="text-3xl font-bold text-blue-600">{totalQuantity} <span className="text-lg text-gray-400 font-normal">dona</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="text-gray-500 text-sm font-medium mb-1">Jami Summasi</div>
                        <div className="text-3xl font-bold text-green-600">{grandTotalUZS.toLocaleString()} <span className="text-lg text-gray-400 font-normal">UZS</span></div>
                    </div>
                </div>
            )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 min-h-[400px] flex flex-col">
            <div className="flex border-b">
                <button onClick={() => setActiveTab('products')} className={`px-8 py-4 font-bold text-sm transition-all ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Tovarlar ro'yxati (Qidiruv)
                </button>
                <button onClick={() => setActiveTab('invoice')} className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'invoice' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Faktura tovarlari 
                    {selectedItems.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{selectedItems.length}</span>}
                </button>
            </div>

            {/* TAB 1: QIDIRUV */}
            {activeTab === 'products' && (
                <div className="p-6 flex flex-col h-full animate-in fade-in">
                    <div className="overflow-auto flex-1 border rounded-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Nomi</th>
                                    <th className="p-4 text-center">Kategoriya</th>
                                    {/* O'ZGARTIRISH: FAQAT DIREKTOR KO'RADI */}
                                    {userRole === 'director' && <th className="p-4 text-right">Asl Narxi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {filteredProducts.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-500">#{item.customId}</td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-center text-blue-600">{item.category}</td>
                                        {/* O'ZGARTIRISH: FAQAT DIREKTOR KO'RADI */}
                                        {userRole === 'director' && <td className="p-4 text-right font-medium">{item.buyPrice.toLocaleString()} {item.buyCurrency}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: FAKTURA */}
            {activeTab === 'invoice' && (
                <div className="p-6 flex flex-col h-full animate-in fade-in">
                    {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>Faktura bo'sh. Yuqoridan mahsulot tanlang.</p>
                        </div>
                    ) : (
                        <div className="overflow-auto border rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="p-4">Kod</th>
                                        <th className="p-4">Nomi</th>
                                        <th className="p-4 w-32">Miqdor</th>
                                        <th className="p-4 w-40">Kirim Narxi</th>
                                        <th className="p-4 w-28">Valyuta</th>
                                        {/* O'ZGARTIRISH: FAQAT DIREKTOR KO'RADI */}
                                        {userRole === 'director' && <th className="p-4 w-32 text-right">Jami Summa</th>}
                                        <th className="p-4 w-16 text-center">X</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {selectedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-4 font-mono text-blue-600 font-bold">{item.customId}</td>
                                            <td className="p-4 font-medium">{item.name}</td>
                                            
                                            <td className="p-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 border rounded-lg text-center font-bold outline-blue-500"
                                                    value={item.count}
                                                    onChange={(e) => updateItem(item.id, 'count', e.target.value)}
                                                />
                                            </td>
                                            
                                            <td className="p-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 border rounded-lg outline-blue-500"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                                />
                                            </td>
                                            
                                            <td className="p-4">
                                                <select 
                                                    className="w-full p-2 border rounded-lg bg-white outline-blue-500"
                                                    value={item.currency}
                                                    onChange={(e) => updateItem(item.id, 'currency', e.target.value)}
                                                >
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </td>
                                            
                                            {/* O'ZGARTIRISH: FAQAT DIREKTOR KO'RADI */}
                                            {userRole === 'director' && (
                                                <td className="p-4 text-right font-bold text-gray-800">
                                                    {item.total.toLocaleString()}
                                                </td>
                                            )}

                                            <td className="p-4 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:bg-red-100 p-2 rounded transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr> 
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* O'ZGARTIRISH: PASTKI JAMI SUMMA QUTISI FAQAT DIREKTOR UCHUN */}
                    {userRole === 'director' && selectedItems.length > 0 && (
                        <div className="flex justify-end gap-4 mt-6">
                            <div className="bg-gray-800 text-white px-6 py-4 rounded-xl shadow-lg">
                                <span className="text-gray-400 text-sm font-bold mr-4">Jami:</span>
                                <span className="text-2xl font-black tracking-tight">{grandTotalUZS.toLocaleString()} <span className="text-lg">UZS</span></span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* TASDIQLASH MODALI */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Fakturani saqlaysizmi?</h3>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Barcha kiritilgan ma'lumotlar to'g'riligiga ishonch hosil qiling.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowConfirmModal(false)} 
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Orqaga
                        </button>
                        <button 
                            onClick={handleSaveInvoice} 
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            Tasdiqlash
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};


export default AddSupplierIncome;
