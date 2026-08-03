import { Currency } from '../types';

export const EXCHANGE_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 83.33,
  OMR: 216.0,
  JPY: 0.55,
  LKR: 0.27,
  SGD: 62.0,
  MYR: 17.8,
  IDR: 0.0053
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  OMR: 'ر.ع.',
  JPY: '¥',
  LKR: 'Rs',
  SGD: 'S$',
  MYR: 'RM',
  IDR: 'Rp'
};

export function formatPrice(amountINR: number, currency: Currency): string {
  const convertedAmount = amountINR / EXCHANGE_RATES[currency];
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(convertedAmount);
}

export function convertPrice(amountINR: number, currency: Currency): number {
  return amountINR / EXCHANGE_RATES[currency];
}
