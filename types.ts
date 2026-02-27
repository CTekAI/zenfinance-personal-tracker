export type FrequencyType = 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Yearly' | 'One-time';

export interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  category: string;
  frequency: FrequencyType;
  currency: string;
  dayOfMonth?: number | null;
}

export interface OutgoingItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  frequency: FrequencyType;
  currency: string;
  dayOfMonth?: number | null;
  isRecurring: boolean;
}

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  currency: string;
}

export interface SavingsItem {
  id: string;
  name: string;
  balance: number;
  target?: number;
  category: string;
  currency: string;
}

export interface WishlistItem {
  id: string;
  item: string;
  cost: number;
  saved: number;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  currency: string;
}

export interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface SpendingLogItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string | null;
  createdAt: string;
}

export type TabType = 'Dashboard' | 'Income' | 'Outgoings' | 'Savings' | 'Debt' | 'Wishlist' | 'Accounts' | 'Spending' | 'AI Advisor' | 'Profile';

export interface FinanceData {
  income: IncomeItem[];
  outgoings: OutgoingItem[];
  savings: SavingsItem[];
  debt: DebtItem[];
  wishlist: WishlistItem[];
  accounts: AccountItem[];
  spendingLog: SpendingLogItem[];
}
