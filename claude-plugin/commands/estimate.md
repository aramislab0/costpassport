# /costpassport:estimate

Estimate AI token cost for a project brief.

## What it does
Produces a token and cost estimate across Economy, Standard, and Premium scenarios.
Includes confidence level, missing context detection, and optimization hints.

## Usage

Ask me for the path to your project brief, then I will run:

```bash
npx -y costpassport@latest estimate --brief <file> --format markdown --live
```

## Notes
- Output is in Markdown by default. Use `--format json` for raw data.
- CostPassport runs locally. No project data leaves your machine.
- Requires Node.js ≥ 20.
