import type { Currency } from "@/lib/db/schema";

export function convertAmount(
  amount: number,
  fromRateToUsd: number,
  toRateToUsd: number
): number {
  if (toRateToUsd === 0) return 0;
  return (amount * fromRateToUsd) / toRateToUsd;
}

export function toDisplayAmount(
  amount: number,
  from: Pick<Currency, "rateToUsd">,
  display: Pick<Currency, "rateToUsd">
): number {
  return convertAmount(amount, from.rateToUsd, display.rateToUsd);
}

export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: currencyCode === "CDF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    })} ${currencyCode}`;
  }
}

export function periodLabel(
  period: "month" | "week" | "day",
  plural = false
): string {
  const map = {
    month: plural ? "mois" : "mois",
    week: plural ? "semaines" : "semaine",
    day: plural ? "jours" : "jour",
  } as const;
  return map[period];
}

export function suggestedContribution(
  targetAmount: number,
  durationUnits: number
): number {
  if (durationUnits <= 0) return targetAmount;
  return targetAmount / durationUnits;
}

/** Convert "unités pour 1 USD" → rateToUsd */
export function unitsPerUsdToRate(unitsPerUsd: number): number {
  if (unitsPerUsd <= 0) return 1;
  return 1 / unitsPerUsd;
}

/** Convert rateToUsd → "unités pour 1 USD" */
export function rateToUnitsPerUsd(rateToUsd: number): number {
  if (rateToUsd <= 0) return 1;
  return 1 / rateToUsd;
}
