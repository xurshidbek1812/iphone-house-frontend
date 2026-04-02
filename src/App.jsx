import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Calculator as CalcIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Calculator from './components/Calculator';
import { Toaster } from 'react-hot-toast';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './utils/permissions';

// YUKLANAYOTGANDA KO'RINADIGAN ANIMATSIYA
const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// LAZY LOADING
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

// --- AVTOTO'LOV ---
const AutoPaymentContracts = lazy(() => import('./pages/autopayment/AutoPaymentContracts'));

// --- NAQDSIZ PULLAR ---
const CustomerReceipts = lazy(() => import('./pages/non_cash/CustomerReceipts'));

// --- HISOBOTLAR ---
const ReportsList = lazy(() => import('./pages/reports/ReportsList'));

// --- XARAJATLAR ---
const CashExpenses = lazy(() => import('./pages/expenses/CashExpenses'));

// --- NARX YORLIG'I ---
const ChangedPriceProducts = lazy(() => import('./pages/price_tag/ChangedPriceProducts'));
const PrintPriceTag = lazy(() => import('./pages/price_tag/PrintPriceTag'));
const PriceTagTemplates = lazy(() => import('./pages/price_tag/PriceTagTemplates'));

// --- NARXLARNI BOSHQARISH ---
const ChangedPrices = lazy(() => import('./pages/price_management/ChangedPrices'));
const IncomingPriceChanges = lazy(() => import('./pages/price_management/IncomingPriceChanges'));
const GeneralMarkup = lazy(() => import('./pages/price_management/GeneralMarkup'));
const CategoryMarkup = lazy(() => import('./pages/price_management/CategoryMarkup'));
const ProductMarkup = lazy(() => import('./pages/price_management/ProductMarkup'));

// --- MIJOZ HISOB RAQAMI ---
const BonusOrders = lazy(() => import('./pages/client_account/BonusOrders'));
const BonusDifference = lazy(() => import('./pages/client_account/BonusDifference'));
const BonusGoods = lazy(() => import('./pages/client_account/BonusGoods'));
const BonusHistory = lazy(() => import('./pages/client_account/BonusHistory'));
const AccountBalances = lazy(() => import('./pages/client_account/AccountBalances'));
const AccountTransactions = lazy(() => import('./pages/client_account/AccountTransactions'));
const BonusReturn = lazy(() => import('./pages/client_account/BonusReturn'));
const AccountHistory = lazy(() => import('./pages/client_account/AccountHistory'));

// --- MIJOZGA TOVAR CHIQIMI ---
const IssueInvoices = lazy(() => import('./pages/issue/IssueInvoices'));
const DeliveryList = lazy(() => import('./pages/issue/DeliveryList'));
const PickupList = lazy(() => import('./pages/issue/PickupList'));

// --- MIJOZLAR ---
const CustomerList = lazy(() => import('./pages/customers/CustomerList'));
const AddCustomer = lazy(() => import('./pages/customers/AddCustomer'));
const Blacklist = lazy(() => import('./pages/customers/Blacklist'));
const BlacklistOrders = lazy(() => import('./pages/customers/BlacklistOrders'));

// --- HISOB-KITOBLAR ---
const SupplierAct = lazy(() => import('./pages/hisob/SupplierAct'));
const SupplierAccounts = lazy(() => import('./pages/hisob/SupplierAccounts'));
const SupplierLimit = lazy(() => import('./pages/hisob/SupplierLimit'));
const SupplierList = lazy(() => import('./pages/hisob/SupplierList'));

// --- OMBOR ---
const WarehouseOperations = lazy(() => import('./pages/ombor/WarehouseOperations'));
const InternalIncome = lazy(() => import('./pages/ombor/InternalIncome'));
const InternalExpense = lazy(() => import('./pages/ombor/InternalExpense'));
const SupplierIncomeList = lazy(() => import('./pages/ombor/SupplierIncomeList'));
const SupplierIncome = lazy(() => import('./pages/ombor/SupplierIncome'));
const EditSupplierIncome = lazy(() => import('./pages/ombor/EditSupplierIncome'));
const SupplierReturn = lazy(() => import('./pages/ombor/SupplierReturn'));
const UnfinishedSales = lazy(() => import('./pages/ombor/UnfinishedSales'));
const CustomerIncome = lazy(() => import('./pages/ombor/CustomerIncome'));
const Sklad = lazy(() => import('./pages/ombor/Sklad'));
const AddSupplierReturn = lazy(() => import('./pages/ombor/AddSupplierReturn'));
const InventoryCount = lazy(() => import('./pages/ombor/InventoryCount'));
const InventoryHistory = lazy(() => import('./pages/ombor/InventoryHistory'));

