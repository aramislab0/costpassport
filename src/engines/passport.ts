/**
 * src/engines/passport.ts — AI Work Passport orchestrator
 *
 * Calls all 4 public engines and derives a unified PassportReport.
 * No CTOP Pro logic. Accepts double estimate() call (savings internally
 * calls estimate() too — accepted for v0.4.0, refactor in v0.5.0).
 */

import { estimate as runEstimate } from "./estimate.js";
import { readiness as runReadiness } from "./readiness.js";
import { tokenDoctor as runDoctor } from "./doctor.js";
import { savingsReport as runSavings } from "./savings.js";
import { deriveRisks } from "../lib/passport-risk.js";
import type {
  BriefFlags,
  PassportCost,
  PassportReadiness,
  PassportReport,
  ReadinessDecision,
  ScenarioName,
} from "../types.js";

const VERSION = "0.3.0";

const LOCKED_PRO_SECTIONS: string[] = [
  "Full AI Work Contract",
  "Stop-Loss Rules",
  "Client-Safe Report",
  "Compare Estimated vs Actual",
];

// ─── Readiness helper ────────────────────────────────────────────────────────

function buildPassportReadiness(
  decision: ReadinessDecision,
  buildDecision: string,
  score: number,
  confidence: "low" | "medium" | "high",
): PassportReadiness {
  // Modification #1: override message for "Ready to build"
  const passportBuildDecision =
    decision === "Ready to build"
      ? "Ready to run with guardrails — start with a scoped first phase and monitor cost."
      : buildDecision;

  return { decision, buildDecision: passportBuildDecision, score, confidence };
}

// ─── Cost helper ─────────────────────────────────────────────────────────────

function buildPassportCost(
  estimateResult: ReturnType<typeof runEstimate>,
  savingsResult: ReturnType<typeof runSavings>,
): PassportCost {
  function scenarioCost(name: ScenarioName) {
    const s = estimateResult.scenarios[name];
    return {
      usd: s.cost.USD,
      eur: s.cost.EUR,
      xof: s.cost.XOF,
    };
  }

  return {
    standard: scenarioCost("standard"),
    economy: scenarioCost("economy"),
    premium: scenarioCost("premium"),
    savingsOpportunity: {
      minPercent: savingsResult.potentialSavings.minPercent,
      maxPercent: savingsResult.potentialSavings.maxPercent,
      usd: savingsResult.potentialSavings.usd,
      eur: savingsResult.potentialSavings.eur,
      xof: savingsResult.potentialSavings.xof,
    },
  };
}

// ─── Priority actions ────────────────────────────────────────────────────────

function buildPriorityActions(
  estimateResult: ReturnType<typeof runEstimate>,
  savingsResult: ReturnType<typeof runSavings>,
  doctorResult: ReturnType<typeof runDoctor>,
): string[] {
  const actions: string[] = [];

  // High-impact savings actions first
  for (const action of savingsResult.priorityActions.highImpact) {
    actions.push(action);
    if (actions.length >= 3) break;
  }

  // Immediate fixes from token doctor
  for (const fix of doctorResult.optimizationPlan.immediateFixes) {
    if (!actions.includes(fix)) actions.push(fix);
    if (actions.length >= 5) break;
  }

  // Medium-impact savings if still room
  for (const action of savingsResult.priorityActions.mediumImpact) {
    if (!actions.includes(action)) actions.push(action);
    if (actions.length >= 7) break;
  }

  // Add optimization hints from estimate if still room
  for (const hint of estimateResult.optimizationHints) {
    if (!actions.includes(hint)) actions.push(hint);
    if (actions.length >= 7) break;
  }

  return actions.slice(0, 7);
}

// ─── Assumptions ─────────────────────────────────────────────────────────────

function buildAssumptions(
  estimateResult: ReturnType<typeof runEstimate>,
  doctorResult: ReturnType<typeof runDoctor>,
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const a of [...estimateResult.assumptions, ...doctorResult.assumptions]) {
    if (!seen.has(a)) { seen.add(a); merged.push(a); }
  }

  return merged.slice(0, 6);
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function passport({ text, flags }: { text: string; flags: BriefFlags }): PassportReport {
  // Run all 4 public engines
  const estimateResult = runEstimate({ text, flags });
  const readinessResult = runReadiness({ text, flags });
  const doctorResult = runDoctor({ text, flags });
  const savingsResult = runSavings({ text, flags });

  // Derive risks from engine outputs
  const risks = deriveRisks(estimateResult, readinessResult, doctorResult);

  const readiness = buildPassportReadiness(
    readinessResult.decision,
    readinessResult.buildDecision,
    estimateResult.costReadinessScore.score,
    estimateResult.confidence,
  );

  const cost = buildPassportCost(estimateResult, savingsResult);

  const priorityActions = buildPriorityActions(estimateResult, savingsResult, doctorResult);

  const assumptions = buildAssumptions(estimateResult, doctorResult);

  return {
    risks,
    readiness,
    cost,
    topCostDrivers: estimateResult.topCostDrivers,
    mainTokenLeaks: doctorResult.mainTokenLeaks,
    priorityActions,
    suggestedBuildStrategy: readinessResult.suggestedBuildStrategy,
    lockedProSections: LOCKED_PRO_SECTIONS,
    assumptions,
    disclaimer:
      "This AI Work Passport is heuristic. CostPassport does not read your source code or team capabilities. " +
      "Estimates may vary ±30–50% from actual AI token cost. " +
      "Prices and exchange rates may be verified, but token volume remains an estimate based on project scope. " +
      "CostPassport runs locally — no project data leaves your machine.",
    meta: {
      generated_at: new Date().toISOString(),
      costpassport_version: VERSION,
      pricing_verified_at: estimateResult.meta.pricing_verified_at,
    },
  };
}
