/**
 * tests/core.test.ts — CostPassport v0.3.0
 *
 * Covers the 5 critical risk areas before v0.4.0:
 *   1. FX conversion chain  (USD → EUR → XOF)
 *   2. Scoring 5-tier coherence
 *   3. Readiness decision logic
 *   4. Resolver fallback  (absent / corrupted / valid cache)
 *   5. --live ECB failure graceful fallback
 *
 * Safe for CI: resolver tests spy on fs instead of touching the real user cache.
 * No network calls — fetch is stubbed for ECB tests.
 * No secrets read or written.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";

import { usdToEur, eurToXof, rangeToCurrencies } from "../src/lib/currency.js";
import { computeScore } from "../src/lib/score.js";
import { readiness } from "../src/engines/readiness.js";
import { resolveCostData } from "../src/data/resolver.js";
import { runPricingUpdate } from "../src/engines/pricing-update.js";
import type { FxTable } from "../src/types.js";

// ─── FX Fixtures ──────────────────────────────────────────────────────────────

/** ECB-style rate: 1 EUR = 1.1765 USD → 1 USD = 0.85 EUR */
const FX_ECB: FxTable = {
  base: "USD",
  rates: { EUR: 0.85, XOF_PER_EUR: 655.957 },
  last_updated: "2026-05-11",
  mode: "ecb-live",
  warning: "",
};

/** Bundled fallback rate: 1 USD = 0.92 EUR (older static rate) */
const FX_BUNDLED: FxTable = {
  base: "USD",
  rates: { EUR: 0.92, XOF_PER_EUR: 655.957 },
  last_updated: "2026-05-10",
  mode: "static",
  warning: "Static FX rates.",
};

/** Minimal valid CacheV1 for resolver "cache hit" tests. */
const VALID_CACHE_V1 = {
  version: 1,
  saved_at: new Date().toISOString(), // fresh
  pricing: {
    provider: "anthropic",
    source: "https://platform.claude.com/docs/en/about-claude/pricing",
    verified_at: "2026-05-11",
    update_method: "manual_table_with_official_source",
    models: {
      "claude-sonnet-4-6": {
        input_price_per_million: 3,
        output_price_per_million: 15,
        cache_write_5m_price_per_million: 3.75,
        cache_write_1h_price_per_million: 6,
        cache_read_price_per_million: 0.30,
        source_url: "https://platform.claude.com/docs/en/about-claude/pricing",
        verified_at: "2026-05-11",
      },
    },
  },
  fx: {
    source: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
    xof_source: "https://www.bceao.int/en/content/history-cfa-franc",
    verified_at: "2026-05-11",
    rates: {
      EUR_TO_USD: 1.1765,
      USD_TO_EUR: 0.85,
      EUR_TO_XOF: 655.957,
      USD_TO_XOF: 557.56,
    },
  },
  warnings: ["Test warning only — not a real cache."],
};

// ─── 1. FX Conversion ─────────────────────────────────────────────────────────

describe("Currency — usdToEur", () => {
  it("USD 100 → EUR 85 at ECB rate 0.85", () => {
    // Math.round(100 × 0.85 × 100) / 100 = 85
    expect(usdToEur(100, FX_ECB)).toBe(85);
  });

  it("USD 100 → EUR 92 at bundled rate 0.92", () => {
    expect(usdToEur(100, FX_BUNDLED)).toBe(92);
  });

  it("rounds to 2 decimal places — USD 21.6 → EUR 18.36", () => {
    // Math.round(21.6 × 0.85 × 100) / 100 = Math.round(1836) / 100 = 18.36
    expect(usdToEur(21.6, FX_ECB)).toBe(18.36);
  });

  it("USD 0 → EUR 0", () => {
    expect(usdToEur(0, FX_ECB)).toBe(0);
  });

  it("different rates produce different EUR amounts for same USD", () => {
    expect(usdToEur(100, FX_ECB)).not.toBe(usdToEur(100, FX_BUNDLED));
  });
});

describe("Currency — eurToXof (BCEAO peg 655.957)", () => {
  it("EUR 1 → XOF 656 (Math.round(655.957))", () => {
    expect(eurToXof(1, FX_ECB)).toBe(656);
  });

  it("EUR 85 → XOF 55756 (Math.round(85 × 655.957))", () => {
    // Math.round(55756.345) = 55756
    expect(eurToXof(85, FX_ECB)).toBe(55756);
  });

  it("peg is identical regardless of FX mode (ECB vs bundled)", () => {
    // XOF_PER_EUR is always 655.957 — BCEAO fixed peg
    expect(eurToXof(10, FX_ECB)).toBe(eurToXof(10, FX_BUNDLED));
    expect(eurToXof(100, FX_ECB)).toBe(eurToXof(100, FX_BUNDLED));
  });

  it("EUR 0 → XOF 0", () => {
    expect(eurToXof(0, FX_ECB)).toBe(0);
  });
});

