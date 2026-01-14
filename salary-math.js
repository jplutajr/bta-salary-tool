(() => {
  const stepForYear = (baseStep, yearIdx) => {
    const offset = Math.max(0, (yearIdx | 0) - 1);
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

  const api = {
    stepForYear,
    computeCellValue,
    computeSalaryAt,
    computeHealthInsuranceNet
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    globalThis.SalaryMath = api;
  }
})();
