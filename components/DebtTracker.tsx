import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Percent, Activity, Calendar, ShieldAlert, ArrowDownCircle, GripVertical, HelpCircle, Landmark } from 'lucide-react';
import { FinanceData, DebtItem } from '../types';
import { addDebt, updateDebt, deleteDebt, deductFromAccount } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

interface DebtTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const DebtTracker: React.FC<DebtTrackerProps> = ({ data, setData, currency }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Record<string, string>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showMinPaymentTip, setShowMinPaymentTip] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minPayment: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    deadline: '',
    currency: currency as string
  });

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.balance) return;
    
    const itemData: Omit<DebtItem, 'id'> = {
      name: newItem.name,
      balance: cleanNumber(newItem.balance),
      interestRate: cleanNumber(newItem.interestRate),
      minPayment: cleanNumber(newItem.minPayment),
      priority: newItem.priority,
      deadline: newItem.deadline || undefined,
      currency: newItem.currency
    };

    try {
      const serverItem = await addDebt(itemData);
      setData(prev => ({ ...prev, debt: [...prev.debt, serverItem] }));
      setShowAdd(false);
      setNewItem({ 
        name: '', 
        balance: '', 
        interestRate: '', 
        minPayment: '', 
        priority: 'Medium', 
        deadline: '',
        currency: currency
      });
    } catch (error) {
      console.error('Failed to add debt:', error);
    }
  };

  const accounts = data.accounts || [];

  const handlePayment = async (id: string) => {
    const amountStr = pendingPayments[id];
    if (!amountStr) return;
    
    const amount = cleanNumber(amountStr);
    if (amount <= 0) return;

    const existingItem = data.debt.find(d => d.id === id);
    if (!existingItem) return;

    const newBalance = Math.max(0, existingItem.balance - amount);
    const accountId = selectedAccounts[id];

    try {
      await updateDebt(id, { ...existingItem, balance: newBalance });

      if (accountId) {
        const updatedAccount = await deductFromAccount(accountId, amount);
        setData(prev => ({
          ...prev,
          debt: prev.debt.map(d => d.id === id ? { ...d, balance: newBalance } : d),
          accounts: prev.accounts.map(a => a.id === accountId ? { ...a, balance: updatedAccount.balance } : a)
        }));
      } else {
        setData(prev => ({
          ...prev,
          debt: prev.debt.map(d => d.id === id ? { ...d, balance: newBalance } : d)
        }));
      }
      setPendingPayments(prev => ({ ...prev, [id]: '' }));
      setSelectedAccounts(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Failed to update debt:', error);
    }
  };

  const removeDebt = async (id: string) => {
    try {
      await deleteDebt(id);
      setData(prev => ({ ...prev, debt: prev.debt.filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Failed to delete debt:', error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...data.debt];
    const itemToMove = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, itemToMove);
    
    setDraggedIndex(index);
    setData(prev => ({ ...prev, debt: newList }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const currencyTotals: Record<string, number> = {};
  data.debt.forEach(d => {
    const cur = d.currency || currency;
    currencyTotals[cur] = (currencyTotals[cur] || 0) + d.balance;
  });

  const currencyMinPayments: Record<string, number> = {};
  data.debt.forEach(d => {
    const cur = d.currency || currency;
    currencyMinPayments[cur] = (currencyMinPayments[cur] || 0) + d.minPayment;
  });

  const getItemCurrency = (item: DebtItem): CurrencyCode => {
    return (item.currency || currency) as CurrencyCode;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Debt Management</h2>
          <p className="text-slate-500 text-sm">Strategically reducing liabilities</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Liability</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Outstanding</p>
          <div className="flex flex-wrap items-baseline gap-3 mb-8">
            {Object.entries(currencyTotals).length > 0 ? (
              Object.entries(currencyTotals).map(([cur, total], i) => (
                <React.Fragment key={cur}>
                  {i > 0 && <span className="text-slate-500 text-2xl font-light">|</span>}
                  <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter">
                    {formatCurrency(total, cur as CurrencyCode)}
                  </span>
                </React.Fragment>
              ))
            ) : (
              <span className="text-6xl font-black tracking-tighter">{formatCurrency(0, currency)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Percent className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Rate</p>
                <p className="font-bold text-sm">
                  {data.debt.length > 0 
                    ? (data.debt.reduce((s, d) => s + d.interestRate, 0) / data.debt.length).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Monthly Min</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currencyMinPayments).length > 0 ? (
                    Object.entries(currencyMinPayments).map(([cur, total], i) => (
                      <span key={cur} className="font-bold text-sm">
                        {i > 0 && <span className="text-slate-500 mr-2">|</span>}
                        {formatCurrency(total, cur as CurrencyCode)}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-sm">{formatCurrency(0, currency)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] -mr-20 -mt-20 rounded-full"></div>
      </div>

      {showAdd && (
        <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Register Liability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Debt Name</label>
              <input 
                type="text" 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                placeholder="e.g. Visa Platinum" 
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select
                value={newItem.currency}
                onChange={e => setNewItem({...newItem, currency: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              >
                {Object.values(CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Balance</label>
              <input 
                type="text" 
                value={newItem.balance}
                onChange={e => setNewItem({...newItem, balance: e.target.value})}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interest Rate (%)</label>
              <input 
                type="text" 
                value={newItem.interestRate}
                onChange={e => setNewItem({...newItem, interestRate: e.target.value})}
                placeholder="18.9"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                Min. Payment
                <span className="relative inline-block">
                  <HelpCircle 
                    className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help transition-colors"
                    onMouseEnter={() => setShowMinPaymentTip(true)}
                    onMouseLeave={() => setShowMinPaymentTip(false)}
                  />
                  {showMinPaymentTip && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[11px] font-medium rounded-xl whitespace-nowrap shadow-lg z-50 normal-case tracking-normal">
                      The minimum amount you need to pay each month
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
                    </span>
                  )}
                </span>
              </label>
              <input 
                type="text" 
                value={newItem.minPayment}
                onChange={e => setNewItem({...newItem, minPayment: e.target.value})}
                placeholder="50.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
              <select 
                value={newItem.priority}
                onChange={e => setNewItem({...newItem, priority: e.target.value as any})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline (Optional)</label>
              <input 
                type="date" 
                value={newItem.deadline}
                onChange={e => setNewItem({...newItem, deadline: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Save Debt</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {data.debt.map((item, index) => {
          const itemCur = getItemCurrency(item);
          const itemSym = CURRENCIES[itemCur].symbol;
          return (
            <div 
              key={item.id} 
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                bg-white p-6 rounded-[2rem] border transition-all duration-300 ease-out group
                ${draggedIndex === index ? 'opacity-40 border-slate-300 scale-[0.98]' : 'border-slate-100 hover:border-slate-300 shadow-sm'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 transition-colors self-center">
                  <GripVertical className="w-6 h-6" />
                </div>

                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start space-x-5 min-w-0 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      item.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                      item.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.priority === 'High' ? <ShieldAlert className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-slate-900 text-lg truncate tracking-tight">{item.name}</h4>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                          item.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                          item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 uppercase tracking-wider">
                          {itemCur}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                        <span>{item.interestRate}% APR</span>
                        {item.deadline && (
                          <span className="flex items-center text-indigo-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <button 
                          onClick={() => removeDebt(item.id)}
                          className="text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Balance</p>
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(item.balance, itemCur)}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1">
                        Min Payment: {formatCurrency(item.minPayment, itemCur)}
                        <span className="relative group/tip inline-block">
                          <HelpCircle className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
                          <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-[11px] font-medium rounded-xl whitespace-nowrap shadow-lg z-50 hidden group-hover/tip:block normal-case tracking-normal">
                            The minimum amount you need to pay each month
                            <span className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></span>
                          </span>
                        </span>
                      </p>
                    </div>

                    {accounts.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={selectedAccounts[item.id] || ''}
                          onChange={(e) => setSelectedAccounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="">No account deduction</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({formatCurrency(acc.balance, acc.currency as CurrencyCode)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-mono">{itemSym}</span>
                        <input 
                          type="text"
                          value={pendingPayments[item.id] || ''}
                          onChange={(e) => setPendingPayments(prev => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handlePayment(item.id)}
                          placeholder="Pay off"
                          className="w-28 pl-6 pr-2 py-2.5 bg-transparent text-sm font-bold font-mono focus:outline-none placeholder:text-slate-300"
                        />
                      </div>
                      <button 
                        onClick={() => handlePayment(item.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <ArrowDownCircle className="w-3 h-3" />
                        Pay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {data.debt.length === 0 && (
          <div className="py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <CreditCard className="w-10 h-10 opacity-20" />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Debt-Free Zone!</h4>
            <p className="text-slate-400 font-medium mt-2">You've cleared all your liabilities. Excellent work.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtTracker;
