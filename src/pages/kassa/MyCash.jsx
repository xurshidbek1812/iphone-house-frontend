import React from 'react';
import { DollarSign, Wallet } from 'lucide-react';

const MyCash = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mening kassalarim</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: USD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <DollarSign size={20} />
                  </div>
                  <h3 className="font-bold text-gray-700">Dollor kassa</h3>
                  <div className="ml-auto w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">0 <span className="text-lg text-gray-400">USD</span></div>
              <div className="text-sm text-gray-400 mb-6">Band qilingan: <span className="text-red-500 font-bold">0</span></div>
              
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-t pt-4">
                  <span>Valyuta turi - USD</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Faol</span>
              </div>
          </div>

          {/* Card 2: UZS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Wallet size={20} />
                  </div>
                  <h3 className="font-bold text-gray-700">So'm kassa</h3>
                  <div className="ml-auto w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">16 052 665.16 <span className="text-lg text-gray-400">UZS</span></div>
              <div className="text-sm text-gray-400 mb-6">Band qilingan: <span className="text-red-500 font-bold">0</span></div>
              
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-t pt-4">
                  <span>Valyuta turi - UZS</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Faol</span>
              </div>
          </div>
      </div>
    </div>
  );
};
export default MyCash;