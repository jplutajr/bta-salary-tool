(() => {
  const computeAffordability = () => {
    const app = window.BtaApp;
    if (!app) return;
    const rosterTools = window.BtaRoster;
    const roster = rosterTools?.getRoster?.() || [];

    const params = app.getUIParams();
    const schedules = app.buildSchedules(params);

    const adderPct = app.clamp(parseFloat(document.getElementById("adderPct")?.value || "0"), 0, 100) / 100;
    const addlRevenue = +document.getElementById("addlRevenue")?.value || 0;
    const otherSavings = +document.getElementById("otherSavings")?.value || 0;

    const budget = +document.getElementById("budget")?.value || 0;
    const maxBudgetFlat = +document.getElementById("maxBudgetFlat")?.value || 0;
    const maxBudgetPct = app.clamp(+document.getElementById("maxBudgetPct")?.value || 0, 0, 100) / 100;
    const stateAidPct = app.clamp(+document.getElementById("stateAidPct")?.value || 0, 0, 100) / 100;

    const allowableNewSpend = Math.max(maxBudgetFlat, budget * maxBudgetPct) + budget * stateAidPct;
    const offsets = addlRevenue + otherSavings;

    const schedules0 = schedules[0];
    const tbody = document.getElementById("affordabilityTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const years = [1, 2, 3, 4, 5];
    let anyFail = false;

    const rosterPayrollForYear = (year) => {
      let total = 0;
      roster.forEach((entry) => {
        const stepY = app.stepForYear(entry.Step, year);
        const value = app.salaryAt(schedules, year, stepY, entry.Column);
        if (value == null) return;
        total += value * (entry.FTE || 1);
      });
      return total;
    };

    const rosterBaselineForYear = (year) => {
      let total = 0;
      roster.forEach((entry) => {
        const stepY = app.stepForYear(entry.Step, year);
        const value = schedules0?.[stepY]?.[rosterTools?.normScale?.(entry.Column) || entry.Column];
        if (value == null) return;
        total += value * (entry.FTE || 1);
      });
      return total;
    };

    years.forEach((year) => {
      const contractPayroll = rosterPayrollForYear(year);
      const baselinePayroll = rosterBaselineForYear(year);

      const incremental = contractPayroll - baselinePayroll;
      const incrementalWithAdders = incremental * (1 + adderPct);
      const netImpact = incrementalWithAdders - offsets;

      const pass = netImpact <= allowableNewSpend;
      if (!pass) anyFail = true;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${year}</td>
        <td>${app.money(contractPayroll)}</td>
        <td>${app.money(baselinePayroll)}</td>
        <td>${app.money(incrementalWithAdders)}</td>
        <td>${app.money(offsets)}</td>
        <td>${app.money(netImpact)}</td>
        <td>${app.money(allowableNewSpend)}</td>
        <td class="${pass ? "ok" : "bad"}">${pass ? "PASS" : "FAIL"}</td>
      `;
      tbody.appendChild(tr);
    });

    const summary = document.getElementById("affordabilitySummary");
    const err = document.getElementById("affordabilityError");
    if (summary) summary.style.display = "block";
    if (err) err.style.display = anyFail ? "block" : "none";

    if (summary) {
      summary.className = `banner ${anyFail ? "fail" : "pass"}`;
      summary.innerHTML = `
        <div><strong>${anyFail ? "Affordability: FAIL in at least one year" : "Affordability: PASS (all years)"}</strong></div>
        <div class="soft">Allowable new spend/yr = ${app.money(allowableNewSpend)} (cap + state aid). Offsets/yr = ${app.money(offsets)}. Adders = ${(adderPct * 100).toFixed(1)}%.</div>
      `;
    }
    if (err) {
      err.innerHTML = "<strong>One or more years exceed allowable new spend.</strong> Reduce raises/flat, increase offsets, or revise cap assumptions.";
    }

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    let totalContract = 0;
    let totalInc = 0;
    years.forEach((year) => {
      const contract = rosterPayrollForYear(year);
      const baseline = rosterBaselineForYear(year);
      const incremental = (contract - baseline) * (1 + adderPct);
      totalContract += contract;
      totalInc += incremental;
      setText(`contractPayrollY${year}`, app.money(contract));
      setText(`incrementalY${year}`, app.money(incremental));
    });
    setText("contractPayrollTotal", app.money(totalContract));
    setText("incrementalTotal", app.money(totalInc));
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.BtaAffordability = { computeAffordability };
    window.addEventListener("bta-roster-updated", () => computeAffordability());
  });
})();
