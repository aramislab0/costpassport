# CostPassport — Demo Scenarios

Three real-world scenarios showing what CostPassport catches before you start building.

---

## Scenario 1 — Marketplace MVP (well-scoped)

**Brief:** `examples/marketplace.md` — three-sided delivery marketplace, defined stack, phased rollout.

```bash
# Cost estimate — JSON
cat examples/marketplace.md | costpassport estimate

# Formatted report — Markdown passport
cat examples/marketplace.md | costpassport estimate --format passport

# Readiness check
cat examples/marketplace.md | costpassport before-you-build

# Token diagnosis
cat examples/marketplace.md | costpassport token-doctor
```

**Expected output highlights:**
- Complexity tier: Heavy
- Confidence: Medium
- costReadinessScore: ~55–65 (Needs attention)
- before-you-build decision: Needs clarification (payments + multi-surface)
- token-doctor risk: Medium

---

## Scenario 2 — Vague SaaS Brief (typical early-stage input)

**Brief:** `examples/saas-vague.md` — 8-line AI SaaS idea with no stack, no roles, no MVP boundary.

```bash
cat examples/saas-vague.md | costpassport before-you-build

cat examples/saas-vague.md | costpassport savings-report
```

**Expected output highlights:**
- Decision: Not ready yet
- Fuzzy points: 6–8 (auth, data model, deployment, stack, MVP scope)
- Savings potential: 40–60%
- Top lever: Define MVP scope + specify tech stack

---

## Scenario 3 — Chaos Brief (worst case)

**Brief:** `examples/chaos-brief.md` — one sentence requesting everything globally at scale.

```bash
cat examples/chaos-brief.md | costpassport token-doctor

cat examples/chaos-brief.md | costpassport before-you-build --format markdown
```

**Expected output highlights:**
- tokenBloatRisk: **Critical**
- mainTokenLeaks: 8 leaks detected
- before-you-build decision: **Not ready yet**
- Recommended action: Clarify MVP scope before starting. Do not launch a full build yet.

---

## Path scan (no brief)

Run token-doctor on an existing project directory:

```bash
costpassport token-doctor --path ./my-project
```

**What it checks (without reading source code):**
- CLAUDE.md present and under 80 lines?
- README exists and under 300 lines?
- .claudeignore present?
- Large log directories?
- docs/ directory for large codebases?

---

## Combined: brief + path scan

```bash
cat examples/marketplace.md | costpassport token-doctor --path ./my-project
```

Combines brief analysis with project structure signals for the most complete diagnosis.

---

## Output formats

All commands support `--format json` (default) and `--format markdown`.

```bash
cat examples/marketplace.md | costpassport estimate --format markdown
cat examples/marketplace.md | costpassport estimate --format passport   # branded report
cat examples/saas-vague.md  | costpassport before-you-build --format markdown
cat examples/chaos-brief.md | costpassport savings-report --format markdown
```
