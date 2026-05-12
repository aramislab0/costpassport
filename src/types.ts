export type ProjectType =
  | "landing"
  | "saas"
  | "marketplace"
  | "ecommerce"
  | "internal-tool"
  | "mobile-app"
  | "ai-app"
  | "other";

export type ComplexityTier = "Simple" | "Standard" | "Complex" | "Heavy";

export type Confidence = "low" | "medium" | "high";

export type ScenarioName = "economy" | "standard" | "premium";

export type ModelKey = "opus-4-7" | "opus-4-6" | "sonnet-4-6" | "haiku-4-5";

export interface Range {
  low: number;
  high: number;
}

export interface CurrencyRange {
  USD: Range;
  EUR: Range;
  XOF: Range;
}

export type ModelMix = Partial<Record<ModelKey, number>>;

export interface BriefFlags {
  stack?: string;
  mobile?: boolean;
  payments?: boolean;
  ai?: boolean;
  realtime?: boolean;
  i18n?: boolean;
  refactor?: boolean;
  legacy?: boolean;
}

export interface Scenario {
  name: ScenarioName;
  totalTokensRange: Range;
  inputTokensRange: Range;
  outputTokensRange: Range;
  inputOutputRatio: { input: number; output: number };
  modelMix: ModelMix;
  cost: CurrencyRange;
}

export interface CostReadinessScore {
  score: number;
  status: string;
  riskLevel: "Low" | "Low-medium" | "Medium" | "Medium-high" | "High";
  optimizationPotential: number;
}

export type TokenBloatRisk = "Low" | "Low-medium" | "Medium" | "Medium-high" | "High" | "Critical";

export interface ContextDiet {
  remove: string[];
  compress: string[];
  split: string[];
  clarify: string[];
  defer: string[];
  isolate: string[];
}

export interface OptimizationPlan {
  immediateFixes: string[];
  structuralFixes: string[];
  advancedFixes: string[];
}

export interface TokenDoctorReport {
  tokenBloatRisk: TokenBloatRisk;
  costReadinessScore: CostReadinessScore;
  mainTokenLeaks: string[];
  contextDiet: ContextDiet;
  optimizationPlan: OptimizationPlan;
  estimatedSavingsPotential: { minPercent: number; maxPercent: number };
  recommendedNextAction: string;
  assumptions: string[];
  disclaimer: string;
  meta: { generated_at: string; costpassport_version: string };
}

export interface SavingsLever {
  name: string;
  estimatedImpactMin: number;
  estimatedImpactMax: number;
  action: string;
}

export interface MoneyRange {
  min: number;
  max: number;
}

export interface SavingsReport {
  currentCost: {
    scenario: "Standard";
    usd: MoneyRange;
    eur: MoneyRange;
    xof: MoneyRange;
  };
  optimizedCost: {
    usd: MoneyRange;
    eur: MoneyRange;
    xof: MoneyRange;
  };
  potentialSavings: {
    usd: MoneyRange;
    eur: MoneyRange;
    xof: MoneyRange;
    minPercent: number;
    maxPercent: number;
  };
  savingsLevers: SavingsLever[];
  priorityActions: {
    highImpact: string[];
    mediumImpact: string[];
    lowImpact: string[];
  };
  agencyFreelanceNote: string;
  recommendedNextAction: string;
  assumptions: string[];
  disclaimer: string;
  meta: { generated_at: string; costpassport_version: string };
}

export type ReadinessDecision = "Ready to build" | "Needs clarification" | "Not ready yet";

export interface ReadinessReport {
  decision: ReadinessDecision;
  buildDecision: string;
  costReadinessScore: CostReadinessScore;
  confidence: Confidence;
  tokenWasteRisk: "Low" | "Medium" | "High";
  fuzzyPoints: string[];
  questionsToClarity: string[];
  recommendations: string[];
  suggestedBuildStrategy: string[];
  disclaimer: string;
  meta: {
    generated_at: string;
    costpassport_version: string;
  };
}

export interface Estimate {
  projectType: ProjectType;
  complexityTier: ComplexityTier;
  baseTokensRange: Range;
  adjustedTokensRange: Range;
  confidence: Confidence;
  missingContext: string[];
  costReadinessScore: CostReadinessScore;
  scenarios: Record<ScenarioName, Scenario>;
  topCostDrivers: string[];
  optimizationHints: string[];
  assumptions: string[];
  disclaimer: string;
  meta: {
    generated_at: string;
    costpassport_version: string;
    pricing_verified_at: string;
  };
}

