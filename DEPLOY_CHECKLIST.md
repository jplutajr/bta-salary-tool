# Deploy Checklist (BTA Salary Tool)

Before pushing to main:

1) Run tests:
   - node tests/run-tests.js

2) Open index.html locally (optional sanity check).

After pushing to main:

3) GitHub → Actions → confirm "pages build and deployment" succeeded.

4) Open the live site and confirm:
   - Salary table generates inline and in a new window (print view includes affordability banners).
   - Roster highlighting works, hover shows names/FTE/cell cost, and details toggle works.
   - Scenario A/B compare renders side-by-side when both are saved.
   - Staff salary lookup returns Gross + Net (uses 2026 annual premiums, correct premium type).
   - Hide TA / Compare to Year 0 / Net salary toggles update the table.
   - Export CSV and XLSX work for UI/A/B/both.
   - Affordability shows recurring + cash coverage results and updates with new inputs.
