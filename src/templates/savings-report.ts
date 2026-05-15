import type { MoneyRange, SavingsLever, SavingsReport } from "../types.js";
import type { SourceMetadata } from "../lib/source-metadata.js";
import { formatSourcesMarkdown } from "../lib/source-metadata.js";
import type { CurrencyCode } from "../lib/currencies.js";
import { DEFAULT_CURRENCIES, convertUsd, formatCurrencyAmount } from "../lib/currencies.js";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtUSD(n: number): string { return "$" + Math.round(n).toLocaleString("en-US"); }

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

export function renderSavingsReport(
  report: SavingsReport,
  selectedCurrencies: readonly CurrencyCode[] = DEFAULT_CURRENCIES,
  usdToEur = 0.92,
  ecbRates: Record<string, number> = {},
  sources?: SourceMetadata,
): string {
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

  for (const currency of selectedCurrencies) {
    let currentMin: number;
    let currentMax: number;
    let optimizedMin: number;
    let optimizedMax: number;

    if (currency === "USD") {
      currentMin = report.currentCost.usd.min;
      currentMax = report.currentCost.usd.max;
      optimizedMin = report.optimizedCost.usd.min;
      optimizedMax = report.optimizedCost.usd.max;
    } else if (currency === "EUR") {
      currentMin = report.currentCost.eur.min;
      currentMax = report.currentCost.eur.max;
      optimizedMin = report.optimizedCost.eur.min;
      optimizedMax = report.optimizedCost.eur.max;
    } else if (currency === "XOF") {
      currentMin = report.currentCost.xof.min;
      currentMax = report.currentCost.xof.max;
      optimizedMin = report.optimizedCost.xof.min;
      optimizedMax = report.optimizedCost.xof.max;
    } else {
      currentMin = convertUsd(report.currentCost.usd.min, currency, usdToEur, ecbRates);
      currentMax = convertUsd(report.currentCost.usd.max, currency, usdToEur, ecbRates);
      optimizedMin = convertUsd(report.optimizedCost.usd.min, currency, usdToEur, ecbRates);
      optimizedMax = convertUsd(report.optimizedCost.usd.max, currency, usdToEur, ecbRates);
    }

    const fmtCurrent = `${formatCurrencyAmount(currentMin, currency)} – ${formatCurrencyAmount(currentMax, currency)}`;
    const fmtOptimized = `${formatCurrencyAmount(optimizedMin, currency)} – ${formatCurrencyAmount(optimizedMax, currency)}`;
    lines.push(`| ${currency} | ${fmtCurrent} | ${fmtOptimized} |`);
  }

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

  for (const currency of selectedCurrencies) {
    let savMin: number;
    let savMax: number;

    if (currency === "USD") {
      savMin = report.potentialSavings.usd.min;
      savMax = report.potentialSavings.usd.max;
    } else if (currency === "EUR") {
      savMin = report.potentialSavings.eur.min;
      savMax = report.potentialSavings.eur.max;
    } else if (currency === "XOF") {
      savMin = report.potentialSavings.xof.min;
      savMax = report.potentialSavings.xof.max;
    } else {
      savMin = convertUsd(report.potentialSavings.usd.min, currency, usdToEur, ecbRates);
      savMax = convertUsd(report.potentialSavings.usd.max, currency, usdToEur, ecbRates);
    }

    lines.push(`| ${currency} | ${formatCurrencyAmount(savMin, currency)} | ${formatCurrencyAmount(savMax, currency)} |`);
  }

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
