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
    const recurringSurplus = +document.getElementById("recurringSurplus")?.value || 0;
    const oneTimeFund = +document.getElementById("oneTimeFund")?.value || 0;
    const reallocPct = app.clamp(+document.getElementById("reallocPct")?.value || 0, 0, 100) / 100;
    const oneTimeMode = document.getElementById("oneTimeMode")?.value || "y1";

    const budget = +document.getElementById("budget")?.value || 0;
    const maxBudgetFlat = +document.getElementById("maxBudgetFlat")?.value || 0;
    const maxBudgetPct = app.clamp(+document.getElementById("maxBudgetPct")?.value || 0, 0, 100) / 100;
    const stateAidPct = app.clamp(+document.getElementById("stateAidPct")?.value || 0, 0, 100) / 100;
    const otherPct = app.clamp(+document.getElementById("otherPct")?.value || 0, 0, 1);

    const baseCap = Math.max(maxBudgetFlat, budget * maxBudgetPct) + budget * stateAidPct + addlRevenue + otherSavings;
    const otherObligations = budget * otherPct;
    const reallocAmount = otherObligations * reallocPct;
    const recurringOffsets = recurringSurplus + reallocAmount;

    const schedules0 = schedules[0];
    const tbody = document.getElementById("affordabilityTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const years = [1, 2, 3, 4, 5];
    let anyFailRecurring = false;
    let anyFailCash = false;
    const oneTimePerYear = oneTimeMode === "spread" ? oneTimeFund / 5 : 0;

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
      const netImpactRecurring = incrementalWithAdders - recurringOffsets;
      const oneTimeApplied = oneTimeMode === "y1" ? (year === 1 ? oneTimeFund : 0) : oneTimePerYear;
      const netImpactCash = incrementalWithAdders - (recurringOffsets + oneTimeApplied);

      const passRecurring = netImpactRecurring <= baseCap;
      const passCash = netImpactCash <= baseCap;
      if (!passRecurring) anyFailRecurring = true;
      if (!passCash) anyFailCash = true;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${year}</td>
        <td>${app.money(contractPayroll)}</td>
        <td>${app.money(baselinePayroll)}</td>
        <td>${app.money(incrementalWithAdders)}</td>
        <td>${app.money(recurringOffsets)}</td>
        <td>${app.money(netImpactRecurring)}</td>
        <td>${app.money(baseCap)}</td>
        <td class="${passRecurring ? "ok" : "bad"}">${passRecurring ? "PASS" : "FAIL"}</td>
        <td class="${passCash ? "ok" : "bad"}">${passCash ? "PASS" : "FAIL"}</td>
      `;
      tbody.appendChild(tr);
    });

    const recurringSummary = document.getElementById("affordabilitySummaryRecurring");
    const cashSummary = document.getElementById("affordabilitySummaryCash");
    if (recurringSummary) recurringSummary.style.display = "block";
    if (cashSummary) cashSummary.style.display = "block";

    if (recurringSummary) {
      recurringSummary.className = `banner ${anyFailRecurring ? "fail" : "pass"}`;
      recurringSummary.innerHTML = `
        <div><strong>Recurring Affordability: ${anyFailRecurring ? "FAIL in at least one year" : "PASS (all years)"}</strong></div>
        <div class="soft">Base cap/yr = ${app.money(baseCap)} (cap + state aid + addl/other). Recurring offsets/yr = ${app.money(recurringOffsets)}. Adders = ${(adderPct * 100).toFixed(1)}%.</div>
      `;
    }
    if (cashSummary) {
      cashSummary.className = `banner ${anyFailCash ? "fail" : "pass"}`;
      cashSummary.innerHTML = `
        <div><strong>Cash Coverage (with one-time): ${anyFailCash ? "FAIL in at least one year" : "PASS (all years)"}</strong></div>
        <div class="soft">One-time applied: ${oneTimeMode === "y1" ? "Year 1 only" : "Spread evenly Y1–Y5"} (${app.money(oneTimeMode === "y1" ? oneTimeFund : oneTimePerYear)}${oneTimeMode === "spread" ? " / yr" : ""}).</div>
      `;
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
