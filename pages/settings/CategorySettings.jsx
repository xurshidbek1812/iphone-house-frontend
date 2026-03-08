import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Save } from 'lucide-react';

const CategorySettings = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // --- YUKLASH ---
  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem('categoryList') || "[]");
    setCategories(savedCats);
  }, []);

  // --- QO'SHISH ---
  const handleAdd = () => {
    if (!newCategory.trim()) return alert("Kategoriya nomini yozing!");
    
    // Bir xil nomli kategoriya borligini tekshirish
    if (categories.some(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
        return alert("Bu kategoriya allaqachon mavjud!");
    }

    const updatedList = [...categories, { id: Date.now(), name: newCategory }];
    setCategories(updatedList);
    localStorage.setItem('categoryList', JSON.stringify(updatedList));
    setNewCategory('');
  };

  // --- O'CHIRISH ---
  const handleDelete = (id) => {
    if(window.confirm("Kategoriyani o'chirmoqchimisiz?")) {
        const updatedList = categories.filter(c => c.id !== id);
        setCategories(updatedList);
        localStorage.setItem('categoryList', JSON.stringify(updatedList));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kategoriyalarni boshqarish</h1>

      <div className="grid grid-cols-12 gap-6">
        
        {/* CHAP: QO'SHISH FORMASI */}
        <div className="col-span-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600"/> Yangi kategoriya
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nomi</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border rounded-xl outline-blue-500"
                            placeholder="Masalan: Telefonlar"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                    </div>
                    <button onClick={handleAdd} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>

        {/* O'NG: RO'YXAT */}
        <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 font-bold text-gray-600">
                    Mavjud kategoriyalar ({categories.length})
                </div>
                {categories.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Hozircha kategoriyalar yo'q</div>
                ) : (
                    <ul className="divide-y">
                        {categories.map(cat => (
                            <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <span className="font-medium text-gray-800 flex items-center gap-2">
                                    <Layers size={18} className="text-blue-500"/> {cat.name}
                                </span>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg">
                                    <Trash2 size={18}/>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CategorySettings;