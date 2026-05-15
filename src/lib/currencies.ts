/**
 * src/lib/currencies.ts — Multi-currency support (D-031)
 * Default: USD, EUR, JPY. XOF supported but not shown by default.
 */

export type CurrencyCode =
  | "USD" | "EUR" | "JPY" | "GBP" | "CNY" | "AUD" | "CAD" | "CHF"
  | "HKD" | "SGD" | "SEK" | "KRW" | "NOK" | "NZD" | "MXN" | "XOF";

export const MAJOR_CURRENCIES: readonly CurrencyCode[] = [
  "USD", "EUR", "JPY", "GBP", "CNY", "AUD", "CAD", "CHF",
  "HKD", "SGD", "SEK", "KRW", "NOK", "NZD", "MXN",
];
export const SPECIAL_CURRENCIES: readonly CurrencyCode[] = ["XOF"];
export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [...MAJOR_CURRENCIES, ...SPECIAL_CURRENCIES];
export const DEFAULT_CURRENCIES: readonly CurrencyCode[] = ["USD", "EUR", "JPY"];

/** BCEAO fixed peg — never changes */
export const EUR_XOF_PEG = 655.957;

// ─── Display ──────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Partial<Record<CurrencyCode, string>> = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£", CNY: "¥", AUD: "A$",
  CAD: "C$", CHF: "Fr", HKD: "HK$", SGD: "S$", SEK: "kr",
  KRW: "₩", NOK: "kr", NZD: "NZ$", MXN: "MX$",
};

export function formatCurrencyAmount(amount: number, code: CurrencyCode): string {
  if (code === "XOF") return Math.round(amount).toLocaleString("fr-FR") + " XOF";
  if (code === "JPY" || code === "KRW") {
    const sym = CURRENCY_SYMBOLS[code] ?? code;
    return sym + Math.round(amount).toLocaleString("en-US");
  }
  const sym = CURRENCY_SYMBOLS[code];
  const rounded = Math.round(amount * 100) / 100;
  return (sym ?? (code + " ")) + rounded.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeCurrencyCode(code: string): CurrencyCode | null {
  const upper = code.trim().toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(upper) ? (upper as CurrencyCode) : null;
}

export function parseCurrencyList(input: string): { valid: CurrencyCode[]; invalid: string[] } {
  const valid: CurrencyCode[] = [];
  const invalid: string[] = [];
  for (const raw of input.split(",").map(c => c.trim()).filter(Boolean)) {
    const norm = normalizeCurrencyCode(raw);
    if (norm) valid.push(norm);
    else invalid.push(raw);
  }
  return { valid, invalid };
}

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Convert USD amount to target currency.
 * usdToEur = FxTable.rates.EUR (USD_TO_EUR)
 * ecbRates = FxTable.ecbRates (EUR_TO_XXX from ECB)
 */
export function convertUsd(
  usdAmount: number,
  target: CurrencyCode,
  usdToEur: number,
  ecbRates: Record<string, number>,
): number {
  if (target === "USD") return Math.round(usdAmount * 100) / 100;
  if (target === "EUR") return Math.round(usdAmount * usdToEur * 100) / 100;
  if (target === "XOF") return Math.round(usdAmount * usdToEur * EUR_XOF_PEG);
  const eurToTarget = ecbRates[target];
  if (!eurToTarget) return Math.round(usdAmount * 100) / 100; // fallback: show USD equiv
  return Math.round(usdAmount * usdToEur * eurToTarget * 100) / 100;
}

export function convertUsdRange(
  usdLow: number,
  usdHigh: number,
  currency: CurrencyCode,
  usdToEur: number,
  ecbRates: Record<string, number>,
): { low: number; high: number } {
  return {
    low: convertUsd(usdLow, currency, usdToEur, ecbRates),
    high: convertUsd(usdHigh, currency, usdToEur, ecbRates),
  };
}

/** Format a USD range in the target currency */
export function formatUsdRange(
  usdLow: number,
  usdHigh: number,
  currency: CurrencyCode,
  usdToEur: number,
  ecbRates: Record<string, number>,
): string {
  const { low, high } = convertUsdRange(usdLow, usdHigh, currency, usdToEur, ecbRates);
  return `${formatCurrencyAmount(low, currency)} – ${formatCurrencyAmount(high, currency)}`;
}

// ─── CLI option resolver ──────────────────────────────────────────────────────

/** Resolve currency options from CLI flags to a final list of CurrencyCode */
export function resolveCurrencies(opts: {
  currency?: string;
  currencies?: string;
  allCurrencies?: boolean;
}): { currencies: CurrencyCode[]; error?: string } {
  if (opts.allCurrencies) return { currencies: [...SUPPORTED_CURRENCIES] };

  if (opts.currencies) {
    const { valid, invalid } = parseCurrencyList(opts.currencies);
    if (invalid.length > 0) return { currencies: [], error: `Unsupported currency: ${invalid.join(", ")}.` };
    if (valid.length === 0) return { currencies: [...DEFAULT_CURRENCIES] };
    return { currencies: valid };
  }

  const result: CurrencyCode[] = [...DEFAULT_CURRENCIES];
  if (opts.currency) {
    const norm = normalizeCurrencyCode(opts.currency);
    if (!norm) return { currencies: [], error: `Unsupported currency: ${opts.currency}.` };
    if (!result.includes(norm)) result.push(norm);
  }
  return { currencies: result };
}
