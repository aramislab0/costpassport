# /costpassport:doctor

Diagnose token waste in your project brief or directory.

## What it does
Identifies token leaks, context bloat, and provides a prioritized optimization plan.
Can scan your project directory structure (reads only CLAUDE.md, README.md, package.json,
and directory names — no source code).

## Usage

For a project brief:

```bash
npx -y costpassport@latest token-doctor --brief <file>
```

For a project directory:

```bash
npx -y costpassport@latest token-doctor --path .
```

## Notes
- Never reads source code, .env files, or secrets.
- CostPassport runs locally. No project data leaves your machine.
- Requires Node.js ≥ 20.
