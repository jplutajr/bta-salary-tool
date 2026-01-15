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
    // -----------------------------
// System self-check (lightweight, deterministic)
// -----------------------------
function systemSelfCheck(baseTable) {
  try {
    // Basic sanity: required exported funcs exist
    if (typeof stepForYear !== "function") return { ok: false, message: "Missing stepForYear()" };
    if (typeof computeSalaryAt !== "function") return { ok: false, message: "Missing computeSalaryAt()" };

    // Minimal table sanity
    if (!baseTable || typeof baseTable !== "object") {
      return { ok: false, message: "Missing baseTable" };
    }

    // 1) Step rule sanity: Year 0 and Year 1 should keep same step; Year 2 advances by 1 (your hybrid rule)
    // NOTE: If your stepForYear signature differs, we’ll adjust next.
    const s0 = stepForYear(10, 0);
    const s1 = stepForYear(10, 1);
    const s2 = stepForYear(10, 2);

    if (s0 !== 10) return { ok: false, message: `stepForYear(10,0) expected 10, got ${s0}` };
    if (s1 !== 10) return { ok: false, message: `stepForYear(10,1) expected 10, got ${s1}` };
    if (s2 !== 11) return { ok: false, message: `stepForYear(10,2) expected 11, got ${s2}` };

    // 2) Step cap sanity: large year shouldn’t exceed 22
    const capped = stepForYear(22, 99);
    if (capped !== 22) return { ok: false, message: `step cap failed: expected 22, got ${capped}` };

    // 3) Deterministic salary sanity: if table contains a known cell, computeSalaryAt should return a number
    // We’ll use whatever exists: try common keys, otherwise just confirm computeSalaryAt runs.
    let sample = null;
    const possibleCols = ["M50", "BA", "MA", "BA+60", "M"];
    for (const col of possibleCols) {
      if (baseTable[col] && baseTable[col][10] != null) {
        sample = { col, step: 10, base: baseTable[col][10] };
        break;
      }
    }

    // If we found a sample, validate numeric output
    if (sample) {
      const val = computeSalaryAt(baseTable, sample.step, sample.col, 1, 0, 0); // year=1, flat=0, pct=0
      if (typeof val !== "number" || Number.isNaN(val)) {
        return { ok: false, message: `computeSalaryAt returned non-number for ${sample.col} step ${sample.step}` };
      }
    } else {
      // No sample found; still verify computeSalaryAt doesn't throw on a basic call
      computeSalaryAt(baseTable, 1, Object.keys(baseTable)[0], 0, 0, 0);
    }

    return { ok: true, message: "All checks passed" };
  } catch (e) {
    return { ok: false, message: `Self-check error: ${e && e.message ? e.message : String(e)}` };
  }
}

// Export via window.SalaryMath (keep existing exports intact)
window.SalaryMath = window.SalaryMath || {};
window.SalaryMath.systemSelfCheck = systemSelfCheck;

  } else {
    globalThis.SalaryMath = api;
  }
})();
