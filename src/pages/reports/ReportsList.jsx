import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Package,
  Warehouse,
  Coins,
  ShoppingCart,
  Landmark,
  CreditCard,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReportsList = () => {
  const token = sessionStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('Ombor');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  const tabs = [
    { key: 'Ombor', icon: Warehouse },
    { key: 'Undiruv', icon: Package },
    { key: 'Xarajat', icon: Coins },
    { key: 'Kassa', icon: Landmark },
    { key: 'Savdo', icon: ShoppingCart },
    { key: 'Naqdsiz pullar', icon: CreditCard }
  ];

  const reportsByTab = useMemo(
    () => ({
      Ombor: [
        {
          id: 'R0001',
          title: "R0001 - Tovarlar qoldig'i",
          description:
            "Tanlangan sanadagi ombordagi barcha tovarlar qoldig'ini Excel formatida yuklab oladi.",
          requiresDate: true,
          enabled: true
        }
      ],
      Undiruv: [
        {
          id: 'R0101',
          title: 'Undiruv hisobotlari',
          description: 'Tez orada qo‘shiladi.',
          requiresDate: false,
          enabled: false
        }
      ],
      Xarajat: [
        {
          id: 'R0201',
          title: 'Xarajat hisobotlari',
          description: 'Tez orada qo‘shiladi.',
          requiresDate: false,
          enabled: false
        }
      ],
      Kassa: [
        {
          id: 'R0301',
          title: 'Kassa hisobotlari',
          description: 'Tez orada qo‘shiladi.',
          requiresDate: false,
          enabled: false
        }
      ],
      Savdo: [
        {
          id: 'R0401',
          title: 'Savdo hisobotlari',
          description: 'Tez orada qo‘shiladi.',
          requiresDate: false,
          enabled: false
        }
      ],
      'Naqdsiz pullar': [
        {
          id: 'R0501',
          title: 'Naqdsiz pullar hisobotlari',
          description: 'Tez orada qo‘shiladi.',
          requiresDate: false,
          enabled: false
        }
      ]
    }),
    []
  );

  const currentReports = reportsByTab[activeTab] || [];

  const handleDownloadWarehouseStock = async () => {
    if (!reportDate) {
      toast.error('Sanani tanlang');
      return;
    }

    setDownloadingReportId('R0001');

    try {
      const url = `${API_URL}/api/reports/warehouse-stock?date=${reportDate}&format=xlsx`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorText = "Hisobotni yuklab bo'lmadi";
        try {
          const errorData = await response.json();
          errorText = errorData?.error || errorText;
        } catch {
          //
        }
        throw new Error(errorText);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `tovarlar-qoldigi-${reportDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Excel fayl yuklab olindi");
    } catch (error) {
      console.error('Warehouse stock report download error:', error);
      toast.error(error.message || "Hisobotni yuklashda xatolik yuz berdi");
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleDownload = async (report) => {
    if (!report.enabled) {
      toast('Bu hisobot hali tayyor emas');
      return;
    }

    if (report.id === 'R0001') {
      await handleDownloadWarehouseStock();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Hisobotlar ro‘yxati
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Bo‘lim bo‘yicha hisobotlarni ko‘rish va Excel formatida yuklab olish
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex min-w-fit items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{activeTab} hisobotlari</h2>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'Ombor'
              ? "Omborga oid hisobotlarni Excel formatida yuklab oling"
              : "Bu bo‘lim uchun hisobotlar keyingi bosqichda qo‘shiladi"}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {currentReports.map((report) => {
            const isDownloading = downloadingReportId === report.id;

            return (
              <div
                key={report.id}
                className={`rounded-2xl border p-4 transition ${
                  report.enabled
                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    : 'border-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        report.enabled
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <FileSpreadsheet size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-800">{report.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{report.description}</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[360px]">
                    {report.requiresDate && (
                      <div className="relative">
                        <Calendar
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!report.enabled || isDownloading}
                      onClick={() => handleDownload(report)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                        report.enabled
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'cursor-not-allowed bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDownloading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {isDownloading ? 'Yuklanmoqda...' : 'Yuklab olish'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {currentReports.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-slate-400">
              Hisobot topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsList;