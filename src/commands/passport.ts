/**
 * src/commands/passport.ts — `costpassport passport` command
 *
 * Produces an AI Work Passport from a project brief.
 * Orchestrates all 4 public engines: estimate, before-you-build, token-doctor, savings-report.
 * Output: markdown (default) | json.
 * Flags: --live (ECB FX), --sources (data provenance), --output (write to file).
 */

import { readFileSync, writeFileSync } from "fs";
import type { Command } from "commander";
import { passport } from "../engines/passport.js";
import { runPricingUpdate } from "../engines/pricing-update.js";
import { renderPassportReport } from "../templates/passport-report.js";
import { getSourceMetadata } from "../lib/source-metadata.js";
import type { BriefFlags } from "../types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function registerPassportCommand(program: Command): void {
  program
    .command("passport")
    .description("Generate a full AI Work Passport from a project brief")
    .option("--brief <file>", "Path to a text file containing the project brief")
    .option("--format <format>", "Output format: markdown | json", "markdown")
    .option("--output <file>", "Write output to a file instead of stdout")
    .option("--sources", "Show data sources, FX rates and freshness metadata", false)
    .option("--live", "Fetch latest FX rates from ECB before calculating", false)
    .option("--stack <name>", "Tech stack (e.g. nextjs-supabase)")
    .option("--mobile", "Includes a mobile app", false)
    .option("--payments", "Includes payments integration", false)
    .option("--ai", "Includes AI/ML features", false)
    .option("--realtime", "Includes real-time features", false)
    .option("--i18n", "Includes multi-language support", false)
    .option("--refactor", "Refactoring existing codebase", false)
    .option("--legacy", "Legacy codebase involved", false)
    .action(async (opts: {
      brief?: string;
      format: string;
      output?: string;
      sources: boolean;
      live: boolean;
      stack?: string;
      mobile: boolean;
      payments: boolean;
      ai: boolean;
      realtime: boolean;
      i18n: boolean;
      refactor: boolean;
      legacy: boolean;
    }) => {
      let text: string;

      if (opts.brief) {
        text = readFileSync(opts.brief, "utf8").trim();
      } else if (!process.stdin.isTTY) {
        text = await readStdin();
      } else {
        process.stderr.write("[costpassport] No brief provided. Use --brief <file> or pipe text via stdin.\n");
        process.exit(1);
      }

      if (!text) {
        process.stderr.write("[costpassport] Brief is empty. Provide a non-empty project brief.\n");
        process.exit(1);
      }

      // --live: fetch ECB rates before running engines
      let liveResult: Awaited<ReturnType<typeof runPricingUpdate>> | undefined;
      if (opts.live) {
        process.stderr.write("[costpassport] Fetching live FX rates from ECB…\n");
        liveResult = await runPricingUpdate();
        if (liveResult.fxLive) {
          process.stderr.write(
            `[costpassport] ECB rate: EUR/USD ${liveResult.eurToUsd} (${liveResult.fxVerifiedAt})\n`,
          );
        } else {
          process.stderr.write(
            `[costpassport] ECB unavailable — using bundled fallback rates. (${liveResult.fxError ?? "unknown error"})\n`,
          );
        }
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

      const result = passport({ text, flags });

      let output: string;

      if (opts.format === "json") {
        if (opts.sources) {
          const sourceMeta = getSourceMetadata(liveResult);
          output = JSON.stringify({ ...result, sources: sourceMeta }, null, 2);
        } else {
          output = JSON.stringify(result, null, 2);
        }
      } else {
        // markdown (default)
        const sourceMeta = opts.sources ? getSourceMetadata(liveResult) : undefined;
        output = renderPassportReport(result, sourceMeta);
      }

      if (opts.output) {
        writeFileSync(opts.output, output + "\n", "utf8");
        process.stderr.write(`[costpassport] Passport saved to ${opts.output}\n`);
      } else {
        process.stdout.write(output + "\n");
      }
    });
}
