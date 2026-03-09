import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Calculator as CalcIcon } from 'lucide-react'; 
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Calculator from './components/Calculator';
import { Toaster } from 'react-hot-toast';

// --- AVTOTO'LOV ---
import AutoPaymentContracts from './pages/autopayment/AutoPaymentContracts';

// --- NAQDSIZ PULLAR ---
import CustomerReceipts from './pages/non_cash/CustomerReceipts';

// --- HISOBOTLAR ---
import ReportsList from './pages/reports/ReportsList';

// --- XARAJATLAR ---
import CashExpenses from './pages/expenses/CashExpenses';

// --- NARX YORLIG'I ---
import ChangedPriceProducts from './pages/price_tag/ChangedPriceProducts';
import PrintPriceTag from './pages/price_tag/PrintPriceTag'; 
import PriceTagTemplates from './pages/price_tag/PriceTagTemplates';

// --- NARXLARNI BOSHQARISH ---
import ChangedPrices from './pages/price_management/ChangedPrices';
import IncomingPriceChanges from './pages/price_management/IncomingPriceChanges';
import GeneralMarkup from './pages/price_management/GeneralMarkup';
import CategoryMarkup from './pages/price_management/CategoryMarkup';
import ProductMarkup from './pages/price_management/ProductMarkup';

// --- MIJOZ HISOB RAQAMI ---
import BonusOrders from './pages/client_account/BonusOrders';
import BonusDifference from './pages/client_account/BonusDifference';
import BonusGoods from './pages/client_account/BonusGoods';
import BonusHistory from './pages/client_account/BonusHistory';
import AccountBalances from './pages/client_account/AccountBalances';
import AccountTransactions from './pages/client_account/AccountTransactions';
import BonusReturn from './pages/client_account/BonusReturn';
import AccountHistory from './pages/client_account/AccountHistory';

// --- MIJOZGA TOVAR CHIQIMI ---
import IssueInvoices from './pages/issue/IssueInvoices';
import DeliveryList from './pages/issue/DeliveryList';
import PickupList from './pages/issue/PickupList';

// --- MIJOZLAR ---
import CustomerList from './pages/customers/CustomerList';
import AddCustomer from './pages/customers/AddCustomer';
import Blacklist from './pages/customers/Blacklist';
import BlacklistOrders from './pages/customers/BlacklistOrders';

// --- HISOB-KITOBLAR ---
import SupplierAct from './pages/hisob/SupplierAct';
import SupplierAccounts from './pages/hisob/SupplierAccounts';
import SupplierLimit from './pages/hisob/SupplierLimit';
import SupplierList from './pages/hisob/SupplierList';

// --- OMBOR ---
import WarehouseOperations from './pages/ombor/WarehouseOperations';
import InternalIncome from './pages/ombor/InternalIncome';
import InternalExpense from './pages/ombor/InternalExpense';
import SupplierIncomeList from './pages/ombor/SupplierIncomeList';
import EditSupplierIncome from './pages/ombor/EditSupplierIncome';
import AddSupplierIncome from './pages/ombor/AddSupplierIncome'; 
import SupplierReturn from './pages/ombor/SupplierReturn';
import UnfinishedSales from './pages/ombor/UnfinishedSales';
import CustomerIncome from './pages/ombor/CustomerIncome';
import Sklad from './pages/ombor/Sklad';
import AddSupplierReturn from './pages/ombor/AddSupplierReturn';
import InventoryCount from './pages/ombor/InventoryCount'; 
import InventoryHistory from './pages/ombor/InventoryHistory'; 

// --- UNDIRUV ---
import AttachedContracts from './pages/undiruv/AttachedContracts';
import AllContracts from './pages/undiruv/AllContracts';
import AllCustomers from './pages/undiruv/AllCustomers';
import WarningLetters from './pages/undiruv/WarningLetters';
import WarningLetterTemplates from './pages/undiruv/WarningLetterTemplates';
import AssignResponsible from './pages/undiruv/AssignResponsible';
import AssignMFY from './pages/undiruv/AssignMFY';
import AssignWorkplace from './pages/undiruv/AssignWorkplace';
import CommentTypes from './pages/undiruv/CommentTypes';

