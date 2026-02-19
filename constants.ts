
import { FinanceData } from './types';

export const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Gifts', 'Other'],
  OUTGOINGS: ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'],
  DEBT: ['Credit Card', 'Personal Loan', 'Mortgage', 'Student Loan', 'Car Loan'],
  SAVINGS: ['Emergency Fund', 'Retirement', 'Stocks', 'Bonds', 'Cash', 'Other'],
};

export const INITIAL_DATA: FinanceData = {
  income: [
    { id: '1', source: 'Primary Salary', amount: 4500, category: 'Salary', frequency: 'Monthly' },
    { id: '2', source: 'Design Gig', amount: 800, category: 'Freelance', frequency: 'One-time' }
  ],
  outgoings: [
    { id: '1', description: 'Rent', amount: 1200, category: 'Housing', date: '2024-05-01', frequency: 'Monthly' },
    { id: '2', description: 'Groceries', amount: 450, category: 'Food', date: '2024-05-05', frequency: 'Weekly' },
    { id: '3', description: 'Electricity', amount: 120, category: 'Utilities', date: '2024-05-10', frequency: 'Monthly' }
  ],
  savings: [
    { id: '1', name: 'Emergency Fund', balance: 5000, target: 15000, category: 'Emergency Fund' },
    { id: '2', name: 'Stock Portfolio', balance: 12400, category: 'Stocks' }
  ],
  debt: [
    { 
      id: '1', 
      name: 'Mastercard', 
      balance: 2500, 
      interestRate: 18.9, 
      minPayment: 100, 
      priority: 'High', 
      deadline: '2025-12-31' 
    }
  ],
  wishlist: [
    { id: '1', item: 'New Laptop', cost: 2000, saved: 800, priority: 'High' }
  ]
};
