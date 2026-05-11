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
