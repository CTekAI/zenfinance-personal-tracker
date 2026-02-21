export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'IDR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID' },
};

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currencyCode];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currencyCode === 'IDR' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'IDR' ? 0 : 2,
  }).format(amount);
}

export function formatCurrencyShort(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currencyCode];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
