import React from 'react';
import { Search } from 'lucide-react';

const AccountHistory = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Hisob raqam tarixi</h1>
      
      {/* Search Box */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Mijoz familiyasi, ismi va otasining ismi</div>
                  <div className="font-bold text-gray-800">-</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Mijoz ID</div>
                  <div className="font-bold text-gray-800">-</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">JSHSHIR</div>
                  <div className="font-bold text-gray-800">-</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Telefon raqami</div>
                  <div className="font-bold text-gray-800">-</div>
              </div>
          </div>

          <div className="relative">
             <label className="block text-sm font-medium text-gray-700 mb-2">Mijozni tanlang</label>
             <div className="relative">
                <input type="text" placeholder="Qidirish..." className="w-full pl-4 pr-10 py-3 border rounded-lg outline-none focus:border-blue-500" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             </div>
          </div>
      </div>
    </div>
  );
};
export default AccountHistory;