// --- SHARTNOMA ---
import ContractList from './pages/shartnoma/ContractList';
import OrderList from './pages/shartnoma/OrderList';
import Discounts from './pages/shartnoma/Discounts';
import Returns from './pages/shartnoma/Returns';
import ClosedContracts from './pages/shartnoma/ClosedContracts';
import AddContract from './pages/shartnoma/AddContract';

// --- NAQD SAVDO ---
import CashSales from './pages/sales/CashSales';
import SalesReturns from './pages/sales/Returns';
import SalesDiscounts from './pages/sales/Discounts';

// --- KASSA ---
import Finance from './pages/Finance'; 
import MyCash from './pages/kassa/MyCash';
import CurrencyExchange from './pages/kassa/CurrencyExchange';
import ContractPayment from './pages/kassa/ContractPayment';
import Prepayment from './pages/kassa/Prepayment';
import CashSalesPayment from './pages/kassa/CashSalesPayment';
import IncomeFromOtherCash from './pages/kassa/IncomeFromOtherCash';
import ExpenseToOtherCash from './pages/kassa/ExpenseToOtherCash';
import IncomeFromExpense from './pages/kassa/IncomeFromExpense';
import ExpenseOutput from './pages/kassa/ExpenseOutput';
import AllCashOperations from './pages/kassa/AllCashOperations';
import CashOrders from './pages/kassa/CashOrders';
import ManageCash from './pages/kassa/ManageCash';
import CashBalance from './pages/kassa/CashBalance';
import AllReceipts from './pages/kassa/AllReceipts';
import OrderListKassa from './pages/kassa/OrderListKassa';

// --- SMS YUBORISH ---
import SmsSend from './pages/sms/SmsSend';

// --- SETTINGS ---
import Settings from './pages/Settings';
import Expenses from './pages/Expenses'; 
import StaffList from './pages/settings/StaffList'; 
import ProfileSettings from './pages/settings/ProfileSettings';
import CategorySettings from './pages/settings/CategorySettings';

// --- DEBUG COMPONENT ---
const NotFound = () => {
  const location = useLocation();
  return (
    <div className="p-10 text-center bg-white rounded-xl shadow-sm border border-red-200">
      <h1 className="text-xl font-bold text-red-600 mb-2">Sahifa topilmadi</h1>
      <p className="text-gray-600">Tizim ushbu manzilni topa olmadi:</p>
      <code className="block mt-4 mb-4 p-3 bg-gray-100 rounded text-blue-600 font-mono font-bold text-lg">
        {location.pathname}
      </code>
    </div>
  );
};

