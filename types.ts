
export type FrequencyType = 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Yearly' | 'One-time';

export interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  category: string;
  frequency: FrequencyType;
}

export interface OutgoingItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  frequency: FrequencyType;
}

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
}

export interface SavingsItem {
  id: string;
  name: string;
  balance: number;
  target?: number;
  category: string;
}

export interface WishlistItem {
  id: string;
  item: string;
  cost: number;
  saved: number;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
}

export type TabType = 'Dashboard' | 'Income' | 'Outgoings' | 'Savings' | 'Debt' | 'Wishlist' | 'AI Advisor' | 'Profile';

export interface FinanceData {
  income: IncomeItem[];
  outgoings: OutgoingItem[];
  savings: SavingsItem[];
  debt: DebtItem[];
  wishlist: WishlistItem[];
}
