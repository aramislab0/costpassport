/**
 * src/engines/pricing-update.ts — v0.2.0
 *
 * Fetches ECB FX rates (live) + uses hardcoded Anthropic pricing (official source).
 * Writes ~/.costpassport/cache.json in CacheV1 format.
 * Never sends any project data. No backend required.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import fxBundled from "../resources/fx.json" with { type: "json" };
import type { FxTable } from "../types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_DIR = path.join(os.homedir(), ".costpassport");
export const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const EUR_XOF_PEG = 655.957; // BCEAO fixed peg — never changes
const ECB_TIMEOUT_MS = 10_000;

// ─── Anthropic pricing table ──────────────────────────────────────────────────
// Source: https://platform.claude.com/docs/en/about-claude/pricing
// Verified: 2026-05-11
// Update this table and ANTHROPIC_PRICING_VERIFIED_AT on each price change.

const ANTHROPIC_PRICING_VERIFIED_AT = "2026-05-11";
const ANTHROPIC_SOURCE_URL = "https://platform.claude.com/docs/en/about-claude/pricing";

const ANTHROPIC_MODELS = {
  "claude-sonnet-4-6": {
    input_price_per_million: 3,
    output_price_per_million: 15,
    cache_write_5m_price_per_million: 3.75,
    cache_write_1h_price_per_million: 6,
    cache_read_price_per_million: 0.30,
    source_url: ANTHROPIC_SOURCE_URL,
    verified_at: ANTHROPIC_PRICING_VERIFIED_AT,
  },
  "claude-haiku-4-5": {
    input_price_per_million: 1,
    output_price_per_million: 5,
    cache_write_5m_price_per_million: 1.25,
    cache_write_1h_price_per_million: 2,
    cache_read_price_per_million: 0.10,
    source_url: ANTHROPIC_SOURCE_URL,
    verified_at: ANTHROPIC_PRICING_VERIFIED_AT,
  },
  "claude-opus-4-7": {
    input_price_per_million: 5,
    output_price_per_million: 25,
    cache_write_5m_price_per_million: 6.25,
    cache_write_1h_price_per_million: 10,
    cache_read_price_per_million: 0.50,
    source_url: ANTHROPIC_SOURCE_URL,
    verified_at: ANTHROPIC_PRICING_VERIFIED_AT,
  },
  // Opus 4.6 — same price tier as 4.7
  "claude-opus-4-6": {
    input_price_per_million: 5,
    output_price_per_million: 25,
    cache_write_5m_price_per_million: 6.25,
    cache_write_1h_price_per_million: 10,
    cache_read_price_per_million: 0.50,
    source_url: ANTHROPIC_SOURCE_URL,
    verified_at: ANTHROPIC_PRICING_VERIFIED_AT,
  },
} as const;

// ─── ECB fetch ────────────────────────────────────────────────────────────────

/** Extracts all EUR→XXX rates from ECB eurofxref XML. Returns null on any parse failure.
 *  ECB uses single-quoted attributes: currency='USD' rate='1.1765'
 *  Regex accepts both single and double quotes for resilience.
 */
function parseEcbXml(xml: string): { eurToUsd: number; date: string; allRates: Record<string, number> } | null {
  const allRates: Record<string, number> = {};
  const rateRegex = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([^'"]+)['"]/g;
  let match;
  while ((match = rateRegex.exec(xml)) !== null) {
    const rate = parseFloat(match[2]);
    if (!isNaN(rate) && rate > 0) allRates[match[1]] = rate;
  }
  if (!allRates["USD"]) return null;
  const dateMatch = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/);
  const date = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);
  return { eurToUsd: allRates["USD"], date, allRates };
}

interface FxFetchResult {
  eurToUsd: number;
  allRates: Record<string, number>;
  verifiedAt: string;
  live: boolean;
  error: string | null;
}

async function fetchEcbRate(): Promise<FxFetchResult> {
  try {
    const response = await fetch(ECB_URL, {
      signal: AbortSignal.timeout(ECB_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`ECB returned HTTP ${response.status}`);

    const xml = await response.text();
    const parsed = parseEcbXml(xml);
    if (!parsed) throw new Error("Could not extract USD rate from ECB XML");

    return { eurToUsd: parsed.eurToUsd, allRates: parsed.allRates, verifiedAt: parsed.date, live: true, error: null };
  } catch (err) {
    // Graceful fallback: use bundled FX rates
    const fx = fxBundled as unknown as FxTable;
    const eurToUsd = Math.round((1 / fx.rates.EUR) * 10_000) / 10_000;
    return {
      eurToUsd,
      allRates: {},
      verifiedAt: fx.last_updated,
      live: false,
      error: (err as Error).message,
    };
  }
}

// ─── Result type ─────────────────────────────────────────────────────────────

export interface PricingUpdateResult {
  cachePath: string;
  pricingVerifiedAt: string;
  fxVerifiedAt: string;
  eurToUsd: number;
  usdToEur: number;
  eurToXof: number;
  usdToXof: number;
  fxLive: boolean;
  fxError: string | null;
  warnings: string[];
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function runPricingUpdate(): Promise<PricingUpdateResult> {
  // Ensure cache directory exists
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const { eurToUsd, allRates, verifiedAt: fxVerifiedAt, live: fxLive, error: fxError } =
    await fetchEcbRate();

  const usdToEur = Math.round((1 / eurToUsd) * 10_000) / 10_000;
  const eurToXof = EUR_XOF_PEG;
  const usdToXof = Math.round(usdToEur * EUR_XOF_PEG * 100) / 100;

  const warnings: string[] = [
    "Model prices are maintained from official provider pricing pages. Verify before client billing.",
    "FX rates are reference rates and may not match bank or payment provider conversion rates.",
    "Token volume remains an estimate based on project scope.",
  ];

  if (!fxLive) {
    warnings.unshift(
      `FX rates could not be fetched from ECB (${fxError ?? "unknown error"}) — using bundled fallback rates. Retry when online.`
    );
  }

  const cache = {
    version: 1 as const,
    saved_at: new Date().toISOString(),
    pricing: {
      provider: "anthropic",
      source: ANTHROPIC_SOURCE_URL,
      verified_at: ANTHROPIC_PRICING_VERIFIED_AT,
      update_method: "manual_table_with_official_source",
      models: ANTHROPIC_MODELS,
    },
    fx: {
      source: ECB_URL,
      xof_source: "https://www.bceao.int/en/content/history-cfa-franc",
      verified_at: fxVerifiedAt,
      rates: {
        EUR_TO_USD: eurToUsd,
        USD_TO_EUR: usdToEur,
        EUR_TO_XOF: eurToXof,
        USD_TO_XOF: usdToXof,
      },
      ecb_rates: allRates,
    },
    warnings,
  };

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");

  return {
    cachePath: CACHE_FILE,
    pricingVerifiedAt: ANTHROPIC_PRICING_VERIFIED_AT,
    fxVerifiedAt,
    eurToUsd,
    usdToEur,
    eurToXof,
    usdToXof,
    fxLive,
    fxError,
    warnings,
  };
}
