(() => {
  const stepForYear = (baseStep, yearIdx) => {
    const yr = yearIdx | 0;
    if (yr <= 1) return Math.max(1, Math.min(22, baseStep | 0));
    const offset = Math.max(0, yr - 1);
    return Math.max(1, Math.min(22, (baseStep | 0) + offset));
  };

  const computeCellValue = (base, yearIdx, paramsOverride) => {
    if (yearIdx === 0) return base;
    let v = base;
    for (let j = 1; j <= yearIdx; j += 1) {
      const r = paramsOverride ? (paramsOverride.increases?.[j]?.rate ?? 0) : 0;
      const f = paramsOverride ? (paramsOverride.increases?.[j]?.flat ?? 0) : 0;
      v = (v + f) * (1 + r);
    }
    return v;
  };

  const computeHealthInsuranceNet = (gross, pct, premiumYear) =>
    +(gross - (premiumYear * pct)).toFixed(2);

  const computeSalaryAt = (step, col, fte, year, paramsOverride) => {
    const table = globalThis.baseTable;
    if (!Array.isArray(table)) return 0;
    const row = table.find(r => r.step === Math.max(1, Math.min(step, 22)));
    const base = row ? row[col] : null;
    if (base == null) return 0;
    return +(computeCellValue(base, year, paramsOverride) * (fte || 1)).toFixed(2);
  };

  const explainSalaryAt = (baseStep, col, fte, yearIdx, paramsOverride) => {
    const table = globalThis.baseTable;
    if (!Array.isArray(table)) return null;
    const year = yearIdx | 0;
    const startStep = Math.max(1, Math.min(22, baseStep | 0));
    const effectiveStep = stepForYear(startStep, year);
    const row = table.find(r => r.step === effectiveStep);
    const base = row ? row[col] : null;
    if (base == null) return null;
    const params = paramsOverride || {};
    const increase = params.increases?.[year] || {};
    const flatAdd = +(+increase.flat || 0).toFixed(2);
    const pctIncrease = +(+increase.rate || 0).toFixed(4);
    const stepAdvanced = effectiveStep !== startStep;
    const stepCapApplied = effectiveStep === 22 && startStep + Math.max(0, year - 1) > 22;
    let stepReason = "";
    if (year <= 1) {
      stepReason = "No step movement in Year 0/1 (retroactive years).";
    } else {
      stepReason = `Advanced +${Math.max(0, year - 1)} step(s) after Year 1.`;
    }
    if (stepCapApplied) {
      stepReason += " Capped at step 22.";
    }
    const finalSalary = computeSalaryAt(effectiveStep, col, fte || 1, year, paramsOverride);
    return {
      startStep,
      column: col,
      year,
      effectiveStep,
      stepAdvanced,
      stepReason,
      flatAdd,
      pctIncrease,
      baseSalary: base,
      fte: fte || 1,
      finalSalary
    };
  };

  const systemSelfCheck = () => {
    const required = {
      stepForYear,
      computeCellValue,
      computeSalaryAt,
      computeHealthInsuranceNet
    };
    const missing = Object.entries(required)
      .filter(([, fn]) => typeof fn !== "function")
      .map(([name]) => name);
    if (missing.length) {
      return { ok: false, status: "FAIL", reason: `Missing exports: ${missing.join(", ")}` };
    }
    return { ok: true, status: "PASS" };
  };

  const runSelfCheck = () => systemSelfCheck();

  const api = {
    stepForYear,
    computeCellValue,
    computeSalaryAt,
    explainSalaryAt,
    computeHealthInsuranceNet,
    runSelfCheck,
    systemSelfCheck
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    globalThis.SalaryMath = api;
  }
})();
