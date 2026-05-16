# CostPassport — Claude Code Plugin

A Claude Code plugin that wraps the CostPassport CLI.
Run AI cost estimation, readiness checks, and token diagnostics directly from your Claude Code session.

## Commands

| Command | What it does |
|---|---|
| `/costpassport:passport` | Full AI Work Passport — cost, readiness, risks, actions |
| `/costpassport:demo` | Instant demo (no brief required) |
| `/costpassport:estimate` | Token + cost range across 3 scenarios |
| `/costpassport:doctor` | Token waste diagnosis |
| `/costpassport:savings` | Savings opportunity report |

## Requirements

- Claude Code
- Node.js ≥ 20
- Internet access for `--live` FX rates (optional)

## Privacy

CostPassport runs locally. Your brief and project files never leave your machine.
The only network call is an ECB FX rate fetch when `--live` is used.

## Source

CLI: `npx costpassport@latest`
Repo: https://github.com/aramislab0/costpassport