const MainLayout = () => {
  const [isCalcOpen, setIsCalcOpen] = useState(false); 
  // 1. YANGI STATE: Menyuni boshqarish pulti endi shu yerda turadi
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* 2. SIDEBARGA PULTNI BERAMIZ */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* 3. ASOSIY EKRAN MOSLASHUVCHANLIGI:
          Agar Sidebar ochiq bo'lsa chapdan 256px (ml-64), 
          yopiq bo'lsa chapdan 80px (ml-20) joy tashlaydi.
      */}
      <div className={`flex-1 p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <header className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-black text-slate-800">Iphone House</h1>
              <button 
                onClick={() => setIsCalcOpen(true)}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl shadow-sm border border-blue-100 hover:bg-blue-50 font-bold transition-colors"
              >
                <CalcIcon size={20} /> Kalkulyator
              </button>
          </header>
          
          <Outlet />
      </div>

      <Calculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <>
    <Toaster position="top-right" reverseOrder={false} />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                
                {/* AVTO */}
                <Route path="/avto/shartnomalar" element={<AutoPaymentContracts />} />
                <Route path="/avto" element={<AutoPaymentContracts />} />

                {/* NAQDSIZ */}
                <Route path="/naqdsiz/tushumlar" element={<CustomerReceipts />} />
                <Route path="/naqdsiz" element={<CustomerReceipts />} />

                {/* HISOBOTLAR */}
                <Route path="/hisobotlar/royxat" element={<ReportsList />} />
                <Route path="/hisobotlar" element={<ReportsList />} />

                {/* XARAJATLAR */}
                <Route path="/xarajatlar/kassa" element={<CashExpenses />} />
                
                {/* YORLIQ */}
                <Route path="/yorliq/ozgargan" element={<ChangedPriceProducts />} />
                <Route path="/yorliq/chop-etish" element={<PrintPriceTag />} />
                <Route path="/yorliq/shablonlar" element={<PriceTagTemplates />} />

                {/* SMS */}
                <Route path="/sms/mijozlar" element={<SmsSend />} />
                <Route path="/sms" element={<SmsSend />} />

                {/* NARXLAR */}
                <Route path="/narxlar/ozgargan" element={<ChangedPrices />} />
                <Route path="/narxlar/ozgargan-narxlar" element={<ChangedPrices />} />
                <Route path="/narxlar/kirim" element={<IncomingPriceChanges />} />
                <Route path="/narxlar/kirim-narxi-ozgarishlari" element={<IncomingPriceChanges />} />
                <Route path="/narxlar/umumiy" element={<GeneralMarkup />} />
                <Route path="/narxlar/umumiy-ustama" element={<GeneralMarkup />} /> 
                <Route path="/narxlar/umumiy-ustama-belgilash" element={<GeneralMarkup />} />
                <Route path="/narxlar/kategoriya" element={<CategoryMarkup />} />
                <Route path="/narxlar/kategoriya-ustama" element={<CategoryMarkup />} />
                <Route path="/narxlar/kategoriya-uchun-ustama" element={<CategoryMarkup />} />
                <Route path="/narxlar/tovar" element={<ProductMarkup />} />
                <Route path="/narxlar/tovar-ustama" element={<ProductMarkup />} />
                <Route path="/narxlar/tovarlar-uchun-ustama" element={<ProductMarkup />} />

                {/* HISOB RAQAM */}
                <Route path="/hisobraqam/bonus" element={<BonusOrders />} />
                <Route path="/hisobraqam/tolov" element={<BonusDifference />} />
                <Route path="/hisobraqam/tovar" element={<BonusGoods />} />
                <Route path="/hisobraqam/tarix" element={<BonusHistory />} />
                <Route path="/hisobraqam/qoldiq" element={<AccountBalances />} />
                <Route path="/hisobraqam/amaliyot" element={<AccountTransactions />} />
                <Route path="/hisobraqam/qaytarish" element={<BonusReturn />} />
                <Route path="/hisobraqam/hisob-tarix" element={<AccountHistory />} />

                {/* CHIQIM */}
                <Route path="/chiqim/faktura" element={<IssueInvoices />} />
                <Route path="/chiqim/yetkazish" element={<DeliveryList />} />
                <Route path="/chiqim/olib-ketish" element={<PickupList />} />

                {/* MIJOZLAR */}
                <Route path="/mijozlar" element={<CustomerList />} />
                <Route path="/mijozlar/qoshish" element={<AddCustomer />} />
                <Route path="/mijozlar/tahrirlash/:id" element={<AddCustomer />} />
                <Route path="/mijozlar/qora-royxat" element={<Blacklist />} />
                <Route path="/mijozlar/qora-royxat-buyurtmalari" element={<BlacklistOrders />} />

                {/* --- HISOB-KITOBLAR --- */}
                <Route path="/hisob/akt" element={<SupplierAct />} />
                <Route path="/hisob/taminotchi" element={<SupplierAccounts />} />
                <Route path="/hisob/limit" element={<SupplierLimit />} />
                <Route path="/hisob/taminotchilar-royxati" element={<SupplierList />} />

                {/* --- OMBOR (TO'G'RILANGAN) --- */}
                <Route path="/ombor/amaliyotlar" element={<WarehouseOperations />} />
                <Route path="/ombor/boshqa-kirim" element={<InternalIncome />} />
                <Route path="/ombor/boshqa-chiqim" element={<InternalExpense />} />
                <Route path="/ombor/taminotchi-kirim" element={<SupplierIncomeList />} />
                <Route path="/ombor/taminotchi-kirim/qoshish" element={<AddSupplierIncome />} />
                <Route path="/ombor/taminotchi-kirim/tahrirlash/:id" element={<EditSupplierIncome />} />
                <Route path="/ombor/taminotchi-qaytarish" element={<SupplierReturn />} />
                <Route path="/ombor/yakunlanmagan" element={<UnfinishedSales />} />
                <Route path="/ombor/mijoz-kirim" element={<CustomerIncome />} />
                <Route path="/ombor/qoldiq" element={<Sklad />} /> 
                <Route path="/ombor/taminotchi-qaytarish/qoshish" element={<AddSupplierReturn />} />
                <Route path="/ombor/taminotchilar" element={<SupplierList />} />
                
                {/* --- MANA BU YERDA O'ZGARISH --- */}
                <Route path="/ombor/sanoq" element={<InventoryCount />} /> 
                <Route path="/ombor/sanoq-tarixi" element={<InventoryHistory />} />

                {/* UNDIRUV */}
                <Route path="/undiruv" element={<AttachedContracts />} />
                <Route path="/undiruv/barcha" element={<AllContracts />} />
                <Route path="/undiruv/mijozlar" element={<AllCustomers />} />
                <Route path="/undiruv/xat" element={<WarningLetters />} />
                <Route path="/undiruv/xat-shablon" element={<WarningLetterTemplates />} />
                <Route path="/undiruv/biriktirish" element={<AssignResponsible />} />
                <Route path="/undiruv/mfy" element={<AssignMFY />} />
                <Route path="/undiruv/ish-joyi" element={<AssignWorkplace />} />
                <Route path="/undiruv/izoh" element={<CommentTypes />} />

                {/* SHARTNOMA */}
                <Route path="/shartnoma" element={<ContractList />} />
                <Route path="/shartnoma/buyurtmalar" element={<OrderList />} />
                <Route path="/shartnoma/chegirmalar" element={<Discounts />} />
                <Route path="/shartnoma/qaytarish" element={<Returns />} />
                <Route path="/shartnoma/yopilgan" element={<ClosedContracts />} />
                <Route path="/shartnoma/qoshish" element={<AddContract />} />

                {/* NAQD SAVDO */}
                <Route path="/savdo" element={<CashSales />} />
                <Route path="/savdo/qaytarish" element={<SalesReturns />} />
                <Route path="/savdo/chegirmalar" element={<SalesDiscounts />} />

                {/* KASSA */}
                <Route path="/kassa" element={<Finance />} />
                <Route path="/kassa/shartnoma-tolov" element={<ContractPayment />} />
                <Route path="/kassa/oldindan-tolov" element={<Prepayment />} />
                <Route path="/kassa/naqd-tolov" element={<CashSalesPayment />} />
                <Route path="/kassa/boshqa-kirim" element={<IncomeFromOtherCash />} />
                <Route path="/kassa/boshqa-chiqim" element={<ExpenseToOtherCash />} />
                <Route path="/kassa/xarajat-kirim" element={<IncomeFromExpense />} />
                <Route path="/kassa/xarajat-chiqim" element={<ExpenseOutput />} />
                <Route path="/kassa/amaliyotlar" element={<AllCashOperations />} />
                <Route path="/kassa/buyurtmalar" element={<CashOrders />} />
                <Route path="/kassa/boshqarish" element={<ManageCash />} />
                <Route path="/kassa/qoldiq" element={<CashBalance />} />
                <Route path="/kassa/mening-kassam" element={<MyCash />} />
                <Route path="/kassa/tushumlar" element={<AllReceipts />} />
                <Route path="/kassa/buyurtmalar-royxati" element={<OrderListKassa />} />
                <Route path="/kassa/valyuta" element={<CurrencyExchange />} />

                {/* SOZLAMALAR */}
                <Route path="/sozlamalar" element={<Settings />} />
                <Route path="/sozlamalar/xodimlar" element={<StaffList />} />
                <Route path="/xarajatlar" element={<Expenses />} />
                <Route path="/sozlamalar/profil" element={<ProfileSettings />} />
                <Route path="/sozlamalar/kategoriyalar" element={<CategorySettings />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
