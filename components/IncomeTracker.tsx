import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Wallet, ArrowUpRight, CalendarDays } from 'lucide-react';
import { FinanceData, IncomeItem, FrequencyType } from '../types';
import { CATEGORIES, DAY_OF_MONTH_OPTIONS } from '../constants';
import { addIncome, deleteIncome } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

interface IncomeTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const AMOUNT_LABELS: Record<FrequencyType, string> = {
  'Monthly': 'Monthly Amount',
  'Weekly': 'Weekly Amount',
  'Bi-Weekly': 'Bi-Weekly Amount',
  'Yearly': 'Yearly Amount',
  'One-time': 'Amount',
};

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ data, setData, currency }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const [newItem, setNewItem] = useState({
    source: '',
    amount: '',
    category: CATEGORIES.INCOME[0],
    customCategory: '',
    frequency: 'Monthly' as FrequencyType,
    currency: currency as string,
    dayOfMonth: null as number | null,
  });

  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    data.income.forEach(item => {
      const cur = item.currency || currency;
      totals[cur] = (totals[cur] || 0) + item.amount;
    });
    return totals;
  }, [data.income, currency]);

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = async () => {
    if (!newItem.source || !newItem.amount) return;
    
    const finalCategory = isCustomCategory ? newItem.customCategory : newItem.category;
    const itemData = {
      source: newItem.source,
      amount: cleanNumber(newItem.amount),
      category: finalCategory,
      frequency: newItem.frequency,
      currency: newItem.currency,
      dayOfMonth: newItem.frequency === 'Monthly' ? newItem.dayOfMonth : null,
    };

    try {
      const item = await addIncome(itemData);
      setData(prev => ({ ...prev, income: [...prev.income, item] }));
      setShowAdd(false);
      setIsCustomCategory(false);
      setNewItem({ 
        source: '', 
        amount: '', 
        category: CATEGORIES.INCOME[0], 
        customCategory: '',
        frequency: 'Monthly',
        currency: currency,
        dayOfMonth: null,
      });
    } catch (error) {
      console.error('Failed to add income:', error);
    }
  };

  const removeIncome = async (id: string) => {
    try {
      await deleteIncome(id);
      setData(prev => ({ ...prev, income: prev.income.filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const ordinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Income Sources</h2>
          <p className="text-slate-500 text-sm">Managing your cash flow sources</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Income</span>
        </button>
      </div>

      {Object.keys(currencyTotals).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(currencyTotals).map(([cur, total]) => (
            <div key={cur} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cur} Total</span>
              <p className="text-xl font-black text-slate-900 tracking-tight">
                {formatCurrency(total as number, cur as CurrencyCode)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">New Income Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Name</label>
              <input 
                type="text" 
                value={newItem.source}
                onChange={e => setNewItem({...newItem, source: e.target.value})}
                placeholder="e.g. Primary Salary" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{AMOUNT_LABELS[newItem.frequency]}</label>
              <input 
                type="text" 
                value={newItem.amount}
                onChange={e => setNewItem({...newItem, amount: e.target.value})}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={isCustomCategory ? "custom" : newItem.category}
                onChange={e => {
                  if (e.target.value === "custom") setIsCustomCategory(true);
                  else { setIsCustomCategory(false); setNewItem({...newItem, category: e.target.value}); }
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              >
                {CATEGORIES.INCOME.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="custom">+ New Category...</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
              <select 
                value={newItem.frequency}
                onChange={e => setNewItem({...newItem, frequency: e.target.value as FrequencyType})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Yearly">Yearly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select 
                value={newItem.currency}
                onChange={e => setNewItem({...newItem, currency: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              >
                {Object.entries(CURRENCIES).map(([code, config]) => (
                  <option key={code} value={code}>{config.symbol} {code}</option>
                ))}
              </select>
            </div>
            {newItem.frequency === 'Monthly' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day of Month</label>
                <select 
                  value={newItem.dayOfMonth ?? ''}
                  onChange={e => setNewItem({...newItem, dayOfMonth: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
                >
                  <option value="">Not set</option>
                  {DAY_OF_MONTH_OPTIONS.map(day => (
                    <option key={day} value={day}>{ordinalSuffix(day)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Save Source</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.income.map(item => {
          const itemCurrency = (item.currency || currency) as CurrencyCode;
          return (
            <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-full bg-[#5CC8BE]/10 flex items-center justify-center text-[#5CC8BE]">
                  <Wallet className="w-7 h-7" />
                </div>
                <button 
                  onClick={() => removeIncome(item.id)}
                  className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xl tracking-tight">{item.source}</h4>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.frequency}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{itemCurrency}</span>
                  {item.dayOfMonth && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {ordinalSuffix(item.dayOfMonth)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {item.frequency === 'One-time' ? 'Amount' : `${item.frequency} Flow`}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(item.amount, itemCurrency)}
                  </h3>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncomeTracker;
