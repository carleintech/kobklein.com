/**
 * Format currency amounts consistently across the app.
 */
export function formatCurrency(amount: number, currency: string = "HTG"): string {
  const symbols: Record<string, string> = {
    HTG: "G",
    USD: "$",
    CAD: "C$",
    EUR: "€",
  };

  const symbol = symbols[currency] ?? currency;
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(2);
}
