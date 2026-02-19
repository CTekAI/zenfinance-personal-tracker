
import React, { useState } from 'react';
import { Plus, Trash2, Heart, PiggyBank, GripVertical, AlarmClock, Calendar, ArrowUpCircle } from 'lucide-react';
import { FinanceData, WishlistItem } from '../types';

interface WishlistTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}

const WishlistTracker: React.FC<WishlistTrackerProps> = ({ data, setData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pendingWishlistDeposits, setPendingWishlistDeposits] = useState<Record<string, string>>({});
  
  const [newItem, setNewItem] = useState({
    item: '',
    cost: '',
    saved: '',
    deadline: ''
  });

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = () => {
    if (!newItem.item) return;
    
    const item: WishlistItem = {
      id: Math.random().toString(36).substr(2, 9),
      item: newItem.item,
      cost: cleanNumber(newItem.cost),
      saved: cleanNumber(newItem.saved),
      priority: 'Medium',
      deadline: newItem.deadline || undefined
    };

    setData(prev => ({ ...prev, wishlist: [item, ...prev.wishlist] }));
    setShowAdd(false);
    setNewItem({ item: '', cost: '', saved: '', deadline: '' });
  };

  const removeWish = (id: string) => {
    setData(prev => ({ ...prev, wishlist: prev.wishlist.filter(i => i.id !== id) }));
  };

  const handleDeposit = (id: string) => {
    const amountStr = pendingWishlistDeposits[id];
    if (!amountStr) return;
    
    const amount = cleanNumber(amountStr);
    if (amount <= 0) return;

    setData(prev => ({
      ...prev,
      wishlist: prev.wishlist.map(w => w.id === id ? { ...w, saved: Math.min(w.cost, w.saved + amount) } : w)
    }));

    setPendingWishlistDeposits(prev => ({ ...prev, [id]: '' }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...data.wishlist];
    const itemToMove = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, itemToMove);
    
    setDraggedIndex(index);
    setData(prev => ({ ...prev, wishlist: newList }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Wishlist</h2>
          <p className="text-slate-500 text-sm">Prioritize your dreams and goals</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-[#EC4899] hover:bg-[#DB2777] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-pink-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">New Financial Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Goal Name</label>
              <input 
                type="text" 
                value={newItem.item}
                onChange={e => setNewItem({...newItem, item: e.target.value})}
                placeholder="What are you saving for?" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#EC4899] outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Cost ($)</label>
              <input 
                type="text" 
                value={newItem.cost}
                onChange={e => setNewItem({...newItem, cost: e.target.value})}
                placeholder="2,000.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#EC4899] outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Savings ($)</label>
              <input 
                type="text" 
                value={newItem.saved}
                onChange={e => setNewItem({...newItem, saved: e.target.value})}
                placeholder="500.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#EC4899] outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
              <input 
                type="date" 
                value={newItem.deadline}
                onChange={e => setNewItem({...newItem, deadline: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#EC4899] outline-none transition-all font-semibold"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button 
              onClick={handleAdd} 
              className="bg-[#EC4899] text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95"
            >
              Add to List
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {data.wishlist.map((item, index) => {
          const progress = item.cost > 0 ? (item.saved / item.cost) * 100 : 0;
          const isMostUrgent = index === 0;
          
          return (
            <div 
              key={item.id} 
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                bg-white p-6 rounded-[2rem] border transition-all duration-300 ease-out
                ${draggedIndex === index ? 'opacity-40 border-pink-300 scale-[0.98]' : 'border-slate-100 hover:border-pink-200 shadow-sm hover:shadow-md'}
                ${isMostUrgent ? 'ring-4 ring-pink-500/5 border-pink-100' : ''}
              `}
            >
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors">
                  <GripVertical className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isMostUrgent ? 'bg-[#EC4899] text-white' : 'bg-pink-50 text-[#EC4899]'
                      }`}>
                        {isMostUrgent ? <AlarmClock className="w-7 h-7" /> : <Heart className="w-7 h-7 fill-current" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 text-lg truncate tracking-tight">{item.item}</h4>
                          {isMostUrgent && (
                            <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                              Top Priority
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rank #{index + 1}</span>
                          {item.deadline && (
                            <span className="text-[10px] text-pink-500 flex items-center font-bold uppercase tracking-wider">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeWish(item.id)}
                      className="text-slate-200 hover:text-rose-500 transition-colors p-2 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex items-baseline space-x-2">
                           <p className="text-3xl font-black text-slate-900 tracking-tighter">
                             ${item.saved.toLocaleString()}
                           </p>
                           <span className="text-sm font-bold text-slate-300">/ ${item.cost.toLocaleString()}</span>
                        </div>
                        <span className="text-xs font-black text-[#EC4899] bg-pink-50 px-2 py-1 rounded-lg">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-mono">$</span>
                        <input 
                          type="text"
                          value={pendingWishlistDeposits[item.id] || ''}
                          onChange={(e) => setPendingWishlistDeposits(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleDeposit(item.id)}
                          placeholder="Amount"
                          className="w-28 pl-6 pr-2 py-2.5 bg-transparent text-sm font-bold font-mono focus:outline-none placeholder:text-slate-300"
                        />
                      </div>
                      <button 
                        onClick={() => handleDeposit(item.id)}
                        className="bg-white hover:bg-pink-50 text-[#EC4899] border border-pink-100 px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {data.wishlist.length === 0 && (
          <div className="py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <PiggyBank className="w-16 h-16 text-slate-100 mb-4" />
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Dream Big</h4>
            <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">Your wishlist is currently empty. Add your first goal to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistTracker;