// --- UNDIRUV ---
const AttachedContracts = lazy(() => import('./pages/undiruv/AttachedContracts'));
const AllContracts = lazy(() => import('./pages/undiruv/AllContracts'));
const AllCustomers = lazy(() => import('./pages/undiruv/AllCustomers'));
const WarningLetters = lazy(() => import('./pages/undiruv/WarningLetters'));
const WarningLetterTemplates = lazy(() => import('./pages/undiruv/WarningLetterTemplates'));
const AssignResponsible = lazy(() => import('./pages/undiruv/AssignResponsible'));
const AssignMFY = lazy(() => import('./pages/undiruv/AssignMFY'));
const AssignWorkplace = lazy(() => import('./pages/undiruv/AssignWorkplace'));
const CommentTypes = lazy(() => import('./pages/undiruv/CommentTypes'));

// --- SHARTNOMA ---
const ContractList = lazy(() => import('./pages/shartnoma/ContractList'));
const OrderList = lazy(() => import('./pages/shartnoma/OrderList'));
const Discounts = lazy(() => import('./pages/shartnoma/Discounts'));
const Returns = lazy(() => import('./pages/shartnoma/Returns'));
const ClosedContracts = lazy(() => import('./pages/shartnoma/ClosedContracts'));
const AddContract = lazy(() => import('./pages/shartnoma/AddContract'));

// --- NAQD SAVDO ---
const CashSales = lazy(() => import('./pages/sales/CashSales'));
const AddCashSale = lazy(() => import('./pages/sales/AddCashSale'));
const SalesReturns = lazy(() => import('./pages/sales/Returns'));
const SalesDiscounts = lazy(() => import('./pages/sales/Discounts'));

// --- KASSA ---
const Finance = lazy(() => import('./pages/Finance'));
const MyCash = lazy(() => import('./pages/kassa/MyCash'));
const CurrencyExchange = lazy(() => import('./pages/kassa/CurrencyExchange'));
const ContractPayment = lazy(() => import('./pages/kassa/ContractPayment'));
const Prepayment = lazy(() => import('./pages/kassa/Prepayment'));
const CashSalesPayment = lazy(() => import('./pages/kassa/CashSalesPayment'));
const IncomeFromOtherCash = lazy(() => import('./pages/kassa/IncomeFromOtherCash'));
const ExpenseToOtherCash = lazy(() => import('./pages/kassa/ExpenseToOtherCash'));
const IncomeFromExpense = lazy(() => import('./pages/kassa/IncomeFromExpense'));
const ExpenseOutput = lazy(() => import('./pages/kassa/ExpenseOutput'));
const AllCashOperations = lazy(() => import('./pages/kassa/AllCashOperations'));
const CashOrders = lazy(() => import('./pages/kassa/CashOrders'));
const ManageCash = lazy(() => import('./pages/kassa/ManageCash'));
const CashBalance = lazy(() => import('./pages/kassa/CashBalance'));
const AllReceipts = lazy(() => import('./pages/kassa/AllReceipts'));
const OrderListKassa = lazy(() => import('./pages/kassa/OrderListKassa'));

// --- SMS YUBORISH ---
const SmsSend = lazy(() => import('./pages/sms/SmsSend'));

// --- SETTINGS ---
const StaffList = lazy(() => import('./pages/settings/StaffList'));
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const CategorySettings = lazy(() => import('./pages/settings/CategorySettings'));
const ExpenseCategorySettings = lazy(() => import('./pages/settings/ExpenseCategorySettings'));

