# Minimal Automated Test Plan

This project is a single-file HTML app. The automated tests focus on the core salary math and helper logic, using a lightweight Node.js script.

## Scope
- Salary math ordering (flat then percent).
- Step movement rules (advance +1 per year, capped at 22).
- Health insurance (HI) net salary calculations.
- Staff lookup scenario selection (Current UI vs Scenario A/B/Both).

## How to run
From the repo root:

```bash
node tests/run-tests.js
```

## Expected results
- The script should report: `All 14 tests passed.`
- Non-zero exit code on failures.
