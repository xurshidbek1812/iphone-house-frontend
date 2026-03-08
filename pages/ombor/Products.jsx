import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Package, Printer } from 'lucide-react'; 
import QRCode from "react-qr-code"; 

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printProduct, setPrintProduct] = useState(null); 

  // FORM STATE (Valyutalar bilan)
  const [formData, setFormData] = useState({
    name: '', buyPrice: '', salePrice: '', quantity: '', unit: 'Dona', buyCurrency: 'USD', saleCurrency: 'UZS'
  });

  // --- API: TOVARLARNI OLISH ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('https://iphone-house-api.onrender.com/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- API: TOVAR QO'SHISH ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Nomini kiriting!");

    try {
      // FRONTEND O'ZI AVTOMATIK ID YASAYDI
      const avtomatikId = Math.floor(10000 + Math.random() * 90000).toString();

      const newProductData = {
        customId: avtomatikId,
        name: formData.name,
        buyPrice: Number(formData.buyPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        quantity: Number(formData.quantity) || 0,
        unit: formData.unit,
        buyCurrency: formData.buyCurrency,
        saleCurrency: formData.saleCurrency
      };

      const res = await fetch('https://iphone-house-api.onrender.com/api/products', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductData) 
      });
      
      if (res.ok) {
        alert("Tovar muvaffaqiyatli qo'shildi!");
        fetchProducts(); 
        setIsModalOpen(false); 
        setFormData({ name: '', buyPrice: '', salePrice: '', quantity: '', unit: 'Dona', buyCurrency: 'USD', saleCurrency: 'UZS' }); 
      } else {
        const xato = await res.json();
        alert("Server qabul qilmadi: " + (xato.error || "Noma'lum xato"));
      }
    } catch (err) { 
        alert("Serverga ulanib bo'lmadi!"); 
    }
  };

  // --- API: O'CHIRISH ---
  const handleDelete = async (id) => {
    if(!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      await fetch(`https://iphone-house-api.onrender.com/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tovarlar qoldig'i</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium">
            <Plus size={20} /> Tovar qo'shish
        </button>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Nomi</th>
                    <th className="p-4 text-center">Birlik</th>
                    <th className="p-4 text-right">Kirim Narxi</th>
                    <th className="p-4 text-right">Sotuv Narxi</th>
                    <th className="p-4 text-center">Qoldiq</th>
                    <th className="p-4 text-right">Amallar</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {products.map((product) => (
                    <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600">#{product.customId}</td>
                        <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Package size={16}/></div>
                            {product.name}
                        </td>
                        <td className="p-4 text-center text-gray-500">{product.unit}</td>
                        
                        {/* JADVALDA VALYUTALAR KO'RSATILADI */}
                        <td className="p-4 text-right text-gray-600">
                            {Number(product.buyPrice).toLocaleString()} <span className="font-bold text-gray-800">{product.buyCurrency || 'USD'}</span>
                        </td>
                        <td className="p-4 text-right font-bold text-green-600">
                            {Number(product.salePrice).toLocaleString()} <span className="font-bold text-green-800">{product.saleCurrency || 'UZS'}</span>
                        </td>

                        <td className="p-4 text-center font-bold">
                            {product.quantity}
                        </td>
                        <td className="p-4 text-right">
                            <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- MODAL (TOVAR QO'SHISH) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Yangi mahsulot qo'shish</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot nomi</label>
                        <input type="text" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    </div>
                    
                    {/* --- SIZ SO'RAGAN DROP-DOWN (SELECT) DIZAYNI --- */}
                    <div className="grid grid-cols-2 gap-4">
                        
                        {/* Kirim narxi va valyutasi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kirim narxi</label>
                            <div className="flex items-center border rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500">
                                <input 
                                    type="number" 
                                    className="w-full p-3 outline-none" 
                                    placeholder="0" 
                                    value={formData.buyPrice} 
                                    onChange={e => setFormData({...formData, buyPrice: e.target.value})}
                                />
                                {/* Mana shu siz aytgan pastga tushadigan oyna */}
                                <select 
                                    className="bg-gray-100 border-l px-3 py-3 outline-none font-bold text-gray-700 cursor-pointer"
                                    value={formData.buyCurrency} 
                                    onChange={e => setFormData({...formData, buyCurrency: e.target.value})}
                                >
                                    <option value="USD">USD</option>
                                    <option value="UZS">UZS</option>
                                </select>
                            </div>
                        </div>

                        {/* Sotuv narxi va valyutasi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sotuv narxi</label>
                            <div className="flex items-center border rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500">
                                <input 
                                    type="number" 
                                    className="w-full p-3 outline-none" 
                                    placeholder="0" 
                                    value={formData.salePrice} 
                                    onChange={e => setFormData({...formData, salePrice: e.target.value})}
                                />
                                {/* Mana shu siz aytgan pastga tushadigan oyna */}
                                <select 
                                    className="bg-gray-100 border-l px-3 py-3 outline-none font-bold text-gray-700 cursor-pointer"
                                    value={formData.saleCurrency} 
                                    onChange={e => setFormData({...formData, saleCurrency: e.target.value})}
                                >
                                    <option value="UZS">UZS</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Qoldiq va Birlik */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Boshlang'ich qoldiq</label>
                            <input type="number" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">O'lchov birligi</label>
                            <select className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                                <option value="Dona">Dona</option>
                                <option value="Kg">Kg</option>
                                <option value="Metr">Metr</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg flex items-center gap-2 border border-blue-100">
                        <Package size={16} className="text-blue-600"/> 
                        ID va Kod bazadan avtomatik tarzda yaratiladi.
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium">Bekor qilish</button>
                        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium">Saqlash</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Products;