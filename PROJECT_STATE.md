# CostPassport — Project State
**Phase:** v0.2.0 — Feature complete, pending commit + tag
**Last update:** 2026-05-11
**Version local:** 0.1.1
**Version npm:** 0.1.1 ✅

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

## Pending
- [ ] Git commit + tag v0.2.0
- [ ] npm publish v0.2.0 (requires human OTP)

## Next — v0.3.0
- `--live` flag on estimate, token-doctor, savings-report
- ECB fetch inline (without separate pricing:update step)
- Graceful fallback to cache if fetch fails
- `--sources` shows live fetch results

## Risks
- Anthropic pricing table: hardcoded in pricing-update.ts — must be updated manually when prices change
- No automated tests — regression risk on each release
