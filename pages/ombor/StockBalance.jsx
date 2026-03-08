import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, X, Package } from 'lucide-react';

const StockBalance = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State (For adding new product)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    barcode: '',
    measureUnit: 'dona',
    costPrice: '',
    sellPrice: '',
    stockQuantity: ''
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get Products
      const prodRes = await fetch('https://iphone-house-api.onrender.com/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData);

      // 2. Get Categories (for the dropdown)
      const catRes = await fetch('https://iphone-house-api.onrender.com/api/categories');
      const catData = await catRes.json();
      setCategories(catData);
      
      // Set default category if available
      if (catData.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: catData[0].id }));
      }
    } catch (error) {
      console.error("Data fetching error:", error);
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
    try {
      const response = await fetch('https://iphone-house-api.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData(); // Refresh the table
        // Reset form
        setFormData({
            name: '',
            categoryId: categories[0]?.id || '',
            barcode: '',
            measureUnit: 'dona',
            costPrice: '',
            sellPrice: '',
            stockQuantity: ''
        });
        alert("Mahsulot muvaffaqiyatli qo'shildi!");
      } else {
        alert("Xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Submit error:", error);
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
                    <th className="p-4 font-medium">Kategoriya</th>
                    <th className="p-4 font-medium">Shtrix kod</th>
                    <th className="p-4 font-medium">Kirim narxi</th>
                    <th className="p-4 font-medium">Sotuv narxi</th>
                    <th className="p-4 font-medium">Qoldiq</th>
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
                            <td className="p-4 text-gray-600">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                    {item.category?.name || '-'}
                                </span>
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-sm">{item.barcode || '-'}</td>
                            <td className="p-4 text-gray-600">{Number(item.costPrice).toLocaleString()} $</td>
                            <td className="p-4 font-medium text-blue-600">{Number(item.sellPrice).toLocaleString()} UZS</td>
                            <td className={`p-4 font-bold ${item.stockQuantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                {item.stockQuantity} {item.measureUnit}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot nomi</label>
                            <input 
                                name="name" required
                                value={formData.name} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="Masalan: iPhone 15 Pro Max"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
                            <select 
                                name="categoryId" 
                                value={formData.categoryId} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shtrix kod (ixtiyoriy)</label>
                            <input 
                                name="barcode"
                                value={formData.barcode} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="|||||||||||"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kirim narxi (USD)</label>
                            <input 
                                type="number" name="costPrice" required
                                value={formData.costPrice} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sotuv narxi (UZS)</label>
                            <input 
                                type="number" name="sellPrice" required
                                value={formData.sellPrice} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Boshlang'ich qoldiq</label>
                            <input 
                                type="number" name="stockQuantity" required
                                value={formData.stockQuantity} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" 
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">O'lchov birligi</label>
                            <select 
                                name="measureUnit"
                                value={formData.measureUnit} onChange={handleInputChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                            >
                                <option value="dona">Dona</option>
                                <option value="kg">Kg</option>
                                <option value="metr">Metr</option>
                                <option value="litr">Litr</option>
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