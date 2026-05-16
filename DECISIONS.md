# Architecture Decisions

## D-032 · Distribution pack before product depth — 2026-05-15
CostPassport needs shareable artifacts and a natural adoption channel before new product depth.
demo, --compact, --share, badge and the Claude Code plugin serve distribution without exposing Pro logic.
Commands/ markdown files (not skills/) chosen for plugin wrappers: simpler, more predictable, no SKILL.md overhead for wrappers that just call npx.
Marketplace uses a local .claude-plugin/marketplace.json sibling folder to claude-plugin/.
Both plugin folders excluded from npm tarball via package.json files allowlist.

## D-031 · Multi-currency support — 2026-05-15
Default currencies changed from USD/EUR/XOF to USD/EUR/JPY (BIS top-traded currencies).
XOF stays supported but is no longer shown by default — available via `--currency XOF`.
16 supported currencies total: 15 major (BIS-ranked) + XOF (BCEAO fixed peg).
New file: src/lib/currencies.ts — CurrencyCode type, SUPPORTED_CURRENCIES, DEFAULT_CURRENCIES, convertUsd(), formatCurrencyAmount(), resolveCurrencies().
CLI flags added to passport, estimate, savings-report: `--currency <code>`, `--currencies <codes>`, `--all-currencies`.
Conversion formula: USD → EUR (FxTable.rates.EUR) → target (FxTable.ecbRates[target], EUR_TO_XXX from ECB).
XOF uses BCEAO fixed peg: EUR_TO_XOF = 655.957 (never fetched from ECB).
ecbRates stored in FxTable.ecbRates (optional); bundled in fx.json and populated by pricing:update.
Resolver fix (D-031b): if cache lacks ecb_rates, fall back to bundled ecbRates so major currencies always convert correctly.
No version bump. No npm publish.

## D-030 · AI Work Passport command — 2026-05-15
New command: `costpassport passport` — unified report from all 4 public engines.
Input: project brief (--brief file or stdin) + standard BriefFlags.
Output: markdown (default) | json. Flags: --live, --sources, --output.
Architecture: orchestrator pattern — calls estimate(), readiness(), tokenDoctor(), savingsReport() sequentially.
Risk derivation: 4 dimensions (costRisk, scopeRisk, contextWasteRisk, qualityRisk) → overallRisk.
  costRisk: Standard scenario USD high-end cost bracket.
  scopeRisk: tokenWasteRisk (Low/Medium/High) combined with fuzzy point count.
  contextWasteRisk: direct mapping from tokenBloatRisk (6-tier → 5-tier).
  qualityRisk: confidence level combined with missingContext count.
Double estimate() call accepted (savingsReport() calls estimate() internally) — refactor in v0.5.0.
lockedProSections (4): Full AI Work Contract, Stop-Loss Rules, Client-Safe Report, Compare Estimated vs Actual.
"Ready to build" message override: "Ready to run with guardrails — start with a scoped first phase and monitor cost."
New files: src/lib/passport-risk.ts, src/engines/passport.ts, src/templates/passport-report.ts, src/commands/passport.ts.
No version bump. No npm publish. No CTOP Pro exposure.

## D-029 · Keep CTOP Pro engine out of public distribution — 2026-05-12
The advanced optimization features of CTOP are commercially sensitive and reserved for a future Pro version.
Decision: public CLI exposes free preview only (risk level, savings estimate, 3 generic actions, locked sections).
Advanced optimization features are planned for a future Pro version of CostPassport.
Bundle size: 92.18 KB. Tarball: 10 files, 28.2 KB, no source files, no private assets.

## D-028 · CTOP — CostPassport Token Optimization Protocol — 2026-05-12
New command: `costpassport optimize` — free preview.
Output: protocol, riskLevel, currentTokensRange, estimatedSavingsPercent, topActionsPreview (3 items), lockedSections, upgradeMessage.
--write: blocked in public build — returns "not available in the public CLI yet."
Output formats: json | markdown.
No version bump. No npm publish.

## D-027 · Add automated core tests before plugin work — 2026-05-11
First automated test suite (vitest) covering the 5 critical risk areas:
  1. FX conversion chain — USD → EUR → XOF, peg 655.957, rounding at each step
  2. Scoring 5-tier coherence — computeScore() mapping + invariant checks (score 15 ≠ "Safe", score 75 ≠ "Excellent")
  3. Readiness decision logic — "Ready to build" reserved for score >= 85, "Almost ready" for 70–84
  4. Resolver fallback — absent / corrupted / wrong-format cache all fall back to bundled; valid CacheV1 resolves to "cache"
  5. --live ECB failure — graceful fallback, fxLive=false, warning present, no crash on HTTP 503 or malformed XML
