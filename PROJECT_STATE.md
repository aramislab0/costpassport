# CostPassport — Project State
**Phase:** v0.1.1 — Ready to publish (pending npm OTP)
**Last update:** 2026-05-11
**Version local:** 0.1.1
**Version npm:** 0.1.0 (0.1.1 publish blocked on user OTP)

## Done
- v0.1.0: Full MVP — estimate, before-you-build, token-doctor, savings-report ✅
- v0.1.0: npm published, npx costpassport works ✅
- v0.1.1: Scoring coherence fix ✅
  - tokenBloatRisk derived from score via scoreToTokenBloatRisk() + max(scoreRisk, leakRisk)
  - 5-tier mapping: Low / Low-medium / Medium / Medium-high / High + Critical for 7+ leaks
  - score 15 → tokenBloatRisk "High", action "Do not start yet..."
  - score 75 → status "Good" (not "Excellent"), riskLevel "Low-medium"
  - Types expanded: TokenBloatRisk + CostReadinessScore.riskLevel
  - All smoke tests pass ✅
  - npm publish --dry-run: clean, costpassport@0.1.1, 22.2 kB, 0 warnings ✅
  - npm whoami: aramis001 ✅
  - Git commit 00dd924, tag v0.1.1 ✅

## Blocked on
```bash
npm publish --otp=XXXXXX   # enter your 2FA code locally
```

## After publish — verify
```bash
npm view costpassport version      # should return 0.1.1
npx costpassport --help
npx costpassport token-doctor --path .
```

## Next — v0.2.0 Live Data Layer
See ROADMAP.md for full spec.
Key items:
- src/data/resolver.ts — loads cache first, falls back to bundled JSON
- costpassport pricing:update command
- Sources visible in all reports
- Cache in ~/.costpassport/cache.json

## Risks
- Pricing values: heuristic — need calibration on real projects
- before-you-build "Ready to build" threshold at score >= 75 (should be >= 85) — v0.2.0
- No automated tests — regression risk on each release
- USD/EUR rate static at 0.92 — update before v0.2.0 release
