import type { FinanceData, IncomeItem, OutgoingItem, SavingsItem, DebtItem, WishlistItem, AccountItem } from '../../../types';

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
}

export async function fetchFinanceData(): Promise<FinanceData> {
  return apiCall<FinanceData>('/api/finance');
}

export async function addIncome(item: Omit<IncomeItem, 'id'>): Promise<IncomeItem> {
  return apiCall<IncomeItem>('/api/finance/income', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateIncome(id: string, item: Omit<IncomeItem, 'id'>): Promise<IncomeItem> {
  return apiCall<IncomeItem>(`/api/finance/income/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteIncome(id: string): Promise<void> {
  await apiCall(`/api/finance/income/${id}`, { method: 'DELETE' });
}

export async function addOutgoing(item: Omit<OutgoingItem, 'id'>): Promise<OutgoingItem> {
  return apiCall<OutgoingItem>('/api/finance/outgoings', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateOutgoing(id: string, item: Omit<OutgoingItem, 'id'>): Promise<OutgoingItem> {
  return apiCall<OutgoingItem>(`/api/finance/outgoings/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteOutgoing(id: string): Promise<void> {
  await apiCall(`/api/finance/outgoings/${id}`, { method: 'DELETE' });
}

export async function addSavings(item: Omit<SavingsItem, 'id'>): Promise<SavingsItem> {
  return apiCall<SavingsItem>('/api/finance/savings', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateSavings(id: string, item: Partial<SavingsItem>): Promise<SavingsItem> {
  return apiCall<SavingsItem>(`/api/finance/savings/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteSavings(id: string): Promise<void> {
  await apiCall(`/api/finance/savings/${id}`, { method: 'DELETE' });
}

export async function addDebt(item: Omit<DebtItem, 'id'>): Promise<DebtItem> {
  return apiCall<DebtItem>('/api/finance/debt', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateDebt(id: string, item: Partial<DebtItem>): Promise<DebtItem> {
  return apiCall<DebtItem>(`/api/finance/debt/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteDebt(id: string): Promise<void> {
  await apiCall(`/api/finance/debt/${id}`, { method: 'DELETE' });
}

export async function addWishlistItem(item: Omit<WishlistItem, 'id'>): Promise<WishlistItem> {
  return apiCall<WishlistItem>('/api/finance/wishlist', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateWishlistItem(id: string, item: Partial<WishlistItem>): Promise<WishlistItem> {
  return apiCall<WishlistItem>(`/api/finance/wishlist/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await apiCall(`/api/finance/wishlist/${id}`, { method: 'DELETE' });
}

export async function addAccount(item: Omit<AccountItem, 'id'>): Promise<AccountItem> {
  return apiCall<AccountItem>('/api/finance/accounts', { method: 'POST', body: JSON.stringify(item) });
}

export async function updateAccount(id: string, item: Partial<AccountItem>): Promise<AccountItem> {
  return apiCall<AccountItem>(`/api/finance/accounts/${id}`, { method: 'PUT', body: JSON.stringify(item) });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiCall(`/api/finance/accounts/${id}`, { method: 'DELETE' });
}

export async function updateCurrency(currency: string): Promise<{ currency: string }> {
  return apiCall<{ currency: string }>('/api/auth/currency', { method: 'PUT', body: JSON.stringify({ currency }) });
}
