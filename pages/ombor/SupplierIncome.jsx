import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupplierIncome = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('products'); // 'products' (Qidiruv) yoki 'invoice' (Faktura)
  const [allProducts, setAllProducts] = useState([]);     // Bazadagi hamma tovarlar
  const [searchTerm, setSearchTerm] = useState('');
  
  // Faktura ma'lumotlari
  const [invoiceItems, setInvoiceItems] = useState([]);   // Tanlangan tovarlar
  const [supplierName, setSupplierName] = useState('');   // Ta'minotchi ismi
  const [invoiceNumber, setInvoiceNumber] = useState(''); // Faktura raqami
  const [currencyRate, setCurrencyRate] = useState('12500'); // Kurs

  // --- 1. TOVARLARNI YUKLASH ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://iphone-house-api.onrender.com/api/products');
        const data = await res.json();
        setAllProducts(data);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
    
    // Tasodifiy faktura raqami generatsiya qilish
    setInvoiceNumber(Date.now().toString().slice(-10));
  }, []);

  // --- 2. FAKTURAGA QO'SHISH ---
  const addToInvoice = (product) => {
    // Agar allaqachon qo'shilgan bo'lsa, ogohlantiramiz
    if (invoiceItems.some(item => item.id === product.id)) {
      return alert("Bu tovar fakturaga qo'shilgan! 'Faktura tovarlari' bo'limidan o'zgartiring.");
    }

    const newItem = {
      ...product,
      inputQty: 1,                  // Default soni
      inputPrice: product.buyPrice, // Default kirim narxi
      totalSum: product.buyPrice    // Jami
    };

    setInvoiceItems([...invoiceItems, newItem]);
    // Avtomatik "Faktura tovarlari" ga o'tishni xohlasangiz shu yerni yoqing:
    // setActiveTab('invoice'); 
  };

  // --- 3. FAKTURADAGI TOVARNI O'ZGARTIRISH ---
  const updateItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: Number(value) };
        updatedItem.totalSum = updatedItem.inputQty * updatedItem.inputPrice;
        return updatedItem;
      }
      return item;
    }));
  };

  // O'chirish
  const removeFromInvoice = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  // --- 4. HISOBLASH ---
  const totalQty = invoiceItems.reduce((acc, item) => acc + item.inputQty, 0);
  const grandTotal = invoiceItems.reduce((acc, item) => acc + item.totalSum, 0);

  // --- 5. SAQLASH ---
  const handleSave = () => {
    if (!supplierName) return alert("Ta'minotchi nomini kiriting!");
    if (invoiceItems.length === 0) return alert("Fakturaga tovar qo'shing!");

    console.log("Saqlanmoqda:", {
      supplier: supplierName,
      invoiceNumber,
      items: invoiceItems,
      total: grandTotal
    });
    
    alert("Kirim qilindi! (Backendga yuborish logikasi shu yerda bo'ladi)");
    // Keyin tozalash yoki boshqa sahifaga o'tish mumkin
  };

  // Qidiruv filtri
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.customId.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
            <h1 className="text-xl font-bold text-gray-800">Ta'minotchidan tovar kirim</h1>
        </div>
        <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600">Bekor qilish</button>
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                <Save size={18}/> Saqlash
            </button>
        </div>
      </div>

      {/* --- TEPADAGI FORMALAR --- */}
      <div className="grid grid-cols-12 gap-6 mb-6">
         {/* Chap tomon: Ta'minotchi va Valyuta */}
         <div className="col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ta'minotchi nomi</label>
                    <input 
                        type="text" 
                        className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Ta'minotchi nomini yozing yoki tanlang..."
                        list="suppliers-list"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                    />
                    {/* Agar oldingi ta'minotchilar bo'lsa shu yerda chiqadi */}
                    <datalist id="suppliers-list">
                        <option value="Abror shina Shovot 'K'" />
                        <option value="Samsung Dealer Tashkent" />
                        <option value="Artel Zavod" />
                    </datalist>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Faktura Raqami</label>
                    <input type="text" className="w-full p-2.5 bg-gray-50 border rounded-lg font-mono" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Valyuta turi</label>
                    <select className="w-full p-2.5 bg-gray-50 border rounded-lg">
                        <option>UZS</option>
                        <option>USD</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Valyuta kursi</label>
                    <input type="number" className="w-full p-2.5 bg-gray-50 border rounded-lg" value={currencyRate} onChange={(e)=>setCurrencyRate(e.target.value)} />
                </div>
            </div>
         </div>

         {/* O'ng tomon: Statistika */}
         <div className="col-span-4 grid grid-rows-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="text-gray-500 text-sm font-medium mb-1">Jami Tovar soni</div>
                <div className="text-3xl font-bold text-blue-600">{totalQty} <span className="text-lg text-gray-400 font-normal">dona</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="text-gray-500 text-sm font-medium mb-1">Jami Summasi</div>
                <div className="text-3xl font-bold text-green-600">{grandTotal.toLocaleString()} <span className="text-lg text-gray-400 font-normal">UZS</span></div>
            </div>
         </div>
      </div>

      {/* --- TABLAR (Tovarlar ro'yxati / Faktura tovarlari) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
        
        {/* Tab Headers */}
        <div className="flex border-b">
            <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-4 font-bold text-sm transition-all ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Tovarlar ro'yxati (Qidiruv)
            </button>
            <button 
                onClick={() => setActiveTab('invoice')}
                className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'invoice' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Faktura tovarlari 
                {invoiceItems.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{invoiceItems.length}</span>}
            </button>
        </div>

        {/* --- 1. TAB: TOVARLAR RO'YXATI (SEARCH) --- */}
        {activeTab === 'products' && (
            <div className="p-6 flex flex-col h-full animate-in fade-in">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                    <input 
                        type="text" 
                        className="w-full pl-12 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                        placeholder="Tovarni nomi yoki ID bo'yicha qidiring..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-auto flex-1 border rounded-xl">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Nomi</th>
                                <th className="p-4 text-center">Joriy Qoldiq</th>
                                <th className="p-4 text-right">Kirim narxi (Asl)</th>
                                <th className="p-4 text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredProducts.map(item => {
                                const isAdded = invoiceItems.some(i => i.id === item.id);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-500">#{item.customId}</td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-center text-blue-600 font-bold">{item.quantity} {item.unit}</td>
                                        <td className="p-4 text-right">{item.buyPrice.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            {isAdded ? (
                                                <span className="text-green-600 font-bold text-xs bg-green-50 px-3 py-1 rounded-lg border border-green-100 flex items-center justify-center gap-1">
                                                    <Check size={14}/> Qo'shilgan
                                                </span>
                                            ) : (
                                                <button onClick={() => addToInvoice(item)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                                    <Plus size={18}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- 2. TAB: FAKTURA TOVARLARI (EDIT) --- */}
        {activeTab === 'invoice' && (
             <div className="p-6 flex flex-col h-full animate-in fade-in">
                {invoiceItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <p>Faktura bo'sh. "Tovarlar ro'yxati" dan mahsulot qo'shing.</p>
                    </div>
                ) : (
                    <div className="overflow-auto border rounded-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Nomi</th>
                                    <th className="p-4 w-32">Miqdor</th>
                                    <th className="p-4 text-center">Birlik</th>
                                    <th className="p-4 w-48">Kirim Narxi (UZS)</th>
                                    <th className="p-4 w-48 text-right">Jami Summa</th>
                                    <th className="p-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {invoiceItems.map(item => (
                                    <tr key={item.id} className="hover:bg-blue-50">
                                        <td className="p-4 font-bold text-gray-500">#{item.customId}</td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        
                                        {/* INPUT: MIQDOR */}
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-full p-2 border rounded-lg text-center font-bold outline-blue-500"
                                                value={item.inputQty}
                                                onChange={(e) => updateItem(item.id, 'inputQty', e.target.value)}
                                            />
                                        </td>
                                        
                                        <td className="p-4 text-center text-gray-500">{item.unit}</td>
                                        
                                        {/* INPUT: NARX */}
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                className="w-full p-2 border rounded-lg text-right outline-blue-500"
                                                value={item.inputPrice}
                                                onChange={(e) => updateItem(item.id, 'inputPrice', e.target.value)}
                                            />
                                        </td>
                                        
                                        {/* JAMI SUMMA (Avtomatik) */}
                                        <td className="p-4 text-right font-bold text-gray-800">
                                            {item.totalSum.toLocaleString()}
                                        </td>

                                        <td className="p-4 text-center">
                                            <button onClick={() => removeFromInvoice(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                                                <Trash2 size={18}/>
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
    </div>
  );
};

export default SupplierIncome;