/**
 * src/lib/source-metadata.ts — v0.2.0
 *
 * Builds structured source/freshness metadata for the --sources flag.
 * Single source of truth for JSON and Markdown rendering.
 * FxTable.mode drives ECB vs bundled detection:
 *   "ecb-live" → fetched via pricing:update from ECB
 *   "static"   → bundled at build time
 */

import { resolveCostData } from "../data/resolver.js";
import type { ResolvedData } from "../types.js";

// ─── SourceMetadata shape ─────────────────────────────────────────────────────

export interface SourceMetadata {
  data_origin: "cache" | "bundled";
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

export function buildSourceMetadata(resolved: ResolvedData): SourceMetadata {
  const usdToEur = resolved.fx.rates.EUR;                       // e.g. 0.85
  const eurToUsd = Math.round((1 / usdToEur) * 10_000) / 10_000; // e.g. 1.1765
  const eurToXof = resolved.fx.rates.XOF_PER_EUR;               // 655.957
  const usdToXof = Math.round(usdToEur * eurToXof * 100) / 100; // e.g. 557.56

  const fxIsLive = resolved.fx.mode === "ecb-live";

  return {
    data_origin: resolved.origin,
    cache_path: resolved.cachePath,
    cache_age_hours: resolved.cacheAgeHours,
    data_freshness: resolved.freshness,
    pricing: {
      provider: "anthropic",
      source: "https://platform.claude.com/docs/en/about-claude/pricing",
      verified_at: resolved.pricingVerifiedAt,
      update_method: resolved.origin === "cache"
        ? "manual_table_with_official_source"
        : "bundled_json — run `costpassport pricing:update` to refresh",
    },
    fx: {
      source: fxIsLive
        ? "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
        : "bundled (static) — run `costpassport pricing:update` to refresh",
      xof_source: "https://www.bceao.int/en/content/history-cfa-franc",
      verified_at: resolved.fxVerifiedAt,
      rates: {
        EUR_TO_USD: eurToUsd,
        USD_TO_EUR: usdToEur,
        EUR_TO_XOF: eurToXof,
        USD_TO_XOF: usdToXof,
      },
    },
    warnings: [
      "Model prices are maintained from official provider pricing pages. Verify before client billing.",
      "FX rates are reference rates and may not match bank or payment provider conversion rates.",
      "Prices and exchange rates may be verified, but token volume remains an estimate based on project scope.",
    ],
  };
}

/** Convenience: resolve + build in one call. */
export function getSourceMetadata(): SourceMetadata {
  return buildSourceMetadata(resolveCostData());
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

export function formatSourcesMarkdown(meta: SourceMetadata): string {
  const lines: string[] = [];

  lines.push("## Sources & Data Freshness");
  lines.push("");
  lines.push(`- Data origin: **${meta.data_origin}**`);
  if (meta.cache_age_hours !== null) {
    lines.push(`- Cache age: ${meta.cache_age_hours} hours`);
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
