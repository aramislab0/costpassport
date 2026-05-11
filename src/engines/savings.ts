import { estimate as runEstimate } from "./estimate.js";
import { scanProject } from "../lib/project-scan.js";
import type { ProjectSignals } from "../lib/project-scan.js";
import { usdToEur, eurToXof } from "../lib/currency.js";
import { resolveCostData } from "../data/resolver.js";
import type {
  BriefFlags,
  Estimate,
  FxTable,
  MoneyRange,
  SavingsLever,
  SavingsReport,
} from "../types.js";

const VERSION = "0.3.0";

// ─── Savings % from score ─────────────────────────────────────────────────────

function savingsPercent(estimate: Estimate, signals: ProjectSignals | null): { min: number; max: number } {
  const score = estimate.costReadinessScore.score;
  let base: { min: number; max: number };
  if (score >= 85) base = { min: 10, max: 20 };
  else if (score >= 70) base = { min: 15, max: 25 };
  else if (score >= 50) base = { min: 25, max: 40 };
  else if (score >= 30) base = { min: 35, max: 50 };
  else base = { min: 40, max: 60 };

  // project signals can push the range up
  if (signals !== null) {
    if (!signals.hasClaudeIgnore) { base.min += 3; base.max += 5; }
    if (signals.claudeMdLines > 80) { base.min += 2; base.max += 3; }
    if (signals.hasLargeLogs) { base.max += 5; }
  }

  return { min: Math.min(base.min, 55), max: Math.min(base.max, 70) };
}

// ─── Money helpers ────────────────────────────────────────────────────────────

function toMoneyRange(usdLow: number, usdHigh: number, fx: FxTable): {
  usd: MoneyRange; eur: MoneyRange; xof: MoneyRange;
} {
  const eurLow = usdToEur(usdLow, fx);
  const eurHigh = usdToEur(usdHigh, fx);
  return {
    usd: { min: Math.round(usdLow * 100) / 100, max: Math.round(usdHigh * 100) / 100 },
    eur: { min: eurLow, max: eurHigh },
    xof: { min: eurToXof(eurLow, fx), max: eurToXof(eurHigh, fx) },
  };
}

// ─── Savings levers ───────────────────────────────────────────────────────────

function buildLevers(text: string, flags: BriefFlags, estimate: Estimate, signals: ProjectSignals | null): SavingsLever[] {
  const t = text.toLowerCase();
  const levers: SavingsLever[] = [];

  // Always present
  levers.push({ name: "Prompt caching", estimatedImpactMin: 15, estimatedImpactMax: 40, action: "Enable prompt caching for stable system context — saves up to 90% on repeated inputs" });
  levers.push({ name: "Model routing", estimatedImpactMin: 10, estimatedImpactMax: 25, action: "Use Haiku for summaries, Sonnet for implementation, Opus only for architecture" });
  levers.push({ name: "Context compression", estimatedImpactMin: 10, estimatedImpactMax: 20, action: "Compress brief, CLAUDE.md, and docs before each AI session" });

  // MVP boundary missing
  if (estimate.missingContext.some(m => m.includes("scope")) || !/mvp|phase|milestone|v1\b|out of scope/.test(t))
    levers.push({ name: "MVP clarification", estimatedImpactMin: 20, estimatedImpactMax: 35, action: "Define MVP scope before starting — agents implement what they see, not what you intend" });

  // Multiple surfaces
  const surfaces = [/mobile|ios|android/.test(t), /web|next\.?js|nuxt/.test(t), /admin|backoffice|back.?office/.test(t)].filter(Boolean).length;
  if (surfaces >= 2 || flags.mobile)
    levers.push({ name: "Scope splitting", estimatedImpactMin: 15, estimatedImpactMax: 30, action: "Split mobile, admin, and integrations into separate build lots" });

  if (flags.payments)
    levers.push({ name: "Payment flow isolation", estimatedImpactMin: 10, estimatedImpactMax: 20, action: "Build and test payments in isolation before integrating with the main app" });

  if (signals?.claudeMdLines && signals.claudeMdLines > 80)
    levers.push({ name: "CLAUDE.md compression", estimatedImpactMin: 5, estimatedImpactMax: 15, action: `Trim CLAUDE.md to under 80 lines (currently ~${signals.claudeMdLines} lines)` });

  if (signals !== null && !signals.hasClaudeIgnore)
    levers.push({ name: ".claudeignore strategy", estimatedImpactMin: 5, estimatedImpactMax: 10, action: "Create .claudeignore to exclude dist, logs, and node_modules from AI agent context" });

  if (estimate.missingContext.length >= 3)
    levers.push({ name: "Smaller build batches", estimatedImpactMin: 10, estimatedImpactMax: 20, action: "Submit focused, scoped tasks instead of full-project builds to the AI agent" });

  return levers.slice(0, 6);
}

