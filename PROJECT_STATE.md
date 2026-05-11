# CostPassport — Project State
**Phase:** Ready to Publish — waiting for `npm login`
**Last update:** 2026-05-10
**Version:** 0.1.0

## Done
- Repo scaffold + types + currency + estimate engine + CLI ✅
- T-002: AI Build Cost Passport — Markdown renderer ✅
- T-003: `before-you-build` command ✅
- T-004: `token-doctor` command ✅
- T-005: `savings-report` command + chaos-brief + detection fixes ✅
- T-006: Launch readiness (README, CLAUDE.md, dotfiles, LICENSE, docs) ✅
- T-007: Release candidate review — READY TO PUBLISH ✅
- T-008: Publish attempt ✅ (blocked on npm auth — not a code issue)
  - Final build: clean (66.38 KB)
  - `npm view costpassport` → E404 (name still available)
  - `npm publish --dry-run` → zero warnings, `+ costpassport@0.1.0`
  - `npm whoami` → ENEEDAUTH
  - docs/LAUNCH.md updated with npm login steps, GitHub release notes, checklist
  - docs/POSTS.md created: X post, X thread (7 tweets), LinkedIn short + long, Show HN, Product Hunt tagline + description, GitHub release notes

## Next — One action away from publish

```bash
npm login          # authenticate with npmjs.org account
npm whoami         # verify: should return your npm username
npm publish        # publish costpassport@0.1.0
npm view costpassport          # verify publication
npx costpassport --help        # live test from registry
```

## Post-publish
- [ ] GitHub repo created (name: `costpassport`)
- [ ] `git push` and tag `v0.1.0`
- [ ] GitHub release created (notes in docs/LAUNCH.md)
- [ ] X/Twitter post (text in docs/POSTS.md)
- [ ] LinkedIn post (text in docs/POSTS.md)
- [ ] Show HN submitted Tue–Thu morning UTC (title + body in docs/POSTS.md)
- [ ] Product Hunt draft (description in docs/POSTS.md)
- [ ] 5 terminal screenshots (commands in docs/LAUNCH.md)

## Risks
- npm name `costpassport` is free today — publish fast
- Pricing values: heuristic, need calibration on real projects
- USD/EUR rate is static at 0.92 — update on publish day if needed

## Budget
- T-001 cost: ~$3
- T-002–T-008 estimate: ~$18
- Remaining for beta: ~$9
