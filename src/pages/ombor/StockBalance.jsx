import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, X, Package } from 'lucide-react';
import toast from 'react-hot-toast'; // Xabarlar uchun qo'shildi

const StockBalance = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = sessionStorage.getItem('token');

  // Form State (Backend kutayotgan to'g'ri maydonlar nomi bilan)
  const [formData, setFormData] = useState({
    customId: '',    // Backend 'customId' (Shtrix kod yoki maxsus ID) kutadi
    name: '',
    category: '',    // Backend 'category' string kutadi (ID emas)
    unit: 'Dona',    // Backend 'unit' kutadi ('measureUnit' emas)
    buyPrice: '',    // Backend 'buyPrice' kutadi
    salePrice: '',   // Backend 'salePrice' kutadi
    quantity: '',    // Backend 'quantity' kutadi
    buyCurrency: 'USD',
    saleCurrency: 'UZS'
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get Products
      const prodRes = await fetch('https://iphone-house-api.onrender.com/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if(prodRes.ok) setProducts(prodData);

      // 2. Get Categories (for the dropdown)
      const catRes = await fetch('https://iphone-house-api.onrender.com/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const catData = await catRes.json();
      if(catRes.ok) setCategories(catData);
      
    } catch (error) {
      console.error("Data fetching error:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.name || !formData.category || !formData.customId) {
        return toast.error("Nomi, Kategoriya va Shtrix kod kiritilishi shart!");
    }

    try {
      // Backend aynan shu formatdagi payload ni qabul qiladi
      const payload = {
          customId: Number(formData.customId),
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          buyPrice: Number(formData.buyPrice),
          salePrice: Number(formData.salePrice),
          quantity: Number(formData.quantity) || 0,
          buyCurrency: formData.buyCurrency,
          saleCurrency: formData.saleCurrency
      };

      const response = await fetch('https://iphone-house-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setIsModalOpen(false);
        fetchData(); // Jadvalni yangilash
        
        // Formni tozalash
        setFormData({
            customId: '',
            name: '',
            category: '',
            unit: 'Dona',
            buyPrice: '',
            salePrice: '',
            quantity: '',
            buyCurrency: 'USD',
            saleCurrency: 'UZS'
        });
        toast.success("Mahsulot muvaffaqiyatli qo'shildi!");
      } else {
        toast.error(data.error || "Xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Server bilan aloqa yo'q!");
    }
  };

  // --- RENDER ---
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Tovarlar qoldig'i</h2>
            <p className="text-gray-500 text-sm">Ombordagi barcha mahsulotlar ro'yxati</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
            <Plus size={20} /> Mahsulot qo'shish
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Mahsulot nomi yoki kodini qidiring..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
        </div>
        <button className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2">
            <Filter size={20} /> Filtr
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                    <th className="p-4 font-medium">Mahsulot nomi</th>
                    <th className="p-4 font-medium text-center">Kategoriya</th>
                    <th className="p-4 font-medium text-center">Shtrix kod</th>
                    <th className="p-4 font-medium text-right">Kirim narxi</th>
                    <th className="p-4 font-medium text-right">Sotuv narxi</th>
                    <th className="p-4 font-medium text-center">Qoldiq</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan="6" className="p-4 text-center">Yuklanmoqda...</td></tr>
                ) : products.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="p-10 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                                <Package size={40} className="text-gray-300"/>
                                <p>Hozircha mahsulot yo'q</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    products.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-800">{item.name}</td>
                            <td className="p-4 text-gray-600 text-center">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                    {item.category || '-'}
                                </span>
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-sm text-center">#{item.customId || '-'}</td>
                            <td className="p-4 text-gray-600 text-right">{Number(item.buyPrice).toLocaleString()} <span className="text-xs">{item.buyCurrency}</span></td>
                            <td className="p-4 font-medium text-blue-600 text-right">{Number(item.salePrice).toLocaleString()} <span className="text-xs">{item.saleCurrency}</span></td>
                            <td className={`p-4 font-bold text-center ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                {item.quantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* MODAL - ADD PRODUCT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-bold">Yangi mahsulot qo'shish</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot nomi *</label>
                            <input 
                                name="name" required
                                value={formData.name} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="Masalan: iPhone 15 Pro Max"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya *</label>
                            <select 
                                name="category" required
                                value={formData.category} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                            >
                                <option value="">Tanlang...</option>
                                {categories.map((cat, i) => (
                                    <option key={cat.id || i} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shtrix kod / ID *</label>
                            <input 
                                type="number" name="customId" required
                                value={formData.customId} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="12345"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kirim narxi</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" name="buyPrice" required
                                    value={formData.buyPrice} onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                    placeholder="0"
                                />
                                <select name="buyCurrency" value={formData.buyCurrency} onChange={handleInputChange} className="border rounded-lg p-2 bg-gray-50 outline-none">
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sotuv narxi</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" name="salePrice" required
                                    value={formData.salePrice} onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                    placeholder="0"
                                />
                                <select name="saleCurrency" value={formData.saleCurrency} onChange={handleInputChange} className="border rounded-lg p-2 bg-gray-50 outline-none">
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Boshlang'ich qoldiq</label>
                            <input 
                                type="number" name="quantity" required
                                value={formData.quantity} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">O'lchov birligi</label>
                            <select 
                                name="unit"
                                value={formData.unit} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                            >
                                <option value="Dona">Dona</option>
                                <option value="Kg">Kg</option>
                                <option value="Metr">Metr</option>
                                <option value="Litr">Litr</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Bekor qilish
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200"
                        >
                            Saqlash
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default StockBalance;
