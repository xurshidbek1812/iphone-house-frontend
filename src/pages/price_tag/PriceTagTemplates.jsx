import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

const PriceTagTemplates = () => {
  const data = [
    { id: '2', name: 'Yorliq (58×40)', active: true },
    { id: '12', name: '10×15 - 12 oylik yangi model-copy-copy', active: false },
    { id: '11', name: '10×15 - 12 oylik yangi model-copy', active: false },
    { id: '9', name: '10×7 - 12 oylik yangi model', active: false },
    { id: '8', name: '10×15 - 12 oylik yangi model', active: false },
    { id: '10', name: '7.5*11.3 samsung uchun Shovot', active: false },
    { id: '1', name: '10×7 - 12 oylik', active: false },
    { id: '17', name: '7.5*11.3 samsung 25% chegirma', active: false },
    { id: '20', name: '7.5*11.3 samsung yangi', active: true },
    { id: '19', name: '10×7 - 12 Faqat telfonlarga', active: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Narx yorlig'i shablonlari</h1>
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
         <button className="px-4 py-2 border rounded-lg">Ustunlar</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nomi</th>
              <th className="p-4 text-right">Faolligi</th>
              <th className="p-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 text-gray-600">{item.name}</td>
                <td className="p-4 text-right">
                    <div className={`w-10 h-5 rounded-full inline-flex items-center px-1 ml-auto transition-colors ${item.active ? 'bg-green-200' : 'bg-gray-200'}`}>
                        <div className={`w-3 h-3 rounded-full ml-auto transition-colors ${item.active ? 'bg-green-600' : 'bg-white'}`}></div>
                    </div>
                </td>
                <td className="p-4 text-right"><MoreVertical size={16} className="text-gray-400 cursor-pointer ml-auto"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PriceTagTemplates;