import type { Estimate, ScenarioName } from "../types.js";

function riskLevel(score: number): string {
  if (score >= 70) return "Low";
  if (score >= 45) return "Medium";
  return "High";
}

// ─── Number formatting ───────────────────────────────────────────────────────

function fmtM(n: number): string {
  return (n / 1_000_000).toFixed(1) + "M";
}

function fmtRange(low: number, high: number, fmt: (n: number) => string): string {
  return `${fmt(low)} – ${fmt(high)}`;
}

function fmtUSD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtEUR(n: number): string {
  return "€" + Math.round(n).toLocaleString("en-US");
}

function fmtXOF(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

function fmtConfidence(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function fmtProjectType(t: string): string {
  return t.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Recommended next action ─────────────────────────────────────────────────

function recommendedAction(estimate: Estimate, score: number): string {
  if (estimate.missingContext.filter(m => !m.includes("auth")).length > 0) {
    const items = estimate.missingContext.filter(m => !m.includes("auth")).join(", ");
    return `Add missing context (${items}) to your brief and re-run \`costpassport estimate\` for a tighter range.`;
  }
  if (score >= 70) {
    return "Run `costpassport before-you-build` to break down your token budget by project phase and identify high-risk milestones before starting.";
  }
  return "Refine your brief with stack, roles, and deployment target, then re-run to reach Medium or High confidence before starting.";
}

// ─── Scenario label ──────────────────────────────────────────────────────────

const SCENARIO_LABEL: Record<ScenarioName, string> = {
  economy: "Economy",
  standard: "Standard",
  premium: "Premium",
};

const SCENARIO_DESC: Record<ScenarioName, string> = {
  economy: "Haiku + Sonnet mix, minimal iterations",
  standard: "Sonnet 4.6 throughout",
  premium: "Sonnet + Opus mix, intensive iteration",
};

// ─── Main renderer ───────────────────────────────────────────────────────────

export function renderPassport(estimate: Estimate): string {
  const score = estimate.costReadinessScore.score;
  const risk = riskLevel(score);
  const action = recommendedAction(estimate, score);

  const lines: string[] = [];

  // Header
  lines.push("# COSTPASSPORT REPORT");
  lines.push("");
  lines.push("> No more surprise AI bills.");
  lines.push("");
  lines.push("**AI Build Cost Passport**");
  lines.push("*Know your AI build cost before you start.*");
  lines.push("*AI Project Cost Planner for AI-coded projects.*");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Project summary
  lines.push("## Project Summary");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|---|---|");
  lines.push(`| Project Type | ${fmtProjectType(estimate.projectType)} |`);
  lines.push(`| Complexity Tier | ${estimate.complexityTier} |`);
  lines.push(`| Confidence | ${fmtConfidence(estimate.confidence)} |`);
  lines.push(`| AI Cost Readiness Score | ${score} / 100 |`);
  lines.push(`| Risk Level | ${risk} |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Estimated AI build cost
  lines.push("## Estimated AI Build Cost");
  lines.push("");
  lines.push("| Scenario | Model Mix | USD | EUR | XOF |");
  lines.push("|---|---|---|---|---|");

  for (const name of ["economy", "standard", "premium"] as ScenarioName[]) {
    const s = estimate.scenarios[name];
    const usd = fmtRange(s.cost.USD.low, s.cost.USD.high, fmtUSD);
    const eur = fmtRange(s.cost.EUR.low, s.cost.EUR.high, fmtEUR);
    const xof = fmtRange(s.cost.XOF.low, s.cost.XOF.high, fmtXOF);
    lines.push(`| **${SCENARIO_LABEL[name]}** | ${SCENARIO_DESC[name]} | ${usd} | ${eur} | ${xof} |`);
  }

  lines.push("");
  lines.push("> Recommended baseline: budget for the **Standard** scenario.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Token range
  lines.push("## Token Range");
  lines.push("");
  lines.push("| Scenario | Total Tokens | Input | Output | I/O Split |");
  lines.push("|---|---|---|---|---|");

  for (const name of ["economy", "standard", "premium"] as ScenarioName[]) {
    const s = estimate.scenarios[name];
    const total = fmtRange(s.totalTokensRange.low, s.totalTokensRange.high, fmtM);
    const input = fmtRange(s.inputTokensRange.low, s.inputTokensRange.high, fmtM);
    const output = fmtRange(s.outputTokensRange.low, s.outputTokensRange.high, fmtM);
    const split = `${Math.round(s.inputOutputRatio.input * 100)}% / ${Math.round(s.inputOutputRatio.output * 100)}%`;
    lines.push(`| **${SCENARIO_LABEL[name]}** | ${total} | ${input} | ${output} | ${split} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Top cost drivers
  lines.push("## Top Cost Drivers");
  lines.push("");
  estimate.topCostDrivers.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Optimization recommendations
  lines.push("## Optimization Recommendations");
  lines.push("");
  estimate.optimizationHints.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Missing context
  if (estimate.missingContext.length > 0) {
    lines.push("## Missing Context");
    lines.push("");
    lines.push("The following details would improve estimate accuracy:");
    lines.push("");
    estimate.missingContext.forEach(m => lines.push(`- ${m}`));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Assumptions
  lines.push("## Assumptions");
  lines.push("");
  estimate.assumptions.forEach(a => lines.push(`- ${a}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Agency / freelance note
  lines.push("## Agency & Freelance Note");
  lines.push("");
  lines.push("These estimates cover **AI token cost only** — not developer time, hosting, or third-party services.");
  lines.push("A freelance developer using Claude Code may spend 2–5× the estimated token budget on experimentation and iteration.");
  lines.push("An experienced AI-native team typically stays within the Standard scenario range.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Recommended next action
  lines.push("## Recommended Next Action");
  lines.push("");
  lines.push(action);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Disclaimer
  lines.push("## Disclaimer");
  lines.push("");
  lines.push(estimate.disclaimer);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Footer
  lines.push("*Privacy: CostPassport runs locally. No project data leaves your machine.*");
  lines.push(`*Generated: ${estimate.meta.generated_at} · CostPassport v${estimate.meta.costpassport_version} · Pricing verified: ${estimate.meta.pricing_verified_at}*`);
  lines.push("");

  return lines.join("\n");
}
