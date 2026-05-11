import { readFileSync } from "fs";
import type { Command } from "commander";
import { readiness } from "../engines/readiness.js";
import { renderReadiness } from "../templates/before-you-build.js";
import type { BriefFlags } from "../types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function registerBeforeYouBuildCommand(program: Command): void {
  program
    .command("before-you-build")
    .description("Check if your brief is ready to start building with an AI coding agent")
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
    .action(async (opts: {
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
    }) => {
      let text: string;

      if (opts.brief) {
        text = readFileSync(opts.brief, "utf8").trim();
      } else {
        text = await readStdin();
      }

      if (!text) {
        process.stderr.write("[costpassport] No brief provided. Pipe text via stdin or use --brief <file>.\n");
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

      const report = readiness({ text, flags });

      if (opts.format === "markdown") {
        process.stdout.write(renderReadiness(report) + "\n");
      } else {
        process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      }
    });
}