export interface PricingModel {
  label: string;
  input: number;
  output: number;
  cache_hit: number;
  cache_write_5m?: number;
  cache_write_1h?: number;
}

export interface PricingTable {
  pricing_last_verified: string;
  source_note: string;
  batch_discount: number;
  opus_4_7_tokenizer_risk: string;
  currency: string;
  unit: string;
  models: Record<ModelKey, PricingModel>;
}

export interface FxTable {
  base: string;
  rates: {
    EUR: number;
    XOF_PER_EUR: number;
  };
  last_updated: string;
  mode: string;
  warning: string;
}

export interface ResolvedData {
  pricing: PricingTable;
  fx: FxTable;
  /** "cache" = ~/.costpassport/cache.json was used; "bundled" = fallback to compiled-in JSON */
  origin: "cache" | "bundled";
  cachePath: string;
  cacheExists: boolean;
  /** Hours since cache was written. null when no cache exists. */
  cacheAgeHours: number | null;
  /** fresh < 24h | stale 24h–720h | missing = no cache or invalid */
  freshness: "fresh" | "stale" | "missing";
  pricingVerifiedAt: string | null;
  fxVerifiedAt: string | null;
  sources: {
    pricing: string;
    fx: string;
  };
}

// ─── CTOP — CostPassport Token Optimization Protocol ─────────────────────────

export type ContextCategory =
  | "STABLE_CONTEXT"
  | "TASK_CONTEXT"
  | "CODE_CONTEXT"
  | "NOISY_CONTEXT"
  | "REPEATED_CONTEXT"
  | "UNKNOWN_CONTEXT";

export type ContextDecision =
  | "KEEP"
  | "CACHE"
  | "COMPRESS"
  | "SPLIT"
  | "EXCLUDE"
  | "DEFER"
  | "CLARIFY";

export interface ContextElement {
  name: string;
  category: ContextCategory;
  decision: ContextDecision;
  /** 1–10 relative token weight */
  token_weight: number;
  /** 0–1 how relevant to the current task */
  relevance_score: number;
  /** 0–1 higher = more stable = more cacheable */
  stability_score: number;
  /** 0–1 higher = more likely to waste tokens */
  risk_score: number;
  /** 0–1 how often this context is reused across sessions */
  reuse_frequency: number;
  rationale: string;
}

export interface CtopAction {
  id: string;
  name: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedTokensSaved: number;
  estimatedSavingsPercent: number;
  /** Composite impact score used for action prioritization */
  impact_score: number;
  implementation: string;
  reversibility: "immediate" | "low_effort" | "medium_effort" | "high_effort";
  confidence: "high" | "medium" | "low";
}

export interface CtopModelRouting {
  model: string;
  useFor: string[];
  avoidFor: string[];
  rationale: string;
}

export interface CtopBudgetGuardrail {
  name: string;
  rule: string;
  threshold?: string;
  action: string;
}

export interface CtopFreePreview {
  protocol: "CTOP";
  access: "free_preview";
  proFeature: true;
  riskLevel: string;
  currentTokensRange: Range;
  estimatedSavingsPercent: { low: number; high: number };
  topActionsPreview: Array<{ name: string; action: string }>;
  lockedSections: string[];
  upgradeMessage: string;
  recommendedNextAction: string;
  meta: { generated_at: string; costpassport_version: string };
}

/** Full Pro report — returned by the Pro engine, not available in public CLI */
export interface CtopProReport {
  protocol: "CTOP";
  access: "pro";
  version: "1.0";
  riskLevel: string;
  currentTokensRange: Range;
  optimizedTokensRange: Range;
  estimatedSavings: {
    percent: { low: number; high: number };
    USD: { low: number; high: number };
    EUR: { low: number; high: number };
    XOF: { low: number; high: number };
  };
  topActions: CtopAction[];
  contextDecisions: ContextElement[];
  modelRouting: CtopModelRouting[];
  promptCachingStrategy: string[];
  buildPhases: string[];
  budgetGuardrails: CtopBudgetGuardrail[];
  /** Present only when --write was used */
  promptPackFiles?: string[];
  recommendedNextAction: string;
  disclaimer: string;
  meta: { generated_at: string; costpassport_version: string };
}

export type CtopReport = CtopFreePreview | CtopProReport;
