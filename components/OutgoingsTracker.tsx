import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ShoppingBag, Filter, X, Home, UtensilsCrossed, Car, Zap, Film, HeartPulse, MoreHorizontal, Calendar } from 'lucide-react';
import { FinanceData, FrequencyType } from '../types';
import { CATEGORIES, CATEGORY_COLORS, DAY_OF_MONTH_OPTIONS } from '../constants';
import { addOutgoing, deleteOutgoing } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

const LUCIDE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Home,
  UtensilsCrossed,
  Car,
  Zap,
  Film,
  ShoppingBag,
  HeartPulse,
  MoreHorizontal,
};

const ICON_MAP: Record<string, string> = {
  Housing: 'Home',
  Food: 'UtensilsCrossed',
  Transport: 'Car',
  Utilities: 'Zap',
  Entertainment: 'Film',
  Shopping: 'ShoppingBag',
  Health: 'HeartPulse',
  Other: 'MoreHorizontal',
};

function getCategoryIcon(category: string): React.FC<{ className?: string }> {
  const iconName = ICON_MAP[category] || 'MoreHorizontal';
  return LUCIDE_ICONS[iconName] || MoreHorizontal;
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#94A3B8';
}

interface OutgoingsTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const OutgoingsTracker: React.FC<OutgoingsTrackerProps> = ({ data, setData, currency }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newItem, setNewItem] = useState({
    description: '',
    amount: '',
    category: CATEGORIES.OUTGOINGS[0],
    date: new Date().toISOString().split('T')[0],
    frequency: 'Monthly' as FrequencyType,
    currency: currency as string,
    isRecurring: true,
    dayOfMonth: null as number | null,
  });

  const handleAdd = async () => {
    if (!newItem.description || !newItem.amount) return;
    const cleanAmount = parseFloat(newItem.amount.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount)) return;

    try {
      const item = await addOutgoing({
        description: newItem.description,
        amount: cleanAmount,
        category: newItem.category,
        date: newItem.date,
        frequency: newItem.isRecurring ? newItem.frequency : 'One-time',
        currency: newItem.currency,
        isRecurring: newItem.isRecurring,
        dayOfMonth: newItem.isRecurring ? newItem.dayOfMonth : null,
      });

      setData(prev => ({ ...prev, outgoings: [...prev.outgoings, item] }));
      setShowAdd(false);
      setNewItem({
        description: '',
        amount: '',
        category: CATEGORIES.OUTGOINGS[0],
        date: new Date().toISOString().split('T')[0],
        frequency: 'Monthly',
        currency: currency,
        isRecurring: true,
        dayOfMonth: null,
      });
    } catch (error) {
      console.error('Failed to add outgoing:', error);
    }
  };

  const removeOutgoing = async (id: string) => {
    try {
      await deleteOutgoing(id);
      setData(prev => ({ ...prev, outgoings: prev.outgoings.filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Failed to delete outgoing:', error);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || dateFrom || dateTo;

  const filteredOutgoings = useMemo(() => {
    return data.outgoings.filter(item => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
        return false;
      }
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });
  }, [data.outgoings, selectedCategories, dateFrom, dateTo]);

  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredOutgoings.forEach(item => {
      const cur = item.currency || currency;
      totals[cur] = (totals[cur] || 0) + item.amount;
    });
    return totals;
  }, [filteredOutgoings, currency]);

  const currencyKeys = Object.keys(CURRENCIES) as CurrencyCode[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Expenses</h2>
          <p className="text-slate-500 text-sm">Every coin tracked, every goal closer</p>
        </div>
        <div className="flex items-center space-x-3">
           <button
             onClick={() => setShowFilters(!showFilters)}
             className={`p-3 bg-white border rounded-2xl shadow-sm transition-colors ${hasActiveFilters ? 'border-[#FF4B8B] text-[#FF4B8B]' : 'border-slate-100 text-slate-400 hover:text-slate-900'}`}
           >
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

      {Object.keys(currencyTotals).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {(Object.entries(currencyTotals) as [string, number][]).map(([cur, total]) => (
            <div key={cur} className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cur} Total</p>
              <p className="text-xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(total, cur as CurrencyCode)}
              </p>
            </div>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filters</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-bold text-[#FF4B8B] hover:text-[#FF3A7B] transition-colors">
                  Clear All
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.OUTGOINGS.map(cat => {
                  const isSelected = selectedCategories.includes(cat);
                  const color = getCategoryColor(cat);
                  const Icon = getCategoryIcon(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                      style={isSelected ? { backgroundColor: color } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select
                value={newItem.currency}
                onChange={e => setNewItem({...newItem, currency: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
              >
                {currencyKeys.map(code => (
                  <option key={code} value={code}>{code} ({CURRENCIES[code].symbol})</option>
                ))}
              </select>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
              <select
                value={newItem.isRecurring ? 'monthly' : 'one-off'}
                onChange={e => setNewItem({...newItem, isRecurring: e.target.value === 'monthly'})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
              >
                <option value="monthly">Monthly (Recurring)</option>
                <option value="one-off">One-off</option>
              </select>
            </div>
            {newItem.isRecurring && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day of Month</label>
                <select
                  value={newItem.dayOfMonth ?? ''}
                  onChange={e => setNewItem({...newItem, dayOfMonth: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
                >
                  <option value="">Not set</option>
                  {DAY_OF_MONTH_OPTIONS.map(day => (
                    <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>
                  ))}
                </select>
              </div>
            )}
            {!newItem.isRecurring && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                <input
                  type="date"
                  value={newItem.date}
                  onChange={e => setNewItem({...newItem, date: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[#FF4B8B] outline-none transition-all font-semibold"
                />
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-[#FF4B8B] text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Add Transaction</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-4">
        <div className="space-y-1">
          {filteredOutgoings.length > 0 ? (
            filteredOutgoings.slice().reverse().map((item, idx) => {
              const Icon = getCategoryIcon(item.category);
              const color = getCategoryColor(item.category);
              const itemCurrency = (item.currency || currency) as CurrencyCode;
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 sm:p-5 hover:bg-slate-50 rounded-[1.5rem] transition-all group ${idx !== filteredOutgoings.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <div className="flex items-center space-x-5">
                    <div
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center group-hover:shadow-sm transition-all"
                      style={{ backgroundColor: color + '15', border: `2px solid ${color}30` }}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base leading-none mb-1.5 tracking-tight min-w-0 truncate">{item.description}</h4>
                      <div className="flex items-center space-x-2">
                        <span
                          className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: color + '15', color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                          <span>{item.category}</span>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400">{item.date}</span>
                        {item.dayOfMonth && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400 items-center space-x-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{item.dayOfMonth}{item.dayOfMonth === 1 ? 'st' : item.dayOfMonth === 2 ? 'nd' : item.dayOfMonth === 3 ? 'rd' : 'th'}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-lg tracking-tighter">-{formatCurrency(item.amount, itemCurrency)}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                        {item.isRecurring ? item.frequency : 'One-off'}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeOutgoing(item.id)}
                      className="p-2 text-slate-200 hover:text-rose-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-16 h-16 text-slate-100 mb-4" />
              <h4 className="text-slate-900 font-bold">
                {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Your expense history will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutgoingsTracker;
