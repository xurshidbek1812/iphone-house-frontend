import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react'; // <--- Eye va EyeOff qo'shildi
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <--- Parolni ko'rsatish/yashirish holati
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
        toast.error("Login va parolni kiriting!");
        return;
    }

    // 1. MASTER DIREKTOR TEKSHIRUVI
    const savedDirector = JSON.parse(localStorage.getItem('masterDirector') || "null");
    
    const dirLogin = savedDirector ? savedDirector.login : 'director';
    const dirPass = savedDirector ? savedDirector.password : '777';
    const dirName = savedDirector ? savedDirector.name : 'Bosh Direktor';

    if (username === dirLogin && password === dirPass) {
      localStorage.setItem('userRole', 'director');
      localStorage.setItem('userName', dirName);
      localStorage.setItem('currentUserLogin', dirLogin); 
      
      toast.success(`Xush kelibsiz, ${dirName}!`);
      setTimeout(() => {
          navigate('/');
          window.location.reload();
      }, 1000);
      return;
    }

    // 2. XODIMLARNI TEKSHIRISH
    const staffList = JSON.parse(localStorage.getItem('staffList') || "[]");
    const foundUser = staffList.find(u => u.login === username && u.password === password);

    if (foundUser) {
      const fullName = foundUser.firstName 
            ? `${foundUser.firstName} ${foundUser.lastName || ''}`.trim() 
            : foundUser.name;

      localStorage.setItem('userRole', foundUser.role);
      localStorage.setItem('userName', fullName); 
      localStorage.setItem('currentUserLogin', foundUser.login); 
      
      toast.success(`Xush kelibsiz, ${fullName}!`);
      setTimeout(() => {
          navigate('/');
          window.location.reload();
      }, 1000);
    } else {
      toast.error("Login yoki parol noto'g'ri!");
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
                />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Maxfiy Parol</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type={showPassword ? "text" : "password"} // <--- Holatga qarab o'zgaradi
                    className="w-full pl-12 pr-12 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-black tracking-widest text-slate-800" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder="••••••"
                />
                {/* --- KO'ZCHA TUGMASI --- */}
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>
          <button type="submit" className="w-full py-4 mt-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all tracking-wide">
              KIRISH
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;