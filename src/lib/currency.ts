import type { CurrencyRange, FxTable, Range } from "../types.js";

export function usdToEur(usd: number, fx: FxTable): number {
  return Math.round(usd * fx.rates.EUR * 100) / 100;
}

export function eurToXof(eur: number, fx: FxTable): number {
  return Math.round(eur * fx.rates.XOF_PER_EUR);
}

// USD → EUR → XOF (never USD → XOF direct; XOF is pegged to EUR)
export function rangeToCurrencies(usdRange: Range, fx: FxTable): CurrencyRange {
  const eurLow = usdToEur(usdRange.low, fx);
  const eurHigh = usdToEur(usdRange.high, fx);
  return {
    USD: { low: Math.round(usdRange.low * 100) / 100, high: Math.round(usdRange.high * 100) / 100 },
    EUR: { low: eurLow, high: eurHigh },
    XOF: { low: eurToXof(eurLow, fx), high: eurToXof(eurHigh, fx) },
  };
}
