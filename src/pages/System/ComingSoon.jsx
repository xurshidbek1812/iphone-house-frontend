import React from 'react';
import { Wrench, Clock3, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({
  title = 'Sahifa hali tayyor emas',
  message = "Bu bo'lim ustida hozir texnik ishlar ketmoqda.",
  subMessage = "Iltimos, keyinroq qayta urinib ko'ring."
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
          <div className="relative px-8 pt-10 pb-8 text-center">
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50" />

            <div className="relative">
              <div className="mx-auto mb-6 w-24 h-24 rounded-[28px] bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-200">
                <Wrench size={42} strokeWidth={2.5} />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-black uppercase tracking-widest mb-5">
                <Clock3 size={14} />
                Texnik ishlar ketmoqda
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-3">
                {title}
              </h1>

              <p className="text-slate-500 font-bold text-base leading-relaxed max-w-xl mx-auto">
                {message}
              </p>

              <p className="text-slate-400 font-medium text-sm mt-2">
                {subMessage}
              </p>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>

              <div>
                <div className="font-black text-slate-800 mb-1">
                  Bo‘lim vaqtincha yopiq
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Bu sahifa hali to‘liq ishga tushirilmagan. Dizayn, logika yoki backend qismi hali yakunlanmoqda.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Orqaga qaytish
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Bosh sahifaga o'tish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;