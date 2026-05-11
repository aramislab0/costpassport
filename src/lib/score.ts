import type { BriefFlags, ComplexityTier, Confidence, CostReadinessScore } from "../types.js";

const CONFIDENCE_BASE: Record<Confidence, number> = { high: 80, medium: 55, low: 30 };
const TIER_ADJUST: Record<ComplexityTier, number> = { Simple: 10, Standard: 5, Complex: 0, Heavy: -10 };

export function computeScore(
  confidence: Confidence,
  complexityTier: ComplexityTier,
  missingContextCount: number,
  flags: BriefFlags
): CostReadinessScore {
  const base = CONFIDENCE_BASE[confidence];
  const tierAdj = TIER_ADJUST[complexityTier];
  const missingPenalty = Math.min(missingContextCount * 5, 20);
  const score = Math.max(0, Math.min(100, base + tierAdj - missingPenalty));

  const status =
    score >= 85 ? "Excellent" :
    score >= 70 ? "Good" :
    score >= 50 ? "Acceptable" :
    score >= 30 ? "Needs work" :
    "High risk";

  const riskLevel: "Low" | "Low-medium" | "Medium" | "Medium-high" | "High" =
    score >= 85 ? "Low" :
    score >= 70 ? "Low-medium" :
    score >= 50 ? "Medium" :
    score >= 30 ? "Medium-high" :
    "High";

  const optimizationPotential = Math.min(60,
    25 +
    (flags.payments ? 5 : 0) +
    (flags.ai ? 10 : 0) +
    (flags.realtime ? 5 : 0) +
    (confidence === "low" ? 15 : confidence === "medium" ? 5 : 0)
  );

  return { score, status, riskLevel, optimizationPotential };
}
