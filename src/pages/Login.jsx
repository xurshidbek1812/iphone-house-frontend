import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <--- Yuklanish jarayoni uchun
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
        toast.error("Login va parolni kiriting!");
        return;
    }

    setIsLoading(true);

    try {
        // 1. HAQIQIY SERVERGA SO'ROV YUBORAMIZ
        const response = await fetch('https://iphone-house-api.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // 2. JAVOBNI TEKSHIRAMIZ
        // ... (oldingi kodlar)
        if (response.ok && data.success) {
            // 1. Ma'lumotlarni saqlaymiz
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user)); // <--- USERNI HAM SAQLAYMIZ
            sessionStorage.setItem('userRole', data.user.role);
            sessionStorage.setItem('userName', data.user.fullName);
            sessionStorage.setItem('currentUserLogin', data.user.username); 
        
            toast.success(`Xush kelibsiz, ${data.user.fullName}!`);
            
            // 2. navigate'dan keyin reload'ni olib tashlaymiz
            navigate('/'); 
        } else {
            // Parol xato bo'lsa yoki bunday user topilmasa
            toast.error(data.message || "Login yoki parol noto'g'ri!");
        }
    } catch (error) {
        console.error("Login xatosi:", error);
        toast.error("Server bilan ulanishda xatolik! Tarmoqni tekshiring.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl w-[400px] border border-slate-100 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <span className="text-3xl font-black text-white">I</span>
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800 mb-8 tracking-tight">IPHONE HOUSE</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tizimga kirish (Login)</label>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type="text" 
                    className="w-full pl-12 pr-4 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800" 
                    value={username} 
                    onChange={e=>setUsername(e.target.value)} 
                    placeholder="Login kiriting..."
                    disabled={isLoading}
                />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Maxfiy Parol</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-12 pr-12 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-black tracking-widest text-slate-800" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder="••••••"
                    disabled={isLoading}
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 mt-4 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all tracking-wide ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
          >
              {isLoading ? "TEKSHIRILMOQDA..." : "KIRISH"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

