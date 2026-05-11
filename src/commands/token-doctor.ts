import { readFileSync } from "fs";
import type { Command } from "commander";
import { tokenDoctor } from "../engines/doctor.js";
import { runPricingUpdate } from "../engines/pricing-update.js";
import { renderTokenDoctor } from "../templates/token-doctor.js";
import type { BriefFlags } from "../types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function registerTokenDoctorCommand(program: Command): void {
  program
    .command("token-doctor")
    .description("Diagnose token bloat and get an optimization plan for your AI build")
    .option("--brief <file>", "Path to a text file containing the project brief")
    .option("--path <directory>", "Path to an existing project directory to scan")
    .option("--stack <name>", "Tech stack (e.g. nextjs-supabase)")
    .option("--mobile", "Includes a mobile app", false)
    .option("--payments", "Includes payments integration", false)
    .option("--ai", "Includes AI/ML features", false)
    .option("--realtime", "Includes real-time features", false)
    .option("--i18n", "Includes multi-language support", false)
    .option("--refactor", "Refactoring existing codebase", false)
    .option("--legacy", "Legacy codebase involved", false)
    .option("--format <format>", "Output format: json | markdown", "json")
    .option("--live", "Fetch latest FX rates from ECB before calculating", false)
    .action(async (opts: {
      brief?: string;
      path?: string;
      stack?: string;
      mobile: boolean;
      payments: boolean;
      ai: boolean;
      realtime: boolean;
      i18n: boolean;
      refactor: boolean;
      legacy: boolean;
      format: string;
      live: boolean;
    }) => {
      let text: string;

      if (opts.brief) {
        text = readFileSync(opts.brief, "utf8").trim();
      } else if (!process.stdin.isTTY) {
        text = await readStdin();
      } else if (!opts.path) {
        process.stderr.write("[costpassport] No brief provided. Pipe text via stdin, use --brief <file>, or use --path <directory>.\n");
        process.exit(1);
        return;
      } else {
        text = "";
      }

      // --live: fetch ECB rates and write cache before running the engine.
      if (opts.live) {
        process.stderr.write("[costpassport] Fetching live FX rates from ECB…\n");
        const liveResult = await runPricingUpdate();
        if (liveResult.fxLive) {
          process.stderr.write(`[costpassport] ECB rate: EUR/USD ${liveResult.eurToUsd} (${liveResult.fxVerifiedAt})\n`);
        } else {
          process.stderr.write(`[costpassport] ECB unavailable — using bundled fallback rates. (${liveResult.fxError ?? "unknown error"})\n`);
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

      const report = tokenDoctor({ text, flags, projectPath: opts.path });

      if (opts.format === "markdown") {
        process.stdout.write(renderTokenDoctor(report) + "\n");
      } else {
        process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      }
    });
}
