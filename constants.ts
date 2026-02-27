export const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Gifts', 'Other'],
  OUTGOINGS: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'],
  DEBT: ['Credit Card', 'Personal Loan', 'Mortgage', 'Student Loan', 'Car Loan'],
  SAVINGS: ['Emergency Fund', 'Retirement', 'Stocks', 'Bonds', 'Cash', 'Other'],
  SPENDING: ['Food', 'Coffee', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'],
};

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#6366F1',
  Food: '#F97316',
  Transport: '#8B5CF6',
  Utilities: '#06B6D4',
  Entertainment: '#EC4899',
  Shopping: '#F59E0B',
  Health: '#10B981',
  Other: '#94A3B8',
  Coffee: '#92400E',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Housing: 'Home',
  Food: 'UtensilsCrossed',
  Transport: 'Car',
  Utilities: 'Zap',
  Entertainment: 'Film',
  Shopping: 'ShoppingBag',
  Health: 'HeartPulse',
  Other: 'MoreHorizontal',
  Coffee: 'Coffee',
};

export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