Method: vi.spyOn(fs, 'existsSync/readFileSync') for resolver — no real cache touched.
Method: vi.stubGlobal('fetch') for ECB tests — zero real network calls.
42 tests, 207ms, 1 file (tests/core.test.ts).
Rationale: CostPassport now has live data, local cache, FX conversions and product scoring.
Tests protect the core before the plugin (Claude Code) and provider abstraction work.

## D-026 · --live flag fetches ECB FX inline before calculation — 2026-05-11
New opt-in flag --live added to estimate, savings-report, and token-doctor.
Without --live: behaviour unchanged (reads cache if available, falls back to bundled JSON).
With --live: calls runPricingUpdate() before the engine runs, writes ~/.costpassport/cache.json.
Engine functions (estimate, savingsReport) now call resolveCostData() at function level (not module level)
so the freshly written cache is picked up in the same process invocation.
buildScenario() and toMoneyRange() now accept (pricing, fx) as explicit parameters — no module-level globals.
SourceMetadata.data_origin expanded to "live_fetch" | "cache" | "bundled".
LiveRefreshResult (alias of PricingUpdateResult) passed to getSourceMetadata(liveResult?) to override
data_origin, FX rates, and warnings with live fetch result.
ECB fetch failure: graceful fallback to bundled rates; liveResult.fxLive = false; stderr warning printed.
No project data ever sent to any network — only ECB exchange rate XML is fetched.
Decision: reuse runPricingUpdate() engine entirely — zero duplication between pricing:update and --live.

## D-025 · --sources flag exposes data provenance on estimate + savings-report — 2026-05-11
New opt-in flag --sources added to estimate and savings-report commands.
Without --sources: JSON output is structurally unchanged (backward compatible).
With --sources JSON: adds top-level "sources" field (additive) with SourceMetadata.
With --sources markdown/passport: appends "Sources & Data Freshness" block before Disclaimer.
Source metadata centralised in src/lib/source-metadata.ts (buildSourceMetadata, getSourceMetadata, formatSourcesMarkdown).
FxTable.mode drives ECB vs bundled detection: "ecb-live" → ECB URL, "static" → bundled label.
Canonical disclaimer phrase added to estimate.ts and savings.ts disclaimers:
  "Prices and exchange rates may be verified, but token volume remains an estimate based on project scope."
savings.ts FX assumption updated from "static" to "reference rates (ECB or bundled fallback)".

