# /costpassport:doctor

Diagnose token waste in the current project directory.

## What it does
Scans your project structure and identifies token leaks, context bloat, and
provides a prioritized optimization plan.
Reads only CLAUDE.md, README.md, package.json, and directory names — no source code.

## Usage

Default — scan the current project:

```bash
npx -y costpassport@latest token-doctor --path .
```

Optional — diagnose a specific brief file instead:

```bash
npx -y costpassport@latest token-doctor --brief <file>
```

## Notes
- Default behavior is `--path .` (current directory). No brief file needed.
- Never reads source code, .env files, or secrets.
- CostPassport runs locally. No project data leaves your machine.
- Requires Node.js ≥ 20.
