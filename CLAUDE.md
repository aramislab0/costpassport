# CostPassport — CLAUDE.md

## What this project is
CLI tool: `costpassport`. Estimates AI build costs before starting a project.
Four commands: `estimate`, `before-you-build`, `token-doctor`, `savings-report`.
Local-first, no backend, no telemetry, MIT open-source.

## What NOT to build
- No SaaS dashboard, no web UI, no backend API
- No provider abstraction at MVP (Anthropic only)
- No actual `npm publish` without human confirmation
- No new commands in T-006 — launch readiness only

## Architecture
```
src/
  cli.ts              — commander entrypoint, registers all commands
  commands/           — one file per command, thin wrappers
  engines/            — estimate.ts, readiness.ts, doctor.ts, savings.ts
  lib/                — score.ts, currency.ts, project-scan.ts
  templates/          — passport.ts (Markdown renderer)
  resources/          — pricing.anthropic.json, fx.json, complexity-tiers.json
  types.ts            — all shared types, single source of truth
dist/cli.js           — single bundled output (tsup ESM)
```

## Coding rules
- TypeScript strict — no `any`, no unused vars, no `console.log` in production
- No duplicated scoring logic — `computeScore()` lives in `lib/score.ts` only
- Currency chain: USD → EUR → XOF (never USD → XOF direct)
- JSON resources: static imports with `with { type: "json" }` — never readFileSync
- Stdin: check `process.stdin.isTTY` before reading to avoid hang in path-only mode
- Text-based detection pattern: `mentionsX = flags.x || /regex/.test(t)`

## Files to update after any change
- `src/types.ts` if adding/changing a type
- `DECISIONS.md` if making an architectural decision (D-NNN format)
- `PROJECT_STATE.md` after completing a task
- `ROADMAP.md` if scope changes

## Build & test
```bash
npm run build           # tsup → dist/cli.js
node dist/cli.js estimate --help
cat examples/marketplace.md | node dist/cli.js estimate
cat examples/chaos-brief.md | node dist/cli.js token-doctor
```

## Pricing data
`src/resources/pricing.anthropic.json` — verify against Anthropic pricing page before any release.
`src/resources/fx.json` — EUR/XOF static peg 655.957, update USD/EUR rate periodically.
