/**
 * src/commands/demo.ts — `costpassport demo`
 *
 * Generates an instant AI Work Passport demo using a built-in brief.
 * No brief file required.
 */

import type { Command } from "commander";
import { passport } from "../engines/passport.js";
import { runPricingUpdate } from "../engines/pricing-update.js";
import { renderPassportReport, renderPassportCompact } from "../templates/passport-report.js";
import { getSourceMetadata } from "../lib/source-metadata.js";
import { resolveCurrencies } from "../lib/currencies.js";
import { resolveCostData } from "../data/resolver.js";
import { DEMO_BRIEF } from "../resources/demo-brief.js";

export function registerDemoCommand(program: Command): void {
  program
    .command("demo")
    .description("Generate an instant AI Work Passport demo (no brief required)")
    .option("--compact", "Output a compact screenshotable AI Work Passport", false)
    .option("--format <format>", "Output format: markdown | json", "markdown")
    .option("--live", "Fetch latest FX rates from ECB before calculating", false)
    .option("--sources", "Show data sources, FX rates and freshness metadata", false)
    .action(async (opts: {
      compact: boolean;
      format: string;
      live: boolean;
      sources: boolean;
    }) => {
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

      const { currencies: selectedCurrencies } = resolveCurrencies({});
      const { fx } = resolveCostData();
      const usdToEur = fx.rates.EUR;
      const ecbRates = fx.ecbRates ?? {};

      const result = passport({
        text: DEMO_BRIEF,
        flags: { mobile: true, payments: true, realtime: true },
      });

      let output: string;

      if (opts.format === "json") {
        output = JSON.stringify(result, null, 2);
      } else if (opts.compact) {
        output = renderPassportCompact(result, selectedCurrencies, usdToEur, ecbRates);
      } else {
        const sourceMeta = opts.sources ? getSourceMetadata(liveResult) : undefined;
        output = renderPassportReport(result, selectedCurrencies, usdToEur, ecbRates, sourceMeta);
      }

      process.stdout.write(output + "\n");
    });
}
