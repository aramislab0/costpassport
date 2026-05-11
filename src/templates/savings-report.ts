import type { MoneyRange, SavingsLever, SavingsReport } from "../types.js";
import type { SourceMetadata } from "../lib/source-metadata.js";
import { formatSourcesMarkdown } from "../lib/source-metadata.js";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtUSD(n: number): string { return "$" + Math.round(n).toLocaleString("en-US"); }
function fmtEUR(n: number): string { return "€" + Math.round(n).toLocaleString("en-US"); }
function fmtXOF(n: number): string { return Math.round(n).toLocaleString("fr-FR"); }

function fmtMoneyRange(r: MoneyRange, fmt: (n: number) => string): string {
  return `${fmt(r.min)} – ${fmt(r.max)}`;
}

// ─── Lever impact bar ─────────────────────────────────────────────────────────

function impactTag(lever: SavingsLever): string {
  const mid = (lever.estimatedImpactMin + lever.estimatedImpactMax) / 2;
  if (mid >= 25) return "High";
  if (mid >= 15) return "Medium";
  return "Low";
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function renderSavingsReport(report: SavingsReport, sources?: SourceMetadata): string {
  const lines: string[] = [];

  // Header
  lines.push("# COSTPASSPORT SAVINGS REPORT");
  lines.push("");
  lines.push("> Reduce AI build cost before it becomes an invoice.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Savings Summary
  lines.push("## Savings Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Current cost (Standard) | ${fmtUSD(report.currentCost.usd.min)} – ${fmtUSD(report.currentCost.usd.max)} |`);
  lines.push(`| Optimized cost | ${fmtUSD(report.optimizedCost.usd.min)} – ${fmtUSD(report.optimizedCost.usd.max)} |`);
  lines.push(`| Potential savings | **${report.potentialSavings.minPercent}–${report.potentialSavings.maxPercent}%** |`);
  lines.push(`| Savings levers identified | ${report.savingsLevers.length} |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Current vs Optimized Cost
  lines.push("## Current vs Optimized Cost");
  lines.push("");
  lines.push("| | Current (Standard) | Optimized |");
  lines.push("|---|---|---|");
  lines.push(`| USD | ${fmtMoneyRange(report.currentCost.usd, fmtUSD)} | ${fmtMoneyRange(report.optimizedCost.usd, fmtUSD)} |`);
  lines.push(`| EUR | ${fmtMoneyRange(report.currentCost.eur, fmtEUR)} | ${fmtMoneyRange(report.optimizedCost.eur, fmtEUR)} |`);
  lines.push(`| XOF | ${fmtMoneyRange(report.currentCost.xof, fmtXOF)} | ${fmtMoneyRange(report.optimizedCost.xof, fmtXOF)} |`);
  lines.push("");
  lines.push("> Optimized cost assumes all savings levers below are applied.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Estimated Savings Potential
  lines.push("## Estimated Savings Potential");
  lines.push("");
  lines.push("| Currency | Min savings | Max savings |");
  lines.push("|---|---|---|");
  lines.push(`| USD | ${fmtUSD(report.potentialSavings.usd.min)} | ${fmtUSD(report.potentialSavings.usd.max)} |`);
  lines.push(`| EUR | ${fmtEUR(report.potentialSavings.eur.min)} | ${fmtEUR(report.potentialSavings.eur.max)} |`);
  lines.push(`| XOF | ${fmtXOF(report.potentialSavings.xof.min)} | ${fmtXOF(report.potentialSavings.xof.max)} |`);
  lines.push(`| Rate | ${report.potentialSavings.minPercent}% | ${report.potentialSavings.maxPercent}% |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Main Savings Levers
  lines.push("## Main Savings Levers");
  lines.push("");
  lines.push("| Lever | Impact | Action |");
  lines.push("|---|---:|---|");
  for (const lever of report.savingsLevers) {
    const impact = `${lever.estimatedImpactMin}–${lever.estimatedImpactMax}% (${impactTag(lever)})`;
    lines.push(`| **${lever.name}** | ${impact} | ${lever.action} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Priority Actions
  lines.push("## Priority Actions");
  lines.push("");

  if (report.priorityActions.highImpact.length > 0) {
    lines.push("**High impact**");
    lines.push("");
    report.priorityActions.highImpact.forEach(a => lines.push(`- ${a}`));
    lines.push("");
  }

  if (report.priorityActions.mediumImpact.length > 0) {
    lines.push("**Medium impact**");
    lines.push("");
    report.priorityActions.mediumImpact.forEach(a => lines.push(`- ${a}`));
    lines.push("");
  }

  if (report.priorityActions.lowImpact.length > 0) {
    lines.push("**Low impact**");
    lines.push("");
    report.priorityActions.lowImpact.forEach(a => lines.push(`- ${a}`));
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Agency & Freelance Margin Note
  lines.push("## Agency & Freelance Margin Note");
  lines.push("");
  lines.push(report.agencyFreelanceNote);
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

  // Assumptions
  lines.push("## Assumptions");
  lines.push("");
  report.assumptions.forEach(a => lines.push(`- ${a}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Sources & Data Freshness (only when --sources flag is set)
  if (sources) {
    lines.push(formatSourcesMarkdown(sources));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

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
