/**
 * src/templates/passport-report.ts — AI Work Passport Markdown renderer
 *
 * Renders a PassportReport to Markdown. Named passport-report.ts to avoid
 * collision with src/templates/passport.ts (which renders Estimate objects).
 */

import type { PassportReport, PassportRiskLevel } from "../types.js";
import type { SourceMetadata } from "../lib/source-metadata.js";
import { formatSourcesMarkdown } from "../lib/source-metadata.js";

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

function fmtEUR(n: number): string {
  return "€" + Math.round(n).toLocaleString("en-US");
}

function fmtXOF(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " XOF";
}

function fmtRange(
  low: number,
  high: number,
  fmt: (n: number) => string,
): string {
  return `${fmt(low)} – ${fmt(high)}`;
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function renderPassportReport(
  report: PassportReport,
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
  lines.push("| Scenario | USD | EUR | XOF |");
  lines.push("|---|---|---|---|");

  const { economy, standard, premium } = report.cost;
  lines.push(`| Economy | ${fmtRange(economy.usd.low, economy.usd.high, fmtUSD)} | ${fmtRange(economy.eur.low, economy.eur.high, fmtEUR)} | ${fmtRange(economy.xof.low, economy.xof.high, fmtXOF)} |`);
  lines.push(`| **Standard** *(recommended)* | **${fmtRange(standard.usd.low, standard.usd.high, fmtUSD)}** | **${fmtRange(standard.eur.low, standard.eur.high, fmtEUR)}** | **${fmtRange(standard.xof.low, standard.xof.high, fmtXOF)}** |`);
  lines.push(`| Premium | ${fmtRange(premium.usd.low, premium.usd.high, fmtUSD)} | ${fmtRange(premium.eur.low, premium.eur.high, fmtEUR)} | ${fmtRange(premium.xof.low, premium.xof.high, fmtXOF)} |`);

  lines.push("");
  lines.push("### Savings Opportunity");
  lines.push("");
  const sav = report.cost.savingsOpportunity;
  lines.push(`- Potential savings: **${sav.minPercent}–${sav.maxPercent}%**`);
  lines.push(`- In USD: ${fmtUSD(sav.usd.min)} – ${fmtUSD(sav.usd.max)}`);
  lines.push(`- In EUR: ${fmtEUR(sav.eur.min)} – ${fmtEUR(sav.eur.max)}`);
  lines.push(`- In XOF: ${fmtXOF(sav.xof.min)} – ${fmtXOF(sav.xof.max)}`);
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
