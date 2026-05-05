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
    const salaryBudgetEnvelope = +document.getElementById("salaryBudgetEnvelope")?.value || 0;
    const salaryEnvelopeGrowthPct = app.clamp(+document.getElementById("salaryBudgetEnvelopeGrowthPct")?.value || 0, 0, 100) / 100;
    const oneTimeFund = +document.getElementById("oneTimeFund")?.value || 0;
    const reallocPct = app.clamp(+document.getElementById("reallocPct")?.value || 0, 0, 100) / 100;
    const oneTimeMode = document.getElementById("oneTimeMode")?.value || "y1";

    const budget = +document.getElementById("budget")?.value || 0;
    const maxBudgetFlat = +document.getElementById("maxBudgetFlat")?.value || 0;
    const maxBudgetPct = app.clamp(+document.getElementById("maxBudgetPct")?.value || 0, 0, 100) / 100;
    const stateAidPct = app.clamp(+document.getElementById("stateAidPct")?.value || 0, 0, 100) / 100;
    const otherPct = app.clamp(+document.getElementById("otherPct")?.value || 0, 0, 1);

    const firstYearIncrease = maxBudgetFlat > 0 ? maxBudgetFlat : (budget * maxBudgetPct);
    const additionalStateAidY1 = budget * stateAidPct;

    const cumulativeBudgetCapacityForYear = (year) => {
      let projectedBudget = budget;
      let cumulative = 0;
      for (let y = 1; y <= year; y += 1) {
        const inc = y === 1 && maxBudgetFlat > 0 ? maxBudgetFlat : projectedBudget * maxBudgetPct;
        cumulative += inc;
        projectedBudget += inc;
      }
      return cumulative + (additionalStateAidY1 * year) + (addlRevenue * year) + (otherSavings * year);
    };

    const otherObligations = budget * otherPct;
    const reallocAmount = otherObligations * reallocPct;
    const recurringOffsets = recurringSurplus + reallocAmount;
    const salaryEnvelopeForYear = (year) => (
      salaryBudgetEnvelope > 0
        ? salaryBudgetEnvelope * Math.pow(1 + salaryEnvelopeGrowthPct, Math.max(0, year - 1))
        : 0
    );

    const schedules0 = schedules[0];
    const tbody = document.getElementById("affordabilityTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const years = [1, 2, 3, 4, 5];
    let anyFailRecurring = false;
    let anyFailCash = false;
    let anyFailSalaryEnvelope = false;
    const failYearsRecurring = [];
    const failYearsCash = [];
    const failYearsSalaryEnvelope = [];
    const oneTimePerYear = oneTimeMode === "spread" ? oneTimeFund / 5 : 0;

    const rosterPayrollForYear = (year) => {
      let total = 0;
      roster.forEach((entry) => {
        const stepY = app.stepForYear(entry.Step, year, { step23Year1Eligible: !!entry.Step23Year1Eligible });
        const value = app.salaryAt(schedules, year, stepY, entry.Column);
        if (value == null) return;
        total += value * (entry.FTE || 1);
      });
      return total;
    };

    const rosterBaselineForYear = (year) => {
      let total = 0;
      roster.forEach((entry) => {
        const stepY = typeof app.baselineStepForYear === "function"
          ? app.baselineStepForYear(entry, year)
          : Math.max(1, Math.min(22, (Number(entry.Step) || 1) + Math.max(0, year - 1)));
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
      const cumulativeBudgetCapacity = cumulativeBudgetCapacityForYear(year);
      const cumulativeOffsets = recurringOffsets * year;
      const netImpactRecurring = incrementalWithAdders - cumulativeOffsets;
      const oneTimeApplied = oneTimeMode === "y1" ? (year === 1 ? oneTimeFund : 0) : oneTimePerYear * year;
      const netImpactCash = incrementalWithAdders - (cumulativeOffsets + oneTimeApplied);

      const projectedSalaryEnvelope = salaryEnvelopeForYear(year);
      const passSalaryEnvelope = projectedSalaryEnvelope <= 0 || contractPayroll <= projectedSalaryEnvelope;
      const passRecurring = netImpactRecurring <= cumulativeBudgetCapacity;
      const passCash = netImpactCash <= cumulativeBudgetCapacity;
      if (!passSalaryEnvelope) { anyFailSalaryEnvelope = true; failYearsSalaryEnvelope.push(year); }
      if (!passRecurring) { anyFailRecurring = true; failYearsRecurring.push(year); }
      if (!passCash) { anyFailCash = true; failYearsCash.push(year); }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${year}</td>
        <td>${app.money(contractPayroll)}</td>
        <td>${app.money(baselinePayroll)}</td>
        <td>${app.money(incrementalWithAdders)}</td>
        <td>${projectedSalaryEnvelope > 0 ? app.money(projectedSalaryEnvelope) : "—"}</td>
        <td class="${passSalaryEnvelope ? "ok" : "bad"}">${passSalaryEnvelope ? "PASS" : "FAIL"}</td>
        <td>${app.money(cumulativeOffsets)}</td>
        <td>${app.money(netImpactRecurring)}</td>
        <td>${app.money(cumulativeBudgetCapacity)}</td>
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
      const hasRecurringFlag = anyFailRecurring || anyFailSalaryEnvelope;
      const failParts = [];
      if (failYearsRecurring.length) failParts.push(`recurring capacity fails Y${failYearsRecurring.join(", Y")}`);
      if (failYearsSalaryEnvelope.length) failParts.push(`salary envelope fails Y${failYearsSalaryEnvelope.join(", Y")}`);
      const failText = failParts.length ? ` — ${failParts.join("; ")}` : "";
      recurringSummary.className = `banner ${hasRecurringFlag ? "fail" : "pass"}`;
      recurringSummary.innerHTML = `
        <div><strong>Recurring Affordability: ${hasRecurringFlag ? "FLAGGED" : "PASS (all years)"}${failText}</strong></div>
        <div class="soft">Year 1 official budget increase = ${app.money(firstYearIncrease)}. Future years use cumulative projected budget-growth capacity. Historical recurring cushion/underbudget default = ${app.money(recurringSurplus)}. Salary-code envelope starts at ${salaryBudgetEnvelope > 0 ? app.money(salaryBudgetEnvelope) : "not used"} and grows at ${(salaryEnvelopeGrowthPct * 100).toFixed(2)}%/yr. Adders = ${(adderPct * 100).toFixed(1)}%.</div>
      `;
    }
    if (cashSummary) {
      const cashFailText = failYearsCash.length ? ` — fails Y${failYearsCash.join(", Y")}` : "";
      cashSummary.className = `banner ${anyFailCash ? "fail" : "pass"}`;
      cashSummary.innerHTML = `
        <div><strong>Cash Coverage (with one-time): ${anyFailCash ? "FAIL" : "PASS (all years)"}${cashFailText}</strong></div>
        <div class="soft">One-time applied: ${oneTimeMode === "y1" ? "Year 1 only" : "Cumulative spread Y1–Y5"} (${app.money(oneTimeMode === "y1" ? oneTimeFund : oneTimePerYear)}${oneTimeMode === "spread" ? " / yr" : ""}).</div>
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
