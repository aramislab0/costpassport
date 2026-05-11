/**
 * src/lib/source-metadata.ts — v0.3.0
 *
 * Builds structured source/freshness metadata for the --sources flag.
 * Single source of truth for JSON and Markdown rendering.
 *
 * FxTable.mode drives ECB vs bundled detection:
 *   "ecb-live" → fetched via pricing:update from ECB
 *   "static"   → bundled at build time
 *
 * LiveRefreshResult (from runPricingUpdate) overrides data_origin to "live_fetch"
 * and provides the freshest possible FX rates for the session.
 */

import { resolveCostData } from "../data/resolver.js";
import type { ResolvedData } from "../types.js";
import type { PricingUpdateResult } from "../engines/pricing-update.js";

// ─── LiveRefreshResult ────────────────────────────────────────────────────────

/** Subset of PricingUpdateResult used to populate SourceMetadata for --live. */
export type LiveRefreshResult = PricingUpdateResult;

// ─── SourceMetadata shape ─────────────────────────────────────────────────────

export interface SourceMetadata {
  /** "live_fetch" = --live flag fetched ECB in this session;
   *  "cache"      = ~/.costpassport/cache.json was used;
   *  "bundled"    = fallback to compiled-in JSON */
  data_origin: "live_fetch" | "cache" | "bundled";
  cache_path: string;
  cache_age_hours: number | null;
  data_freshness: "fresh" | "stale" | "missing";
  pricing: {
    provider: string;
    source: string;
    verified_at: string | null;
    update_method: string;
  };
  fx: {
    source: string;
    xof_source: string;
    verified_at: string | null;
    rates: {
      EUR_TO_USD: number;
      USD_TO_EUR: number;
      EUR_TO_XOF: number;
      USD_TO_XOF: number;
    };
  };
  warnings: string[];
}

// ─── Build ────────────────────────────────────────────────────────────────────

/**
 * Build SourceMetadata from resolved cost data.
 * Pass `liveResult` when the --live flag was used to override data_origin
 * and surface the live ECB fetch result.
 */
export function buildSourceMetadata(
  resolved: ResolvedData,
  liveResult?: LiveRefreshResult,
): SourceMetadata {
  // FX values — live result takes priority
  const usdToEur = liveResult ? liveResult.usdToEur : resolved.fx.rates.EUR;
  const eurToUsd = liveResult
    ? liveResult.eurToUsd
    : Math.round((1 / resolved.fx.rates.EUR) * 10_000) / 10_000;
  const eurToXof = liveResult ? liveResult.eurToXof : resolved.fx.rates.XOF_PER_EUR;
  const usdToXof = liveResult
    ? liveResult.usdToXof
    : Math.round(usdToEur * eurToXof * 100) / 100;

  const fxIsLive = liveResult ? liveResult.fxLive : resolved.fx.mode === "ecb-live";
  const dataOrigin: "live_fetch" | "cache" | "bundled" = liveResult
    ? "live_fetch"
    : resolved.origin;

  const fxVerifiedAt = liveResult ? liveResult.fxVerifiedAt : resolved.fxVerifiedAt;
  const pricingVerifiedAt = liveResult
    ? liveResult.pricingVerifiedAt
    : resolved.pricingVerifiedAt;

  const warnings: string[] = liveResult
    ? liveResult.warnings
    : [
        "Model prices are maintained from official provider pricing pages. Verify before client billing.",
        "FX rates are reference rates and may not match bank or payment provider conversion rates.",
        "Prices and exchange rates may be verified, but token volume remains an estimate based on project scope.",
      ];

  return {
    data_origin: dataOrigin,
    cache_path: liveResult ? liveResult.cachePath : resolved.cachePath,
    cache_age_hours: liveResult ? 0 : resolved.cacheAgeHours,
    data_freshness: liveResult ? "fresh" : resolved.freshness,
    pricing: {
      provider: "anthropic",
      source: "https://platform.claude.com/docs/en/about-claude/pricing",
      verified_at: pricingVerifiedAt,
      update_method:
        dataOrigin === "bundled"
          ? "bundled_json — run `costpassport pricing:update` to refresh"
          : "manual_table_with_official_source",
    },
    fx: {
      source: fxIsLive
        ? "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
        : "bundled (static) — run `costpassport pricing:update` to refresh",
      xof_source: "https://www.bceao.int/en/content/history-cfa-franc",
      verified_at: fxVerifiedAt,
      rates: {
        EUR_TO_USD: eurToUsd,
        USD_TO_EUR: usdToEur,
        EUR_TO_XOF: eurToXof,
        USD_TO_XOF: usdToXof,
      },
    },
    warnings,
  };
}

/** Convenience: resolve + build in one call. */
export function getSourceMetadata(liveResult?: LiveRefreshResult): SourceMetadata {
  return buildSourceMetadata(resolveCostData(), liveResult);
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

export function formatSourcesMarkdown(meta: SourceMetadata): string {
  const lines: string[] = [];

  lines.push("## Sources & Data Freshness");
  lines.push("");
  lines.push(`- Data origin: **${meta.data_origin}**`);
  if (meta.cache_age_hours !== null) {
    const age = meta.cache_age_hours === 0 ? "< 1 min (just fetched)" : `${meta.cache_age_hours} hours`;
    lines.push(`- Cache age: ${age}`);
  }
  lines.push(`- Data freshness: **${meta.data_freshness}**`);
  lines.push("");
  lines.push(`- Pricing provider: ${meta.pricing.provider}`);
  lines.push(`- Pricing source: ${meta.pricing.source}`);
  lines.push(`- Pricing verified at: ${meta.pricing.verified_at ?? "unknown"}`);
  lines.push(`- Pricing method: ${meta.pricing.update_method}`);
  lines.push("");
  lines.push(`- FX source: ${meta.fx.source}`);
  lines.push(`- XOF source: ${meta.fx.xof_source}`);
  lines.push(`- FX verified at: ${meta.fx.verified_at ?? "unknown"}`);
  lines.push(`- EUR/USD: ${meta.fx.rates.EUR_TO_USD}`);
  lines.push(`- USD/EUR: ${meta.fx.rates.USD_TO_EUR}`);
  lines.push(`- EUR/XOF: ${meta.fx.rates.EUR_TO_XOF}`);
  lines.push(`- USD/XOF: ${meta.fx.rates.USD_TO_XOF}`);
  lines.push("");
  lines.push("**Warnings:**");
  lines.push("");
  for (const w of meta.warnings) {
    lines.push(`- ${w}`);
  }

  return lines.join("\n");
}
