(() => {
  const stepForYear = (baseStep, yearIdx) => {
    const offset = Math.max(0, (yearIdx | 0) - 1);
    return Math.max(1, Math.min(22, (baseStep | 0) + offset));
  };

  const computeCellValue = (base, yearIdx, paramsOverride) => {
    if (yearIdx <= 0) return Number(base) || 0;
    let v = Number(base) || 0;
    for (let j = 1; j <= yearIdx; j++) {
      const inc = paramsOverride?.increases?.[j] || {};
      const flat = Number(inc.flat) || 0;
      const rate = Number(inc.rate) || 0;
      // Apply % first, then add flat (flat not multiplied by %)
      v = v * (1 + rate) + flat;
    }
    return Number(v.toFixed(2)) || 0;
  };

  const computeHealthInsuranceNet = (gross, pct, premiumYear) => {
    const g = Number(gross) || 0;
    const p = Number(premiumYear) || 0;
    const contrib = Number(pct) || 0;
    return Number((g - p * contrib).toFixed(2)) || 0;
  };

  const computeSalaryAt = (step, col, fte = 1, year = 0, paramsOverride = null) => {
    const table = globalThis.baseTable || window.baseTable;
    if (!Array.isArray(table)) return 0;
    const effectiveStep = stepForYear(Number(step), Number(year));
    const row = table.find(r => r.step === effectiveStep);
    if (!row) return 0;
    const base = Number(row[col]) || 0;
    if (!base) return 0;
    return Number((computeCellValue(base, year, paramsOverride) * Number(fte || 1)).toFixed(2)) || 0;
  };

  const explainSalaryAt = (baseStep, column, fte = 1, year, paramsOverride = null) => {
    if (year <= 0) {
      const base = window.baseTable?.find(r => r.step === baseStep)?.[column] || 0;
      return {
        startStep: baseStep,
        column,
        stepAdvanced: false,
        stepReason: "Year 0 or 1 — no step advance",
        flatAdd: 0,
        pctIncrease: 0,
        finalSalary: computeSalaryAt(baseStep, column, fte, year, paramsOverride)
      };
    }

    let currentStep = baseStep;
    let currentSalary = window.baseTable?.find(r => r.step === currentStep)?.[column] || 0;
    let explanation = {
      startStep: baseStep,
      column,
      stepAdvances: [],
      flatAdds: [],
      pctIncreases: [],
      finalSalary: 0
    };

    for (let y = 1; y <= year; y++) {
      const inc = paramsOverride?.increases?.[y] || {};
      const flat = Number(inc.flat) || 0;
      const rate = Number(inc.rate) || 0;

      if (y >= 2) {
        const oldStep = currentStep;
        currentStep = stepForYear(baseStep, y);
        if (currentStep > oldStep) {
          explanation.stepAdvances.push({ year: y, from: oldStep, to: currentStep });
          const newBase = window.baseTable?.find(r => r.step === currentStep)?.[column] || currentSalary;
          currentSalary = newBase;
        }
      }

      if (flat > 0) explanation.flatAdds.push({ year: y, amount: flat });
      if (rate > 0) explanation.pctIncreases.push({ year: y, rate: rate * 100 });

      // Apply % first, then add flat (flat not multiplied by %)
      currentSalary = currentSalary * (1 + rate) + flat;
    }

    explanation.finalSalary = Number((currentSalary * Number(fte || 1)).toFixed(2));
    explanation.stepAdvanced = explanation.stepAdvances.length > 0;
    explanation.stepReason = explanation.stepAdvanced
      ? `Advanced in years: ${explanation.stepAdvances.map(a => `Y${a.year} (${a.from}→${a.to})`).join(", ")}`
      : "No step advances occurred";

    return explanation;
  };

  // Lightweight self-check
  const systemSelfCheck = () => {
    try {
      if (typeof stepForYear !== "function") return { status: "FAIL", reason: "stepForYear missing" };
      if (typeof computeSalaryAt !== "function") return { status: "FAIL", reason: "computeSalaryAt missing" };

      const table = window.baseTable;
      if (!Array.isArray(table) || table.length === 0) return { status: "FAIL", reason: "baseTable missing or empty" };

      // Step logic check
      if (stepForYear(10, 0) !== 10) return { status: "FAIL", reason: "stepForYear year 0 wrong" };
      if (stepForYear(10, 1) !== 10) return { status: "FAIL", reason: "stepForYear year 1 wrong" };
      if (stepForYear(10, 2) !== 11) return { status: "FAIL", reason: "stepForYear year 2 wrong" };
      if (stepForYear(22, 99) !== 22) return { status: "FAIL", reason: "step cap broken" };

      // Salary calc smoke test
      const test = computeSalaryAt(10, "M50", 1, 3, { increases: { 1: { flat: 1200, rate: 0.0275 } } });
      if (typeof test !== "number" || isNaN(test)) return { status: "FAIL", reason: "computeSalaryAt returned invalid value" };

      return { status: "PASS", message: "All core checks passed" };
    } catch (e) {
      return { status: "FAIL", reason: String(e.message || e) };
    }
  };

  const api = {
    stepForYear,
    computeCellValue,
    computeSalaryAt,
    computeHealthInsuranceNet,
    explainSalaryAt,
    systemSelfCheck,
    runSelfCheck: systemSelfCheck  // alias for compatibility
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    window.SalaryMath = api;
  }
})();
