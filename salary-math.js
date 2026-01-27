(() => {
  // Exported salary math + base table for the BTA Salary Lookup app.
  // NOTE: This file intentionally exports baseTable + COLS so index.html can render without duplicating the schedule.

  const COLS = ["TA","BA","BA10","BA20","BA30","BA40","BA50","BA60","M","M10","M20","M30","M40","M50"];

  const baseTable = [
    {step:1,TA:31297, BA:52156, BA10:55028, BA20:57896, BA30:60765, BA40:63634, BA50:66502, BA60:69371,  M:66502,  M10:69371, M20:72239, M30:75109, M40:77975, M50:80846},
    {step:2,TA:null, BA:54767, BA10:57634, BA20:60504, BA30:63372, BA40:66241, BA50:69109, BA60:71980,  M:69109,  M10:71980, M20:74847, M30:77714, M40:80586, M50:83453},
    {step:3,TA:null, BA:57373, BA10:60243, BA20:63112, BA30:65979, BA40:68850, BA50:71716, BA60:74587,  M:71716,  M10:74587, M20:77457, M30:80324, M40:83194, M50:86062},
    {step:4,TA:null, BA:60243, BA10:63112, BA20:65979, BA30:68850, BA40:71716, BA50:74587, BA60:77457,  M:74587,  M10:77457, M20:80324, M30:83194, M40:86062, M50:88933},
    {step:5,TA:null, BA:63112, BA10:65979, BA20:68850, BA30:71716, BA40:74587, BA50:77457, BA60:80324,  M:77457,  M10:80324, M20:83194, M30:86062, M40:88933, M50:91799},
    {step:6,TA:null, BA:66241, BA10:69109, BA20:71980, BA30:74847, BA40:77714, BA50:80586, BA60:83453,  M:80586,  M10:83453, M20:86324, M30:89192, M40:92059, M50:94927},
    {step:7,TA:null, BA:69371, BA10:72239, BA20:75109, BA30:77975, BA40:80846, BA50:83716, BA60:86584,  M:83716,  M10:86584, M20:89453, M30:92320, M40:95189, M50:98059},
    {step:8,TA:null, BA:72503, BA10:75369, BA20:78238, BA30:81106, BA40:83976, BA50:86845, BA60:89712,  M:86845,  M10:89712, M20:92584, M30:95450, M40:98318, M50:101187},
    {step:9,TA:null, BA:75630, BA10:78500, BA20:81369, BA30:84238, BA40:87104, BA50:89974, BA60:92843,  M:89974,  M10:92843, M20:95713, M30:98579, M40:101449, M50:104317},
    {step:10,TA:null,BA:78761, BA10:81629, BA20:84497, BA30:87365, BA40:90236, BA50:93105, BA60:95973, M:93105, M10:95973, M20:98841, M30:101709, M40:104578, M50:107447},
    {step:11,TA:null,BA:81890, BA10:84756, BA20:87629, BA30:90495, BA40:93362, BA50:96233, BA60:99101, M:96233, M10:99101, M20:101972, M30:104840, M40:107708, M50:110576},
    {step:12,TA:null,BA:85019, BA10:87889, BA20:90757, BA30:93625, BA40:96492, BA50:99363, BA60:102230, M:99363, M10:102230, M20:105099, M30:107968, M40:110836, M50:113706},
    {step:13,TA:null,BA:88149, BA10:91017, BA20:93885, BA30:96754, BA40:99623, BA50:102492, BA60:105360, M:102492, M10:105360, M20:108229, M30:111098, M40:113965, M50:116836},
    {step:14,TA:null,BA:91279, BA10:94148, BA20:97016, BA30:99882, BA40:102752, BA50:105621, BA60:108490, M:105621, M10:108490, M20:111360, M30:114228, M40:117095, M50:119964},
    {step:15,TA:null,BA:94407, BA10:97277, BA20:100145, BA30:103014, BA40:105882, BA50:108752, BA60:111620, M:108752, M10:111620, M20:114488, M30:117357, M40:120225, M50:123095},
    {step:16,TA:null,BA:97537, BA10:100406, BA20:103274, BA30:106143, BA40:109012, BA50:111881, BA60:114751, M:111881, M10:114751, M20:117618, M30:120486, M40:123354, M50:126222},
    {step:17,TA:null,BA:100667, BA10:103534, BA20:106405, BA30:109272, BA40:112139, BA50:115010, BA60:117880, M:115010, M10:117880, M20:120748, M30:123616, M40:126486, M50:129355},
    {step:18,TA:null,BA:103794, BA10:106664, BA20:109532, BA30:112401, BA40:115270, BA50:118140, BA60:121006, M:118140, M10:121006, M20:123874, M30:126745, M40:129613, M50:132483},
    {step:19,TA:null,BA:106925, BA10:109795, BA20:112661, BA30:115530, BA40:118400, BA50:121269, BA60:124138, M:121269, M10:124138, M20:127006, M30:129876, M40:132742, M50:135612},
    {step:20,TA:null,BA:110056, BA10:112923, BA20:115792, BA30:118660, BA40:121529, BA50:124398, BA60:127266, M:124398, M10:127266, M20:130136, M30:133006, M40:135874, M50:138742},
    {step:21,TA:null,BA:113186, BA10:116053, BA20:118920, BA30:121791, BA40:124658, BA50:127529, BA60:130399, M:127529, M10:130399, M20:133265, M30:136134, M40:139003, M50:141872},
    {step:22,TA:null,BA:116315, BA10:119183, BA20:122050, BA30:124919, BA40:127790, BA50:130659, BA60:133527, M:130659, M10:133527, M20:136395, M30:139264, M40:142133, M50:145000}
  ];

  const stepForYear = (baseStep, yearIdx) => {
    const yr = yearIdx | 0;
    if (yr <= 1) return Math.max(1, Math.min(22, baseStep | 0));
    const offset = Math.max(0, yr - 1);
    return Math.max(1, Math.min(22, (baseStep | 0) + offset));
  };

  // paramsOverride format:
  // { increases: { 1:{rate,flat}, 2:{rate,flat}, ... } }
  const computeCellValue = (base, yearIdx, paramsOverride) => {
    const year = yearIdx | 0;
    if (year <= 0) return base;
    const params = paramsOverride || {};
    let v = base;
    for (let j = 1; j <= year; j += 1) {
      const r = +(params.increases?.[j]?.rate ?? 0);
      const f = +(params.increases?.[j]?.flat ?? 0);
      v = (v + f) * (1 + r); // flat first, then percent
    }
    return v;
  };

  const computeHealthInsuranceNet = (gross, pct, premiumYear) =>
    +(gross - (premiumYear * pct)).toFixed(2);

  const computeSalaryAt = (step, col, fte, year, paramsOverride) => {
    const effectiveStep = stepForYear(step, year);
    const row = baseTable.find(r => r.step === Math.max(1, Math.min(effectiveStep, 22)));
    const base = row ? row[col] : null;
    if (base == null) return 0;
    return +(computeCellValue(base, year, paramsOverride) * (fte || 1)).toFixed(2);
  };

  const explainSalaryAt = (baseStep, col, fte, yearIdx, paramsOverride) => {
    const year = yearIdx | 0;
    const startStep = Math.max(1, Math.min(22, baseStep | 0));
    const effectiveStep = stepForYear(startStep, year);
    const row = baseTable.find(r => r.step === effectiveStep);
    const base = row ? row[col] : null;
    if (base == null) return null;

    const params = paramsOverride || {};
    const increase = params.increases?.[year] || {};
    const flatAdd = +(+increase.flat || 0).toFixed(2);
    const pctIncrease = +(+increase.rate || 0).toFixed(4);

    const stepAdvanced = effectiveStep !== startStep;
    const stepCapApplied = effectiveStep === 22 && startStep + Math.max(0, year - 1) > 22;

    let stepReason = "";
    if (year <= 1) stepReason = "No step movement in Year 0/1 (retroactive years).";
    else stepReason = `Advanced +${Math.max(0, year - 1)} step(s) after Year 1.`;
    if (stepCapApplied) stepReason += " Capped at step 22.";

    const finalSalary = computeSalaryAt(startStep, col, fte || 1, year, paramsOverride);

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
    if (missing.length) return { ok: false, status: "FAIL", reason: `Missing exports: ${missing.join(", ")}` };
    return { ok: true, status: "PASS" };
  };

  const bootSelfTest = () => {
    const failures = [];
    const tests = [
      { base: 10, year: 0, expected: 10 },
      { base: 10, year: 1, expected: 10 },
      { base: 10, year: 2, expected: 11 },
      { base: 10, year: 5, expected: 14 }
    ];
    tests.forEach(t => {
      const got = stepForYear(t.base, t.year);
      if (got !== t.expected) failures.push(`stepForYear(${t.base},${t.year})=${got}`);
    });
    const sample = computeCellValue(1000, 1, { increases: { 1: { rate: 0.01, flat: 100 } } });
    if (typeof sample !== "number" || Number.isNaN(sample)) failures.push("computeCellValue returned non-number");
    if (failures.length) return { ok: false, status: "FAIL", reason: failures.join("; ") };
    return { ok: true, status: "PASS" };
  };

  const api = {
    COLS,
    baseTable,
    stepForYear,
    computeCellValue,
    computeSalaryAt,
    explainSalaryAt,
    computeHealthInsuranceNet,
    systemSelfCheck,
    bootSelfTest
  };

  // Back-compat globals
  globalThis.COLS = COLS;
  globalThis.baseTable = baseTable;

  // Export
  globalThis.SalaryMath = api;
  if (typeof window !== "undefined") window.SalaryMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
