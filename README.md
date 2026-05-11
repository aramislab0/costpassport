# CostPassport

**No more surprise AI bills.**

Know your AI build cost before you start — before you open Claude Code, before you write a single line.

```bash
npx costpassport estimate
cat brief.md | npx costpassport before-you-build
```

---

## What is CostPassport?

CostPassport is a local CLI that analyzes your project brief and gives you a cost estimate, a readiness score, and a concrete action plan — before you burn tokens on a build that wasn't ready.

It runs entirely on your machine. No data leaves your computer. No account required.

---

## Why it exists

AI coding agents (Claude Code, Cursor, Copilot) bill by the token. A vague brief, an undefined MVP scope, or a missing CLAUDE.md can quietly multiply your costs by 3–5×.

CostPassport catches those issues in 10 seconds — before they cost you money.

---

## What it does

| Command | What you get |
|---|---|
| `estimate` | Token + cost range in USD, EUR, and XOF across 3 models |
| `before-you-build` | Readiness score, fuzzy point detection, build strategy |
| `token-doctor` | Token leak diagnosis, context diet, optimization plan |
| `savings-report` | Savings potential, ranked levers, priority actions |

---

## Install

```bash
npm install -g costpassport
```

Requires Node.js ≥ 20.

---

## Quickstart

### Estimate cost from a brief

```bash
# Pipe your project brief
cat my-brief.md | costpassport estimate

# Get a formatted Markdown report
cat my-brief.md | costpassport estimate --format passport
```

### Check readiness before building

```bash
cat my-brief.md | costpassport before-you-build
cat my-brief.md | costpassport before-you-build --format markdown
```

### Diagnose token waste

```bash
# Brief only
cat my-brief.md | costpassport token-doctor

# Project directory only
costpassport token-doctor --path ./my-project

# Both
cat my-brief.md | costpassport token-doctor --path ./my-project
```

### Get a savings report

```bash
cat my-brief.md | costpassport savings-report
cat my-brief.md | costpassport savings-report --format markdown
```

---

## Commands

### `estimate`

Estimates token usage and cost for your project brief.

```
costpassport estimate [options]
```

| Flag | Description |
|---|---|
| `--format <type>` | Output format: `json` (default), `markdown`, `passport` |
| `--payments` | Project involves payment processing |
| `--mobile` | Project includes a mobile app |
| `--realtime` | Project has real-time features (chat, live tracking) |
| `--ai` | Project includes AI/LLM features |
| `--i18n` | Project requires multi-language support |
| `--stack <name>` | Force a specific tech stack label |

### `before-you-build`

Scores your brief's readiness to start building. Detects scope gaps, undefined roles, and missing context that will cause expensive rework.

```
costpassport before-you-build [options]
```

Same flags as `estimate`.

### `token-doctor`

Diagnoses token bloat risk from your brief and project structure. Outputs a context diet and optimization plan.

```
costpassport token-doctor [options]
```

| Flag | Description |
|---|---|
| `--path <dir>` | Path to project directory (reads CLAUDE.md, README, package.json — no source files) |
| + all `estimate` flags | |

### `savings-report`

Quantifies savings potential and ranks optimization levers by impact.

```
costpassport savings-report [options]
```

Same flags as `token-doctor`.

---

## Example Reports

### Estimate — passport format

```
╔══════════════════════════════════════════════════╗
║      AI BUILD COST PASSPORT — v0.1.0             ║
╚══════════════════════════════════════════════════╝

PROJECT PROFILE
  Type         : marketplace
  Complexity   : Heavy
  Confidence   : medium

COST ESTIMATE (Economy Scenario — Sonnet 4.6)
  Tokens       : 420K – 780K
  USD          : $1.26 – $2.34
  EUR          : €1.16 – €2.15
  XOF          : 760 – 1,410 XOF

COST READINESS SCORE
  Score        : 55 / 100
  Status       : Needs attention
  Risk Level   : Medium
```

### token-doctor — Markdown

```markdown
## Token Doctor Report

**Token Bloat Risk: High**

### Main Token Leaks
1. Payments mentioned without flow — payment rework is the most expensive iteration type
2. Real-time mentioned without architecture — implementation rework doubles token cost
3. No .claudeignore — AI agent may send dist, logs, and node_modules as context

### Estimated Savings Potential
40 – 55%
```

---

## Privacy

CostPassport runs 100% locally.

- No API calls
- No telemetry
- No account
- No data collection

Your brief, your code, your costs — stay on your machine.

---

## Pricing Disclaimer

Token prices in `src/resources/pricing.anthropic.json` reflect Anthropic's published rates as of May 2026. Verify against the [Anthropic pricing page](https://www.anthropic.com/pricing) before making budget decisions.

Exchange rates use a static USD/EUR value. XOF uses the fixed CFA peg: 1 EUR = 655.957 XOF.

---

## Roadmap

- [ ] OpenAI + Gemini provider support
- [ ] Per-phase token budget allocation
- [ ] Claude Code plugin (J7 wrapper)
- [ ] CLAUDE.md generator from brief
- [ ] CI integration: fail build if costReadinessScore < threshold

---

## License

MIT — free to use, fork, and extend.

---

*"Know your AI build cost before you start."*
