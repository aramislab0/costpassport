# /costpassport:savings

Calculate how much you can save by optimizing your AI build strategy.

## What it does
Identifies savings levers (prompt caching, model routing, context pruning, etc.),
ranks them by impact, and gives a total savings opportunity range.

## Usage

Ask me for the path to your project brief, then I will run:

```bash
npx -y costpassport@latest savings-report --brief <file> --format markdown --live
```

## Notes
- CostPassport runs locally. No project data leaves your machine.
- Requires Node.js ≥ 20.
