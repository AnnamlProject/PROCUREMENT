import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, dateFormat = 'dd MMM yyyy') => {
  return format(new Date(date), dateFormat, { locale: id });
};

export interface ToleranceResult {
  isWithin: boolean;
  delta: number;
  deltaPercent: number;
  isOver: boolean;
  isUnder: boolean;
  upperBound: number;
  lowerBound: number;
}

/**
 * Checks if a value is within a specified tolerance percentage of a base value.
 * @param baseValue - The original value (e.g., PO quantity).
 * @param checkValue - The value to compare (e.g., GRN quantity).
 * @param tolerancePercent - The allowed tolerance percentage (e.g., 10 for 10%).
 * @returns An object with the tolerance check results.
 */
export const checkTolerance = (
  baseValue: number,
  checkValue: number,
  tolerancePercent: number
): ToleranceResult => {
  if (baseValue === 0 && checkValue === 0) {
    return { isWithin: true, delta: 0, deltaPercent: 0, isOver: false, isUnder: false, upperBound: 0, lowerBound: 0 };
  }

  const upperBound = baseValue * (1 + tolerancePercent / 100);
  const lowerBound = baseValue * (1 - tolerancePercent / 100);
  const delta = checkValue - baseValue;
  const deltaPercent = baseValue !== 0 ? (delta / baseValue) * 100 : Infinity;

  const isWithin = checkValue >= lowerBound && checkValue <= upperBound;

  return {
    isWithin,
    delta,
    deltaPercent,
    isOver: delta > 0,
    isUnder: delta < 0,
    upperBound,
    lowerBound,
  };
};

/**
 * Calculates the tax amount from a base amount and rate.
 * @param baseAmount The amount to calculate tax from.
 * @param taxRate The tax rate (e.g., 0.11 for 11%).
 * @returns The calculated tax amount.
 */
export const calculateTax = (baseAmount: number, taxRate: number): number => {
  return baseAmount * taxRate;
};

/**
 * Calculates the withholding tax amount from a base amount and rate.
 * @param baseAmount The amount to calculate withholding from.
 * @param withholdingRate The withholding rate (e.g., 0.02 for 2%).
 * @returns The calculated withholding tax amount.
 */
export const calculateWithholding = (baseAmount: number, withholdingRate: number): number => {
  return baseAmount * withholdingRate;
};
