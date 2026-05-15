/**
 * src/lib/passport-risk.ts — AI Work Passport risk derivation
 *
 * Derives 4 risk dimensions from the 4 public engine outputs.
 * No CTOP Pro logic. No private engine access.
 */

import type {
  Estimate,
  PassportRiskLevel,
  PassportRiskScores,
  ReadinessReport,
  TokenDoctorReport,
} from "../types.js";

// ─── Risk utilities ───────────────────────────────────────────────────────────

const RISK_RANK: Record<PassportRiskLevel, number> = {
  "Low": 0,
  "Low-medium": 1,
  "Medium": 2,
  "Medium-high": 3,
  "High": 4,
};

function maxRisk(...levels: PassportRiskLevel[]): PassportRiskLevel {
  return levels.reduce((a, b) => (RISK_RANK[a] >= RISK_RANK[b] ? a : b));
}

// ─── Cost risk ────────────────────────────────────────────────────────────────

/** Budget risk — driven by the Standard scenario USD high-end cost. */
export function deriveCostRisk(estimate: Estimate): PassportRiskLevel {
  const usdHigh = estimate.scenarios.standard.cost.USD.high;
  if (usdHigh > 150) return "High";
  if (usdHigh > 60) return "Medium-high";
  if (usdHigh > 25) return "Medium";
  if (usdHigh > 10) return "Low-medium";
  return "Low";
}

// ─── Scope risk ───────────────────────────────────────────────────────────────

/** Scope / token-waste risk — driven by tokenWasteRisk + fuzzy point count. */
export function deriveScopeRisk(readiness: ReadinessReport): PassportRiskLevel {
  const tokenWaste = readiness.tokenWasteRisk;
  const fuzzyCount = readiness.fuzzyPoints.length;

  if (tokenWaste === "High" || fuzzyCount >= 6) return "High";
  if (tokenWaste === "Medium" && fuzzyCount >= 4) return "Medium-high";
  if (tokenWaste === "Medium") return "Medium";
  if (fuzzyCount >= 3) return "Medium";
  if (fuzzyCount >= 1) return "Low-medium";
  return "Low";
}

// ─── Context waste risk ───────────────────────────────────────────────────────

/** Context hygiene risk — maps tokenBloatRisk (6-tier) to PassportRiskLevel (5-tier). */
export function deriveContextWasteRisk(doctor: TokenDoctorReport): PassportRiskLevel {
  const risk = doctor.tokenBloatRisk;
  if (risk === "Critical" || risk === "High") return "High";
  if (risk === "Medium-high") return "Medium-high";
  if (risk === "Medium") return "Medium";
  if (risk === "Low-medium") return "Low-medium";
  return "Low";
}

// ─── Quality risk ─────────────────────────────────────────────────────────────

/** Brief quality risk — driven by confidence level and missing context count. */
export function deriveQualityRisk(estimate: Estimate): PassportRiskLevel {
  const confidence = estimate.confidence;
  const missingCount = estimate.missingContext.length;

  if (confidence === "low" && missingCount >= 3) return "High";
  if (confidence === "low") return "Medium-high";
  if (confidence === "medium" && missingCount >= 3) return "Medium-high";
  if (confidence === "medium") return "Medium";
  if (missingCount >= 3) return "Low-medium";
  return "Low";
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export function deriveRisks(
  estimate: Estimate,
  readiness: ReadinessReport,
  doctor: TokenDoctorReport,
): PassportRiskScores {
  const costRisk = deriveCostRisk(estimate);
  const scopeRisk = deriveScopeRisk(readiness);
  const contextWasteRisk = deriveContextWasteRisk(doctor);
  const qualityRisk = deriveQualityRisk(estimate);
  const overallRisk = maxRisk(costRisk, scopeRisk, contextWasteRisk, qualityRisk);

  return { costRisk, scopeRisk, contextWasteRisk, qualityRisk, overallRisk };
}