## D-024 · pricing:update writes local cache — 2026-05-11
New command `pricing:update` writes ~/.costpassport/cache.json in CacheV1 format (version:1).
Anthropic pricing: hardcoded table in pricing-update.ts, verified against official pricing page.
FX: fetched live from ECB eurofxref XML (single-quoted attributes — regex uses ['"] for resilience).
EUR/XOF: fixed peg 655.957 (BCEAO convention, never changes).
Fallback: if ECB fetch fails, bundled fx.json rates are used with a warning — CLI never crashes.
Resolver updated to detect CacheV1 (version:1 field) and transform to PricingTable/FxTable.
CacheV1 → PricingTable: model key mapping (claude-sonnet-4-6 → sonnet-4-6 etc.), bundled models as base.
CacheV1 → FxTable: USD_TO_EUR → rates.EUR, EUR_TO_XOF → rates.XOF_PER_EUR.
Old cache format (without version:1) is silently ignored → fallback to bundled.

## D-023 · Resolver wired into estimate + savings engines — 2026-05-11
estimate.ts and savings.ts replace direct JSON imports with resolveCostData() from src/data/resolver.ts.
Call is at module level (not function level): equivalent per CLI invocation (fresh process each time).
Pricing and FX constants (PRICING, FX) now come from cache when available, bundled JSON as fallback.
No changes to internal helper functions — same variable names, zero regression risk.
FxTable and PricingTable type imports removed from estimate.ts (types inferred from ResolvedData).

## D-022 · before-you-build threshold aligned to score >= 85 — 2026-05-11
"Ready to build" is reserved for score >= 85 only, aligned with v0.1.1 5-tier scale.
Old threshold was >= 75 (score "Good"), which contradicted the "Low-medium" risk level.
70–84 → "Needs clarification" + "Almost ready, but clarify the remaining risks before starting."
50–69 → "Needs clarification" (Medium risk, standard clarify message).
0–49  → "Not ready yet".
hasCriticalRisk (payments flow / scope / user roles) blocks "Ready to build" even at >= 85.

## D-020 · Scoring coherence — score drives tokenBloatRisk — 2026-05-11
tokenBloatRisk must never contradict costReadinessScore.score.
Fix: scoreToTokenBloatRisk(score) maps score → risk using the canonical 5-tier scale.
Final tokenBloatRisk = max(scoreBasedRisk, leakBasedRisk) via RISK_RANK ordering.
Same 5-tier thresholds applied in score.ts, doctor.ts, savings.ts, token-doctor template.

## D-019 · npm publish requires human auth — 2026-05-10
`npm publish` blocked by ENEEDAUTH during T-008. Claude does not run `npm login` autonomously.
Human must run `npm login` then `npm publish`. All pre-publish checks (build, dry-run, name availability) passed.

## D-018 · Publish as unscoped `costpassport` — 2026-05-10
npm view E404 confirms name is free. Publishing as `costpassport` (not scoped).
Fallbacks if taken: `costpassport-cli` or `@aramis-lab/costpassport`.

## D-017 · prepublishOnly runs build — 2026-05-10
`npm publish` always triggers `npm run build` first via `prepublishOnly`.
Ensures `dist/cli.js` is always fresh. `npm pkg fix` auto-normalizes `bin` path (removes leading `./`).

## D-001 · Open source MIT — 2026-05-10
Free OSS at MVP. Monetization via SaaS later.

## D-002 · Anthropic only at MVP — 2026-05-10
Single provider. Provider abstraction ready for V2 (OpenAI, Gemini, Cursor).

## D-003 · Local-first, no backend — 2026-05-10
Privacy as positioning. Zero infra cost. No data collection.

## D-004 · CLI-first, plugin later — 2026-05-10
npm CLI is the unit of distribution. Claude Code plugin = J7 wrapper.

## D-005 · USD → EUR → XOF — 2026-05-10
Never USD → XOF direct. EUR pivot. XOF peg = 655.957.

## D-006 · Input/Output ratio per scenario — 2026-05-10
Economy 75/25, Standard 65/35, Premium 60/40. Cost depends on split.

## D-007 · Product name CostPassport — 2026-05-10
Renamed from working title. CLI: `costpassport`. Flagship report: AI Build Cost Passport.
Tagline: "No more surprise AI bills." Signature: "Know your AI build cost before you start."

## D-015 · savings-report reuses estimate() only, not tokenDoctor() — 2026-05-10
Avoids a double call to estimate(). Derives savings% from costReadinessScore.score directly.
Levers are built from flags + estimate.missingContext + projectSignals.

## D-016 · detectBriefLeaks and detectFuzzyPoints: text-based detection for payments/realtime/AI — 2026-05-10
Payments, realtime, and AI leaks now trigger when mentioned in TEXT, not only when flags are set.
Pattern: `mentionsX = flags.x || /text-regex/.test(t)`.
Fixes: chaos-brief now correctly scores CRITICAL in token-doctor and NOT READY YET in before-you-build.

## D-013 · token-doctor: brief analysis + path scan, path-only supported — 2026-05-10
engine/doctor.ts calls estimate() when text is non-empty; uses computeScore() directly for path-only mode.
Stdin blocked on TTY detection (process.stdin.isTTY) so --path alone works without hanging.
Project scan reads only CLAUDE.md, README.md, package.json and checks directory existence — no source files read.

## D-014 · project-scan excludes .env and source code — 2026-05-10
scanProject() never reads .env, node_modules, dist, .git, or source files.
EXCLUDED set prevents recursive scan into build artifacts.

## D-011 · before-you-build reuses estimate engine — 2026-05-10
readiness.ts calls estimate() internally to get confidence and costReadinessScore.
No duplicated scoring logic. Single source of truth in lib/score.ts.

## D-012 · computeScore extracted to lib/score.ts — 2026-05-10
Moved from passport.ts to a shared lib. Both estimate engine and readiness engine use it.
passport.ts now reads costReadinessScore from the Estimate object, not recomputes it.

## D-009 · --format flag on estimate, not a new command — 2026-05-10
Markdown rendering added via `--format markdown|passport` on the existing `estimate` command.
No new top-level command. Keeps the CLI surface minimal for MVP.

## D-010 · costReadinessScore replaces Token Health Score — 2026-05-10
Score 0-100. Base from confidence (high=80, medium=55, low=30), adjusted by complexity tier
(Simple+10, Standard+5, Complex+0, Heavy-10), penalized by missing context items (-5 each, cap -20).
Maps to risk level: ≥70 Low, ≥45 Medium, <45 High.

## D-008 · Static JSON imports instead of readFileSync — 2026-05-10
tsup loader "copy" for JSON + readFileSync path resolution fails after bundling (import.meta.url
resolves to dist/cli.js, not the original source path). Static imports with `with { type: "json" }`
let tsup inline JSON directly into the bundle. loader option removed from tsup.config.ts.
