# CostPassport — Project State
**Phase:** v0.3.0 — Published ✅
**Last update:** 2026-05-11
**Version local:** 0.3.0
**Version npm:** 0.3.0 ✅

## Done

### v0.1.x
- v0.1.0: Full MVP — estimate, before-you-build, token-doctor, savings-report ✅
- v0.1.0: npm published, npx costpassport works ✅
- v0.1.1: Scoring coherence fix ✅ npm published ✅

### v0.2.0 — Live Data Layer ✅ (feature complete)
- `src/data/resolver.ts` — loads CacheV1 first, falls back to bundled JSON. D-021.
- `before-you-build` threshold aligned to score >= 85. D-022. ✅
- Resolver wired into estimate + savings engines. D-023. ✅
- `pricing:update` command — ECB live FX + Anthropic table → ~/.costpassport/cache.json. D-024. ✅
  - ECB XML single-quoted attrs handled (resilient regex)
  - Graceful fallback if ECB unreachable
- `--sources` flag on estimate + savings-report. D-025. ✅
  - JSON: additive `sources` field (backward compatible)
  - Markdown: "Sources & Data Freshness" block appended
  - `src/lib/source-metadata.ts` — centralised helper
  - Canonical disclaimer phrase in estimate + savings-report engines
  - FX assumption updated (static → reference rates / ECB or bundled)
- Build: 82.13 KB, 0 warnings ✅
- All smoke tests pass ✅

## Published
- [x] Git commit 970dc88 ✅
- [x] Git tag v0.2.0 ✅
- [x] npm publish v0.2.0 ✅ — `npm view costpassport version` = 0.2.0
- [x] npx costpassport@0.2.0 --help ✅
- [x] npx pricing:update — ECB live, EUR/USD 1.1765 ✅
- [x] npx estimate --sources — data_origin: cache, FX rates visible ✅
- [x] npx savings-report --sources — EUR 18.36 at 0.85 ✅

## Done

### v0.3.0 — Live Flag ✅ (feature complete + published)
- `--live` flag on estimate, token-doctor, savings-report. D-026.
  - Calls `runPricingUpdate()` before engine — zero duplication with `pricing:update`
  - Engine data loading moved to function-level (was module-level) — picks up fresh cache in same process
  - `buildScenario(name, range, pricing, fx)` and `toMoneyRange(usdLow, usdHigh, fx)` — explicit params, no globals
  - Graceful fallback if ECB unreachable — stderr warning, bundled rates used
  - `data_origin: "live_fetch"` in `--sources` output when `--live` is active
  - `LiveRefreshResult` type alias in `source-metadata.ts`; `getSourceMetadata(liveResult?)` optional param
  - `SourceMetadata.data_origin` expanded to `"live_fetch" | "cache" | "bundled"`
- Build: 84.52 KB, 0 warnings ✅
- All smoke tests pass ✅

## Published
- [x] Git commit cc2bf9e ✅
- [x] Git tag v0.3.0 ✅
- [x] npm publish v0.3.0 ✅ — `npm view costpassport version` = 0.3.0
- [x] npx costpassport@0.3.0 --help ✅
- [x] npx pricing:update — ECB live, EUR/USD 1.1765 ✅
- [x] npx estimate --brief marketplace.md --live --sources — data_origin: live_fetch ✅
- [x] npx savings-report --brief marketplace.md --live --sources — EUR 18.36–48.96, savings 15–25% ✅

### v0.3.x patch — Tests ✅ (post-publish, no version bump)
- Vitest installed as dev dependency (v4.1.6). D-027.
- `tests/core.test.ts` — 42 tests, 207ms, 0 failures.
- Coverage: FX chain, scoring 5-tier, readiness decisions, resolver fallback, ECB failure
- `npm test` script added. `npm test:watch` for dev loop.
- tsconfig.json updated to include `tests/**/*`.
- `vitest.config.ts` created.

### CTOP Public Preview ✅ (post-v0.3.0, no version bump) — D-028, D-029
- `costpassport optimize` command added — free preview. ✅
- Output: riskLevel, estimatedSavingsPercent, top 3 actions, 7 locked sections, upgrade message. ✅
- `--write` blocked in public build with clear message. ✅
- Advanced optimization features reserved for a future Pro version. ✅
- `.npmignore` created — excludes source files and private assets from tarball. ✅
- `.gitignore` hardened — private asset patterns added. ✅
- Bundle: 92.18 KB, 0 warnings. Tarball: 10 files, 28.2 KB. ✅
- Tests: 42/42 ✅

### AI Work Passport ✅ (post-v0.3.0, no version bump) — D-030
- `costpassport passport` command added ✅
- 4 risk dimensions: costRisk, scopeRisk, contextWasteRisk, qualityRisk → overallRisk ✅
- Orchestrates estimate(), readiness(), tokenDoctor(), savingsReport() ✅
- Output: markdown (default) | json — --live, --sources, --output flags ✅
- 4 locked Pro sections: Full AI Work Contract, Stop-Loss Rules, Client-Safe Report, Compare Estimated vs Actual ✅
- New files: src/lib/passport-risk.ts, src/engines/passport.ts, src/templates/passport-report.ts, src/commands/passport.ts ✅
- Build: 106.60 KB, 0 warnings ✅
- Tests: 42/42 ✅
- Security grep: clean ✅

## Next — v0.4.0
- OpenAI / Gemini provider support (provider abstraction)
- `--provider` flag on estimate
- Claude Code plugin (MCP wrapper, command palette integration)

## Risks
- Anthropic pricing table: hardcoded in pricing-update.ts — must be updated manually when prices change
- No automated tests — regression risk on each release
