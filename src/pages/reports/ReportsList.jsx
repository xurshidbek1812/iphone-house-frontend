import React, { useState } from 'react';
import { Search, FileSpreadsheet, Calendar, Download } from 'lucide-react';

const ReportsList = () => {
  const [activeTab, setActiveTab] = useState('Ombor');

  const tabs = ['Ombor', 'Undiruv', 'Xarajat', 'Kassa', 'Savdo', 'Naqdsiz pullar'];

  const reports = [
    { id: 'R0001', title: "R0001 - Tovarlar qoldig'i", hasDate: false },
    { id: 'R0009', title: "R0009 - Chiqim tovarlar", hasDate: false },
    { id: 'R0010', title: "R0010 - Ta'minotchilardan olingan tovarlar", hasDate: false },
    { id: 'R0011', title: "R0011 - Ta'minotchilarga qaytarilgan tovarlar", hasDate: false },
    { id: 'R0012', title: "R0012 - FIFO bo'yicha tovar qoldig'i", hasDate: true, date: '26.01.2026' },
    { id: 'R0015', title: "R0015 - Tovar chiqimi JSHSHIR", hasDate: false },
    { id: 'R0019', title: "R0019 - Tovar buyurtmalari", hasDate: false },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Hisobotlar ro'yxati</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Filter */}
        <div className="w-full lg:w-1/4 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" className="rounded border-gray-300" />
                        Tashkilot nomi
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 pl-4">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        Qo'shko'pir filiali
                    </label>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4 space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" />
                </div>

                <div className="space-y-3">
                    {reports.map((report) => (
                        <div key={report.id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="bg-blue-500 p-2 rounded-lg text-white">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <span className="font-bold text-gray-700 text-sm">{report.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-48">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        defaultValue={report.hasDate ? report.date : ''} 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none text-sm" 
                                        disabled={!report.hasDate}
                                    />
                                </div>
                                <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-blue-200 whitespace-nowrap">
                                    <Download size={18}/> Yuklab olish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsList;