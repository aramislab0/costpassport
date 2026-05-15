# CostPassport Roadmap

## v0.1.0 — CLI MVP ✅ Published
- estimate, before-you-build, token-doctor, savings-report
- USD / EUR / XOF support
- Economy / Standard / Premium scenarios
- JSON + Markdown + passport output formats
- Local-first, no telemetry, MIT

## v0.1.1 — Scoring coherence ✅ Ready to publish (pending OTP)
- tokenBloatRisk now derived from costReadinessScore.score (not just leak count)
- 5-tier scoring scale: Low / Low-medium / Medium / Medium-high / High
- score 15 → "High risk" everywhere, no more "Safe to continue"
- score 75 → "Good" (not "Excellent")
- recommendedNextAction aligned per tier across all commands

## v0.2.0 — Live Data Layer
**Goal:** CostPassport becomes traceable — every report cites its sources.

- New command: `costpassport pricing:update`
  - Fetches model prices and exchange rates
  - Writes local cache to `~/.costpassport/cache.json`
  - Displays source URL + verification date
  - Warns if cache is older than 30 days
- New module: `src/data/resolver.ts`
  - Loads from `~/.costpassport/cache.json` first, falls back to bundled JSON
- Reports display: `pricing_source`, `fx_source`, `pricing_verified_at`, `fx_verified_at`, `cache_age`
- Disclaimer phrase added to all reports:
  "Prices and exchange rates may be verified, but token volume remains an estimate based on project scope."
- Flag `--sources` on `estimate` and `token-doctor`: shows source metadata inline
- Fix: `before-you-build` "Ready to build" threshold aligned to score ≥ 85
- Architecture: CostPassport remains local-first, no server required

## v0.3.0 — Mode --live + FX sérieux ✅ Published
- Flag `--live` on estimate, token-doctor, savings-report
- Fetches ECB FX before calculation — reuses pricing:update engine
- Graceful fallback to cache/bundled if ECB unreachable
- `--sources` shows `data_origin: live_fetch` with fresh FX rates

## v0.3.x — Core test suite ✅ (post-publish patch, no version bump)
- Vitest test suite: 42 tests, 207ms, 5 critical areas covered
- FX chain, scoring coherence, readiness decisions, resolver fallback, ECB failure
- Safe for CI: fs mocked, no real cache touched, no network calls

## v0.3.x — CTOP Public Preview (post-publish, no version bump)
- `costpassport optimize` — free preview: risk level, savings estimate, 3 generic actions, 7 locked sections
- Advanced optimization features are planned for a future Pro version

## v0.3.x — AI Work Passport (post-publish, no version bump)
- `costpassport passport --brief brief.md --live --sources`
- 4 risk dimensions: costRisk, scopeRisk, contextWasteRisk, qualityRisk → overallRisk
- Orchestrates all 4 public engines in a single unified report
- Output: markdown (default) | json — flags: --live, --sources, --output
- 4 locked Pro sections: Full AI Work Contract, Stop-Loss Rules, Client-Safe Report, Compare Estimated vs Actual

## CostPassport Pro (not yet released)
- Full CTOP report with advanced prioritized optimization recommendations
- Advanced preparation assets (--write)
- Requires real licensing — Pro version coming soon

## v0.4.0 — AI Work Passport + Multi-currency ✅ Published
- `costpassport passport` — unified cost + risk + readiness report in one command
- 4 risk dimensions: costRisk, scopeRisk, contextWasteRisk, qualityRisk → overallRisk
- Multi-currency: 16 currencies supported; USD/EUR/JPY default (BIS top-traded)
- XOF available via `--currency XOF`, no longer shown by default
- Flags: `--currency <code>`, `--currencies <codes>`, `--all-currencies`
- ECB rates bundled for all 15 major currencies; refreshed with `--live`

## v0.5.0 — Plugin Claude Code
- Skill `/costpassport:preflight` — analyzes brief before build, checks budget, lists risks
- Skill `/costpassport:doctor` — quick diagnosis in session
- Skill `/costpassport:savings` — savings report in session
- Built on existing engines, no duplication

## v0.6.0 — compare: estimated vs actual
- `costpassport usage:import` — parses Claude Code / Cursor / Anthropic console exports
- `costpassport compare` — estimated vs actual delta + probable cause
- Local history in `~/.costpassport/history/`

## v0.7.0 — budget-guard
- `costpassport budget-guard --brief brief.md --max-usd 100`
- within budget / over budget decision
- Scope reduction recommendations if over budget

## Future — Supabase (optional backend, not local replacement)
- npm = CLI distribution
- Supabase = live data, snapshots, prices, rates, history, agency mode
- No source code sent to Supabase
- No sensitive data collected without explicit consent
- Tables: model_prices, fx_rates, pricing_snapshots, estimate_reports
