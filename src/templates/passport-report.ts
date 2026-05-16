/**
 * src/templates/passport-report.ts — AI Work Passport Markdown renderer
 *
 * Renders a PassportReport to Markdown. Named passport-report.ts to avoid
 * collision with src/templates/passport.ts (which renders Estimate objects).
 */

import type { PassportReport, PassportRiskLevel } from "../types.js";
import type { SourceMetadata } from "../lib/source-metadata.js";
import { formatSourcesMarkdown } from "../lib/source-metadata.js";
import type { CurrencyCode } from "../lib/currencies.js";
import { DEFAULT_CURRENCIES, convertUsd, formatCurrencyAmount } from "../lib/currencies.js";

// ─── Risk formatting ──────────────────────────────────────────────────────────

const RISK_EMOJI: Record<PassportRiskLevel, string> = {
  "Low": "🟢",
  "Low-medium": "🟡",
  "Medium": "🟠",
  "Medium-high": "🔴",
  "High": "🔴",
};

function riskBadge(level: PassportRiskLevel): string {
  return `${RISK_EMOJI[level]} **${level}**`;
}

// ─── Number formatting ────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function renderPassportReport(
  report: PassportReport,
  selectedCurrencies: readonly CurrencyCode[] = DEFAULT_CURRENCIES,
  usdToEur = 0.92,
  ecbRates: Record<string, number> = {},
  sources?: SourceMetadata,
): string {
  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push("# AI WORK PASSPORT");
  lines.push("");
  lines.push("> No more surprise AI bills.");
  lines.push("");
  lines.push("**CostPassport · AI Build Cost Passport**");
  lines.push("*Know your AI build cost before you start.*");
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Overall Risk ───────────────────────────────────────────────────────────
  lines.push("## Overall Risk");
  lines.push("");
  lines.push(`**${riskBadge(report.risks.overallRisk)}**`);
  lines.push("");
  lines.push("| Dimension | Risk Level |");
  lines.push("|---|---|");
  lines.push(`| 💰 Budget Risk | ${riskBadge(report.risks.costRisk)} |`);
  lines.push(`| 📋 Scope Risk | ${riskBadge(report.risks.scopeRisk)} |`);
  lines.push(`| 🗃️ Context Waste | ${riskBadge(report.risks.contextWasteRisk)} |`);
  lines.push(`| 📝 Brief Quality | ${riskBadge(report.risks.qualityRisk)} |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Build Readiness ────────────────────────────────────────────────────────
  lines.push("## Build Readiness");
  lines.push("");
  lines.push(`**Decision:** ${report.readiness.decision}`);
  lines.push("");
  lines.push(`> ${report.readiness.buildDecision}`);
  lines.push("");
  lines.push(`- Cost Readiness Score: **${report.readiness.score} / 100**`);
  lines.push(`- Confidence: **${report.readiness.confidence}**`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── AI Build Cost ──────────────────────────────────────────────────────────
  lines.push("## AI Build Cost");
  lines.push("");
  const currencyHeaders = selectedCurrencies.join(" | ");
  lines.push(`| Scenario | ${currencyHeaders} |`);
  lines.push(`|---|${"---|".repeat(selectedCurrencies.length)}`);

  const { economy, standard, premium } = report.cost;

  function fmtScenarioRow(
    label: string,
    usdLow: number,
    usdHigh: number,
    eurLow: number,
    eurHigh: number,
    xofLow: number,
    xofHigh: number,
    bold = false,
  ): string {
    const cols = selectedCurrencies.map(currency => {
      let low: number;
      let high: number;
      if (currency === "USD") { low = usdLow; high = usdHigh; }
      else if (currency === "EUR") { low = eurLow; high = eurHigh; }
      else if (currency === "XOF") { low = xofLow; high = xofHigh; }
      else {
        low = convertUsd(usdLow, currency, usdToEur, ecbRates);
        high = convertUsd(usdHigh, currency, usdToEur, ecbRates);
      }
      const formatted = `${formatCurrencyAmount(low, currency)} – ${formatCurrencyAmount(high, currency)}`;
      return bold ? `**${formatted}**` : formatted;
    });
    return `| ${label} | ${cols.join(" | ")} |`;
  }

  lines.push(fmtScenarioRow("Economy", economy.usd.low, economy.usd.high, economy.eur.low, economy.eur.high, economy.xof.low, economy.xof.high));
  lines.push(fmtScenarioRow("**Standard** *(recommended)*", standard.usd.low, standard.usd.high, standard.eur.low, standard.eur.high, standard.xof.low, standard.xof.high, true));
  lines.push(fmtScenarioRow("Premium", premium.usd.low, premium.usd.high, premium.eur.low, premium.eur.high, premium.xof.low, premium.xof.high));

  lines.push("");
  lines.push("### Savings Opportunity");
  lines.push("");
  const sav = report.cost.savingsOpportunity;
  lines.push(`- Potential savings: **${sav.minPercent}–${sav.maxPercent}%**`);
  lines.push(`- In USD: ${fmtUSD(sav.usd.min)} – ${fmtUSD(sav.usd.max)}`);

  for (const currency of selectedCurrencies) {
    if (currency === "USD") continue; // already shown above
    let savMin: number;
    let savMax: number;
    if (currency === "EUR") { savMin = sav.eur.min; savMax = sav.eur.max; }
    else if (currency === "XOF") { savMin = sav.xof.min; savMax = sav.xof.max; }
    else {
      savMin = convertUsd(sav.usd.min, currency, usdToEur, ecbRates);
      savMax = convertUsd(sav.usd.max, currency, usdToEur, ecbRates);
    }
    lines.push(`- In ${currency}: ${formatCurrencyAmount(savMin, currency)} – ${formatCurrencyAmount(savMax, currency)}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Top Cost Drivers ───────────────────────────────────────────────────────
  if (report.topCostDrivers.length > 0) {
    lines.push("## Top Cost Drivers");
    lines.push("");
    report.topCostDrivers.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Token Leaks ────────────────────────────────────────────────────────────
  if (report.mainTokenLeaks.length > 0) {
    lines.push("## Token Leaks");
    lines.push("");
    lines.push("Issues that inflate your AI token bill:");
    lines.push("");
    report.mainTokenLeaks.forEach(l => lines.push(`- ⚠️ ${l}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Priority Actions ───────────────────────────────────────────────────────
  if (report.priorityActions.length > 0) {
    lines.push("## Priority Actions");
    lines.push("");
    lines.push("Apply these before starting your build:");
    lines.push("");
    report.priorityActions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Suggested Build Strategy ───────────────────────────────────────────────
  if (report.suggestedBuildStrategy.length > 0) {
    lines.push("## Suggested Build Strategy");
    lines.push("");
    report.suggestedBuildStrategy.forEach(s => lines.push(`- ${s}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Pro Features (locked) ──────────────────────────────────────────────────
  lines.push("## Pro Features *(not included in public CLI)*");
  lines.push("");
  lines.push("The following sections are available in a future CostPassport Pro version:");
  lines.push("");
  report.lockedProSections.forEach(s => lines.push(`- 🔒 ${s}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Assumptions ───────────────────────────────────────────────────────────
  lines.push("## Assumptions");
  lines.push("");
  report.assumptions.forEach(a => lines.push(`- ${a}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Sources ───────────────────────────────────────────────────────────────
  if (sources) {
    lines.push(formatSourcesMarkdown(sources));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Disclaimer ────────────────────────────────────────────────────────────
  lines.push("## Disclaimer");
  lines.push("");
  lines.push(report.disclaimer);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Footer ────────────────────────────────────────────────────────────────
  lines.push("*Privacy: CostPassport runs locally. No project data leaves your machine.*");
  lines.push(
    `*Generated: ${report.meta.generated_at} · CostPassport v${report.meta.costpassport_version} · Pricing verified: ${report.meta.pricing_verified_at}*`,
  );
  lines.push("");

  return lines.join("\n");
}

// ─── Compact renderer ─────────────────────────────────────────────────────────

export function renderPassportCompact(
  report: PassportReport,
  selectedCurrencies: readonly CurrencyCode[] = DEFAULT_CURRENCIES,
  usdToEur = 0.92,
  ecbRates: Record<string, number> = {},
): string {
  const W = 41; // total width between the outer dashes
  const bar = "─".repeat(W);

  // Cost: show first 2–3 currencies only (compact width)
  const displayCurrencies = selectedCurrencies.length > 3
    ? [...selectedCurrencies.slice(0, 3)]
    : [...selectedCurrencies];

  const stdUsd = report.cost.standard.usd;
  const costParts: string[] = [];
  for (const cur of displayCurrencies) {
    let low: number, high: number;
    if (cur === "USD") { low = stdUsd.low; high = stdUsd.high; }
    else if (cur === "EUR") { low = report.cost.standard.eur.low; high = report.cost.standard.eur.high; }
    else if (cur === "XOF") { low = report.cost.standard.xof.low; high = report.cost.standard.xof.high; }
    else {
      low = convertUsd(stdUsd.low, cur, usdToEur, ecbRates);
      high = convertUsd(stdUsd.high, cur, usdToEur, ecbRates);
    }
    costParts.push(`${formatCurrencyAmount(low, cur)} – ${formatCurrencyAmount(high, cur)}`);
  }
  const moreCurrencies = selectedCurrencies.length > 3 ? ` (+${selectedCurrencies.length - 3} more)` : "";
  const costStr = costParts.join(" · ") + moreCurrencies;

  // Verdict: first sentence of buildDecision
  const verdict = report.readiness.buildDecision.split(".")[0].trim();
  // Top fix: first priority action, shortened
  const topFix = (report.priorityActions[0] ?? report.mainTokenLeaks[0] ?? "Review project brief").slice(0, 45);

  function row(label: string, value: string): string {
    const labelPad = label.padEnd(11);
    return `  ${labelPad}${value}`;
  }

  const lines: string[] = [
    bar,
    "  AI WORK PASSPORT",
    bar,
    row("Readiness", `${report.readiness.score} / 100 — ${report.readiness.decision}`),
    row("Overall Risk", report.risks.overallRisk),
    row("Scope Risk", report.risks.scopeRisk),
    row("Est. Cost", costStr),
    bar,
    row("Verdict", verdict),
    row("Top Fix", topFix),
    bar,
    "  costpassport · npx costpassport@latest",
    bar,
  ];

  return lines.join("\n");
}
