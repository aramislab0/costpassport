/**
 * src/commands/badge.ts — `costpassport badge`
 * Generates a static shields.io badge for GitHub README.
 */
import { writeFileSync, mkdirSync } from "fs";
import type { Command } from "commander";
import { readFileSync } from "fs";
import { passport } from "../engines/passport.js";
import type { BriefFlags } from "../types.js";

function encodeShields(str: string): string {
  return str.replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "%20").replace(/\$/g, "%24");
}

function readinessColor(score: number): string {
  if (score >= 85) return "brightgreen";
  if (score >= 70) return "green";
  if (score >= 50) return "yellow";
  if (score >= 35) return "orange";
  return "red";
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) { chunks.push(chunk as Buffer); }
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function registerBadgeCommand(program: Command): void {
  program
    .command("badge")
    .description("Generate a shields.io badge for your GitHub README")
    .option("--brief <file>", "Path to project brief file")
    .option("--style <type>", "Badge type: readiness | cost", "readiness")
    .option("--output <file>", "Write badge Markdown to file")
    .action(async (opts: { brief?: string; style: string; output?: string }) => {
      let text: string;
      if (opts.brief) {
        text = readFileSync(opts.brief, "utf8").trim();
      } else if (!process.stdin.isTTY) {
        text = await readStdin();
      } else {
        process.stderr.write("[costpassport] No brief provided. Use --brief <file> or pipe via stdin.\n");
        process.exit(1);
      }
      if (!text) {
        process.stderr.write("[costpassport] Brief is empty.\n");
        process.exit(1);
      }

      const flags: BriefFlags = {};
      const result = passport({ text, flags });
      const score = result.readiness.score;
      const decision = result.readiness.decision;
      const stdUsd = result.cost.standard.usd;

      let badge: string;

      if (opts.style === "cost") {
        const low = Math.round(stdUsd.low);
        const high = Math.round(stdUsd.high);
        const label = encodeShields("AI Build Cost");
        const message = encodeShields(`$${low}-$${high}`);
        badge = `![AI Build Cost: $${low}–$${high}](https://img.shields.io/badge/${label}-${message}-blue)\n`;
      } else {
        // readiness (default)
        const label = encodeShields("AI Work Passport");
        const message = encodeShields(decision);
        const color = readinessColor(score);
        badge = `![AI Work Passport: ${decision}](https://img.shields.io/badge/${label}-${message}-${color})\n`;
      }

      if (opts.output) {
        const outPath = opts.output;
        const dir = outPath.includes("/") ? outPath.split("/").slice(0, -1).join("/") : ".";
        if (dir && dir !== ".") mkdirSync(dir, { recursive: true });
        writeFileSync(outPath, badge, "utf8");
        process.stderr.write(`[costpassport] Badge saved to ${outPath}\n`);
      } else {
        process.stdout.write(badge);
      }
    });
}
