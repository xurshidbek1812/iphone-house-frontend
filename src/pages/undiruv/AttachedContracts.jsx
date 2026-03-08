import React from 'react';

const AttachedContracts = () => {
  const employees = [
    { name: 'Ataboyev Dilmurod unduruv', amount: '473 424 249 UZS', percent: '88%' },
    { name: 'Otanazarov Abdiyozbek Baxrambek o\'g\'li', amount: '191 622 575 UZS', percent: '88%' },
    { name: 'Matqurbanov Ruzmat', amount: '197 826 036 UZS', percent: '67%' },
    { name: 'Otaboyev Dilmurod Marim o\'g\'li', amount: '1 240 000 UZS', percent: '0%' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Biriktirilgan shartnomalar</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-sm">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-md font-bold shadow-sm">Shaxsiy statistika</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200">Barchasi</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200">Bugun to'lov kuni</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200">Bugun gaplashilgan</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200">Bugun gaplashilmagan</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200">Izoh turi bo'yicha</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Jami Qarzdorlik */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <h2 className="font-bold text-gray-700 mb-8">Jami qarzdorlik (Oy boshiga) – 0 ta</h2>
                <div className="flex items-center justify-center gap-12">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-800 mb-2">0%</div>
                        <span className="text-gray-400 text-xs font-bold uppercase">Bajarilganlik foizi</span>
                    </div>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-200"></div> 
                            <div className="w-20 text-gray-500 font-medium">Jami</div> 
                            <div className="font-bold text-gray-800">0 UZS</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div> 
                            <div className="w-20 text-gray-500 font-medium">Undirildi</div> 
                            <div className="font-bold text-gray-800">0 UZS</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div> 
                            <div className="w-20 text-gray-500 font-medium">Qoldi</div> 
                            <div className="font-bold text-gray-800">0 UZS</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">Undiruv qarzdorlik (oylik bo'yicha) – 0 ta</h3>
                    <span className="font-bold text-gray-800">0 UZS</span>
                 </div>
                 {/* Placeholder for chart lines */}
                 <div className="h-32 border-l border-b border-gray-100 relative">
                    <div className="absolute bottom-0 left-0 w-full h-px border-t border-dashed border-gray-200"></div>
                    <div className="absolute bottom-1/3 left-0 w-full h-px border-t border-dashed border-gray-200"></div>
                    <div className="absolute bottom-2/3 left-0 w-full h-px border-t border-dashed border-gray-200"></div>
                 </div>
            </div>
        </div>

        {/* Right Card: Employee Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-6">Qarzdorlik qoldig'i (Mas'ullar bo'yicha)</h2>
            
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-purple-500 text-white flex items-center justify-center text-3xl font-bold mb-4">QM</div>
                <h3 className="text-lg font-bold text-gray-800">Qurbonbayev Mardonbek Saidnazarovich</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-8">
                <div>
                    <div className="flex items-center justify-center gap-1 mb-1"><div className="w-2 h-2 bg-blue-200 rounded-full"></div> <span className="text-xs text-gray-500">Jami qarzdorlik</span></div>
                    <p className="font-bold text-gray-900">31 084 000</p>
                </div>
                <div>
                    <div className="flex items-center justify-center gap-1 mb-1"><div className="w-2 h-2 bg-blue-600 rounded-full"></div> <span className="text-xs text-gray-500">Undirildi</span></div>
                    <p className="font-bold text-gray-900">32 289 436</p>
                </div>
                <div>
                    <div className="flex items-center justify-center gap-1 mb-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> <span className="text-xs text-gray-500">Bajarish foizi</span></div>
                    <p className="font-bold text-gray-900">104 %</p>
                </div>
            </div>

            <table className="w-full text-left text-sm border-t border-gray-100">
                <thead className="text-xs text-gray-400 font-medium border-b border-gray-100">
                    <tr>
                        <th className="py-3 font-normal">Familiya, ism va otasining ismi</th>
                        <th className="py-3 text-right font-normal">Undirildi</th>
                        <th className="py-3 text-right font-normal">Bajarish foizi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                    {employees.map((emp, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="py-3 text-gray-700">{emp.name}</td>
                            <td className="py-3 text-right">{emp.amount}</td>
                            <td className="py-3 text-right">{emp.percent}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
export default AttachedContracts;