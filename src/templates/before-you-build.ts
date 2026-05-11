import type { ReadinessDecision, ReadinessReport } from "../types.js";

const DECISION_BADGE: Record<ReadinessDecision, string> = {
  "Ready to build": "READY TO BUILD",
  "Needs clarification": "NEEDS CLARIFICATION",
  "Not ready yet": "NOT READY YET",
};

function fmtConfidence(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function renderReadiness(report: ReadinessReport): string {
  const lines: string[] = [];

  // Header
  lines.push("# COSTPASSPORT BEFORE-YOU-BUILD CHECK");
  lines.push("");
  lines.push("> Know your AI build cost before you start.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Build Readiness Decision
  lines.push("## Build Readiness Decision");
  lines.push("");
  lines.push(`**${DECISION_BADGE[report.decision]}**`);
  lines.push("");
  lines.push(report.buildDecision);
  lines.push("");
  lines.push("---");
  lines.push("");

  // AI Cost Readiness Score
  lines.push("## AI Cost Readiness Score");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Score | **${report.costReadinessScore.score} / 100** |`);
  lines.push(`| Status | ${report.costReadinessScore.status} |`);
  lines.push(`| Risk Level | ${report.costReadinessScore.riskLevel} |`);
  lines.push(`| Optimization Potential | ${report.costReadinessScore.optimizationPotential}% |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Token Waste Risk
  lines.push("## Token Waste Risk");
  lines.push("");
  lines.push(`**${report.tokenWasteRisk}**`);
  lines.push("");
  if (report.tokenWasteRisk === "High")
    lines.push("Starting the build now risks significant token waste on rework and clarification loops.");
  else if (report.tokenWasteRisk === "Medium")
    lines.push("Some ambiguity remains. Expect iteration overhead on the fuzzy areas listed below.");
  else
    lines.push("Brief is clear enough to proceed with low rework risk.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Confidence
  lines.push("## Confidence");
  lines.push("");
  lines.push(`Estimate confidence: **${fmtConfidence(report.confidence)}**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Missing or Weak Context
  if (report.fuzzyPoints.length > 0) {
    lines.push("## Missing or Weak Context");
    lines.push("");
    lines.push("The following signals are missing or vague in your brief:");
    lines.push("");
    report.fuzzyPoints.forEach(p => lines.push(`- ${p}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Questions to Clarify
  if (report.questionsToClarity.length > 0) {
    lines.push("## Questions to Clarify");
    lines.push("");
    lines.push("Answer these before starting the build:");
    lines.push("");
    report.questionsToClarity.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Recommended Pre-Build Actions
  lines.push("## Recommended Pre-Build Actions");
  lines.push("");
  report.recommendations.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Suggested Build Strategy
  lines.push("## Suggested Build Strategy");
  lines.push("");
  lines.push("Build in phases to reduce rework risk and stay within token budget:");
  lines.push("");
  report.suggestedBuildStrategy.forEach(s => lines.push(`- ${s}`));
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
