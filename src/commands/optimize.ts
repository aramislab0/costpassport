/**
 * src/commands/optimize.ts — CTOP optimize command (public build)
 *
 * Produces a free preview only. Pro features are not available in the public CLI.
 */

import { readFileSync } from "fs";
import type { Command } from "commander";
import type { BriefFlags } from "../types.js";
import { optimize } from "../engines/optimize.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function renderFreeMarkdown(report: ReturnType<typeof optimize>): string {
  if (report.access !== "free_preview") return JSON.stringify(report, null, 2);

  const lines: string[] = [
    "# CostPassport — CTOP Token Optimization Protocol",
    "",
    `> **Access:** Free Preview  |  **Risk level:** ${report.riskLevel}`,
    "",
    "## Current Token Estimate",
    "",
    `| Range | Tokens |`,
    `|-------|--------|`,
    `| Low   | ${report.currentTokensRange.low.toLocaleString("en-US")} |`,
    `| High  | ${report.currentTokensRange.high.toLocaleString("en-US")} |`,
    "",
    "## Estimated Savings Potential",
    "",
    `Implementing the recommended actions could reduce token usage by **${report.estimatedSavingsPercent.low}–${report.estimatedSavingsPercent.high}%**.`,
    "",
    "## Top Actions (Preview)",
    "",
  ];

  for (const [i, a] of report.topActionsPreview.entries()) {
    lines.push(`### ${i + 1}. ${a.name}`);
    lines.push("");
    lines.push(`> ${a.action}`);
    lines.push("");
  }

  lines.push("## Unlock Full CTOP Report");
  lines.push("");
  for (const section of report.lockedSections) {
    lines.push(`- 🔒 ${section}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**${report.upgradeMessage}**`);
  lines.push("");
  lines.push(`→ ${report.recommendedNextAction}`);
  lines.push("");
  lines.push(`*Generated at ${report.meta.generated_at} · CostPassport v${report.meta.costpassport_version}*`);

  return lines.join("\n");
}

export function registerOptimizeCommand(program: Command): void {
  program
    .command("optimize")
    .description(
      "CTOP — Analyze token cost structure and get optimization recommendations (free preview).",
    )
    .option("--brief <file>", "Path to a text file containing the project brief")
    .option("--stack <name>", "Tech stack (e.g. nextjs-supabase)")
    .option("--mobile", "Includes a mobile app", false)
    .option("--payments", "Includes payments integration", false)
    .option("--ai", "Includes AI/ML features", false)
    .option("--realtime", "Includes real-time features", false)
    .option("--i18n", "Includes multi-language support", false)
    .option("--refactor", "Refactoring existing codebase", false)
    .option("--legacy", "Legacy codebase involved", false)
    .option("--format <format>", "Output format: json | markdown", "json")
    .option(
      "--write",
      "Prompt Pack generation (CostPassport Pro — not available yet)",
      false,
    )
    .action(
      async (opts: {
        brief?: string;
        stack?: string;
        mobile: boolean;
        payments: boolean;
        ai: boolean;
        realtime: boolean;
        i18n: boolean;
        refactor: boolean;
        legacy: boolean;
        format: string;
        write: boolean;
      }) => {
        // ─── Read brief ──────────────────────────────────────────────────────

        let text: string;
        if (opts.brief) {
          text = readFileSync(opts.brief, "utf8").trim();
        } else if (process.stdin.isTTY) {
          process.stderr.write(
            "[costpassport] No brief provided. Use --brief <file> or pipe via stdin.\n",
          );
          process.exit(1);
        } else {
          text = await readStdin();
        }

        if (!text) {
          process.stderr.write(
            "[costpassport] Empty brief — provide text via --brief or stdin.\n",
          );
          process.exit(1);
        }

        const flags: BriefFlags = {
          stack: opts.stack,
          mobile: opts.mobile,
          payments: opts.payments,
          ai: opts.ai,
          realtime: opts.realtime,
          i18n: opts.i18n,
          refactor: opts.refactor,
          legacy: opts.legacy,
        };

        // ─── Run engine (--write handled inside engine) ──────────────────────

        const report = optimize({ text, flags, write: opts.write });

        // ─── Output ──────────────────────────────────────────────────────────

        if (opts.format === "markdown") {
          process.stdout.write(renderFreeMarkdown(report) + "\n");
        } else {
          process.stdout.write(JSON.stringify(report, null, 2) + "\n");
        }
      },
    );
}
