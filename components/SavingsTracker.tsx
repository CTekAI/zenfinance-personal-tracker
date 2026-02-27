import React, { useState } from 'react';
import { Plus, Trash2, PiggyBank, ArrowUpCircle, TrendingUp, Info } from 'lucide-react';
import { FinanceData } from '../types';
import { addSavings, updateSavings, deleteSavings, deductFromAccount } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

interface SavingsTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const SavingsTracker: React.FC<SavingsTrackerProps> = ({ data, setData, currency }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<Record<string, string>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  
  const [newItem, setNewItem] = useState({
    name: '',
    balance: '',
    currency: currency as string
  });

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.balance) return;
    const item = {
      name: newItem.name,
      balance: cleanNumber(newItem.balance),
      currency: newItem.currency,
      category: 'Savings'
    };

    try {
      const savedItem = await addSavings(item);
      setData(prev => ({ ...prev, savings: [...prev.savings, savedItem] }));
      setShowAdd(false);
      setNewItem({ name: '', balance: '', currency: currency });
    } catch (error) {
      console.error('Failed to add savings item:', error);
    }
  };

  const allAccounts = data.accounts || [];

  const handleDeposit = async (id: string) => {
    const amountStr = pendingDeposits[id];
    if (!amountStr) return;
    const amount = cleanNumber(amountStr);
    if (amount <= 0) return;

    const existingItem = data.savings.find(s => s.id === id);
    if (!existingItem) return;

    const newBalance = existingItem.balance + amount;
    const accountId = selectedAccounts[id];
    try {
      await updateSavings(id, { ...existingItem, balance: newBalance });

      if (accountId) {
        const updatedAccount = await deductFromAccount(accountId, amount);
        setData(prev => ({
          ...prev,
          savings: prev.savings.map(s => s.id === id ? { ...s, balance: newBalance } : s),
          accounts: prev.accounts.map(a => a.id === accountId ? { ...a, balance: updatedAccount.balance } : a)
        }));
      } else {
        setData(prev => ({
          ...prev,
          savings: prev.savings.map(s => s.id === id ? { ...s, balance: newBalance } : s)
        }));
      }
      setPendingDeposits(prev => ({ ...prev, [id]: '' }));
      setSelectedAccounts(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Failed to update savings balance:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavings(id);
      setData(prev => ({ ...prev, savings: prev.savings.filter(s => s.id !== id) }));
    } catch (error) {
      console.error('Failed to delete savings item:', error);
    }
  };

  const currencyTotals: Record<string, number> = {};
  data.savings.forEach(s => {
    const cur = s.currency || 'USD';
    currencyTotals[cur] = (currencyTotals[cur] || 0) + s.balance;
  });

  const currencyKeys = Object.keys(currencyTotals) as CurrencyCode[];

  const groupedByCurrency: Record<string, typeof data.savings> = {};
  data.savings.forEach(s => {
    const cur = s.currency || 'USD';
    if (!groupedByCurrency[cur]) groupedByCurrency[cur] = [];
    groupedByCurrency[cur].push(s);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Savings Pots</h2>
          <p className="text-slate-500 text-sm">Simple per-currency savings</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-[#5CC8BE] hover:bg-[#4BB5AA] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Savings Pot</span>
        </button>
      </div>

      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Totals by Currency</p>
          {currencyKeys.length === 0 ? (
            <h2 className="text-4xl font-black tracking-tighter text-slate-500">No savings yet</h2>
          ) : (
            <div className="flex flex-wrap items-baseline gap-4">
              {currencyKeys.map((cur, i) => (
                <React.Fragment key={cur}>
                  {i > 0 && <span className="text-slate-600 text-2xl font-light">|</span>}
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                    {formatCurrency(currencyTotals[cur], cur as CurrencyCode)}
                  </h2>
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit mt-6">
            <TrendingUp className="w-4 h-4 text-[#5CC8BE]" />
            <span className="text-sm font-semibold">Financial freedom goal in progress</span>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#5CC8BE]/10 rounded-full blur-3xl"></div>
        <PiggyBank className="absolute -right-4 -bottom-4 w-48 h-48 text-white/5 rotate-12" />
      </div>

      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-600 font-medium">For specific savings goals, use <span className="font-bold">Wishlist</span></p>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">New Savings Pot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pot Name</label>
              <input 
                type="text" 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="e.g. Rainy Day Fund" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starting Balance</label>
              <input 
                type="text" 
                value={newItem.balance}
                onChange={e => setNewItem({...newItem, balance: e.target.value})}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select 
                value={newItem.currency}
                onChange={e => setNewItem({...newItem, currency: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-semibold"
              >
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map(code => (
                  <option key={code} value={code}>{CURRENCIES[code].symbol} {code}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-[#5CC8BE] text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Create Pot</button>
          </div>
        </div>
      )}

      {Object.keys(groupedByCurrency).map(cur => {
        const curCode = cur as CurrencyCode;
        const items = groupedByCurrency[cur];
        return (
          <div key={cur} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{cur} Savings</h3>
              <span className="text-sm font-bold text-slate-400">
                {formatCurrency(currencyTotals[cur], curCode)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map(item => {
                const itemCur = (item.currency || 'USD') as CurrencyCode;
                const sym = (CURRENCIES[itemCur] || CURRENCIES['USD']).symbol;
                return (
                  <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                          <PiggyBank className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{item.name}</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{itemCur}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mb-8">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(item.balance, itemCur)}
                      </h3>
                    </div>

                    {allAccounts.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={selectedAccounts[item.id] || ''}
                          onChange={(e) => setSelectedAccounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="">No account deduction</option>
                          {allAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({formatCurrency(acc.balance, acc.currency as CurrencyCode)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xs">{sym}</span>
                        <input 
                          type="text"
                          value={pendingDeposits[item.id] || ''}
                          onChange={(e) => setPendingDeposits(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleDeposit(item.id)}
                          placeholder="Add amount"
                          className="w-full pl-7 pr-3 py-3 bg-transparent text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-300"
                        />
                      </div>
                      <button 
                        onClick={() => handleDeposit(item.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-2"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SavingsTracker;