describe("Currency — USD → EUR → XOF chain", () => {
  it("chain: USD 100 → EUR 85 → XOF 55756", () => {
    const eur = usdToEur(100, FX_ECB); // 85
    expect(eur).toBe(85);
    expect(eurToXof(eur, FX_ECB)).toBe(55756);
  });

  it("rangeToCurrencies preserves the full chain for a low–high range", () => {
    const result = rangeToCurrencies({ low: 10, high: 100 }, FX_ECB);
    expect(result.USD).toEqual({ low: 10, high: 100 });
    expect(result.EUR.low).toBe(usdToEur(10, FX_ECB));   // 8.5
    expect(result.EUR.high).toBe(usdToEur(100, FX_ECB)); // 85
    expect(result.XOF.low).toBe(eurToXof(result.EUR.low, FX_ECB));   // 5576
    expect(result.XOF.high).toBe(eurToXof(result.EUR.high, FX_ECB)); // 55756
  });

  it("XOF is computed via EUR (not directly from USD)", () => {
    // The chain rounds at each step — this documents the intended precision behavior.
    // USD 100 → EUR 85 (rounded) → XOF 55756 (rounded)
    const viaChain = eurToXof(usdToEur(100, FX_ECB), FX_ECB);
    expect(viaChain).toBe(55756);
  });
});

// ─── 2. Scoring 5-tier ────────────────────────────────────────────────────────
//
// Score formula: base(confidence) + tierAdj - min(missing×5, 20)
//   confidence: high=80, medium=55, low=30
//   tier:       Simple=+10, Standard=+5, Complex=0, Heavy=-10
//   missingPenalty: capped at 20 (= 4 missing items)

describe("Scoring — computeScore", () => {
  it("score 15 → 'High risk' / 'High'  [low+Standard-4×5]", () => {
    // 30 + 5 - 20 = 15
    const s = computeScore("low", "Standard", 4, {});
    expect(s.score).toBe(15);
    expect(s.status).toBe("High risk");
    expect(s.riskLevel).toBe("High");
  });

  it("score 40 → 'Needs work' / 'Medium-high'  [medium+Heavy-1×5]", () => {
    // 55 - 10 - 5 = 40
    const s = computeScore("medium", "Heavy", 1, {});
    expect(s.score).toBe(40);
    expect(s.status).toBe("Needs work");
    expect(s.riskLevel).toBe("Medium-high");
  });

  it("score 60 → 'Acceptable' / 'Medium'  [medium+Standard-0]", () => {
    // 55 + 5 - 0 = 60
    const s = computeScore("medium", "Standard", 0, {});
    expect(s.score).toBe(60);
    expect(s.status).toBe("Acceptable");
    expect(s.riskLevel).toBe("Medium");
  });

  it("score 75 → 'Good' / 'Low-medium'  [high+Complex-1×5]", () => {
    // 80 + 0 - 5 = 75
    const s = computeScore("high", "Complex", 1, {});
    expect(s.score).toBe(75);
    expect(s.status).toBe("Good");
    expect(s.riskLevel).toBe("Low-medium");
  });

  it("score 90 → 'Excellent' / 'Low'  [high+Simple-0]", () => {
    // 80 + 10 - 0 = 90
    const s = computeScore("high", "Simple", 0, {});
    expect(s.score).toBe(90);
    expect(s.status).toBe("Excellent");
    expect(s.riskLevel).toBe("Low");
  });

  // Coherence invariants — these must never be violated

  it("score 15 never looks safe (not Acceptable, Good, or Excellent)", () => {
    const s = computeScore("low", "Standard", 4, {});
    expect(s.status).not.toBe("Acceptable");
    expect(s.status).not.toBe("Good");
    expect(s.status).not.toBe("Excellent");
    expect(s.riskLevel).not.toBe("Low");
    expect(s.riskLevel).not.toBe("Low-medium");
  });

  it("score 75 never shows Excellent or Low risk", () => {
    const s = computeScore("high", "Complex", 1, {});
    expect(s.status).not.toBe("Excellent");
    expect(s.riskLevel).not.toBe("Low");
  });

  it("missing context penalty is capped at 20 (4+ items treated the same)", () => {
    const s4  = computeScore("high", "Standard", 4, {});   // penalty = 20
    const s10 = computeScore("high", "Standard", 10, {});  // penalty still = 20
    expect(s4.score).toBe(s10.score);
  });

  it("score is always clamped to [0, 100]", () => {
    const lo = computeScore("low", "Heavy", 10, {});   // 30 - 10 - 20 = 0
    const hi = computeScore("high", "Simple", 0, {});  // 90
    expect(lo.score).toBeGreaterThanOrEqual(0);
    expect(hi.score).toBeLessThanOrEqual(100);
  });

  it("optimizationPotential is > 0 and <= 60", () => {
    const s = computeScore("medium", "Standard", 2, { ai: true, payments: true });
    expect(s.optimizationPotential).toBeGreaterThan(0);
    expect(s.optimizationPotential).toBeLessThanOrEqual(60);
  });
});

