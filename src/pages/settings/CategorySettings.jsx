import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CategorySettings = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const token = sessionStorage.getItem('token'); 

  const fetchCategories = async () => {
    try {
        const res = await fetch(`${API_URL}/api/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            console.log("Bazadan kelgan kategoriyalar:", data); // <-- Shu yozuv F12 Konsolda ko'rinadi
            
            // Xavfsiz tarzda saqlash (Agar data array bo'lsa)
            if (Array.isArray(data)) {
                setCategories(data);
                sessionStorage.setItem('categoryList', JSON.stringify(data)); 
            } else {
                setCategories([]); // Xato kelsa bo'shatib qo'yamiz
            }
        }
    } catch (err) {
        console.error(err);
        toast.error("Kategoriyalarni yuklashda xatolik yuz berdi!");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newCategory.trim()) return toast.error("Kategoriya nomini yozing!");
    
    // Tekshiruv (Xavfsiz tekshiruv)
    if (Array.isArray(categories) && categories.some(c => c.name?.toLowerCase() === newCategory.trim().toLowerCase())) {
        return toast.error("Bu kategoriya allaqachon mavjud!");
    }

    try {
        const res = await fetch(`${API_URL}/api/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newCategory.trim() })
        });

        if (res.ok) {
            toast.success("Kategoriya muvaffaqiyatli qo'shildi!");
            setNewCategory('');
            fetchCategories(); 
        } else {
            const errorData = await res.json();
            toast.error(errorData.error || "Qo'shishda xatolik yuz berdi.");
        }
    } catch (err) {
        toast.error("Server bilan aloqa yo'q!");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Kategoriyani o'chirmoqchimisiz?")) {
        try {
            const res = await fetch(`${API_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                toast.success("Kategoriya o'chirildi!");
                fetchCategories(); 
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "O'chirib bo'lmaydi! (Balki bu kategoriyada tovarlar bordir)");
            }
        } catch (err) {
            toast.error("Server bilan aloqa yo'q!");
        }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kategoriyalarni boshqarish</h1>

      <div className="grid grid-cols-12 gap-6">
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
                        />
                    </div>
                    <button onClick={handleAdd} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all">
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>

        <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 font-bold text-gray-600 flex justify-between">
                    <span>Mavjud kategoriyalar ({Array.isArray(categories) ? categories.length : 0})</span>
                    <span className="text-xs font-normal text-gray-400">Barcha xodimlar uchun umumiy ro'yxat</span>
                </div>
                {(!Array.isArray(categories) || categories.length === 0) ? (
                    <div className="p-8 text-center text-gray-400">Hozircha kategoriyalar yo'q</div>
                ) : (
                    <ul className="divide-y">
                        {categories.map(cat => (
                            <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-gray-800 flex items-center gap-2">
                                    <Layers size={18} className="text-blue-500"/> {cat.name}
                                </span>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="O'chirish">
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
