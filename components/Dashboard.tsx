import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { FinanceData } from '../types';
import { 
  Wallet, TrendingDown, TrendingUp, Landmark, PiggyBank, ArrowUpRight, ArrowDownRight,
  Calendar, CreditCard, Home, UtensilsCrossed, Car, Zap, Film, ShoppingBag, HeartPulse, MoreHorizontal,
  Banknote, Coins
} from 'lucide-react';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  data: FinanceData;
  currency: CurrencyCode;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    Housing: <Home className="w-4 h-4" />,
    Food: <UtensilsCrossed className="w-4 h-4" />,
    Transport: <Car className="w-4 h-4" />,
    Utilities: <Zap className="w-4 h-4" />,
    Entertainment: <Film className="w-4 h-4" />,
    Shopping: <ShoppingBag className="w-4 h-4" />,
    Health: <HeartPulse className="w-4 h-4" />,
  };
  return icons[category] || <MoreHorizontal className="w-4 h-4" />;
};

const Dashboard: React.FC<DashboardProps> = ({ data, currency }) => {
  const accounts = data.accounts || [];
  const spendingLog = data.spendingLog || [];

  const currencyGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const a of accounts) {
      groups[a.currency] = (groups[a.currency] || 0) + a.balance;
    }
    return groups;
  }, [accounts]);

  const totalIncoming = useMemo(() => {
    return data.income.reduce((sum, item) => sum + item.amount, 0);
  }, [data.income]);

  const totalExpenses = useMemo(() => {
    return data.outgoings.reduce((sum, item) => sum + item.amount, 0);
  }, [data.outgoings]);

  const totalDebtPayments = useMemo(() => {
    return data.debt.reduce((sum, item) => sum + item.minPayment, 0);
  }, [data.debt]);

  const totalSavingsBalance = useMemo(() => {
    return data.savings.reduce((sum, item) => sum + item.balance, 0);
  }, [data.savings]);

  const totalSpending = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return spendingLog
      .filter(s => s.date.startsWith(thisMonth))
      .reduce((sum, s) => sum + s.amount, 0);
  }, [spendingLog]);

  const availableMoney = totalIncoming - totalExpenses - totalDebtPayments;
  const isPositiveFlow = totalIncoming >= totalExpenses + totalDebtPayments;

  const categorySpending = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const item of data.outgoings) {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
    }
    for (const item of spendingLog) {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (item.date.startsWith(thisMonth)) {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
      }
    }
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.outgoings, spendingLog]);

  const upcomingExpenses = useMemo(() => {
    const today = new Date().getDate();
    return data.outgoings
      .filter(o => o.isRecurring && o.dayOfMonth)
      .map(o => {
        let daysUntil = (o.dayOfMonth! - today);
        if (daysUntil < 0) daysUntil += 30;
        return { ...o, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 6);
  }, [data.outgoings]);

  const trendData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      months[key] = { income: 0, expenses: 0 };
    }
    for (const item of data.income) {
      if (item.frequency === 'Monthly') {
        for (const key of Object.keys(months)) {
          months[key].income += item.amount;
        }
      }
    }
    for (const item of data.outgoings) {
      if (item.isRecurring || item.frequency === 'Monthly') {
        for (const key of Object.keys(months)) {
          months[key].expenses += item.amount;
        }
      } else if (item.date) {
        const monthKey = item.date.substring(0, 7);
        if (months[monthKey]) {
          months[monthKey].expenses += item.amount;
        }
      }
    }
    return Object.entries(months).map(([key, val]) => {
      const d = new Date(key + '-01');
      return {
        month: d.toLocaleDateString(undefined, { month: 'short' }),
        income: val.income,
        expenses: val.expenses,
      };
    });
  }, [data.income, data.outgoings]);

  const fc = (amount: number) => formatCurrency(amount, currency);

  const COLORS = Object.values(CATEGORY_COLORS);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">In</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incoming</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">{fc(totalIncoming)}</h3>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Out</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outgoing</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">{fc(totalExpenses + totalSpending)}</h3>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Saved</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savings</p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">{fc(totalSavingsBalance)}</h3>
        </div>

        <div className={`p-4 sm:p-6 rounded-[2rem] border shadow-sm ${isPositiveFlow ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositiveFlow ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              <Coins className={`w-5 h-5 ${isPositiveFlow ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isPositiveFlow ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositiveFlow ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available</p>
          <h3 className={`text-xl sm:text-2xl font-black tracking-tighter ${isPositiveFlow ? 'text-emerald-700' : 'text-rose-700'}`}>
            {fc(Math.abs(availableMoney))}
          </h3>
        </div>
      </div>

      {Object.keys(currencyGroups).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(currencyGroups).map(([cur, balance]) => (
            <div key={cur} className="bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <span className="text-white text-xs font-black">{CURRENCIES[cur as CurrencyCode]?.symbol || cur}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cur}</p>
                <p className="text-base sm:text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(balance, cur as CurrencyCode)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`p-4 sm:p-6 rounded-[2rem] border ${isPositiveFlow ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-4">
          {isPositiveFlow ? (
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          ) : (
            <TrendingDown className="w-8 h-8 text-rose-500" />
          )}
          <div>
            <p className="font-black text-slate-900 tracking-tight">
              {isPositiveFlow ? 'More coming in than going out' : 'Spending exceeds income'}
            </p>
            <p className="text-sm text-slate-500">
              {fc(totalIncoming)} in — {fc(totalExpenses + totalSpending)} out this month
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-black text-sm ${isPositiveFlow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {isPositiveFlow ? '+' : '-'}{fc(Math.abs(totalIncoming - totalExpenses - totalSpending))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Spending Breakdown</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">This Month</span>
          </div>
          
          {categorySpending.length > 0 ? (
            <>
              <div className="h-[200px] sm:h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 600 }}
                      formatter={(value: number) => fc(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tighter">{fc(totalExpenses + totalSpending)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {categorySpending.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || COLORS[i % COLORS.length] }}>
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">{cat.name}</p>
                      <p className="font-bold text-slate-900 text-sm truncate">{fc(cat.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No spending data yet</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Upcoming Expenses</h3>
            <Calendar className="w-5 h-5 text-slate-300" />
          </div>
          <div className="space-y-4">
            {upcomingExpenses.length > 0 ? (
              upcomingExpenses.map((item) => {
                const color = CATEGORY_COLORS[item.category] || '#94A3B8';
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.daysUntil === 0 ? 'Due today' : item.daysUntil === 1 ? 'Tomorrow' : `In ${item.daysUntil} days`}
                          {' · Day '}{item.dayOfMonth}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm">{formatCurrency(item.amount, (item.currency || currency) as CurrencyCode)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.currency || currency}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium text-sm">No upcoming recurring expenses</p>
                <p className="text-slate-300 text-xs mt-1">Add recurring expenses with day-of-month to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-900 text-xl tracking-tight">Income vs Expenses</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Last 6 Months</span>
        </div>
        {trendData.length > 0 && (trendData.some(d => d.income > 0 || d.expenses > 0)) ? (
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fc(v)} width={60} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 600 }}
                  formatter={(value: number, name: string) => [fc(value), name === 'income' ? 'Income' : 'Expenses']}
                />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="expenses" stroke="#F43F5E" strokeWidth={3} dot={{ r: 5, fill: '#F43F5E' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Banknote className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">Add income and expenses to see trends</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-slate-500">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-xs font-bold text-slate-500">Expenses</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