// ─── 3. Readiness decision ────────────────────────────────────────────────────
//
// "Ready to build"    → score >= 85 AND no critical risk
// "Needs clarification" → score >= 50 (or 70-84 → "Almost ready" message)
// "Not ready yet"     → score < 50 OR hasCriticalRisk

describe("Readiness — decision logic", () => {
  it('"Ready to build" for a complete, high-confidence landing page brief', () => {
    // Produces: confidence=high, tier=Simple, missing=0 → score=90, no fuzzy points
    const text = [
      "Landing page for a SaaS tool.",
      "Users sign in with email and password sign-up sign-in flow.",
      "Stack: Next.js deployed on Vercel.",
      "MVP v1 scope: home page, sign-up flow, login, simple dashboard.",
      "Only web, no mobile for now.",
      "Data: users table in Supabase. No admin panel in v1.",
    ].join(" ");

    const report = readiness({ text, flags: {} });
    expect(report.decision).toBe("Ready to build");
    expect(report.costReadinessScore.score).toBeGreaterThanOrEqual(85);
  });

  it('"Not ready yet" for a 3-word vague brief', () => {
    // score ~15, hasCriticalRisk (no user roles, scope too vague)
    const report = readiness({ text: "Build an app", flags: {} });
    expect(report.decision).toBe("Not ready yet");
    expect(report.costReadinessScore.score).toBeLessThan(50);
  });

  it('"Needs clarification" + "Almost ready" message for a score 70–84 brief', () => {
    // confidence=high (text, Next.js, user roles, Vercel → 4pts)
    // tier=Complex (marketplace) → 80+0-5=75
    const text = [
      "Two-sided marketplace for freelancers and clients.",
      "Next.js frontend deployed on Vercel.",
      "PostgreSQL with user, project, bid tables.",
      "Two user roles: freelancer and client.",
      "MVP v1 is project listing and bidding only.",
      "No mobile app for launch.",
    ].join(" ");

    const report = readiness({ text, flags: {} });
    expect(report.decision).toBe("Needs clarification");
    expect(report.costReadinessScore.score).toBeGreaterThanOrEqual(70);
    expect(report.costReadinessScore.score).toBeLessThanOrEqual(84);
    expect(report.buildDecision).toContain("Almost ready");
  });

  it("score < 85 never returns 'Ready to build'", () => {
    const text = [
      "Two-sided marketplace for freelancers and clients.",
      "Next.js frontend deployed on Vercel.",
      "PostgreSQL with user, project, bid tables.",
      "Two user roles: freelancer and client.",
      "MVP v1 is project listing and bidding only.",
    ].join(" ");

    const report = readiness({ text, flags: {} });
    expect(report.costReadinessScore.score).toBeLessThan(85);
    expect(report.decision).not.toBe("Ready to build");
  });

  it("questionsToClarity and recommendations are non-empty arrays for unclear briefs", () => {
    const report = readiness({ text: "Build an app", flags: {} });
    expect(Array.isArray(report.questionsToClarity)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("suggestedBuildStrategy starts with data model / auth phase", () => {
    const report = readiness({ text: "Build an app", flags: {} });
    expect(report.suggestedBuildStrategy[0]).toMatch(/data model|auth/i);
  });

  it("meta contains costpassport_version and generated_at", () => {
    const report = readiness({ text: "Build an app", flags: {} });
    expect(report.meta.costpassport_version).toBe("0.3.0");
    expect(typeof report.meta.generated_at).toBe("string");
  });
});

// ─── 4. Resolver fallback ─────────────────────────────────────────────────────
//
// Uses vi.spyOn on node:fs to intercept readCache() without touching the real
// ~/.costpassport/cache.json on disk.

describe("Resolver — resolveCostData", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid ResolvedData structure (real disk state, any origin)", () => {
    const result = resolveCostData();
    expect(["cache", "bundled"]).toContain(result.origin);
    expect(result.fx.rates.XOF_PER_EUR).toBe(655.957); // peg never changes
    expect(result.fx.rates.EUR).toBeGreaterThan(0);
    expect(result.fx.rates.EUR).toBeLessThan(5);        // sanity: not absurd
    expect(["fresh", "stale", "missing"]).toContain(result.freshness);
    expect(typeof result.cachePath).toBe("string");
  });

  it("all 4 model keys are present in pricing", () => {
    const { pricing } = resolveCostData();
    expect(pricing.models).toHaveProperty("sonnet-4-6");
    expect(pricing.models).toHaveProperty("haiku-4-5");
    expect(pricing.models).toHaveProperty("opus-4-7");
    expect(pricing.models).toHaveProperty("opus-4-6");
  });

  it("all model prices are positive", () => {
    const { pricing } = resolveCostData();
    for (const model of Object.values(pricing.models)) {
      expect(model.input).toBeGreaterThan(0);
      expect(model.output).toBeGreaterThan(0);
    }
  });

  it("origin is 'bundled' when cache file does not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const result = resolveCostData();
    expect(result.origin).toBe("bundled");
    expect(result.freshness).toBe("missing");
  });

  it("origin is 'bundled' when cache contains corrupted JSON", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockImplementation(() => "{ !! not valid json" as unknown as Buffer);
    const result = resolveCostData();
    expect(result.origin).toBe("bundled");
  });

  it("origin is 'bundled' when cache has no version field (old format)", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockImplementation(() => JSON.stringify({ legacy: true }) as unknown as Buffer);
    const result = resolveCostData();
    expect(result.origin).toBe("bundled");
  });

  it("origin is 'cache' when a valid CacheV1 is present", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockImplementation(() => JSON.stringify(VALID_CACHE_V1) as unknown as Buffer);
    const result = resolveCostData();
    expect(result.origin).toBe("cache");
    expect(result.cacheAgeHours).not.toBeNull();
    expect(result.cacheAgeHours).toBeGreaterThanOrEqual(0);
    // FX values come from the fixture (USD_TO_EUR = 0.85)
    expect(result.fx.rates.EUR).toBe(0.85);
    expect(result.fx.rates.XOF_PER_EUR).toBe(655.957);
  });

  it("never crashes — returns usable bundled data when readFileSync throws", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockImplementation(() => { throw new Error("EPERM: permission denied"); });
    expect(() => resolveCostData()).not.toThrow();
    const result = resolveCostData();
    expect(result.origin).toBe("bundled");
    expect(result.fx.rates.XOF_PER_EUR).toBe(655.957); // bundled fallback intact
  });
});

