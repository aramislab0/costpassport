import type { Command } from "commander";
import { runPricingUpdate } from "../engines/pricing-update.js";

export function registerPricingUpdateCommand(program: Command): void {
  program
    .command("pricing:update")
    .description("Refresh local pricing cache: fetch FX from ECB, update Anthropic pricing table")
    .action(async () => {
      try {
        process.stdout.write("Fetching pricing and FX data...\n\n");
        const r = await runPricingUpdate();

        const lines: string[] = [];

        lines.push("CostPassport pricing cache updated.\n");

        lines.push("Pricing:");
        lines.push("  Provider:    Anthropic");
        lines.push("  Source:      official Anthropic pricing docs");
        lines.push("  Method:      manual table with official source");
        lines.push(`  Verified at: ${r.pricingVerifiedAt}`);
        lines.push("");

        lines.push("FX:");
        lines.push(`  EUR/USD:     ${r.eurToUsd}`);
        lines.push(`  USD/EUR:     ${r.usdToEur}`);
        lines.push(`  EUR/XOF:     ${r.eurToXof}`);
        lines.push(`  USD/XOF:     ${r.usdToXof}`);
        lines.push(
          `  Source:      ${r.fxLive ? "ECB eurofxref + BCEAO fixed peg" : "Bundled fallback (ECB fetch failed)"}`
        );
        lines.push(`  Verified at: ${r.fxVerifiedAt}`);
        lines.push("");

        lines.push("Cache:");
        lines.push(`  Path:   ${r.cachePath}`);
        lines.push("  Status: fresh");
        lines.push("");

        lines.push("Warnings:");
        for (const w of r.warnings) {
          lines.push(`  - ${w}`);
        }
        lines.push("");

        process.stdout.write(lines.join("\n") + "\n");
      } catch (err) {
        process.stderr.write(
          `[costpassport] pricing:update failed: ${(err as Error).message}\n`
        );
        process.exit(1);
      }
    });
}
