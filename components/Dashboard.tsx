import React from 'react';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FinanceData } from '../types';
import { Wallet, TrendingDown, CreditCard, Landmark, PiggyBank, ArrowUpRight, Filter, Plus } from 'lucide-react';
import { formatCurrency, CurrencyCode } from '../client/src/lib/currency';

interface DashboardProps {
  data: FinanceData;
  currency: CurrencyCode;
}

const Dashboard: React.FC<DashboardProps> = ({ data, currency }) => {
  const totalMonthlyIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
  const totalOutgoings = data.outgoings.reduce((sum, item) => sum + item.amount, 0);
  const totalDebt = data.debt.reduce((sum, item) => sum + item.balance, 0);
  const totalSavings = data.savings.reduce((sum, item) => sum + item.balance, 0);
  const accountsInCurrency = (data.accounts || []).filter(a => a.currency === currency);
  const totalAccountBalance = accountsInCurrency.reduce((sum, item) => sum + item.balance, 0);
  const hasAccounts = (data.accounts || []).length > 0;
  const totalCapital = hasAccounts ? totalAccountBalance : (totalMonthlyIncome + totalSavings - totalDebt);

  const categorySpending = data.outgoings.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.name === item.category);
    if (existing) {
      existing.value += item.amount;
    } else {
      acc.push({ name: item.category, value: item.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#FF4B8B', '#FF8F6B', '#5CC8BE', '#8B5CF6', '#FACC15', '#6366F1'];

  const fc = (amount: number) => formatCurrency(amount, currency);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#FF4B6B] via-[#FF5F6D] to-[#FF8C76] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-rose-200/50">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1 uppercase tracking-widest">Total Capital</p>
                <h2 className="text-6xl font-black tracking-tighter">
                  {fc(totalCapital)}
                </h2>
              </div>
              <button className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl backdrop-blur-md transition-all">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center space-x-2 bg-black/10 w-fit px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="text-emerald-300 font-bold text-sm">6.3%</span>
              <span className="text-white/80 text-xs font-medium">Month-over-Month</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-300" />
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-10 bottom-10 flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 text-lg">Asset Allocation</h3>
              <Landmark className="w-5 h-5 text-slate-300" />
            </div>
            
            <div className="flex h-4 w-full rounded-full overflow-hidden mb-8">
              <div className="bg-[#FF4B8B] h-full" style={{ width: '40%' }}></div>
              <div className="bg-[#5CC8BE] h-full" style={{ width: '25%' }}></div>
              <div className="bg-[#8B5CF6] h-full" style={{ width: '20%' }}></div>
              <div className="bg-[#FACC15] h-full" style={{ width: '15%' }}></div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Income', amount: totalMonthlyIncome, color: 'bg-[#FF4B8B]' },
                { label: 'Savings', amount: totalSavings, color: 'bg-[#5CC8BE]' },
                { label: 'Accounts', amount: totalAccountBalance, color: 'bg-[#8B5CF6]' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{fc(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Expenses</h3>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <span className="text-xs font-bold text-slate-500">This Month</span>
            </div>
          </div>
          
          <div className="h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySpending}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={130}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{fc(totalOutgoings)}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Spent</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {categorySpending.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50/50">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{cat.name}</p>
                  <p className="font-bold text-slate-900 truncate">{fc(cat.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Recent Activity</h3>
            <button className="bg-slate-900 p-2.5 rounded-xl text-white hover:scale-105 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6">
            {data.outgoings.slice(-6).reverse().map((item) => (
              <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <div className="w-6 h-6 text-slate-900 font-black text-xs flex items-center justify-center">
                      {item.category.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.date} • {item.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600 text-sm">-{fc(item.amount)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