// ─── Priority actions ─────────────────────────────────────────────────────────

function buildPriorityActions(levers: SavingsLever[]): { highImpact: string[]; mediumImpact: string[]; lowImpact: string[] } {
  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  for (const lever of levers) {
    const mid = (lever.estimatedImpactMin + lever.estimatedImpactMax) / 2;
    const label = `${lever.name}: ${lever.action}`;
    if (mid >= 25) high.push(label);
    else if (mid >= 15) medium.push(label);
    else low.push(label);
  }

  return { highImpact: high, mediumImpact: medium, lowImpact: low };
}

// ─── Recommended action ───────────────────────────────────────────────────────

function recommendedAction(score: number): string {
  if (score >= 85) return "Ready to build. Keep the context lean and track costs.";
  if (score >= 70) return "Safe to continue, but apply the recommended optimizations.";
  if (score >= 50) return "You can start with caution. Split the build into clear phases.";
  if (score >= 30) return "Clarify the brief and reduce context before starting.";
  return "Do not start yet. Clarify scope, context strategy and build phases first.";
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function savingsReport({
  text,
  flags,
  projectPath,
}: {
  text: string;
  flags: BriefFlags;
  projectPath?: string;
}): SavingsReport {
  // Resolved at call time — reads ~/.costpassport/cache.json if available, falls back to bundled JSON.
  // Function-level (not module-level) so --live can write a fresh cache before this runs.
  const { fx: FX } = resolveCostData();

  const signals = projectPath ? scanProject(projectPath) : null;
  const estimateResult = runEstimate({ text: text || "project", flags });

  const standard = estimateResult.scenarios.standard;
  const currentUsdLow = standard.cost.USD.low;
  const currentUsdHigh = standard.cost.USD.high;
  const currentCostRanges = toMoneyRange(currentUsdLow, currentUsdHigh, FX);

  const { min: minSavings, max: maxSavings } = savingsPercent(estimateResult, signals);

  // optimized = current × (1 - savings%), with max savings applied to low, min to high
  const optUsdLow = Math.round(currentUsdLow * (1 - maxSavings / 100) * 100) / 100;
  const optUsdHigh = Math.round(currentUsdHigh * (1 - minSavings / 100) * 100) / 100;
  const optimizedCostRanges = toMoneyRange(optUsdLow, optUsdHigh, FX);

  // savings = current × savings%
  const savUsdMin = Math.round(currentUsdLow * minSavings / 100 * 100) / 100;
  const savUsdMax = Math.round(currentUsdHigh * maxSavings / 100 * 100) / 100;
  const savEurMin = usdToEur(savUsdMin, FX);
  const savEurMax = usdToEur(savUsdMax, FX);

  const levers = buildLevers(text, flags, estimateResult, signals);
  const score = estimateResult.costReadinessScore.score;

  return {
    currentCost: {
      scenario: "Standard",
      usd: currentCostRanges.usd,
      eur: currentCostRanges.eur,
      xof: currentCostRanges.xof,
    },
    optimizedCost: {
      usd: optimizedCostRanges.usd,
      eur: optimizedCostRanges.eur,
      xof: optimizedCostRanges.xof,
    },
    potentialSavings: {
      usd: { min: savUsdMin, max: savUsdMax },
      eur: { min: savEurMin, max: savEurMax },
      xof: { min: eurToXof(savEurMin, FX), max: eurToXof(savEurMax, FX) },
      minPercent: minSavings,
      maxPercent: maxSavings,
    },
    savingsLevers: levers,
    priorityActions: buildPriorityActions(levers),
    agencyFreelanceNote:
      "These estimates cover AI token cost only — not developer time, hosting, or third-party services. " +
      "For agencies and freelancers, add a 20–30% overhead buffer on top of the token budget to account for rework, clarification loops, and unexpected complexity. " +
      "The tighter and more explicit your brief, the smaller the buffer needed.",
    recommendedNextAction: recommendedAction(score),
    assumptions: [
      "Current cost baseline: Standard scenario (Sonnet 4.6, 65% input / 35% output ratio)",
      "Optimized cost assumes all listed levers are applied",
      "Savings percentages are heuristic — actual savings depend on implementation discipline",
      "FX rates are reference rates (ECB via pricing:update or bundled fallback) — verify before client billing",
    ],
    disclaimer:
      "Savings estimates are heuristic. Actual reduction depends on how rigorously optimizations are applied. CostPassport is calibrated on representative projects, not your specific case. Prices and exchange rates may be verified, but token volume remains an estimate based on project scope.",
    meta: { generated_at: new Date().toISOString(), costpassport_version: VERSION },
  };
}
