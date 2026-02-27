import React, { useState } from 'react';
import { Plus, Trash2, ShoppingCart, Coffee, Car, ShoppingBag, Film, HeartPulse, MoreHorizontal, UtensilsCrossed } from 'lucide-react';
import { FinanceData, SpendingLogItem } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import { addSpending, deleteSpending } from '../client/src/lib/api';
import { formatCurrency, CurrencyCode, CURRENCIES } from '../client/src/lib/currency';

interface SpendingLogProps {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  currency: CurrencyCode;
}

const CATEGORY_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Food: UtensilsCrossed,
  Coffee: Coffee,
  Transport: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Health: HeartPulse,
  Other: MoreHorizontal,
};

const SpendingLog: React.FC<SpendingLogProps> = ({ data, setData, currency }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.SPENDING[0]);
  const [itemCurrency, setItemCurrency] = useState<CurrencyCode>(currency);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanNumber = (val: string) => {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || cleanNumber(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const item = await addSpending({
        description: description.trim(),
        amount: cleanNumber(amount),
        currency: itemCurrency,
        category,
        date: new Date().toISOString(),
      });
      setData(prev => ({
        ...prev,
        spendingLog: [item, ...(prev.spendingLog || [])],
      }));
      setDescription('');
      setAmount('');
      setCategory(CATEGORIES.SPENDING[0]);
    } catch (error) {
      console.error('Failed to add spending:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpending(id);
      setData(prev => ({
        ...prev,
        spendingLog: (prev.spendingLog || []).filter(s => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete spending:', error);
    }
  };

  const spendingItems = data.spendingLog || [];

  const groupByDate = (items: SpendingLogItem[]) => {
    const groups: Record<string, SpendingLogItem[]> = {};
    items.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  };

  const sorted = [...spendingItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const grouped = groupByDate(sorted);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const todayItems = sorted.filter(item => {
    const itemDate = new Date(item.date).toDateString();
    return itemDate === new Date().toDateString();
  });

  const dailyTotals: Record<string, number> = {};
  todayItems.forEach(item => {
    const cur = item.currency || 'USD';
    dailyTotals[cur] = (dailyTotals[cur] || 0) + item.amount;
  });

  const fc = (amt: number, cur: CurrencyCode = currency) => formatCurrency(amt, cur);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Daily Spending</h2>
        <p className="text-slate-500 text-sm">Quick-log your daily purchases</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Total</p>
        </div>
        {Object.keys(dailyTotals).length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {Object.entries(dailyTotals).map(([cur, total]) => (
              <span
                key={cur}
                className="text-2xl font-black text-slate-900 tracking-tighter"
              >
                {fc(total, cur as CurrencyCode)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-2xl font-black text-slate-300 tracking-tighter">
            {fc(0)}
          </span>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6"
      >
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Add</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What did you spend on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full sm:w-28 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full sm:w-36 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          >
            {CATEGORIES.SPENDING.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={itemCurrency}
            onChange={e => setItemCurrency(e.target.value as CurrencyCode)}
            className="w-full sm:w-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          >
            {Object.values(CURRENCIES).map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSubmitting || !description.trim() || !amount}
            className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No spending logged yet</p>
            <p className="text-slate-300 text-sm mt-1">Use the quick add bar above to log your first purchase</p>
          </div>
        )}

        {Object.entries(grouped).map(([dateLabel, items]) => {
          const dayTotals: Record<string, number> = {};
          items.forEach(item => {
            const cur = item.currency || 'USD';
            dayTotals[cur] = (dayTotals[cur] || 0) + item.amount;
          });

          return (
            <div key={dateLabel}>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-bold text-slate-600">
                  {dateLabel === today ? '📅 Today' : dateLabel}
                </h3>
                <div className="flex gap-2">
                  {Object.entries(dayTotals).map(([cur, total]) => (
                    <span key={cur} className="text-sm font-bold text-slate-500">
                      {fc(total, cur as CurrencyCode)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const IconComponent = CATEGORY_ICON_MAP[item.category] || MoreHorizontal;
                  const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between group hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: color + '18' }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.description}</p>
                          <p className="text-xs text-slate-400">
                            {item.category} · {new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-slate-900 tracking-tight">
                          {fc(item.amount, (item.currency || 'USD') as CurrencyCode)}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default SpendingLog;
