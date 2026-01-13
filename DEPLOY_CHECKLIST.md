# Deploy Checklist (BTA Salary Tool)

Before pushing to main:

1) Run tests:
   - node tests/run-tests.js

2) Open index.html locally (optional sanity check).

After pushing to main:

3) GitHub → Actions → confirm "pages build and deployment" succeeded.

4) Open the live site and confirm:
   - Salary table generates
   - Salary lookup returns a value
   - Export CSV works
