# CostPassport — Project State

**Version:** 0.4.0
**npm latest:** 0.4.0 ✅
**Last updated:** 2026-05-15

---

## Status

CostPassport is a local-first CLI tool for estimating AI build costs before starting a project.
Published on npm as `costpassport`. No backend. No telemetry. MIT license.

```bash
npx costpassport --help
```

---

## Public Commands

| Command | Description |
|---|---|
| `estimate` | Estimate AI token cost for a project brief |
| `before-you-build` | Readiness check before starting |
| `token-doctor` | Diagnose token bloat and get an optimization plan |
| `savings-report` | Calculate potential cost savings |
| `pricing:update` | Refresh local FX + pricing cache from ECB |
| `optimize` | CTOP free preview — token optimization analysis |
| `passport` | AI Work Passport — unified cost + risk report *(new in v0.4.0)* |

---

## What's in the package

- CLI only (`dist/cli.js`)
- Local-first: no project data leaves your machine
- No CTOP Pro logic in the public package
- No sensitive files in the npm tarball
- Supports: USD / EUR / XOF · Economy / Standard / Premium scenarios
- Flags: `--live` (ECB FX), `--sources` (data provenance), `--output` (write to file)

---

## Changelog summary

- **v0.1.0** — MVP: estimate, before-you-build, token-doctor, savings-report
- **v0.1.1** — Scoring coherence fix
- **v0.2.0** — Live data layer: `pricing:update`, `--sources`, local cache
- **v0.3.0** — `--live` flag for inline ECB FX fetch
- **v0.3.x** — Automated test suite (42 tests), `optimize` free preview
- **v0.4.0** — AI Work Passport: `costpassport passport`

---

## Next

- v0.5.0: `usage:import` + `compare` — estimated vs actual cost tracking
- v0.6.0: `budget-guard` — over/under budget decision
- Pro version: advanced optimization features (not in public CLI)
