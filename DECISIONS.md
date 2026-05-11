# Architecture Decisions

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