const ComingSoon = lazy(() => import('./pages/System/ComingSoon'));

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <header className="h-16 shrink-0 flex items-center justify-end px-4 md:px-6 bg-slate-50/95 backdrop-blur border-b border-slate-200">
          <button
            onClick={() => setIsCalcOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-700 px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-sm font-normal transition-colors shadow-sm"
          >
            <CalcIcon size={18} />
            Kalkulyator
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
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
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />

                {/* AVTO */}
                <Route path="/avto/shartnomalar" element={<ComingSoon />} />
                <Route path="/avto" element={<ComingSoon />} />

                {/* NAQDSIZ */}
                <Route path="/naqdsiz/tushumlar" element={<ComingSoon />} />
                <Route path="/naqdsiz" element={<ComingSoon />} />

                {/* HISOBOTLAR */}
                <Route path="/hisobotlar/royxat" element={<ReportsList />} />
                <Route path="/hisobotlar" element={<ComingSoon />} />

                {/* XARAJATLAR */}
                <Route path="/xarajatlar/kassa" element={<ComingSoon />} />

                {/* YORLIQ */}
                <Route path="/yorliq/ozgargan" element={<ComingSoon />} />
                <Route path="/yorliq/chop-etish" element={<PrintPriceTag />} />
                <Route path="/yorliq/shablonlar" element={<ComingSoon />} />

                {/* NARXLAR */}
                <Route path="/narxlar/ozgargan" element={<ComingSoon />} />
                <Route path="/narxlar/ozgargan-narxlar" element={<ComingSoon />} />
                <Route path="/narxlar/kirim" element={<ComingSoon />} />
                <Route path="/narxlar/kirim-narxi-ozgarishlari" element={<ComingSoon />} />
                <Route path="/narxlar/umumiy" element={<ComingSoon />} />
                <Route path="/narxlar/umumiy-ustama" element={<ComingSoon />} />
                <Route path="/narxlar/umumiy-ustama-belgilash" element={<ComingSoon />} />
                <Route path="/narxlar/kategoriya" element={<ComingSoon />} />
                <Route path="/narxlar/kategoriya-ustama" element={<ComingSoon />} />
                <Route path="/narxlar/kategoriya-uchun-ustama" element={<ComingSoon />} />
                <Route path="/narxlar/tovar" element={<ComingSoon />} />
                <Route path="/narxlar/tovar-ustama" element={<ComingSoon />} />
                <Route path="/narxlar/tovarlar-uchun-ustama" element={<ComingSoon />} />

                {/* HISOB RAQAM */}
                <Route path="/hisobraqam/bonus" element={<ComingSoon />} />
                <Route path="/hisobraqam/tolov" element={<ComingSoon />} />
                <Route path="/hisobraqam/tovar" element={<ComingSoon />} />
                <Route path="/hisobraqam/tarix" element={<ComingSoon />} />
                <Route path="/hisobraqam/qoldiq" element={<ComingSoon />} />
                <Route path="/hisobraqam/amaliyot" element={<ComingSoon />} />
                <Route path="/hisobraqam/qaytarish" element={<ComingSoon />} />
                <Route path="/hisobraqam/hisob-tarix" element={<ComingSoon />} />

                {/* CHIQIM */}
                <Route path="/chiqim/faktura" element={<ComingSoon />} />
                <Route path="/chiqim/yetkazish" element={<ComingSoon />} />
                <Route path="/chiqim/olib-ketish" element={<ComingSoon />} />

                {/* MIJOZLAR */}
                <Route path="/mijozlar" element={<CustomerList />} />
                <Route path="/mijozlar/qoshish" element={<AddCustomer />} />
                <Route path="/mijozlar/tahrirlash/:id" element={<AddCustomer />} />
                <Route path="/mijozlar/qora" element={<Blacklist />} />
                <Route path="/mijozlar/qora-buyurtma" element={<BlacklistOrders />} />

                {/* HISOB-KITOBLAR */}
                <Route path="/hisob/akt" element={<ComingSoon />} />
                <Route path="/hisob/taminotchi" element={<SupplierAccounts />} />
                <Route path="/hisob/limit" element={<ComingSoon />} />
                <Route
                  path="/hisob/taminotchilar-royxati"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SUPPLIER_MANAGE}>
                      <SupplierList />
                    </PermissionRoute>
                  }
                />

                {/* OMBOR */}
                <Route path="/ombor/amaliyotlar" element={<ComingSoon />} />
                <Route path="/ombor/boshqa-kirim" element={<ComingSoon />} />
                <Route path="/ombor/boshqa-chiqim" element={<ComingSoon />} />
                <Route path="/ombor/taminotchi-kirim" element={<SupplierIncomeList />} />
                <Route path="/ombor/taminotchi-kirim/qoshish" element={<SupplierIncome />} />
                <Route
                  path="/ombor/taminotchi-kirim/tahrirlash/:id"
                  element={
                    <PermissionRoute permission={PERMISSIONS.PRODUCT_MANAGE}>
                      <EditSupplierIncome />
                    </PermissionRoute>
                  }
                />
                <Route path="/naqd-savdo/tahrirlash/:id" element={<AddCashSale />} />
                <Route path="/ombor/taminotchi-qaytarish" element={<ComingSoon />} />
                <Route path="/ombor/yakunlanmagan" element={<ComingSoon />} />
                <Route path="/ombor/mijoz-kirim" element={<ComingSoon />} />
                <Route path="/ombor/qoldiq" element={<Sklad />} />
                <Route
                  path="/ombor/taminotchi-qaytarish/qoshish"
                  element={
                    <PermissionRoute permission={PERMISSIONS.PRODUCT_MANAGE}>
                      <AddSupplierReturn />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/ombor/taminotchilar"
                  element={
                    <PermissionRoute permission={PERMISSIONS.SUPPLIER_MANAGE}>
                      <SupplierList />
                    </PermissionRoute>
                  }
                />
                <Route path="/ombor/sanoq" element={<InventoryCount />} />
                <Route path="/ombor/sanoq-tarixi" element={<InventoryHistory />} />

                {/* UNDIRUV */}
                <Route path="/undiruv" element={<ComingSoon />} />
                <Route path="/undiruv/barcha" element={<ComingSoon />} />
                <Route path="/undiruv/mijozlar" element={<ComingSoon />} />
                <Route path="/undiruv/xat" element={<ComingSoon />} />
                <Route path="/undiruv/xat-shablon" element={<ComingSoon />} />
                <Route path="/undiruv/biriktirish" element={<ComingSoon />} />
                <Route path="/undiruv/mfy" element={<ComingSoon />} />
                <Route path="/undiruv/ish-joyi" element={<ComingSoon />} />
                <Route path="/undiruv/izoh" element={<ComingSoon />} />

                {/* SHARTNOMA */}
                <Route path="/shartnoma" element={<ContractList />} />
                <Route path="/shartnoma/buyurtmalar" element={<ComingSoon />} />
                <Route path="/shartnoma/chegirmalar" element={<Discounts />} />
                <Route path="/shartnoma/qaytarish" element={<ComingSoon />} />
                <Route path="/shartnoma/yopilgan" element={<ComingSoon />} />
                <Route path="/shartnoma/qoshish" element={<AddContract />} />
                <Route path="/shartnoma/tahrirlash/:id" element={<AddContract />} />

                {/* NAQD SAVDO */}
                <Route path="/savdo" element={<CashSales />} />
                <Route path="/naqd-savdo/qoshish" element={<AddCashSale />} />
                <Route path="/savdo/qaytarish" element={<ComingSoon />} />
                <Route path="/savdo/chegirmalar" element={<ComingSoon />} />

                {/* KASSA */}
                <Route path="/kassa" element={<Finance />} />
                <Route path="/kassa/shartnoma-tolov" element={<ContractPayment />} />
                <Route path="/kassa/oldindan-tolov" element={<ComingSoon />} />
                <Route path="/kassa/naqd-tolov" element={<CashSalesPayment />} />
                <Route path="/kassa/boshqa-kirim" element={<ComingSoon />} />
                <Route path="/kassa/boshqa-chiqim" element={<ComingSoon />} />
                <Route path="/kassa/xarajat-kirim" element={<ComingSoon />} />
                <Route path="/kassa/xarajat-chiqim" element={<ExpenseOutput />} />
                <Route path="/kassa/amaliyotlar" element={<AllCashOperations />} />
                <Route path="/kassa/buyurtmalar" element={<ComingSoon />} />
                <Route
                  path="/kassa/boshqarish"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CASHBOX_MANAGE}>
                      <ManageCash />
                    </PermissionRoute>
                  }
                />
                <Route path="/kassa/qoldiq" element={<CashBalance />} />
                <Route path="/kassa/mening-kassam" element={<ComingSoon />} />
                <Route path="/kassa/tushumlar" element={<ComingSoon />} />
                <Route path="/kassa/buyurtmalar-royxati" element={<ComingSoon />} />
                <Route path="/kassa/valyuta" element={<ComingSoon />} />

                {/* SOZLAMALAR */}
                <Route path="/sozlamalar/xodimlar" element={<StaffList />} />
                <Route path="/xarajatlar" element={<ComingSoon />} />
                <Route path="/sozlamalar/profil" element={<ProfileSettings />} />
                <Route path="/sms/mijozlar" element={<ComingSoon />} />
                <Route
                  path="/sozlamalar/kategoriyalar"
                  element={
                    <PermissionRoute permission={PERMISSIONS.CATEGORY_MANAGE}>
                      <CategorySettings />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="/sozlamalar/xarajat-moddalari"
                  element={
                    <PermissionRoute permission={PERMISSIONS.EXPENSE_CATEGORY_MANAGE}>
                      <ExpenseCategorySettings />
                    </PermissionRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;