/**
 * Format a number as Turkish Lira currency
 * Example: 58400 → "58.400,00 ₺"
 * 
 * Rules:
 * - Thousands separator: dot (.)
 * - Decimal separator: comma (,)
 * - Always 2 decimal places
 * - ₺ symbol at the end with a space
 * - Only for display purposes, not for calculations
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00 ₺';
  }
  
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  
  return `${formatted} ₺`;
};

/**
 * Format currency without the ₺ symbol (for use in inputs or compact displays)
 * Example: 58400 → "58.400,00"
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00';
  }
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