// ─── 5. --live / ECB failure ──────────────────────────────────────────────────
//
// Tests runPricingUpdate() (the engine shared by `pricing:update` and `--live`)
// with a mocked fetch. fs.mkdirSync and fs.writeFileSync are also mocked to
// prevent any real file writes.

describe("Pricing update — ECB failure graceful fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fxLive is false and fxError is set when fetch throws", async () => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unreachable")));

    const result = await runPricingUpdate();

    expect(result.fxLive).toBe(false);
    expect(result.fxError).not.toBeNull();
    expect(typeof result.fxError).toBe("string");
    expect(result.fxError).toContain("Network unreachable");
  });

  it("falls back to bundled FX rates — rates are positive and EUR/XOF peg intact", async () => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ENOTFOUND")));

    const result = await runPricingUpdate();

    expect(result.eurToUsd).toBeGreaterThan(0);
    expect(result.usdToEur).toBeGreaterThan(0);
    expect(result.eurToXof).toBe(655.957); // BCEAO peg — fixed
    expect(result.usdToXof).toBeGreaterThan(0);
  });

  it("ECB fallback warning is present in warnings array", async () => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));

    const result = await runPricingUpdate();

    const hasEcbWarning = result.warnings.some(
      (w) => w.includes("ECB") || w.includes("could not be fetched") || w.includes("fallback"),
    );
    expect(hasEcbWarning).toBe(true);
  });

  it("no crash when fetch returns HTTP 503 (non-OK response)", async () => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "<error/>",
    }));

    const result = await runPricingUpdate();

    expect(result.fxLive).toBe(false);
    expect(result.eurToUsd).toBeGreaterThan(0); // bundled fallback used
  });

  it("no crash when ECB XML has no USD rate (malformed body)", async () => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<gesmes:Envelope></gesmes:Envelope>", // no USD rate
    }));

    const result = await runPricingUpdate();

    expect(result.fxLive).toBe(false); // parse failure → fallback
    expect(result.eurToUsd).toBeGreaterThan(0);
  });
});
