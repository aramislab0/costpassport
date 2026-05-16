# /costpassport:passport

Generate a full AI Work Passport from a project brief.

## What it does
Runs all analysis in one pass: cost estimate (Economy / Standard / Premium), readiness score,
4 risk dimensions, token leaks, priority actions, and suggested build strategy.

## Usage

Ask me for the path to your project brief file, then I will run:

```bash
npx -y costpassport@latest passport --brief <file> --live --sources
```

For a compact screenshotable version:

```bash
npx -y costpassport@latest passport --brief <file> --compact
```

For a specific currency:

```bash
npx -y costpassport@latest passport --brief <file> --currency GBP --live
```

## Notes
- CostPassport runs locally. No project data leaves your machine.
- Estimates may vary ±30–50% from actual AI token cost.
- Requires Node.js ≥ 20.
