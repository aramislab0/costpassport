# CostPassport

**Before you run AI, run CostPassport.**

Estimate cost, check readiness and generate an AI Work Passport before launching AI-assisted work.

```bash
npx costpassport@latest passport --brief brief.md --live --sources
```

[![npm version](https://img.shields.io/npm/v/costpassport.svg)](https://www.npmjs.com/package/costpassport)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Why CostPassport

AI coding agents bill by the token. A vague project brief, undefined MVP scope, missing roles, or noisy context can quietly multiply your costs by 3–5× before you realize it.

CostPassport works **one level earlier** than task-level tools:

- Task-level tools estimate or track individual agent runs.
- CostPassport operates at the **project level** — readiness, cost range, scope risks, and guardrails — before execution starts.

Run it in 10 seconds. Get a full pre-execution report. Start your AI work with your eyes open.

---

## Quick start

No install required:

```bash
# The full pre-execution report
npx costpassport@latest passport --brief brief.md --live --sources

# Cost estimate only
npx costpassport@latest estimate --brief brief.md

# Build readiness check
npx costpassport@latest before-you-build --brief brief.md

# Token waste diagnosis
npx costpassport@latest token-doctor --path .

# Savings opportunity report
npx costpassport@latest savings-report --brief brief.md

# Refresh local pricing and FX cache
npx costpassport@latest pricing:update
```

Requires Node.js ≥ 20.

Or install globally:

```bash
npm install -g costpassport
```

---

## AI Work Passport

`costpassport passport` is the central command. It runs all analysis in one pass and returns a unified report covering cost, readiness, risk, and priority actions.

```
# AI WORK PASSPORT

Readiness:  75/100 — Needs clarification
Decision:   Almost ready, but clarify the remaining risks before starting.

Estimated AI cost (Standard scenario):
  USD  $21.60 – $57.60
  EUR  €18.58 – €49.54
  XOF  12,188 – 32,496 XOF

Savings opportunity: 15–25% if optimizations applied

Risk overview:
  💰 Budget risk:        Medium
  📋 Scope risk:         High
  🗃️ Context waste:      Medium
  📝 Brief quality:      Medium
  ──────────────────────────────
  ⚠️  Overall risk:      High

Top token leaks:
  - Payment flow vague — rework is the most expensive iteration type
  - Real-time features without architecture — doubles token cost on correction
  - No MVP boundary defined — agent may implement everything

Priority actions:
  1. Define payment provider and flow before build
  2. Split MVP vs. full build explicitly
  3. List what is NOT in v1 as clearly as what is

Recommended next action:
  Do not launch full AI work yet. Clarify scope first.

Pro features (not included in public CLI):
  🔒 Full AI Work Contract
  🔒 Stop-Loss Rules
  🔒 Client-Safe Report
  🔒 Compare Estimated vs Actual
```

---

## Try the demo

No brief required:

```bash
npx costpassport@latest demo
npx costpassport@latest demo --compact
```

## Share your AI Work Passport

```bash
# Compact screenshotable format
npx costpassport@latest passport --brief brief.md --compact

# Save to .costpassport/AI_WORK_PASSPORT.md
npx costpassport@latest passport --brief brief.md --share

# Generate a GitHub badge
npx costpassport@latest badge --brief brief.md
```

## Claude Code plugin

```bash
# Install from local marketplace
/plugin marketplace add ./claude-plugin-marketplace
/plugin install costpassport@costpassport-marketplace
```

Commands available: `/costpassport:passport`, `/costpassport:demo`, `/costpassport:estimate`, `/costpassport:doctor`, `/costpassport:savings`

---

## Commands

| Command | What it does |
|---|---|
| `passport` | Full AI Work Passport — cost, readiness, risks, actions in one report |
| `demo` | Instant AI Work Passport demo (no brief required) |
| `estimate` | Token + cost range across Economy / Standard / Premium scenarios |
| `before-you-build` | Readiness score, fuzzy point detection, suggested build strategy |
| `token-doctor` | Token leak diagnosis, context diet, optimization plan |
| `savings-report` | Savings potential and ranked optimization levers |
| `badge` | Generate a shields.io badge for your GitHub README |
| `pricing:update` | Refresh local FX rates from ECB + Anthropic pricing table |

### Common flags

| Flag | Commands | Description |
|---|---|---|
| `--brief <file>` | all | Path to project brief file |
| `--live` | passport, estimate, savings-report | Fetch current FX rates from ECB before calculating |
| `--sources` | passport, estimate, savings-report | Show data origin, FX rates and cache freshness |
| `--format json\|markdown` | most commands | Output format (default: json or markdown depending on command) |
| `--output <file>` | passport | Write report to file instead of stdout |
| `--path <dir>` | token-doctor, savings-report | Scan project directory structure |
| `--payments` | all | Project includes payments integration |
| `--mobile` | all | Project includes a mobile app |
| `--ai` | all | Project includes AI/LLM features |
| `--realtime` | all | Project includes real-time features |
| `--i18n` | all | Project includes multi-language support |
| `--legacy` | all | Project involves a legacy codebase |
| `--refactor` | all | Refactoring over greenfield |

---

## Multi-currency support

Reports show **USD, EUR and JPY by default** — the three most-traded currencies globally (BIS ranking).

16 currencies are supported in total. Control the output with three flags:

```bash
# Add a currency to the default USD/EUR/JPY output
npx costpassport@latest passport --brief brief.md --currency XOF

# Show only specific currencies
npx costpassport@latest passport --brief brief.md --currencies USD,EUR,XOF

# Show all 16 supported currencies
npx costpassport@latest passport --brief brief.md --all-currencies
```

**Supported currencies:** USD, EUR, JPY, GBP, CNY, AUD, CAD, CHF, HKD, SGD, SEK, KRW, NOK, NZD, MXN, XOF

XOF uses the BCEAO fixed peg (1 EUR = 655.957 XOF). All other currencies use ECB exchange rates — bundled by default, refreshed with `--live` or `pricing:update`.

---

## Live sources and local cache

CostPassport uses verifiable data for pricing and FX rates.

**`--live`** fetches current EUR/USD rates from the European Central Bank (ECB) before calculating. Only the ECB exchange rate XML is fetched — no project data is sent anywhere.

**`pricing:update`** writes a local cache to `~/.costpassport/cache.json`. On the next run, CostPassport reads this cache instead of using bundled defaults.

**`--sources`** adds a data provenance block to the report:

```
Sources & Data Freshness
  Data origin:       live_fetch
  Data freshness:    fresh
  Pricing source:    https://platform.claude.com/docs/en/about-claude/pricing
  FX source:         ECB eurofxref
  EUR/USD:           1.1628
  EUR/XOF:           655.957  (BCEAO fixed peg)
```

If the network or cache is unavailable, CostPassport falls back silently to bundled rates — it never crashes.

---

## Privacy — local-first

CostPassport is designed to run entirely on your machine.

- Your brief stays local — never uploaded, never logged.
- Your project files stay local — `token-doctor --path` reads only `CLAUDE.md`, `README.md`, `package.json` and directory names. No source code is read.
- No telemetry. No account. No backend.
- The only network call is the ECB FX rate fetch when you explicitly use `--live` or `pricing:update`.

---

## Who it is for

- **Freelancers** quoting AI-assisted work for clients
- **Agencies** managing AI-assisted projects and needing cost guardrails
- **AI builders** who use Claude Code, Cursor, Codex CLI or any AI coding workflow
- **Developers** who want a scope and cost check before starting a new project
- **Teams** who want consistent pre-execution reports across projects

---

## What CostPassport is not

- **Not a billing system** — it does not connect to your Claude, Cursor or OpenAI account.
- **Not a cost guarantee** — estimates are heuristic and may vary ±30–50% from actual usage.
- **Not a replacement for human review** — use it as a pre-execution checklist, not a contract.
- **Not a project management system** — it reports risk and cost, not tasks or timelines.

---

## Roadmap

- Claude Code plugin — run `passport` and `estimate` directly from your AI session
- Compare estimated vs actual — import usage exports and track delta
- Client-safe reports — shareable cost summaries for client conversations
- Team workflows — shared cache and consistent reports across a team

---

## Disclaimer

Prices and exchange rates may be verified, but token volume remains an estimate based on project scope. CostPassport identifies risk and savings opportunities. It does not guarantee final cost, agent behavior or build quality.

Model prices are sourced from official Anthropic documentation. Exchange rates are sourced from the European Central Bank. XOF uses the fixed CFA peg: 1 EUR = 655.957 XOF (BCEAO convention).

---

## License

MIT — free to use, fork, and extend.

---

*CostPassport — AI project cost planner and work guardrail CLI.*
*Know your AI build cost before you start.*
