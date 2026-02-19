
import React, { useState } from 'react';
import { Plus, Trash2, ShoppingBag, Clock, Calendar, ArrowUpRight, Search, Filter } from 'lucide-react';
import { FinanceData, OutgoingItem, FrequencyType } from '../types';
import { CATEGORIES } from '../constants';

interface OutgoingsTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

const OutgoingsTracker: React.FC<OutgoingsTrackerProps> = ({ data, setData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    description: '',
    amount: '',
    category: CATEGORIES.OUTGOINGS[0],
    date: new Date().toISOString().split('T')[0],
    frequency: 'Monthly' as FrequencyType
  });

  const handleAdd = () => {
    if (!newItem.description || !newItem.amount) return;
    const cleanAmount = parseFloat(newItem.amount.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount)) return;

    const item: OutgoingItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: newItem.description,
      amount: cleanAmount,
      category: newItem.category,
      date: newItem.date,
      frequency: newItem.frequency
    };

    setData(prev => ({ ...prev, outgoings: [...prev.outgoings, item] }));
    setShowAdd(false);
    setNewItem({ description: '', amount: '', category: CATEGORIES.OUTGOINGS[0], date: new Date().toISOString().split('T')[0], frequency: 'Monthly' });
  };

  const removeOutgoing = (id: string) => {
    setData(prev => ({ ...prev, outgoings: prev.outgoings.filter(i => i.id !== id) }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Expenses</h2>
          <p className="text-slate-500 text-sm">Every coin tracked, every goal closer</p>
        </div>
        <div className="flex items-center space-x-3">
           <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-colors">
             <Filter className="w-5 h-5" />
           </button>
           <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center space-x-2 bg-[#FF4B8B] hover:bg-[#FF3A7B] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-rose-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Log Transaction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Merchant / Desc</label>
              <input 
                type="text" 
                value={newItem.description}
                onChange={e => setNewItem({...newItem, description: e.target.value})}
                placeholder="e.g. Apple Inc." 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
              <input 
                type="text" 
                value={newItem.amount}
                onChange={e => setNewItem({...newItem, amount: e.target.value})}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <select 
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
              >
                {CATEGORIES.OUTGOINGS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-[#FF4B8B] text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Add Transaction</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-4">
        <div className="space-y-1">
          {data.outgoings.length > 0 ? (
            data.outgoings.slice().reverse().map((item, idx) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-5 hover:bg-slate-50 rounded-[1.5rem] transition-all group ${idx !== data.outgoings.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                    <div className="w-7 h-7 flex items-center justify-center font-black text-xs">
                      {item.category.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base leading-none mb-1.5 tracking-tight">{item.description}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-lg tracking-tighter">-${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[9px] font-black text-[#FF4B8B] uppercase tracking-widest">{item.frequency}</p>
                  </div>
                  <button 
                    onClick={() => removeOutgoing(item.id)}
                    className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-16 h-16 text-slate-100 mb-4" />
              <h4 className="text-slate-900 font-bold">No transactions yet</h4>
              <p className="text-slate-400 text-sm mt-1">Your expense history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutgoingsTracker;
