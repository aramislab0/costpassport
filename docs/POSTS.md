# CostPassport — Launch Posts

**Angle:** CostPassport is not a token counter. It is an AI Project Cost Planner.
**Message:** Before launching Claude Code or another AI coding agent, CostPassport helps you estimate the cost, detect token bloat, and reduce waste.

---

## X / Twitter — Post principal

```
I kept getting surprised by Claude Code bills.

Not because the model is expensive.
Because my brief was vague. My scope was undefined. My CLAUDE.md was missing.

Silent multipliers that 3× your token cost before you notice.

So I built CostPassport.

→ costpassport estimate — cost range before you start
→ before-you-build — is your brief ready?
→ token-doctor — where is your brief bleeding?
→ savings-report — ranked levers to cut cost

Local-first. No account. No telemetry. Free. MIT.

npm install -g costpassport

"Know your AI build cost before you start."
```

---

## X / Twitter — Thread (pour plus d'engagement)

```
🧵 I built a CLI that tells you your AI build cost BEFORE you start.

Here's what it catches — and why it matters.

1/7
```

```
Most AI billing surprises come from 3 things:

- A vague brief ("build a complete SaaS platform")
- An undefined MVP ("and everything needed")
- A missing CLAUDE.md (agent re-asks every session)

costpassport catches all three in 10 seconds.

2/7
```

```
→ costpassport estimate

Gives you a cost range in USD, EUR, and XOF across 3 scenarios:
- Economy (Haiku + Sonnet mix)
- Standard (Sonnet 4.6 throughout)
- Premium (Sonnet + Opus, intensive iteration)

Before you write a single line.

3/7
```

```
→ costpassport before-you-build

Scores your brief's readiness.
Detects fuzzy points: vague auth, undefined roles, no MVP scope.
Suggests a phased build strategy.

Saves you from "I need you to rebuild this from scratch."

4/7
```

```
→ costpassport token-doctor

Finds token leaks in your brief and project structure.
Payments without a provider? Realtime without architecture? CLAUDE.md > 80 lines?

Output: a context diet and optimization plan.

5/7
```

```
→ costpassport savings-report

Quantifies your savings potential (sometimes 40–60%).
Ranks levers: prompt caching, model routing, scope splitting, context compression.

Gives you a concrete action list before you start.

6/7
```

```
Runs 100% locally.
No API calls. No account. No telemetry.
Your brief stays on your machine.

Free. MIT. Node 20+.

npm install -g costpassport

7/7
```

---

## LinkedIn — Post court

```
I built a local CLI that estimates your AI build cost before you start.

Before you open Claude Code or Cursor.
Before you write a single line.

Four commands:
→ estimate — cost range in USD, EUR, XOF
→ before-you-build — is your brief ready to start?
→ token-doctor — where is your token budget leaking?
→ savings-report — how much can you save, and how?

Runs locally. No account. No telemetry.

Free. MIT open source.

npm install -g costpassport

"Know your AI build cost before you start."
```

---

## LinkedIn — Post long

```
I kept getting surprised by AI coding bills.

Not because Claude or Cursor is overpriced.
Because I didn't plan.

A vague brief. An undefined MVP. A missing CLAUDE.md.
These are silent multipliers — and they can 3× your token cost before you notice.

Most tools track usage after the fact. By then, the budget is gone.

So I built CostPassport. A local CLI that helps you plan before the build starts.

Before you launch Claude Code or another AI coding agent, CostPassport gives you:

→ costpassport estimate
Cost range in USD, EUR, and XOF across three scenarios: Economy, Standard, Premium.
Know the ballpark before committing to a build.

→ costpassport before-you-build
Readiness score. Fuzzy point detection. Suggested build strategy.
Catch "payments with no provider" or "realtime with no architecture" before they become expensive rework.

→ costpassport token-doctor
Token leak diagnosis. Context diet. Optimization plan.
Checks your brief AND your project structure (CLAUDE.md length, missing .claudeignore, large log directories).

→ costpassport savings-report
Savings potential (sometimes 40–60%) with ranked levers: prompt caching, model routing, scope splitting, context compression.

The comparison isn't with another AI tool.
It's with the 30-minute conversation a senior engineer has with a client before estimating a project.
CostPassport does that in 10 seconds.

Fully local. No API calls. No account. No telemetry.
Your brief stays on your machine.

Free. MIT. Open source. Node 20+.

npm install -g costpassport

If you use Claude Code, Cursor, or any AI coding agent — I'd love your feedback on the estimates. Especially if you have real project data to compare against.
```

