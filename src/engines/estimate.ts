import { rangeToCurrencies } from "../lib/currency.js";
import { computeScore } from "../lib/score.js";
import { resolveCostData } from "../data/resolver.js";
import type {
  BriefFlags,
  ComplexityTier,
  Confidence,
  Estimate,
  FxTable,
  ModelKey,
  ModelMix,
  PricingTable,
  ProjectType,
  Range,
  Scenario,
  ScenarioName,
} from "../types.js";
import tiersRaw from "../resources/complexity-tiers.json" with { type: "json" };

const VERSION = "0.4.2";

const TIERS_CONFIG = tiersRaw as unknown as {
  tiers: Record<ComplexityTier, Range>;
  multipliers: Record<string, number>;
  addons_tokens: Record<string, number>;
  scenario_factors: Record<ScenarioName, number>;
  scenario_io_ratios: Record<ScenarioName, { input: number; output: number }>;
  scenario_model_mix: Record<ScenarioName, Partial<Record<ModelKey, number>>>;
};

const TIER_ORDER: ComplexityTier[] = ["Simple", "Standard", "Complex", "Heavy"];

function detectProjectType(text: string): ProjectType {
  const t = text.toLowerCase();
  if (/marketplace|three-sided|two-sided|delivery (platform|app)/.test(t)) return "marketplace";
  if (/landing|one-page|coming soon/.test(t)) return "landing";
  if (/e-commerce|online (shop|store)/.test(t)) return "ecommerce";
  if (/saas|crm|admin panel|dashboard platform/.test(t)) return "saas";
  if (/mobile (app|application)|ios|android|expo|react native/.test(t)) return "mobile-app";
  if (/\b(ai|llm|chatbot|agent|copilot)\b/.test(t)) return "ai-app";
  if (/internal tool|backoffice|back-office/.test(t)) return "internal-tool";
  return "other";
}

function detectTier(type: ProjectType, flags: BriefFlags, text: string): ComplexityTier {
  const baseTierMap: Record<ProjectType, ComplexityTier> = {
    landing: "Simple",
    marketplace: "Complex",
    ecommerce: "Complex",
    "ai-app": "Complex",
    saas: "Standard",
    "mobile-app": "Standard",
    "internal-tool": "Standard",
    other: "Standard",
  };

  let idx = TIER_ORDER.indexOf(baseTierMap[type]);
  const t = text.toLowerCase();

  if (/multi-tenant|enterprise grade|saas platform/.test(t)) idx = Math.min(idx + 1, 3);
  if (flags.legacy) idx = Math.min(idx + 1, 3);

  return TIER_ORDER[idx];
}

function applyMultipliersAndAddons(baseRange: Range, flags: BriefFlags): Range {
  let mult = 1.0;
  if (flags.mobile) mult *= 1.3;
  if (flags.refactor) mult *= 1.4;
  if (flags.legacy) mult *= 1.8;

  let addons = 0;
  if (flags.payments) addons += TIERS_CONFIG.addons_tokens.payments;
  if (flags.ai) addons += TIERS_CONFIG.addons_tokens.ai;
  if (flags.realtime) addons += TIERS_CONFIG.addons_tokens.realtime;
  if (flags.i18n) addons += TIERS_CONFIG.addons_tokens.i18n;

  return {
    low: Math.round(baseRange.low * mult + addons),
    high: Math.round(baseRange.high * mult + addons),
  };
}

function buildScenario(
  name: ScenarioName,
  baseRange: Range,
  pricing: PricingTable,
  fx: FxTable,
): Scenario {
  const factor = TIERS_CONFIG.scenario_factors[name];
  const ratio = TIERS_CONFIG.scenario_io_ratios[name];
  const mix: Partial<Record<ModelKey, number>> = TIERS_CONFIG.scenario_model_mix[name];

  const totalLow = Math.round(baseRange.low * factor);
  const totalHigh = Math.round(baseRange.high * factor);

  const inLow = Math.round(totalLow * ratio.input);
  const inHigh = Math.round(totalHigh * ratio.input);
  const outLow = Math.round(totalLow * ratio.output);
  const outHigh = Math.round(totalHigh * ratio.output);

  let blendedInput = 0;
  let blendedOutput = 0;
  for (const [model, share] of Object.entries(mix) as [ModelKey, number][]) {
    blendedInput += share * pricing.models[model].input;
    blendedOutput += share * pricing.models[model].output;
  }

  const usdLow = (inLow / 1e6) * blendedInput + (outLow / 1e6) * blendedOutput;
  const usdHigh = (inHigh / 1e6) * blendedInput + (outHigh / 1e6) * blendedOutput;

  return {
    name,
    totalTokensRange: { low: totalLow, high: totalHigh },
    inputTokensRange: { low: inLow, high: inHigh },
    outputTokensRange: { low: outLow, high: outHigh },
    inputOutputRatio: ratio,
    modelMix: mix as ModelMix,
    cost: rangeToCurrencies({ low: usdLow, high: usdHigh }, fx),
  };
}

