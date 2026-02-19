
import React, { useState } from 'react';
import { Plus, Trash2, Wallet, ArrowUpRight, PlusCircle } from 'lucide-react';
import { FinanceData, IncomeItem, FrequencyType } from '../types';
import { CATEGORIES } from '../constants';

interface IncomeTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ data, setData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const [newItem, setNewItem] = useState({
    source: '',
    amount: '',
    category: CATEGORIES.INCOME[0],
    customCategory: '',
    frequency: 'Monthly' as FrequencyType
  });

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = () => {
    if (!newItem.source || !newItem.amount) return;
    
    const finalCategory = isCustomCategory ? newItem.customCategory : newItem.category;
    const item: IncomeItem = {
      id: Math.random().toString(36).substr(2, 9),
      source: newItem.source,
      amount: cleanNumber(newItem.amount),
      category: finalCategory,
      frequency: newItem.frequency
    };

    setData(prev => ({ ...prev, income: [...prev.income, item] }));
    setShowAdd(false);
    setIsCustomCategory(false);
    setNewItem({ 
      source: '', 
      amount: '', 
      category: CATEGORIES.INCOME[0], 
      customCategory: '',
      frequency: 'Monthly' 
    });
  };

  const removeIncome = (id: string) => {
    setData(prev => ({ ...prev, income: prev.income.filter(i => i.id !== id) }));
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Amount</label>
              <input 
                type="text" 
                value={newItem.amount}
                onChange={e => setNewItem({...newItem, amount: e.target.value})}
                placeholder="$0.00"
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
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Save Source</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.income.map(item => (
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
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.frequency}</span>
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Flow</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  ${item.amount.toLocaleString()}
                </h3>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeTracker;
