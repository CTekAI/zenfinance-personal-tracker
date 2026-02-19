
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  TrendingDown, 
  Heart, 
  Sparkles,
  Menu,
  X,
  PiggyBank,
  Bell
} from 'lucide-react';
import { FinanceData, TabType } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import IncomeTracker from './components/IncomeTracker';
import OutgoingsTracker from './components/OutgoingsTracker';
import DebtTracker from './components/DebtTracker';
import SavingsTracker from './components/SavingsTracker';
import WishlistTracker from './components/WishlistTracker';
import AIAdvisor from './components/AIAdvisor';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [data, setData] = useState<FinanceData>(() => {
    const saved = localStorage.getItem('zenfinance_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('zenfinance_data', JSON.stringify(data));
  }, [data]);

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Income', icon: Wallet, label: 'Income' },
    { id: 'Outgoings', icon: TrendingDown, label: 'Expenses' },
    { id: 'Savings', icon: PiggyBank, label: 'Savings' },
    { id: 'Debt', icon: CreditCard, label: 'Debt' },
    { id: 'Wishlist', icon: Heart, label: 'Wishlist' },
    { id: 'AI Advisor', icon: Sparkles, label: 'ZenAI' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Dashboard': return <Dashboard data={data} />;
      case 'Income': return <IncomeTracker data={data} setData={setData} />;
      case 'Outgoings': return <OutgoingsTracker data={data} setData={setData} />;
      case 'Savings': return <SavingsTracker data={data} setData={setData} />;
      case 'Debt': return <DebtTracker data={data} setData={setData} />;
      case 'Wishlist': return <WishlistTracker data={data} setData={setData} />;
      case 'AI Advisor': return <AIAdvisor data={data} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">ZenFinance</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300
                  ${activeTab === item.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : ''}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Health Score</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-slate-900 tracking-tighter">84</span>
              <span className="text-[10px] text-emerald-500 font-bold pb-1">+6.3%</span>
            </div>
            <div className="mt-4 w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100">
              <div className="bg-slate-900 h-full w-[84%] rounded-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-transparent px-8 pt-8 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-3 bg-white border border-slate-100 rounded-2xl shadow-sm"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{activeTab}</h2>
          </div>
          <div className="flex items-center space-x-4">
             <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-colors">
               <Bell className="w-5 h-5" />
             </button>
             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1 overflow-hidden">
                <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-xs">
                  JD
                </div>
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-10">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
