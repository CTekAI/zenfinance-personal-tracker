import React, { useState } from 'react';
import { Plus, Trash2, Landmark, Pencil, X, Building2, CreditCard, Wallet, PiggyBank, GripVertical, Check } from 'lucide-react';
import { FinanceData, AccountItem } from '../types';
import { addAccount, updateAccount, deleteAccount } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

interface AccountsTrackerProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Investment', 'Cash', 'Other'];

const accountTypeIcon = (type: string, size: string = 'w-6 h-6') => {
  switch (type) {
    case 'Checking': return <Building2 className={size} />;
    case 'Savings': return <PiggyBank className={size} />;
    case 'Credit Card': return <CreditCard className={size} />;
    case 'Investment': return <Landmark className={size} />;
    default: return <Wallet className={size} />;
  }
};

const AccountsTracker: React.FC<AccountsTrackerProps> = ({ data, setData, currency }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', type: ACCOUNT_TYPES[0], balance: '', currency: currency });
  const [editItem, setEditItem] = useState({ name: '', type: '', balance: '', currency: '' });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAdd = async () => {
    if (!newItem.name) return;
    try {
      const item = await addAccount({
        name: newItem.name,
        type: newItem.type,
        balance: cleanNumber(newItem.balance),
        currency: newItem.currency,
      });
      setData(prev => ({ ...prev, accounts: [...prev.accounts, item] }));
      setShowAdd(false);
      setNewItem({ name: '', type: ACCOUNT_TYPES[0], balance: '', currency });
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const item = await updateAccount(id, {
        name: editItem.name,
        type: editItem.type,
        balance: cleanNumber(editItem.balance),
        currency: editItem.currency,
      });
      setData(prev => ({ ...prev, accounts: prev.accounts.map(a => a.id === id ? item : a) }));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      setData(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const startEdit = (item: AccountItem) => {
    setEditingId(item.id);
    setEditItem({ name: item.name, type: item.type, balance: String(item.balance), currency: item.currency });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...accounts];
    const itemToMove = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, itemToMove);

    setData(prev => ({ ...prev, accounts: newList }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const accounts = data.accounts || [];
  const currencyGroups = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + a.balance;
    return acc;
  }, {});
  const hasMixedCurrencies = Object.keys(currencyGroups).length > 1;
  const totalInSelectedCurrency = accounts
    .filter(a => a.currency === currency)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Bank Accounts</h2>
          <p className="text-slate-500 text-sm">Manage all your financial accounts</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200/50">
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
            {hasMixedCurrencies ? `Balance (${currency} accounts)` : 'Total Balance'}
          </p>
          <h2 className="text-6xl font-black tracking-tighter mb-4">
            {formatCurrency(hasMixedCurrencies ? totalInSelectedCurrency : accounts.reduce((s, a) => s + a.balance, 0), currency)}
          </h2>
          {hasMixedCurrencies && (
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(currencyGroups).filter(([c]) => c !== currency).map(([c, total]) => (
                <span key={c} className="text-indigo-200 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                  {formatCurrency(total, c as CurrencyCode)}
                </span>
              ))}
            </div>
          )}
          <p className="text-indigo-200 text-sm font-medium">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
        </div>
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <Landmark className="absolute -right-4 -bottom-4 w-48 h-48 text-white/5 rotate-12" />
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Add New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Chase Checking"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Balance</label>
              <input
                type="text"
                value={newItem.balance}
                onChange={e => setNewItem({ ...newItem, balance: e.target.value })}
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
              <select
                value={newItem.currency}
                onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              >
                {Object.values(CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleAdd} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95">Add Account</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {accounts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {accounts.map((item, index) => (
              <div
                key={item.id}
                draggable={editingId !== item.id}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group transition-all ${draggedIndex === index ? 'opacity-50 bg-indigo-50' : 'hover:bg-slate-50/50'}`}
              >
                {editingId === item.id ? (
                  <div className="px-8 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={editItem.name}
                        onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                        placeholder="Account name"
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <select
                        value={editItem.type}
                        onChange={e => setEditItem({ ...editItem, type: e.target.value })}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        value={editItem.balance}
                        onChange={e => setEditItem({ ...editItem, balance: e.target.value })}
                        placeholder="Balance"
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <select
                        value={editItem.currency}
                        onChange={e => setEditItem({ ...editItem, currency: e.target.value })}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.values(CURRENCIES).map(c => (
                          <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm">Cancel</button>
                      <button onClick={() => handleEdit(item.id)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-6 py-5 cursor-grab active:cursor-grabbing">
                    <div className="text-slate-200 group-hover:text-slate-400 transition-colors mr-4 flex-shrink-0">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 flex-shrink-0 mr-5">
                      {accountTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 mr-6">
                      <h4 className="font-black text-slate-900 text-lg tracking-tight leading-tight truncate">{item.name}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                    </div>

                    <div className="flex-shrink-0 text-right mr-6">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(item.balance, item.currency as CurrencyCode)}
                      </h3>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.currency}</span>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-indigo-500 p-2 rounded-xl hover:bg-indigo-50 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Landmark className="w-10 h-10 text-indigo-200" />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">No Accounts Yet</h4>
            <p className="text-slate-400 font-medium mt-2">Add your first bank account to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsTracker;
