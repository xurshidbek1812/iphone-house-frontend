import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

const CustomerReceipts = () => {
  const [activeTab, setActiveTab] = useState('undistributed');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mijozdan tushumlar</h1>
      
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-lg w-fit">
         <button 
            onClick={() => setActiveTab('undistributed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'undistributed' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Taqsimlanmagan tushumlar
         </button>
         <button 
            onClick={() => setActiveTab('distributed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'distributed' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Taqsimlangan tushumlar
         </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter size={20}/> Filtr</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto min-h-[400px]">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Sanasi</th>
              <th className="p-4">Shartnoma ID</th>
              <th className="p-4">Firma ma'lumotlari</th>
              <th className="p-4">O'tkazilgan firma ma'lumotlari</th>
              <th className="p-4">MFO</th>
              <th className="p-4">Tushum summasi</th>
              <th className="p-4">To'lov maqsadi</th>
              <th className="p-4">Holati</th>
              <th className="p-4">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
             {/* Empty State based on screenshot */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CustomerReceipts;