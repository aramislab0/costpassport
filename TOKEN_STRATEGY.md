# Dev rules for CostPassport itself

1. Sonnet 4.6 by default. Opus only for architecture (max 3 invocations).
2. Never re-read full repo — reference specific files only.
3. Each step produces a testable artefact.
4. CLAUDE.md ≤ 80 lines, no duplication with this file.
5. Logs in scripts: structured + minimal.
6. Validate batch before next batch.
7. Hard cap: $30 for full MVP.
8. Checkpoint every 2h via PROJECT_STATE.md update.
9. No premature optimization. Engine first, polish later.
10. JSON config externalized — never hardcode prices.
