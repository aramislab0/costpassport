# CostPassport — Launch Kit

**Status:** Ready to publish — npm auth required before `npm publish`.

---

## npm

```bash
# Login (one-time)
npm login

# Verify auth
npm whoami

# Publish
npm publish

# Verify publication
npm view costpassport
npm view costpassport version

# Test from registry
npx costpassport --help
npx costpassport estimate --help
```

**Package:** `costpassport@0.1.0` — 10 files, 21.9 kB
**Install command:** `npm install -g costpassport`
**npx demo:** `npx costpassport estimate --brief ./examples/marketplace.md --format markdown`

---

## GitHub Repository

### Repo name
```
costpassport
```

### Description (one-liner under the repo name)
```
AI Project Cost Planner — know your AI build cost before you start.
```

### GitHub About text (160 chars max)
```
No more surprise AI bills. Estimate, diagnose, and reduce Claude Code / Cursor costs before you write a single line. Local-first. No account. MIT.
```

### Topics / tags
```
ai  cli  claude-code  llm  finops  developer-tools  cost-estimation  agents  anthropic  tokens
```

### GitHub Release — v0.1.0

**Title:** `v0.1.0 — CLI MVP`

**Release notes:**
```
CostPassport v0.1.0 introduces a local-first CLI for estimating and reducing AI build costs before launching an AI coding agent.

**Included commands:**
- `costpassport estimate` — cost range in USD / EUR / XOF across 3 scenarios
- `costpassport before-you-build` — readiness score, fuzzy point detection, build strategy
- `costpassport token-doctor` — token leak diagnosis, context diet, optimization plan
- `costpassport savings-report` — savings potential and ranked levers

**Key features:**
- Project-level AI build cost estimation
- Economy / Standard / Premium model scenarios
- AI Cost Readiness Score (0–100)
- Token bloat risk: Low / Medium / High / Critical
- USD / EUR / XOF currency support
- Markdown, passport, and JSON outputs
- Local-first privacy model — no data leaves your machine
- No account, no telemetry, no cloud

**Install:**
npm install -g costpassport

**Node:** ≥ 20 required
**License:** MIT
```

---

## Launch Checklist

- [ ] `npm login` — authenticate to registry
- [ ] `npm publish` — publish v0.1.0
- [ ] `npm view costpassport` — verify publication
- [ ] `npx costpassport --help` — verify from registry
- [ ] GitHub repo created and pushed
- [ ] GitHub release v0.1.0 created
- [ ] README checked on GitHub
- [ ] 5 demo screenshots captured (see docs/POSTS.md)
- [ ] LinkedIn post published
- [ ] X/Twitter post published
- [ ] Show HN submitted (Tue–Thu morning UTC)
- [ ] Product Hunt draft ready

---

## Screenshots to Capture (5)

```bash
# 1 — Full cost passport (marketplace brief)
cat examples/marketplace.md | costpassport estimate --format passport

# 2 — Not ready yet (vague SaaS)
cat examples/saas-vague.md | costpassport before-you-build --format markdown

# 3 — CRITICAL token diagnosis (chaos brief)
cat examples/chaos-brief.md | costpassport token-doctor --format markdown

# 4 — Savings report (chaos brief)
cat examples/chaos-brief.md | costpassport savings-report --format markdown

# 5 — Path scan (project directory, no brief)
costpassport token-doctor --path ./my-project
```

Recommended terminal: iTerm2, dark theme, 120 cols. Or use `vhs` (charmbracelet/vhs) for animated GIFs.

---

## Differentiation — One-Pager

### CostPassport is not a token counter.

Token counters tell you what you spent. CostPassport tells you what you're about to spend — and why it might cost more than expected.

| | Usage dashboards / token trackers | CostPassport |
|---|---|---|
| When | After the build | Before the build |
| Input | API logs | Your project brief |
| Output | Spend history | Cost estimate + risk score |
| Action | Invoice | Decision: build or clarify first |
| Privacy | Sends data to cloud | Runs entirely locally |

Most tools track usage after the fact. CostPassport helps you plan before the build starts.