---

## Hacker News — Show HN

### Title
```
Show HN: CostPassport – CLI to estimate AI build cost before you write a single line
```

### Body
```
I kept getting surprised by Claude Code and Cursor bills mid-project. The pattern was always the same: vague brief, undefined MVP scope, no CLAUDE.md. By the time I noticed, I'd already burned through 2–3× the budget I expected.

CostPassport is a local CLI that catches those issues before you start. You pipe in your project brief and get:

- Cost range in USD/EUR/XOF across Economy/Standard/Premium scenarios (Haiku/Sonnet/Opus mixes)
- A "ready to build?" score with specific gaps flagged (vague auth, undefined roles, no MVP boundary, payments without provider, etc.)
- A token leak diagnosis with a context diet and optimization plan
- A savings report with ranked levers and concrete actions

All heuristic — no AI calls, no API key required. Runs locally, no telemetry.

Built on Node 20, ESM, TypeScript strict, single tsup bundle. ~22KB on npm.

I'm particularly curious whether the cost estimates hold up against real project data. If you've run Claude Code or Cursor on a real project and have a rough token count, I'd love to compare.

npm install -g costpassport
```

---

## Product Hunt

### Title
```
CostPassport
```

### Tagline
```
Know your AI build cost before you start
```

### Description (200 words)
```
CostPassport is a local CLI that estimates your AI build cost before you open Claude Code or Cursor.

You pipe in your project brief and get a cost range across three scenarios (Economy / Standard / Premium), a readiness score, a token leak diagnosis, and a ranked list of savings levers — in seconds.

Four commands:
• estimate — Token + cost range in USD, EUR, and XOF
• before-you-build — Readiness score, fuzzy point detection, suggested build strategy
• token-doctor — Leak diagnosis, context diet, optimization plan
• savings-report — Savings potential and ranked levers

Fully local. No API calls. No account. No telemetry. Your brief stays on your machine.

Built for developers and agencies who use AI coding agents and want to plan their token budget before they start — not after they've burned it.

The comparison isn't with a token tracker. It's with the 30-minute scoping conversation a senior engineer has before estimating a project. CostPassport does that in 10 seconds.

Free. MIT open source. Node 20+.

npm install -g costpassport
```

---

## GitHub Release Notes — v0.1.0

```markdown
## CostPassport v0.1.0 — CLI MVP

No more surprise AI bills.

This release introduces a local-first CLI for estimating and reducing AI build costs before launching Claude Code, Cursor, or another AI coding agent.

### Commands

| Command | Description |
|---|---|
| `costpassport estimate` | Cost range in USD / EUR / XOF across 3 model scenarios |
| `costpassport before-you-build` | Readiness score, fuzzy point detection, build strategy |
| `costpassport token-doctor` | Token leak diagnosis, context diet, optimization plan |
| `costpassport savings-report` | Savings potential and ranked levers |

### Key features

- Economy / Standard / Premium scenarios (Haiku, Sonnet, Opus mixes)
- AI Cost Readiness Score 0–100
- Token Bloat Risk: Low / Medium / High / Critical
- USD / EUR / XOF currency support (CFA peg: 1 EUR = 655.957 XOF)
- Markdown, passport, and JSON output formats
- Brief analysis + project path scan (`--path`)
- Local-first — no data leaves your machine
- No account, no telemetry, no cloud

### Install

```bash
npm install -g costpassport
```

Requires Node.js ≥ 20.

### Privacy

CostPassport runs 100% locally. No API calls. No telemetry. Your project brief stays on your machine.
```
