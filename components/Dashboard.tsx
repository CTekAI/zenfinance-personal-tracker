import React, { useMemo, useState } from 'react';
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
  const [spendingCurTab, setSpendingCurTab] = useState<string>('');
  const [trendCurTab, setTrendCurTab] = useState<string>('');

  const currencyGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const a of accounts) {
      groups[a.currency] = (groups[a.currency] || 0) + a.balance;
    }
    return groups;
  }, [accounts]);

  const incomingByCurrency = useMemo(() => {
    const g: Record<string, number> = {};
    for (const item of data.income)
      g[item.currency || currency] = (g[item.currency || currency] || 0) + item.amount;
    return g;
  }, [data.income, currency]);

  const expensesByCurrency = useMemo(() => {
    const g: Record<string, number> = {};
    for (const item of data.outgoings)
      g[item.currency || currency] = (g[item.currency || currency] || 0) + item.amount;
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const item of spendingLog) {
      if (item.date.startsWith(thisMonth))
        g[item.currency || currency] = (g[item.currency || currency] || 0) + item.amount;
    }
    return g;
  }, [data.outgoings, spendingLog, currency]);

  const debtByCurrency = useMemo(() => {
    const g: Record<string, number> = {};
    for (const item of data.debt)
      g[item.currency || currency] = (g[item.currency || currency] || 0) + item.minPayment;
    return g;
  }, [data.debt, currency]);

  const savingsByCurrency = useMemo(() => {
    const g: Record<string, number> = {};
    for (const item of data.savings)
      g[item.currency || currency] = (g[item.currency || currency] || 0) + item.balance;
    return g;
  }, [data.savings, currency]);

  const availableByCurrency = useMemo(() => {
    const g: Record<string, number> = {};
    const allCurs = new Set([
      ...Object.keys(incomingByCurrency),
      ...Object.keys(expensesByCurrency),
      ...Object.keys(debtByCurrency),
    ]);
    for (const cur of allCurs)
      g[cur] = (incomingByCurrency[cur] || 0) - (expensesByCurrency[cur] || 0) - (debtByCurrency[cur] || 0);
    return g;
  }, [incomingByCurrency, expensesByCurrency, debtByCurrency]);

  // Scalars for the cash flow banner and pie chart (primary currency only)
  const totalIncoming = incomingByCurrency[currency] || 0;
  const totalExpenses = expensesByCurrency[currency] || 0;
  const availableMoney = availableByCurrency[currency] || 0;
  const isPositiveFlow = availableMoney >= 0;

  const categorySpendingByCurrency = useMemo(() => {
    const byCur: Record<string, Record<string, number>> = {};
    for (const item of data.outgoings) {
      const cur = item.currency || currency;
      if (!byCur[cur]) byCur[cur] = {};
      byCur[cur][item.category] = (byCur[cur][item.category] || 0) + item.amount;
    }
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const item of spendingLog) {
      if (item.date.startsWith(thisMonth)) {
        const cur = item.currency || currency;
        if (!byCur[cur]) byCur[cur] = {};
        byCur[cur][item.category] = (byCur[cur][item.category] || 0) + item.amount;
      }
    }
    const result: Record<string, { name: string; value: number }[]> = {};
    for (const [cur, cats] of Object.entries(byCur)) {
      result[cur] = Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }
    return result;
  }, [data.outgoings, spendingLog, currency]);

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

  const trendDataByCurrency = useMemo(() => {
    const now = new Date();
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const byCur: Record<string, Record<string, { income: number; expenses: number }>> = {};
    const ensureCur = (cur: string) => {
      if (!byCur[cur]) {
        byCur[cur] = {};
        for (const key of monthKeys) byCur[cur][key] = { income: 0, expenses: 0 };
      }
    };
    for (const item of data.income) {
      const cur = item.currency || currency;
      ensureCur(cur);
      if (item.frequency === 'Monthly') {
        for (const key of monthKeys) byCur[cur][key].income += item.amount;
      }
    }
    for (const item of data.outgoings) {
      const cur = item.currency || currency;
      ensureCur(cur);
      if (item.isRecurring || item.frequency === 'Monthly') {
        for (const key of monthKeys) byCur[cur][key].expenses += item.amount;
      } else if (item.date) {
        const mk = item.date.substring(0, 7);
        if (byCur[cur][mk] !== undefined) byCur[cur][mk].expenses += item.amount;
      }
    }
    const result: Record<string, { month: string; income: number; expenses: number }[]> = {};
    for (const [cur, months] of Object.entries(byCur)) {
      result[cur] = monthKeys.map(key => {
        const d = new Date(key + '-01');
        return {
          month: d.toLocaleDateString(undefined, { month: 'short' }),
          income: months[key]?.income || 0,
          expenses: months[key]?.expenses || 0,
        };
      });
    }
    return result;
  }, [data.income, data.outgoings, currency]);

  const fc = (amount: number) => formatCurrency(amount, currency);

  const COLORS = Object.values(CATEGORY_COLORS);

  const spendingCurrencies = Object.keys(categorySpendingByCurrency);
  const activeSCur = (spendingCurrencies.includes(spendingCurTab) ? spendingCurTab : spendingCurrencies[0]) || currency;
  const activeSpending = categorySpendingByCurrency[activeSCur] || [];
  const activeSpendingTotal = activeSpending.reduce((s, c) => s + c.value, 0);

  const trendCurrencies = Object.keys(trendDataByCurrency);
  const activeTCur = (trendCurrencies.includes(trendCurTab) ? trendCurTab : trendCurrencies[0]) || currency;
  const activeTrendData = trendDataByCurrency[activeTCur] || [];

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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Incoming</p>
          <div className="space-y-1">
            {Object.entries(incomingByCurrency).length > 0 ? Object.entries(incomingByCurrency).map(([cur, amt]) => (
              <div key={cur} className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{cur}</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter truncate">{formatCurrency(amt, cur as CurrencyCode)}</span>
              </div>
            )) : <span className="text-xl font-black text-slate-300 tracking-tighter">—</span>}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Out</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Outgoing</p>
          <div className="space-y-1">
            {Object.entries(expensesByCurrency).length > 0 ? Object.entries(expensesByCurrency).map(([cur, amt]) => (
              <div key={cur} className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{cur}</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter truncate">{formatCurrency(amt, cur as CurrencyCode)}</span>
              </div>
            )) : <span className="text-xl font-black text-slate-300 tracking-tighter">—</span>}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Saved</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Savings</p>
          <div className="space-y-1">
            {Object.entries(savingsByCurrency).length > 0 ? Object.entries(savingsByCurrency).map(([cur, amt]) => (
              <div key={cur} className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{cur}</span>
                <span className="text-lg sm:text-xl font-black text-indigo-700 tracking-tighter truncate">{formatCurrency(amt, cur as CurrencyCode)}</span>
              </div>
            )) : <span className="text-xl font-black text-slate-300 tracking-tighter">—</span>}
          </div>
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Available</p>
          <div className="space-y-1">
            {Object.entries(availableByCurrency).length > 0 ? Object.entries(availableByCurrency).map(([cur, amt]) => (
              <div key={cur} className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{cur}</span>
                <span className={`text-lg sm:text-xl font-black tracking-tighter truncate ${amt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {amt < 0 ? '-' : ''}{formatCurrency(Math.abs(amt), cur as CurrencyCode)}
                </span>
              </div>
            )) : <span className="text-xl font-black text-slate-300 tracking-tighter">—</span>}
          </div>
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
              {fc(totalIncoming)} in — {fc(totalExpenses)} out this month
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-black text-sm ${isPositiveFlow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {isPositiveFlow ? '+' : '-'}{fc(Math.abs(availableMoney))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Spending Breakdown</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {spendingCurrencies.length > 1 && (
                <div className="flex gap-1">
                  {spendingCurrencies.map(cur => (
                    <button key={cur} onClick={() => setSpendingCurTab(cur)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${activeSCur === cur ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-100'}`}>
                      {cur}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">This Month</span>
            </div>
          </div>

          {activeSpending.length > 0 ? (
            <>
              <div className="h-[200px] sm:h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeSpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {activeSpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 600 }}
                      formatter={(value: number) => formatCurrency(value, activeSCur as CurrencyCode)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
                  <p className="text-sm sm:text-base font-black text-slate-900 tracking-tighter text-center leading-tight">{formatCurrency(activeSpendingTotal, activeSCur as CurrencyCode)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {activeSpending.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50/50 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || COLORS[i % COLORS.length] }}>
                      {getCategoryIcon(cat.name)}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5 truncate">{cat.name}</p>
                      <p className="font-bold text-slate-900 text-xs truncate">{formatCurrency(cat.value, activeSCur as CurrencyCode)}</p>
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {trendCurrencies.length > 1 && (
              <div className="flex gap-1">
                {trendCurrencies.map(cur => (
                  <button key={cur} onClick={() => setTrendCurTab(cur)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${activeTCur === cur ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-100'}`}>
                    {cur}
                  </button>
                ))}
              </div>
            )}
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Last 6 Months</span>
          </div>
        </div>
        {activeTrendData.some(d => d.income > 0 || d.expenses > 0) ? (
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, activeTCur as CurrencyCode)} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 600 }}
                  formatter={(value: number, name: string) => [formatCurrency(value, activeTCur as CurrencyCode), name === 'income' ? 'Income' : 'Expenses']}
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