function topCostDrivers(flags: BriefFlags, type: ProjectType): string[] {
  const drivers: string[] = [];
  if (type === "marketplace") drivers.push("Marketplace architecture (multi-role complexity)");
  if (flags.payments) drivers.push("Payments integration (+500K tokens)");
  if (flags.ai) drivers.push("AI/ML features (+1M tokens)");
  if (flags.realtime) drivers.push("Real-time features (+800K tokens)");
  if (flags.mobile) drivers.push("Mobile app build (x1.3 multiplier)");
  if (flags.refactor) drivers.push("Refactor over greenfield (x1.4 multiplier)");
  if (flags.legacy) drivers.push("Legacy codebase (x1.8 multiplier)");
  if (flags.i18n) drivers.push("Multi-language support (+200K tokens)");
  return drivers.slice(0, 5);
}

function optimizationHints(flags: BriefFlags): string[] {
  const hints: string[] = [
    "Use Sonnet 4.6 by default; reserve Opus only for architecture decisions",
    "Keep CLAUDE.md under 80 lines; move repeated instructions to skills",
    "Enable prompt caching for stable system context (saves up to 90% on repeated inputs)",
  ];
  if (flags.payments) hints.push("Validate payment flow architecture in isolation before integration to reduce rework");
  if (flags.mobile && (flags.payments || flags.ai)) hints.push("Share auth and business logic between mobile and web via a workspace package");
  if (flags.realtime) hints.push("Build real-time layer last, on top of validated CRUD foundation");
  return hints.slice(0, 5);
}

function assessConfidence(text: string, flags: BriefFlags): { confidence: Confidence; missing: string[] } {
  const t = text.toLowerCase();
  let score = 0;
  const missing: string[] = [];

  if (text.length >= 80) score++;
  else missing.push("scope details (brief is too short)");

  if (flags.stack || /next\.?js|supabase|expo|react native|node|django|rails|laravel|nuxt|astro/.test(t)) score++;
  else missing.push("stack/framework choice");

  if (/role|user|customer|merchant|admin|courier|client|seller|buyer/.test(t)) score++;
  else missing.push("user roles");

  const featureCount = [flags.mobile, flags.payments, flags.ai, flags.realtime, flags.i18n].filter(Boolean).length;
  if (featureCount >= 2) score++;

  if (/deploy|hosting|production|launch|cloud|vercel|fly\.io|aws/.test(t)) score++;
  else missing.push("deployment target");

  if (!/auth|login|sign-?in|sign-?up|oauth|sso/.test(t)) missing.push("auth complexity");

  const confidence: Confidence = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  return { confidence, missing };
}

function buildAssumptions(flags: BriefFlags): string[] {
  const assumptions: string[] = [];
  if (!flags.refactor && !flags.legacy) assumptions.push("Greenfield project (no existing codebase)");
  assumptions.push("Sonnet 4.6 as default model");
  assumptions.push("Solo developer or small team using an AI coding agent");
  assumptions.push("Default prompt caching available for repeated context");
  if (!flags.stack) assumptions.push("Mainstream stack assumed (Next.js + Supabase or equivalent)");
  return assumptions;
}

export function estimate({ text, flags }: { text: string; flags: BriefFlags }): Estimate {
  // Resolved at call time — reads ~/.costpassport/cache.json if available, falls back to bundled JSON.
  // Function-level (not module-level) so --live can write a fresh cache before this runs.
  const { pricing: PRICING, fx: FX } = resolveCostData();

  const projectType = detectProjectType(text);
  const complexityTier = detectTier(projectType, flags, text);
  const baseRange = TIERS_CONFIG.tiers[complexityTier];
  const adjustedRange = applyMultipliersAndAddons(baseRange, flags);

  const { confidence, missing } = assessConfidence(text, flags);
  const costReadinessScore = computeScore(confidence, complexityTier, missing.length, flags);

  const scenarios = {
    economy: buildScenario("economy", adjustedRange, PRICING, FX),
    standard: buildScenario("standard", adjustedRange, PRICING, FX),
    premium: buildScenario("premium", adjustedRange, PRICING, FX),
  };

  const errorMargin = confidence === "low" ? "±50%" : "±30%";

  return {
    projectType,
    complexityTier,
    baseTokensRange: baseRange,
    adjustedTokensRange: adjustedRange,
    confidence,
    missingContext: missing,
    costReadinessScore,
    scenarios,
    topCostDrivers: topCostDrivers(flags, projectType),
    optimizationHints: optimizationHints(flags),
    assumptions: buildAssumptions(flags),
    disclaimer: `Estimates are heuristic. Actual cost may vary ${errorMargin}. CostPassport is calibrated on representative projects, not your specific case. Prices and exchange rates may be verified, but token volume remains an estimate based on project scope.`,
    meta: {
      generated_at: new Date().toISOString(),
      costpassport_version: VERSION,
      pricing_verified_at: PRICING.pricing_last_verified,
    },
  };
}
