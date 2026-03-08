import React, { useState, useEffect } from 'react';
import { X, Calculator as CalcIcon } from 'lucide-react';

const Calculator = ({ isOpen, onClose, initialTotal = '', initialCurrency = 'UZS' }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('UZS'); 
  const [exchangeRate, setExchangeRate] = useState(0); // Boshlang'ich qiymat 0, useEffect o'zi topib oladi

  const [initialPayment, setInitialPayment] = useState('');
  const [initialPercent, setInitialPercent] = useState('');
  
  const [showMonths, setShowMonths] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

// Oyna ochilganda ma'lumotlarni va DIREKTOR KURSINI yuklaymiz
  useEffect(() => {
    if (isOpen) {
        if (initialTotal) setTotalAmount(initialTotal);
        setCurrency(initialCurrency || 'UZS'); 
        
        // --- DIREKTOR KURSINI OLISH (To'g'rilandi!) ---
        const savedRate = localStorage.getItem('globalExchangeRate'); // <-- Aynan sizning nomingiz qo'yildi
        
        if (savedRate) {
            setExchangeRate(Number(savedRate));
        } else {
            setExchangeRate(12500); // Agar direktor hali kurs kiritmagan bo'lsa
        }

        setInitialPayment('');
        setInitialPercent('');
        setShowMonths(false);
        setSelectedMonth(null);
    }
  }, [isOpen, initialTotal, initialCurrency]);

  const markupRates = {
    1: 0, 2: 5, 3: 10, 4: 14, 5: 18, 6: 22, 
    7: 26, 8: 30, 9: 34, 10: 38, 11: 42, 12: 45
  };

  // VALYUTANI O'ZGARTIRISH
  const handleCurrencyChange = (e) => {
     const newCurrency = e.target.value;
     if (newCurrency === currency) return; 

     let newTotal = Number(totalAmount) || 0;
     let newInitPay = Number(initialPayment) || 0;

     if (newCurrency === 'UZS' && currency === 'USD') {
         // Dollardan -> So'mga (Ko'paytiramiz)
         newTotal = newTotal * exchangeRate;
         newInitPay = newInitPay * exchangeRate;
     } else if (newCurrency === 'USD' && currency === 'UZS') {
         // So'mdan -> Dollarga (Bo'lamiz)
         newTotal = newTotal / exchangeRate;
         newInitPay = newInitPay / exchangeRate;
     }

     setTotalAmount(newTotal > 0 ? Number(newTotal.toFixed(0)) : '');
     setInitialPayment(newInitPay > 0 ? Number(newInitPay.toFixed(0)) : '');
     setCurrency(newCurrency);
  };

  const handleAmountChange = (e) => {
    const val = Number(e.target.value);
    setInitialPayment(val);
    if (totalAmount > 0) {
      setInitialPercent(((val / totalAmount) * 100).toFixed(1));
    }
    setShowMonths(false);
  };

  const handlePercentChange = (e) => {
    const val = Number(e.target.value);
    setInitialPercent(val);
    if (totalAmount > 0) {
      setInitialPayment(((totalAmount * val) / 100).toFixed(0));
    }
    setShowMonths(false);
  };

  const handleCalculate = () => {
    if (!totalAmount) return alert("Summa kiritilmagan!");
    setShowMonths(true);
    setSelectedMonth(null);
  };

  const calculateResult = () => {
    if (!selectedMonth) return null;
    const principal = totalAmount - initialPayment;
    const markup = principal * (markupRates[selectedMonth] || 0) / 100;
    const total = principal + markup;
    
    return {
      monthly: Math.round(total / selectedMonth),
      total: Math.round(total + Number(initialPayment))
    };
  };

  const result = calculateResult();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalcIcon className="text-blue-600"/> Kredit Kalkulyatori
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* KURS KIRITISH QISMI */}
          <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
              <span className="text-sm font-medium text-gray-600">Joriy dollar kursi:</span>
              <div className="flex items-center gap-1">
                  <input
                      type="number"
                      value={exchangeRate}
                      onChange={e => { 
                          setExchangeRate(Number(e.target.value)); 
                          // Istasangiz bu yerdan o'zgartirilganda LocalStorage ga ham saqlab qo'yish mumkin
                          // localStorage.setItem('dollarKursi', e.target.value);
                          setShowMonths(false); 
                      }}
                      className="w-24 p-1.5 text-right font-bold text-gray-800 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-gray-500">UZS</span>
              </div>
          </div>

          {/* UMUMIY SUMMA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Umumiy summa</label>
            <div className="relative group">
                <input 
                    type="number" 
                    className="w-full p-4 pr-24 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl text-gray-800 transition-all bg-gray-50"
                    placeholder="0"
                    value={totalAmount}
                    onChange={(e) => { setTotalAmount(e.target.value); setShowMonths(false); }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <select value={currency} onChange={handleCurrencyChange} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-blue-600 outline-none cursor-pointer hover:bg-gray-100 shadow-sm">
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Oldindan to'lov */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bosh to'lov</label>
                <div className="relative">
                    <input type="number" className="w-full p-3 pr-14 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={initialPayment} onChange={handleAmountChange}/>
                    <span className="absolute right-3 top-3.5 text-gray-400 text-xs font-bold">{currency}</span>
                </div>
             </div>
             {/* Foiz */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bosh to'lov (%)</label>
                <div className="relative">
                    <input type="number" className="w-full p-3 pr-8 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={initialPercent} onChange={handlePercentChange}/>
                    <span className="absolute right-3 top-3.5 text-gray-400 text-xs font-bold">%</span>
                </div>
             </div>
          </div>

          <button onClick={handleCalculate} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
              Kreditni hisoblash
          </button>

          {showMonths && (
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-gray-500 text-sm mb-3 font-medium">Muddatni tanlang (oy):</p>
                <div className="grid grid-cols-6 gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <button key={m} onClick={() => setSelectedMonth(m)} className={`h-11 rounded-lg font-bold border transition-all ${selectedMonth === m ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>{m}</button>
                    ))}
                </div>
                
                {result && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 shadow-inner">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Har oy to'lanadi:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-gray-800">{result.monthly.toLocaleString()}</span>
                                <select value={currency} onChange={handleCurrencyChange} className="bg-white border border-gray-300 px-2 py-1.5 rounded shadow-sm text-xs font-bold text-blue-600 outline-none cursor-pointer hover:bg-gray-50">
                                    <option value="UZS">UZS</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>
                        <div className="w-full h-px bg-gray-200"></div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Jami to'lanadigan summa:</span>
                            <span className="font-bold text-gray-800 text-base">{result.total.toLocaleString()} {currency}</span>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-white">
            <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Yopish</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;