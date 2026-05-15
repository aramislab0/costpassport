import { readFileSync } from "fs";
import type { Command } from "commander";
import { estimate } from "../engines/estimate.js";
import { runPricingUpdate } from "../engines/pricing-update.js";
import { renderPassport } from "../templates/passport.js";
import { getSourceMetadata } from "../lib/source-metadata.js";
import { resolveCurrencies } from "../lib/currencies.js";
import { resolveCostData } from "../data/resolver.js";
import type { BriefFlags } from "../types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

export function registerEstimateCommand(program: Command): void {
  program
    .command("estimate")
    .description("Estimate AI token cost for a project brief")
    .option("--brief <file>", "Path to a text file containing the project brief")
    .option("--stack <name>", "Tech stack (e.g. nextjs-supabase)")
    .option("--mobile", "Includes a mobile app", false)
    .option("--payments", "Includes payments integration", false)
    .option("--ai", "Includes AI/ML features", false)
    .option("--realtime", "Includes real-time features", false)
    .option("--i18n", "Includes multi-language support", false)
    .option("--refactor", "Refactoring existing codebase", false)
    .option("--legacy", "Legacy codebase involved", false)
    .option("--format <format>", "Output format: json | markdown | passport", "json")
    .option("--sources", "Show data sources, FX rates and freshness metadata", false)
    .option("--live", "Fetch latest FX rates from ECB before calculating", false)
    .option("--currency <code>", "Add a currency to the default output (e.g. XOF, GBP)")
    .option("--currencies <codes>", "Show only specific currencies (e.g. USD,EUR,XOF)")
    .option("--all-currencies", "Show all supported currencies", false)
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
      sources: boolean;
      live: boolean;
      currency?: string;
      currencies?: string;
      allCurrencies: boolean;
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

      // --live: fetch ECB rates and write cache before running the engine.
      // The engine reads the cache at call time, so it picks up the fresh data.
      let liveResult: Awaited<ReturnType<typeof runPricingUpdate>> | undefined;
      if (opts.live) {
        process.stderr.write("[costpassport] Fetching live FX rates from ECB…\n");
        liveResult = await runPricingUpdate();
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

      const { currencies: selectedCurrencies, error: currencyError } = resolveCurrencies({
        currency: opts.currency,
        currencies: opts.currencies,
        allCurrencies: opts.allCurrencies,
      });
      if (currencyError) {
        process.stderr.write(`[costpassport] ${currencyError}\n`);
        process.exit(1);
      }

      const { fx } = resolveCostData();
      const usdToEur = fx.rates.EUR;
      const ecbRates = fx.ecbRates ?? {};

      const result = estimate({ text, flags });
      const isMarkdown = opts.format === "markdown" || opts.format === "passport";

      if (isMarkdown) {
        const sourceMeta = opts.sources ? getSourceMetadata(liveResult) : undefined;
        process.stdout.write(renderPassport(result, selectedCurrencies, usdToEur, ecbRates, sourceMeta) + "\n");
      } else {
        // JSON — without --sources output is unchanged; with --sources add sources field
        if (opts.sources) {
          const sourceMeta = getSourceMetadata(liveResult);
          process.stdout.write(JSON.stringify({ ...result, sources: sourceMeta }, null, 2) + "\n");
        } else {
          process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        }
      }
    });
}
