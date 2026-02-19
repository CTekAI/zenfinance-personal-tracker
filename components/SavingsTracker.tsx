
import React, { useState } from 'react';
import { Plus, Trash2, PiggyBank, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { FinanceData, SavingsItem } from '../types';
import { CATEGORIES } from '../constants';
import { addSavings, updateSavings, deleteSavings } from '../client/src/lib/api';

interface SavingsTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

const SavingsTracker: React.FC<SavingsTrackerProps> = ({ data, setData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<Record<string, string>>({});
  
  const [newItem, setNewItem] = useState({
    name: '',
    balance: '',
    target: '',
    category: CATEGORIES.SAVINGS[0]
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
      target: newItem.target ? cleanNumber(newItem.target) : undefined,
      category: newItem.category
    };

    try {
      const savedItem = await addSavings(item);
      setData(prev => ({ ...prev, savings: [...prev.savings, savedItem] }));
      setShowAdd(false);
      setNewItem({ name: '', balance: '', target: '', category: CATEGORIES.SAVINGS[0] });
    } catch (error) {
      console.error('Failed to add savings item:', error);
    }
  };

  const handleDeposit = async (id: string) => {
    const amountStr = pendingDeposits[id];
    if (!amountStr) return;
    const amount = cleanNumber(amountStr);
    if (amount <= 0) return;

    const existingItem = data.savings.find(s => s.id === id);
    if (!existingItem) return;

    const newBalance = existingItem.balance + amount;
    try {
      await updateSavings(id, { ...existingItem, balance: newBalance });
      setData(prev => ({
        ...prev,
        savings: prev.savings.map(s => s.id === id ? { ...s, balance: newBalance } : s)
      }));
      setPendingDeposits(prev => ({ ...prev, [id]: '' }));
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

  const totalSavings = data.savings.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Savings & Wealth</h2>
          <p className="text-slate-500 text-sm">Building your future capital</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-[#5CC8BE] hover:bg-[#4BB5AA] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Accumulated</p>
          <h2 className="text-6xl font-black tracking-tighter mb-8">
            ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit">
            <TrendingUp className="w-4 h-4 text-[#5CC8BE]" />
            <span className="text-sm font-semibold">Financial freedom goal in progress</span>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#5CC8BE]/10 rounded-full blur-3xl"></div>
        <PiggyBank className="absolute -right-4 -bottom-4 w-48 h-48 text-white/5 rotate-12" />
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">New Asset Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
              <input 
                type="text" 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="e.g. Rainy Day Fund" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Balance</label>
              <input 
                type="text" 
                value={newItem.balance}
                onChange={e => setNewItem({...newItem, balance: e.target.value})}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#5CC8BE] outline-none transition-all font-semibold"
              >
                {CATEGORIES.SAVINGS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-[#5CC8BE] text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Open Account</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.savings.map(item => {
          const progress = item.target ? (item.balance / item.target) * 100 : 0;
          return (
            <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                    <PiggyBank className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{item.name}</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available Balance</p>
                <div className="flex items-baseline space-x-3">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                    ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </h3>
                  {item.target && <span className="text-sm font-bold text-slate-300">/ ${item.target.toLocaleString()}</span>}
                </div>
                
                {item.target && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                      <div className="bg-gradient-to-r from-[#5CC8BE] to-[#4BB5AA] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                       <span className="text-[10px] font-black text-[#5CC8BE] uppercase tracking-widest">{Math.round(progress)}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xs">$</span>
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
};

export default SavingsTracker;
