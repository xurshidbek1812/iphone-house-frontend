import React, { useState } from 'react';
import {
  Bell,
  ShoppingCart,
  Wallet,
  Package,
  Receipt,
  HandCoins
} from 'lucide-react';

import NotificationsTab from './NotificationsTab';
import SalesTab from './SalesTab';
import CashTab from './CashTab';
import WarehouseTab from './WarehouseTab';
import ExpensesTab from './ExpensesTab'
import CollectionTab from './CollectionTab'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  const tabs = [
    { key: 'notifications', label: 'Xabarlar', icon: Bell },
    { key: 'sales', label: 'Savdo', icon: ShoppingCart },
    { key: 'cash', label: 'Kassa', icon: Wallet },
    { key: 'warehouse', label: 'Ombor', icon: Package },
    { key: 'expenses', label: 'Xarajatlar', icon: Receipt },
    { key: 'collection', label: 'Undiruv', icon: HandCoins }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationsTab />;
      case 'sales':
        return <SalesTab />;
      case 'cash':
        return <CashTab />;
      case 'warehouse':
        return <WarehouseTab />;
      case "expenses":
        return <ExpensesTab/>
      case "collection":
        return <CollectionTab/>
      default:
        return <NotificationsTab />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-100 min-h-screen animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
        <div className="text-sm font-bold text-slate-500">Boshqaruv paneli</div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-3 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default Dashboard;