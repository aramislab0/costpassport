/**
 * src/data/resolver.ts — v0.2.0 Live Data Layer (read-only resolver)
 *
 * Priority:  ~/.costpassport/cache.json  (written by `pricing:update`)
 * Fallback:  bundled JSON inlined at build time by tsup
 *
 * Makes NO network calls. Creates NO files. Pure read + metadata.
 *
 * Cache format: CacheV1 (version: 1) — different field names from PricingTable/FxTable.
 * This module transforms CacheV1 → PricingTable + FxTable for the engines.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import pricingBundled from "../resources/pricing.anthropic.json" with { type: "json" };
import fxBundled from "../resources/fx.json" with { type: "json" };

import type { FxTable, ModelKey, PricingModel, PricingTable, ResolvedData } from "../types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_DIR = path.join(os.homedir(), ".costpassport");
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");

const FRESH_THRESHOLD_H = 24;       // < 24h  → fresh
const STALE_THRESHOLD_H = 24 * 30;  // < 720h → stale; beyond → treat as missing

// ─── CacheV1 shape ────────────────────────────────────────────────────────────
// Written by `pricing:update`. Do not change without updating the engine.

interface CacheModelV1 {
  input_price_per_million: number;
  output_price_per_million: number;
  cache_write_5m_price_per_million?: number;
  cache_write_1h_price_per_million?: number;
  cache_read_price_per_million?: number;
  source_url: string;
  verified_at: string;
}

interface CacheV1 {
  version: 1;
  saved_at: string;
  pricing: {
    provider: string;
    source: string;
    verified_at: string;
    update_method: string;
    models: Record<string, CacheModelV1>;
  };
  fx: {
    source: string;
    xof_source: string;
    verified_at: string;
    rates: {
      EUR_TO_USD: number;
      USD_TO_EUR: number;
      EUR_TO_XOF: number;
      USD_TO_XOF: number;
    };
  };
  warnings: string[];
}

// ─── Format detection ─────────────────────────────────────────────────────────

function isCacheV1(parsed: unknown): parsed is CacheV1 {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  return (
    p["version"] === 1 &&
    typeof p["saved_at"] === "string" &&
    typeof p["pricing"] === "object" &&
    typeof p["fx"] === "object"
  );
}

// ─── CacheV1 → PricingTable / FxTable ────────────────────────────────────────

const MODEL_KEY_MAP: Record<string, ModelKey> = {
  "claude-sonnet-4-6": "sonnet-4-6",
  "claude-haiku-4-5":  "haiku-4-5",
  "claude-opus-4-7":   "opus-4-7",
  "claude-opus-4-6":   "opus-4-6",
};

function cacheV1ToPricingTable(cache: CacheV1): PricingTable {
  // Start from bundled models as base — ensures all required keys are present
  const bundled = pricingBundled as unknown as PricingTable;
  const models: Record<string, PricingModel> = { ...bundled.models };

  for (const [name, data] of Object.entries(cache.pricing.models)) {
    const key = MODEL_KEY_MAP[name];
    if (key) {
      models[key] = {
        label: name,
        input: data.input_price_per_million,
        output: data.output_price_per_million,
        cache_hit: data.cache_read_price_per_million ?? 0,
        cache_write_5m: data.cache_write_5m_price_per_million,
        cache_write_1h: data.cache_write_1h_price_per_million,
      };
    }
  }

  return {
    pricing_last_verified: cache.pricing.verified_at,
    source_note: `${cache.pricing.source} (${cache.pricing.update_method})`,
    batch_discount: bundled.batch_discount,
    opus_4_7_tokenizer_risk: bundled.opus_4_7_tokenizer_risk,
    currency: "USD",
    unit: "USD per million tokens (MTok)",
    models: models as Record<ModelKey, PricingModel>,
  };
}

function cacheV1ToFxTable(cache: CacheV1): FxTable {
  return {
    base: "USD",
    rates: {
      EUR: cache.fx.rates.USD_TO_EUR,
      XOF_PER_EUR: cache.fx.rates.EUR_TO_XOF,
    },
    last_updated: cache.fx.verified_at,
    mode: "ecb-live",
    warning: cache.warnings.slice(0, 2).join(" "),
  };
}

// ─── Cache read ───────────────────────────────────────────────────────────────

function readCache(): { data: CacheV1; ageHours: number } | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;

    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (!isCacheV1(parsed)) return null; // unknown or old format → ignore

    const savedAt = new Date(parsed.saved_at).getTime();
    if (Number.isNaN(savedAt)) return null;

    const ageHours = (Date.now() - savedAt) / 3_600_000;
    return { data: parsed, ageHours };
  } catch {
    return null;
  }
}

function computeFreshness(ageHours: number | null): ResolvedData["freshness"] {
  if (ageHours === null) return "missing";
  if (ageHours < FRESH_THRESHOLD_H) return "fresh";
  if (ageHours < STALE_THRESHOLD_H) return "stale";
  return "missing";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns pricing + FX data with full provenance metadata.
 * Uses the local cache (CacheV1) when available and valid; falls back to bundled JSON.
 */
export function resolveCostData(): ResolvedData {
  const cached = readCache();

  if (cached !== null) {
    const { data, ageHours } = cached;
    const freshness = computeFreshness(ageHours);

    if (freshness !== "missing") {
      return {
        pricing: cacheV1ToPricingTable(data),
        fx: cacheV1ToFxTable(data),
        origin: "cache",
        cachePath: CACHE_FILE,
        cacheExists: true,
        cacheAgeHours: Math.round(ageHours * 10) / 10,
        freshness,
        pricingVerifiedAt: data.pricing.verified_at,
        fxVerifiedAt: data.fx.verified_at,
        sources: {
          pricing: `${CACHE_FILE} (cache — ${data.pricing.source})`,
          fx: `${CACHE_FILE} (cache — ${data.fx.source})`,
        },
      };
    }
  }

  // Fallback: bundled JSON (inlined at build time by tsup)
  const pricing = pricingBundled as unknown as PricingTable;
  const fx = fxBundled as unknown as FxTable;

  return {
    pricing,
    fx,
    origin: "bundled",
    cachePath: CACHE_FILE,
    cacheExists: cached !== null,
    cacheAgeHours: cached !== null ? Math.round(cached.ageHours * 10) / 10 : null,
    freshness: "missing",
    pricingVerifiedAt: pricing.pricing_last_verified ?? null,
    fxVerifiedAt: fx.last_updated ?? null,
    sources: {
      pricing:
        "bundled (costpassport@" +
        (pricing.pricing_last_verified ?? "unknown") +
        ") — run `costpassport pricing:update` to refresh",
      fx:
        "bundled (costpassport@" +
        (fx.last_updated ?? "unknown") +
        ") — run `costpassport pricing:update` to refresh",
    },
  };
}
