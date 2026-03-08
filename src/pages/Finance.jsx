import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const Finance = () => {
  // Mock Data matching image_6074f6.png
  // Left Chart: Tushumlar (Income)
  const incomeData = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    cash: Math.floor(Math.random() * 5000000),    // Purple
    card: Math.floor(Math.random() * 3000000),    // Green
  }));

  // Right Chart: Muddatli to'lov (Installments)
  const installmentData = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    expected: Math.floor(Math.random() * 8000000), // Light Green
    collected: Math.floor(Math.random() * 6000000), // Purple
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-gray-800">Kassa operatsiyalari</h1>

      {/* --- TOP ROW: SMALL CARDS --- */}
      <div className="grid grid-cols-2 gap-6">
        {/* Card 1: Income */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ta'minotchidan kirim bo'lgan pullar</p>
                <h3 className="text-2xl font-bold text-gray-800">0 <span className="text-xs text-gray-400">UZS</span></h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <ArrowDownLeft size={24} />
            </div>
        </div>
        
        {/* Card 2: Expense */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ta'minotchiga chiqim bo'lgan pullar</p>
                <h3 className="text-2xl font-bold text-gray-800">0 <span className="text-xs text-gray-400">UZS</span></h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <ArrowUpRight size={24} />
            </div>
        </div>
      </div>

      {/* --- MIDDLE ROW: BIG CHARTS --- */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* LEFT CHART: Tushumlar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-700">Tushumlar</h3>
                    <h2 className="text-2xl font-bold mt-1">91 934 400 <span className="text-sm text-gray-400 font-normal">UZS</span></h2>
                </div>
                <select className="text-xs border rounded px-3 py-1 bg-gray-50"><option>Oylik</option></select>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData} barSize={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="cash" stackId="a" fill="#a855f7" name="Naqd" />  {/* Purple */}
                        <Bar dataKey="card" stackId="a" fill="#22c55e" name="Plastik" /> {/* Green */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* RIGHT CHART: Muddatli To'lov */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-700">Muddatli to'lov bo'yicha tushumlar</h3>
                    <h2 className="text-2xl font-bold mt-1">817 943 568 <span className="text-sm text-gray-400 font-normal">UZS</span></h2>
                </div>
                <select className="text-xs border rounded px-3 py-1 bg-gray-50"><option>Oylik</option></select>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={installmentData} barSize={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="expected" stackId="a" fill="#4ade80" name="Kutilayotgan" /> {/* Light Green */}
                        <Bar dataKey="collected" stackId="a" fill="#8b5cf6" name="Tushgan" />     {/* Purple */}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: CASH BALANCE TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">Kassa qoldig'i - UZS</h3>
            <span className="text-xl font-bold text-gray-900">22 312 665</span>
        </div>
        <div className="p-4">
            <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">BA</div>
                    <span className="text-sm font-medium">Bekchonov Azomat</span>
                </div>
                <span className="font-bold text-gray-800">9 634 665 UZS</span>
            </div>
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">OA</div>
                    <span className="text-sm font-medium">Otanazarov Abdiyozbek Baxrambek o'g'li</span>
                </div>
                <span className="font-bold text-gray-800">6 702 000 UZS</span>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Finance;