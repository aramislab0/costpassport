# CostPassport — Claude Code Plugin Submission

## Plugin name

CostPassport

## One-line description

Generate an AI Work Passport before running AI-assisted work.

## Long description

CostPassport helps developers, freelancers and agencies estimate AI project cost, check readiness and identify top risks before launching Claude Code or other AI workflows.

The plugin provides lightweight Claude Code commands that call the public CostPassport CLI through npm. No configuration required. No backend. No telemetry.

## Use case

Before starting an AI-assisted build, users run `/costpassport:passport` or `/costpassport:demo` to get a pre-execution report covering:

- Readiness score (0–100)
- Estimated AI cost (Economy / Standard / Premium scenarios)
- Cost risk, scope risk, context waste risk, quality risk
- Top token leaks and priority fixes
- Recommended next action

This helps users avoid launching AI work with vague scope, missing decisions or noisy context — which silently multiply AI costs by 3–5×.

## Commands

| Command | What it does |
|---|---|
| `/costpassport:demo` | Instant AI Work Passport demo — no brief required |
| `/costpassport:passport` | Full AI Work Passport from a project brief file |
| `/costpassport:estimate` | Token + cost range across Economy / Standard / Premium |
| `/costpassport:doctor` | Token waste diagnosis on the current project directory |
| `/costpassport:savings` | Savings opportunity report from a project brief |

## Privacy and security

CostPassport is local-first.

- Briefs and project files stay on the user's machine — never uploaded.
- The plugin calls the public npm CLI: `npx -y costpassport@latest`.
- When `--live` is used, CostPassport may fetch public FX reference rates from the ECB (exchange rate XML only — no project data).
- No credentials, no MCP servers, no destructive actions, no private logic.
- No source code is read except `CLAUDE.md`, `README.md`, `package.json` and directory names.

## Installation

```bash
# Via local marketplace (until listed in official directory)
/plugin marketplace add https://github.com/aramislab0/costpassport

# Then install
/plugin install costpassport
```

## Repository

https://github.com/aramislab0/costpassport

## Demo command

```bash
npx -y costpassport@latest demo --compact
```

## Notes for reviewers

- All commands use `npx -y costpassport@latest` — no local binary required.
- The plugin contains no proprietary logic, optimization engines, credentials or private assets.
- `token-doctor --path .` reads only `CLAUDE.md`, `README.md`, `package.json` and directory names. No source code is read.
- The npm package tarball excludes the plugin folder (`claude-plugin/`) via `files` allowlist in `package.json`.
- CostPassport is MIT licensed.
