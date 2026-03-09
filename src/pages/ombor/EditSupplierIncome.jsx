import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const EditSupplierIncome = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL dan faktura ID sini olamiz
  
  const userRole = localStorage.getItem('userRole') || 'admin';
  const currentUserName = localStorage.getItem('userName') || 'Bekchonov Azomat';
  const token = localStorage.getItem('token');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(''); 
  const [exchangeRate, setExchangeRate] = useState(localStorage.getItem('globalExchangeRate') || '12500'); 

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
  const [inputMarkup, setInputMarkup] = useState(''); 
  const [inputSalePrice, setInputSalePrice] = useState(''); 
  const [inputCurrency, setInputCurrency] = useState('UZS');

  // Fakturani localStorage'dan topish va to'ldirish
  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem('supplierInvoices') || "[]");
    const invoiceToEdit = savedInvoices.find(inv => inv.id === Number(id));

    if (invoiceToEdit) {
        setDate(invoiceToEdit.date);
        setSupplier(invoiceToEdit.supplier);
        setInvoiceNumber(invoiceToEdit.invoiceNumber);
        setExchangeRate(invoiceToEdit.exchangeRate || '12500');
        // Itemlarni moslashtirib statega joylash
        const formattedItems = invoiceToEdit.items.map(item => ({
            ...item,
            count: Number(item.count || item.quantity),
            price: Number(item.price || item.buyPrice),
            salePrice: Number(item.salePrice || 0)
        }));
        setSelectedItems(formattedItems);
    } else {
        toast.error("Faktura topilmadi!");
        navigate(-1);
    }

    // Tovar va Taminotchilarni yuklash
    fetch('https://iphone-house-api.onrender.com/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
          if (!res.ok) throw new Error("Server xatosi");
          return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => {
          toast.error("Server bilan aloqa yo'q!");
      });

    const savedSuppliers = JSON.parse(localStorage.getItem('suppliersList') || "[]");
    setSuppliersList(savedSuppliers);
  }, [id, token, navigate]);

  // ==========================================
  // --- MATEMATIKA: DOLLARNI SO'MGA O'GIRISH ---
  // ==========================================
  const getCostInUZS = (price, currency, rate) => {
      const numPrice = Number(price) || 0;
      const numRate = Number(rate) || 12500;
      return currency === 'USD' ? numPrice * numRate : numPrice;
  };

  const handlePriceChange = (val) => {
      setInputPrice(val);
      const costUZS = getCostInUZS(val, inputCurrency, exchangeRate);
      if (inputMarkup && val) {
          const sale = costUZS + (costUZS * (Number(inputMarkup) / 100));
          setInputSalePrice(Math.round(sale));
      }
  };

  const handleMarkupChange = (val) => {
      setInputMarkup(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);
      if (inputPrice && val) {
          const sale = costUZS + (costUZS * (Number(val) / 100));
          setInputSalePrice(Math.round(sale));
      } else if (!val) {
          setInputSalePrice('');
      }
  };

  const handleSalePriceChange = (val) => {
      setInputSalePrice(val);
      const costUZS = getCostInUZS(inputPrice, inputCurrency, exchangeRate);
      if (inputPrice && val && costUZS > 0) {
          const markup = ((Number(val) - costUZS) / costUZS) * 100;
          setInputMarkup(markup.toFixed(2));
      } else if (!val) {
          setInputMarkup('');
      }
  };

  const handleCurrencyChange = (val) => {
      setInputCurrency(val);
      const costUZS = getCostInUZS(inputPrice, val, exchangeRate);
      if (inputPrice && inputMarkup) {
          const sale = costUZS + (costUZS * (Number(inputMarkup) / 100));
          setInputSalePrice(Math.round(sale));
      }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.name); 
    setInputPrice(prod.buyPrice || '');
    setInputCurrency(prod.buyCurrency || 'UZS'); 
    
    const costUZS = getCostInUZS(prod.buyPrice, prod.buyCurrency || 'UZS', exchangeRate);

    if (costUZS > 0 && prod.salePrice) {
        setInputSalePrice(prod.salePrice);
        const markup = ((prod.salePrice - costUZS) / costUZS) * 100;
        setInputMarkup(markup.toFixed(2));
    } else {
        setInputSalePrice('');
        setInputMarkup('');
    }
  };

  const handleAddItem = () => {
    let productToAdd = selectedProduct;
    if (!productToAdd && searchTerm) {
        productToAdd = products.find(p => p.name.toLowerCase() === searchTerm.trim().toLowerCase() || p.customId.toString() === searchTerm.trim());
    }
    if (!productToAdd) return toast.error("Bazada topilmadi! To'g'ri tanlang.");
    if (!inputCount || Number(inputCount) <= 0) return toast.error("Sonini kiriting!");
    if (!inputPrice || Number(inputPrice) <= 0) return toast.error("Kirim narxini kiriting!");
    if (!inputSalePrice || Number(inputSalePrice) <= 0) return toast.error("Sotuv narxini kiriting!");

    const newItem = {
        id: productToAdd.id,
        customId: productToAdd.customId,
        name: productToAdd.name,
        category: productToAdd.category || '-',
        count: Number(inputCount),
        price: Number(inputPrice),
        markup: Number(inputMarkup),
        salePrice: Number(inputSalePrice), 
        currency: inputCurrency,
        total: Number(inputCount) * Number(inputPrice)
    };

    setSelectedItems([...selectedItems, newItem]);
    setSelectedProduct(null);
    setSearchTerm('');
    setInputCount('');
    setInputPrice('');
    setInputMarkup('');
    setInputSalePrice('');
  };

  const updateItem = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        const currentCurrency = field === 'currency' ? value : updatedItem.currency;
        const currentPrice = field === 'price' ? Number(value) : Number(updatedItem.price);
        const costUZS = getCostInUZS(currentPrice, currentCurrency, exchangeRate);

        if (field === 'price' || field === 'currency') {
            updatedItem.total = Number(updatedItem.count) * currentPrice;
            if (updatedItem.markup) {
                updatedItem.salePrice = Math.round(costUZS + (costUZS * (Number(updatedItem.markup) / 100)));
            }
        }
        if (field === 'markup') {
            updatedItem.salePrice = Math.round(costUZS + (costUZS * (Number(value) / 100)));
        }
        if (field === 'salePrice') {
            if (costUZS > 0) {
                updatedItem.markup = Number((((Number(value) - costUZS) / costUZS) * 100).toFixed(2));
            }
        }
        if (field === 'count') {
            updatedItem.total = Number(value) * Number(updatedItem.price);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const calculateTotals = () => {
    let totalUZS = 0; let totalUSD = 0; let totalQuantity = 0;
    selectedItems.forEach(item => {
        totalQuantity += Number(item.count);
        if (item.currency === 'USD') totalUSD += item.total;
        else totalUZS += item.total;
    });
    const rate = Number(exchangeRate) || 0;
    return { grandTotalUZS: totalUZS + (totalUSD * rate), totalQuantity };
  };

  const { grandTotalUZS, totalQuantity } = calculateTotals();

  const filteredProducts = products.filter(p => {
    if (!p) return false;
    return String(p.name).toLowerCase().includes(searchTerm.toLowerCase()) || String(p.customId).includes(searchTerm);
  });

  const handlePreSave = () => {
    setIsSubmitted(true);
    if (!invoiceNumber.trim() || !supplier) return toast.error("Asosiy ma'lumotlarni to'ldiring!");
    if (selectedItems.length === 0) return toast.error("Jadval bo'sh!");
    setShowConfirmModal(true);
  };

  const handleSaveInvoice = () => {
    const savedInvoices = JSON.parse(localStorage.getItem('supplierInvoices') || "[]");
    
    const updatedInvoices = savedInvoices.map(inv => {
        if (inv.id === Number(id)) {
            return {
                ...inv,
                date, 
                supplier, 
                invoiceNumber, 
                items: selectedItems,
                totalSum: grandTotalUZS, 
                exchangeRate, 
                userName: currentUserName
                // status o'zgarmay qoladi (Jarayonda bo'lsa Jarayonda)
            };
        }
        return inv;
    });

    localStorage.setItem('supplierInvoices', JSON.stringify(updatedInvoices));
    setShowConfirmModal(false); 
    toast.success("Faktura muvaffaqiyatli saqlandi!");
    navigate('/ombor/taminotchi-kirim');
  };

  const [activeTab, setActiveTab] = useState('invoice'); // Tahrirlashda asosan pastdagi jadval kerak

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-lg border hover:bg-gray-100"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-bold text-amber-600">Fakturani Tahrirlash</h1>
            </div>
            <button onClick={handlePreSave} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
                <Save size={20}/> O'zgarishlarni Saqlash
            </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
            <div className={`space-y-6 ${userRole === 'director' ? 'col-span-8' : 'col-span-12'}`}>
                
                {/* --- ASOSIY MA'LUMOTLAR --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Asosiy ma'lumotlar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="date" className="w-full p-3 border rounded-lg outline-amber-500" value={date} onChange={e=>setDate(e.target.value)}/>
                        <input type="text" className={`w-full p-3 border rounded-lg outline-amber-500 font-bold ${isSubmitted && !invoiceNumber ? 'border-red-500 bg-red-50' : ''}`} placeholder="Faktura №" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
                        <select className={`w-full p-3 border rounded-lg outline-amber-500 ${isSubmitted && !supplier ? 'border-red-500 bg-red-50' : 'bg-white'}`} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                            <option value="">Ta'minotchi tanlang...</option>
                            {suppliersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <input type="number" className="w-full p-3 border rounded-lg border-amber-300 bg-amber-50 outline-amber-500" placeholder="Kurs (Masalan: 12500)" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)}/>
                    </div>
                </div>

                {/* --- TOVAR TANLASH VA NARXLASH --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Tovarni tanlash va Narxlash</h3>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                            <div className="flex-1 relative min-w-[200px]">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Tovar nomi / Kod</label>
                                <input type="text" className="w-full p-3 border rounded-lg outline-amber-500 font-bold text-sm" placeholder="Qidirish..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedProduct(null); }} />
                                {searchTerm && !selectedProduct && filteredProducts.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                        {filteredProducts.map(p => (
                                            <li key={p.id} onClick={() => handleSelectProduct(p)} className="p-3 hover:bg-amber-50 cursor-pointer text-sm border-b">
                                                <div className="font-bold text-gray-800">{p.name}</div>
                                                <div className="text-amber-600 font-mono font-bold text-xs mt-1">ID: #{p.customId} | Narx: {p.buyPrice} {p.buyCurrency}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="w-24">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Soni</label>
                                <input type="number" className="w-full p-3 border rounded-lg outline-amber-500 text-center font-bold text-sm" value={inputCount} onChange={e => setInputCount(e.target.value)} />
                            </div>

                            <div className="w-32">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Valyuta</label>
                                <select className="w-full p-3 border rounded-lg outline-amber-500 text-sm font-bold bg-white" value={inputCurrency} onChange={e=>handleCurrencyChange(e.target.value)}>
                                    <option value="UZS">UZS</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div className="w-40">
                                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">Kirim Narx</label>
                                <input type="number" className="w-full p-3 border rounded-lg outline-amber-500 font-bold text-sm" value={inputPrice} onChange={e => handlePriceChange(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                            <div className="w-32">
                                <label className="text-[11px] font-bold text-amber-600 uppercase mb-1 block">Ustama (%)</label>
                                <input type="number" className="w-full p-3 border border-amber-200 bg-white rounded-lg outline-amber-500 font-bold text-amber-700 text-sm text-center" placeholder="Misol: 10" value={inputMarkup} onChange={e => handleMarkupChange(e.target.value)} />
                            </div>

                            <div className="flex-1">
                                <label className="text-[11px] font-bold text-emerald-600 uppercase mb-1 block">Sotuv Narx <span className="text-gray-400 font-normal">(Har doim So'mda)</span></label>
                                <input type="number" className="w-full p-3 border border-emerald-200 bg-white rounded-lg outline-emerald-500 font-bold text-emerald-700 text-sm" placeholder="Avtomat hisoblanadi" value={inputSalePrice} onChange={e => handleSalePriceChange(e.target.value)} />
                            </div>

                            <div className="w-40">
                                <button onClick={handleAddItem} className="w-full h-[46px] bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 transition-all flex justify-center items-center shadow-md font-bold gap-2">
                                    <Plus size={20}/> Qo'shish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {userRole === 'director' && (
                <div className="col-span-4 grid grid-rows-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="text-gray-500 text-sm font-medium mb-1">Jami Tovar soni</div>
                        <div className="text-3xl font-bold text-amber-600">{totalQuantity} <span className="text-lg text-gray-400 font-normal">dona</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="text-gray-500 text-sm font-medium mb-1">Jami Summasi</div>
                        <div className="text-3xl font-bold text-emerald-600">{grandTotalUZS.toLocaleString()} <span className="text-lg text-gray-400 font-normal">UZS</span></div>
                    </div>
                </div>
            )}
        </div>

        {/* --- PASTKI JADVAL QISMI --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 min-h-[400px] flex flex-col">
            <div className="flex border-b">
                <button onClick={() => setActiveTab('invoice')} className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'invoice' ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Faktura tovarlari 
                    {selectedItems.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{selectedItems.length}</span>}
                </button>
                <button onClick={() => setActiveTab('products')} className={`px-8 py-4 font-bold text-sm transition-all ${activeTab === 'products' ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Qidiruv (Katalog)
                </button>
            </div>

            {activeTab === 'products' && (
                <div className="p-6 flex flex-col h-full">
                    <div className="overflow-auto border rounded-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Nomi</th>
                                    <th className="p-4 text-center">Joriy Qoldiq</th>
                                    {userRole === 'director' && <th className="p-4 text-right">Asl Narxi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {filteredProducts.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-500">#{item.customId}</td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-center text-blue-600 font-bold">{item.quantity} {item.unit}</td>
                                        {userRole === 'director' && <td className="p-4 text-right font-medium">{item.buyPrice?.toLocaleString()} {item.buyCurrency}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'invoice' && (
                <div className="p-6 flex flex-col h-full animate-in fade-in">
                    {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">Faktura bo'sh. Yuqoridan mahsulot tanlang.</div>
                    ) : (
                        <div className="overflow-auto border rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-wider sticky top-0">
                                    <tr>
                                        <th className="p-3">Kod</th>
                                        <th className="p-3 min-w-[150px]">Nomi</th>
                                        <th className="p-3 w-20 text-center">Soni</th>
                                        <th className="p-3 w-32">Kirim Narx</th>
                                        <th className="p-3 w-24">Valyuta</th>
                                        <th className="p-3 w-24 text-center text-amber-600">Ustama %</th>
                                        <th className="p-3 w-36 text-emerald-600">Sotuv (UZS)</th>
                                        {userRole === 'director' && <th className="p-3 w-32 text-right">Jami Kirim</th>}
                                        <th className="p-3 w-12 text-center">X</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm font-bold">
                                    {selectedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-amber-50 transition-colors">
                                            <td className="p-3 font-mono text-blue-600">#{item.customId}</td>
                                            <td className="p-3 text-gray-800">{item.name}</td>
                                            <td className="p-2">
                                                <input type="number" className="w-full p-2 border rounded-lg text-center outline-amber-500" value={item.count} onChange={(e) => updateItem(item.id, 'count', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full p-2 border rounded-lg outline-amber-500" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <select className="w-full p-2 border rounded-lg bg-white outline-amber-500 text-xs" value={item.currency} onChange={(e) => updateItem(item.id, 'currency', e.target.value)}>
                                                    <option value="UZS">UZS</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full p-2 border border-amber-200 bg-amber-50 rounded-lg text-center outline-amber-500 text-amber-700" value={item.markup || ''} onChange={(e) => updateItem(item.id, 'markup', e.target.value)} />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" className="w-full p-2 border border-emerald-200 bg-emerald-50 rounded-lg outline-emerald-500 text-emerald-700" value={item.salePrice} onChange={(e) => updateItem(item.id, 'salePrice', e.target.value)} />
                                            </td>
                                            {userRole === 'director' && <td className="p-3 text-right text-gray-800">{item.total.toLocaleString()}</td>}
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
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

        {/* TASDIQLASH MODALI */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Fakturani yangilaysizmi?</h3>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        O'zgarishlar faqat faktura ro'yxatida saqlanadi. (Ombor qoldig'i faqat direktor tasdiqlagandan keyin o'zgaradi).
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">Orqaga</button>
                        <button onClick={handleSaveInvoice} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 active:scale-95 transition-all">Saqlash</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default EditSupplierIncome;
