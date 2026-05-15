/**
 * src/engines/optimize.ts — CTOP free preview (public build)
 *
 * CostPassport Token Optimization Protocol — public CLI version.
 * Produces a free preview with top actions and savings estimate.
 *
 * Advanced optimization features are planned for a future Pro version.
 */

const VERSION = "0.4.0";

import type {
  BriefFlags,
  CtopFreePreview,
  CtopReport,
  Range,
} from "../types.js";
import { estimate as runEstimate } from "./estimate.js";
import { resolveCostData } from "../data/resolver.js";

// ─── Risk level ───────────────────────────────────────────────────────────────

function riskLevel(low: number, high: number): string {
  const mid = (low + high) / 2;
  if (mid < 100_000) return "Low";
  if (mid < 250_000) return "Low-medium";
  if (mid < 500_000) return "Medium";
  if (mid < 1_000_000) return "Medium-high";
  return "High";
}

// ─── Savings estimate (generic, no detailed formula exposed) ──────────────────

function genericSavings(tokenHigh: number): { low: number; high: number } {
  if (tokenHigh > 2_000_000) return { low: 40, high: 70 };
  if (tokenHigh > 500_000) return { low: 25, high: 55 };
  return { low: 15, high: 40 };
}

// ─── Generic top-3 preview actions ───────────────────────────────────────────
// Deliberately non-specific — full scored action list is a Pro feature.

function genericActions(
  text: string,
  flags: BriefFlags,
): Array<{ name: string; action: string }> {
  const t = text.toLowerCase();
  const actions: Array<{ name: string; action: string }> = [];

  const hasNode = /node|next|react|nuxt|astro/.test(t) || !!flags.stack;
  actions.push({
    name: hasNode
      ? "Exclude build artifacts from AI context"
      : "Exclude non-essential files from AI context",
    action: hasNode
      ? "Add node_modules/, dist/, .next/, coverage/ to .claudeignore — these directories have zero relevance and inflate context cost."
      : "Audit which files your AI agent reads and exclude logs, dependencies, and build outputs.",
  });

  const hasClaudeMd = /claude\.?md/.test(t);
  actions.push({
    name: hasClaudeMd
      ? "Keep CLAUDE.md under 80 lines and enable prompt caching"
      : "Create CLAUDE.md as a stable context anchor",
    action: hasClaudeMd
      ? "A stable, compact CLAUDE.md cached as a system prefix reduces per-session input cost by up to 90%."
      : "A CLAUDE.md under 80 lines — project description, stack, auth flow, roles — cached as system prefix cuts 50–200k repeated tokens per day.",
  });

  const mentionsPayments = flags.payments || /payment|checkout|billing/.test(t);
  const mentionsRealtime = flags.realtime || /real-?time|websocket/.test(t);

  if (mentionsPayments) {
    actions.push({
      name: "Specify payment provider before build",
      action: "Undefined payment flows cause the most expensive clarification loops. Add provider, webhook strategy, and settlement flow to CLAUDE.md before writing a line of code.",
    });
  } else if (mentionsRealtime) {
    actions.push({
      name: "Defer real-time architecture to Phase 2",
      action: "Build and validate CRUD first. Adding WebSocket/SSE on top of unvalidated business logic is the most common cause of full-rework sessions.",
    });
  } else {
    actions.push({
      name: "Route mechanical tasks to a cheaper model",
      action: "File reading, scaffolding, and test generation don't need your most expensive model. Routing these to a smaller model cuts per-task cost by 40–80%.",
    });
  }

  return actions.slice(0, 3);
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export interface OptimizeOptions {
  text: string;
  flags: BriefFlags;
  write?: boolean;
}

export function optimize(opts: OptimizeOptions): CtopReport {
  const { text, flags, write } = opts;

  // Warn about --write before doing any work
  if (write) {
    process.stderr.write(
      "[costpassport] Prompt Pack generation is a CostPassport Pro feature and is not available in the public CLI yet.\n",
    );
    process.exit(1);
  }

  // Baseline estimate
  const est = runEstimate({ text, flags });
  const currentRange: Range = est.adjustedTokensRange;

  // Savings (generic bands — no detailed formula in public build)
  const savings = genericSavings(currentRange.high);

  const now = new Date().toISOString();

  const report: CtopFreePreview = {
    protocol: "CTOP",
    access: "free_preview",
    proFeature: true,
    riskLevel: riskLevel(currentRange.low, currentRange.high),
    currentTokensRange: currentRange,
    estimatedSavingsPercent: savings,
    topActionsPreview: genericActions(text, flags),
    lockedSections: [
      "Full optimization action list with scored priorities",
      "Advanced project optimization review",
      "Model routing guide (Haiku / Sonnet / Opus task assignment)",
      "Prompt caching implementation strategy",
      "Build phase sequencing",
      "Budget guardrails",
      "Prompt Pack — 7 generated optimization files (--write)",
    ],
    upgradeMessage:
      "CostPassport Pro is not yet available in the public CLI. Full CTOP reports, model routing, build phase sequencing, and Prompt Pack generation are coming soon.",
    recommendedNextAction:
      "Start with the 3 actions above. For a full CTOP report, check https://costpassport.dev",
    meta: { generated_at: now, costpassport_version: VERSION },
  };

  return report;
}
