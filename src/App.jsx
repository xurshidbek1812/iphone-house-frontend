import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Calculator as CalcIcon } from 'lucide-react'; 
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Calculator from './components/Calculator';
import { Toaster } from 'react-hot-toast';

// YUKLANAYOTGANDA KO'RINADIGAN ANIMATSIYA
const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// LAZY LOADING (Barcha sahifalar faqat kerak bo'lganda yuklanadi)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

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
const EditSupplierIncome = lazy(() => import('./pages/ombor/EditSupplierIncome'));
const AddSupplierIncome = lazy(() => import('./pages/ombor/AddSupplierIncome')); 
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
const Expenses = lazy(() => import('./pages/Expenses')); 
const StaffList = lazy(() => import('./pages/settings/StaffList')); 
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const CategorySettings = lazy(() => import('./pages/settings/CategorySettings'));

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
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
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
          
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
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
      {/* YANGI: Butun Routes qismini bitta asosiy Suspense ga o'raymiz 
          shunda sahifalar almashganda qotib qolmaydi.
      */}
      <Suspense fallback={<LoadingSpinner />}>
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
                  <Route path="/mijozlar/qora" element={<Blacklist />} />
                  <Route path="/mijozlar/qora-buyurtma" element={<BlacklistOrders />} />

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
                  
                  {/* --- SANOQ --- */}
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
                  <Route path="/naqd-savdo/qoshish" element={<AddCashSale />} />
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
                  <Route path="/sozlamalar/xodimlar" element={<StaffList />} />
                  <Route path="/xarajatlar" element={<Expenses />} />
                  <Route path="/sozlamalar/profil" element={<ProfileSettings />} />
                  <Route path="/sozlamalar/kategoriyalar" element={<CategorySettings />} />
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
