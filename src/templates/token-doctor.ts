import type { ContextDiet, OptimizationPlan, TokenBloatRisk, TokenDoctorReport } from "../types.js";

const RISK_LABEL: Record<TokenBloatRisk, string> = {
  "Low": "LOW",
  "Low-medium": "LOW-MEDIUM",
  "Medium": "MEDIUM",
  "Medium-high": "MEDIUM-HIGH",
  "High": "HIGH",
  "Critical": "CRITICAL",
};

function fmtSection(label: string, items: string[]): string[] {
  if (items.length === 0) return [];
  return [`**${label}**`, "", ...items.map(i => `- ${i}`), ""];
}

function renderContextDiet(diet: ContextDiet): string[] {
  const lines: string[] = [];
  lines.push(...fmtSection("Remove", diet.remove));
  lines.push(...fmtSection("Compress", diet.compress));
  lines.push(...fmtSection("Split", diet.split));
  lines.push(...fmtSection("Clarify", diet.clarify));
  lines.push(...fmtSection("Defer", diet.defer));
  lines.push(...fmtSection("Isolate", diet.isolate));
  return lines;
}

function renderOptimizationPlan(plan: OptimizationPlan): string[] {
  const lines: string[] = [];

  if (plan.immediateFixes.length > 0) {
    lines.push("**Immediate fixes** *(< 15 minutes)*");
    lines.push("");
    plan.immediateFixes.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }

  if (plan.structuralFixes.length > 0) {
    lines.push("**Structural fixes**");
    lines.push("");
    plan.structuralFixes.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }

  if (plan.advancedFixes.length > 0) {
    lines.push("**Advanced fixes**");
    lines.push("");
    plan.advancedFixes.forEach(f => lines.push(`- ${f}`));
    lines.push("");
  }

  return lines;
}

export function renderTokenDoctor(report: TokenDoctorReport): string {
  const lines: string[] = [];

  // Header
  lines.push("# COSTPASSPORT TOKEN DOCTOR");
  lines.push("");
  lines.push("> Find token bloat before it becomes an invoice.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Diagnosis Summary
  lines.push("## Diagnosis Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Token Bloat Risk | **${RISK_LABEL[report.tokenBloatRisk]}** |`);
  lines.push(`| AI Cost Readiness Score | ${report.costReadinessScore.score} / 100 |`);
  lines.push(`| Status | ${report.costReadinessScore.status} |`);
  lines.push(`| Risk Level | ${report.costReadinessScore.riskLevel} |`);
  lines.push(`| Estimated Savings Potential | ${report.estimatedSavingsPotential.minPercent}–${report.estimatedSavingsPotential.maxPercent}% |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Token Bloat Risk
  lines.push("## Token Bloat Risk");
  lines.push("");
  lines.push(`**${RISK_LABEL[report.tokenBloatRisk]}**`);
  lines.push("");
  const riskDesc: Record<TokenBloatRisk, string> = {
    "Low": "Project context is lean and well-structured. Minimal rework risk.",
    "Low-medium": "Context is mostly clear. Apply the optimizations below to reduce overhead.",
    "Medium": "Some ambiguity detected. Expect iteration overhead if not addressed before build.",
    "Medium-high": "Notable gaps in brief or project context. Clarify before starting.",
    "High": "Significant token waste likely. Do not start a full build before addressing the leaks below.",
    "Critical": "Very high bloat risk. Starting now will cost 2–3× the optimal budget.",
  };
  lines.push(riskDesc[report.tokenBloatRisk]);
  lines.push("");
  lines.push("---");
  lines.push("");

  // AI Cost Readiness Score
  lines.push("## AI Cost Readiness Score");
  lines.push("");
  lines.push(`**${report.costReadinessScore.score} / 100** — ${report.costReadinessScore.status}`);
  lines.push("");
  lines.push(`Optimization potential: **${report.costReadinessScore.optimizationPotential}%**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Main Token Leaks
  if (report.mainTokenLeaks.length > 0) {
    lines.push("## Main Token Leaks");
    lines.push("");
    report.mainTokenLeaks.forEach((l, i) => lines.push(`${i + 1}. ${l}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Context Diet
  lines.push("## Context Diet");
  lines.push("");
  lines.push("Actions to reduce token consumption without losing build quality:");
  lines.push("");
  lines.push(...renderContextDiet(report.contextDiet));
  lines.push("---");
  lines.push("");

  // Optimization Plan
  lines.push("## Optimization Plan");
  lines.push("");
  lines.push(...renderOptimizationPlan(report.optimizationPlan));
  lines.push("---");
  lines.push("");

  // Estimated Savings Potential
  lines.push("## Estimated Savings Potential");
  lines.push("");
  lines.push(`**${report.estimatedSavingsPotential.minPercent}–${report.estimatedSavingsPotential.maxPercent}%** cost reduction achievable by applying the fixes above.`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Recommended Next Action
  lines.push("## Recommended Next Action");
  lines.push("");
  lines.push(report.recommendedNextAction);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Disclaimer
  lines.push("## Disclaimer");
  lines.push("");
  lines.push(report.disclaimer);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Footer
  lines.push("*Privacy: CostPassport runs locally. No project data leaves your machine.*");
  lines.push(`*Generated: ${report.meta.generated_at} · CostPassport v${report.meta.costpassport_version}*`);
  lines.push("");

  return lines.join("\n");
}
