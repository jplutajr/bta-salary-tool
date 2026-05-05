(() => {
  /***********************************************************************
   * app.js — BTA Salary Lookup
   * Fixes included:
   *  - Built-in SalaryMath fallback (prevents "salary-math.js missing" boot error)
   *  - Robust HI contribution parsing (supports 19 or 0.19 inputs)
   *  - A2 behavior: tables open in new window, inline only hidden for newWindow
   *  - Adds .is-hidden style if your CSS doesn’t define it
   *  - NEW: Always builds an AI-friendly salary table payload (even when table is new-window only)
   *  - NEW: Print CSS tuned to fit wide tables (landscape + scaling)
   ***********************************************************************/

  // ------------------------------ Small CSS safety ------------------------------
  (function ensureHiddenClass() {
    try {
      const id = "__bta_app_hidden_style__";
      if (document.getElementById(id)) return;
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
        .is-hidden{ display:none !important; }
      `;
      document.head.appendChild(style);
    } catch {
      // ignore
    }
  })();

  // ------------------------------ Constants ------------------------------
  const BUILD_VERSION = "v0.5.4-budget-realism";
  const BUILD_TIME = new Date().toLocaleString();

  // 2025 premiums (annual)
  const IND_PREM_YEAR = 19599.96;
  const FAM_PREM_YEAR = 43965.48;

  const COLS = ["TA","BA","BA10","BA20","BA30","BA40","BA50","BA60","M","M10","M20","M30","M40","M50"];

  const baseTable = [
    { step: 1, TA: 31297, BA: 52156, BA10: 55028, BA20: 57896, BA30: 60765, BA40: 63634, BA50: 66502, BA60: 69371, M: 66502, M10: 69371, M20: 72239, M30: 75109, M40: 77975, M50: 80846 },
    { step: 2, TA: null, BA: 54767, BA10: 57634, BA20: 60504, BA30: 63372, BA40: 66241, BA50: 69109, BA60: 71980, M: 69109, M10: 71980, M20: 74847, M30: 77714, M40: 80586, M50: 83453 },
    { step: 3, TA: null, BA: 57373, BA10: 60243, BA20: 63112, BA30: 65979, BA40: 68850, BA50: 71716, BA60: 74587, M: 71716, M10: 74587, M20: 77457, M30: 80324, M40: 83194, M50: 86062 },
    { step: 4, TA: null, BA: 60243, BA10: 63112, BA20: 65979, BA30: 68850, BA40: 71716, BA50: 74587, BA60: 77457, M: 74587, M10: 77457, M20: 80324, M30: 83194, M40: 86062, M50: 88933 },
    { step: 5, TA: null, BA: 63112, BA10: 65979, BA20: 68850, BA30: 71716, BA40: 74587, BA50: 77457, BA60: 80324, M: 77457, M10: 80324, M20: 83194, M30: 86062, M40: 88933, M50: 91799 },
    { step: 6, TA: null, BA: 66241, BA10: 69109, BA20: 71980, BA30: 74847, BA40: 77714, BA50: 80586, BA60: 83453, M: 80586, M10: 83453, M20: 86324, M30: 89192, M40: 92059, M50: 94927 },
    { step: 7, TA: null, BA: 69371, BA10: 72239, BA20: 75109, BA30: 77975, BA40: 80846, BA50: 83716, BA60: 86584, M: 83716, M10: 86584, M20: 89453, M30: 92320, M40: 95189, M50: 98059 },
    { step: 8, TA: null, BA: 72503, BA10: 75369, BA20: 78238, BA30: 81106, BA40: 83976, BA50: 86845, BA60: 89712, M: 86845, M10: 89712, M20: 92584, M30: 95450, M40: 98318, M50: 101187 },
    { step: 9, TA: null, BA: 75630, BA10: 78500, BA20: 81369, BA30: 84238, BA40: 87104, BA50: 89974, BA60: 92843, M: 89974, M10: 92843, M20: 95713, M30: 98579, M40: 101449, M50: 104317 },
    { step: 10, TA: null, BA: 78761, BA10: 81629, BA20: 84497, BA30: 87365, BA40: 90236, BA50: 93105, BA60: 95973, M: 93105, M10: 95973, M20: 98841, M30: 101709, M40: 104578, M50: 107447 },
    { step: 11, TA: null, BA: 81890, BA10: 84756, BA20: 87629, BA30: 90495, BA40: 93362, BA50: 96233, BA60: 99101, M: 96233, M10: 99101, M20: 101972, M30: 104840, M40: 107708, M50: 110576 },
    { step: 12, TA: null, BA: 85019, BA10: 87889, BA20: 90757, BA30: 93625, BA40: 96492, BA50: 99363, BA60: 102230, M: 99363, M10: 102230, M20: 105099, M30: 107968, M40: 110836, M50: 113706 },
    { step: 13, TA: null, BA: 88149, BA10: 91017, BA20: 93885, BA30: 96754, BA40: 99623, BA50: 102492, BA60: 105360, M: 102492, M10: 105360, M20: 108229, M30: 111098, M40: 113965, M50: 116836 },
    { step: 14, TA: null, BA: 91279, BA10: 94148, BA20: 97016, BA30: 99882, BA40: 102752, BA50: 105621, BA60: 108490, M: 105621, M10: 108490, M20: 111360, M30: 114228, M40: 117095, M50: 119964 },
    { step: 15, TA: null, BA: 94407, BA10: 97277, BA20: 100145, BA30: 103014, BA40: 105882, BA50: 108752, BA60: 111620, M: 108752, M10: 111620, M20: 114488, M30: 117357, M40: 120225, M50: 123095 },
    { step: 16, TA: null, BA: 97537, BA10: 100406, BA20: 103274, BA30: 106143, BA40: 109012, BA50: 111881, BA60: 114751, M: 111881, M10: 114751, M20: 117618, M30: 120486, M40: 123354, M50: 126222 },
    { step: 17, TA: null, BA: 100667, BA10: 103534, BA20: 106405, BA30: 109272, BA40: 112139, BA50: 115010, BA60: 117880, M: 115010, M10: 117880, M20: 120748, M30: 123616, M40: 126486, M50: 129355 },
    { step: 18, TA: null, BA: 103794, BA10: 106664, BA20: 109532, BA30: 112401, BA40: 115270, BA50: 118140, BA60: 121006, M: 118140, M10: 121006, M20: 123874, M30: 126745, M40: 129613, M50: 132483 },
    { step: 19, TA: null, BA: 106925, BA10: 109795, BA20: 112661, BA30: 115530, BA40: 118400, BA50: 121269, BA60: 124138, M: 121269, M10: 124138, M20: 127006, M30: 129876, M40: 132742, M50: 135612 },
    { step: 20, TA: null, BA: 110056, BA10: 112923, BA20: 115792, BA30: 118660, BA40: 121529, BA50: 124398, BA60: 127266, M: 124398, M10: 127266, M20: 130136, M30: 133006, M40: 135874, M50: 138742 },
    { step: 21, TA: null, BA: 113186, BA10: 116053, BA20: 118920, BA30: 121791, BA40: 124658, BA50: 127529, BA60: 130399, M: 127529, M10: 130399, M20: 133265, M30: 136134, M40: 139003, M50: 141872 },
    { step: 22, TA: null, BA: 116315, BA10: 119183, BA20: 122050, BA30: 124919, BA40: 127790, BA50: 130659, BA60: 133527, M: 130659, M10: 133527, M20: 136395, M30: 139264, M40: 142133, M50: 145000 }
  ];

  // ------------------------------ Utilities ------------------------------
  const money = (value) =>
    Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

  const moneyWhole = (value) =>
    Number(Math.round(Number(value || 0))).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 });

  const setStatus = (msg) => {
    const node = document.getElementById("statusMsg");
    if (node) node.textContent = msg || "";
  };

  const clamp = (n, lo, hi) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
  };

  const parseYearInput = (str) => {
    const raw = String(str || "").trim();
    if (!raw) return [1];
    if (raw.includes("-")) {
      const [a, b] = raw.split("-").map((x) => parseInt(x.trim(), 10));
      const start = clamp(a || 0, 0, 5);
      const end = clamp(b || start, 0, 5);
      const out = [];
      for (let y = Math.min(start, end); y <= Math.max(start, end); y += 1) out.push(y);
      return out;
    }
    return raw
      .split(/[, ]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 5);
  };

  const getBaseSalary = (step, col) => {
    const row = baseTable.find((r) => r.step === step);
    if (!row) return null;
    const value = row[col];
    return value == null ? null : Number(value);
  };

  // ------------------------------ Robust HI parsing ------------------------------
  // Accepts:
  //  - "19" meaning 19%
  //  - "0.19" meaning 19%
  //  - "19%" (if ever)
  const normalizeHiPct = (raw) => {
    const s = String(raw ?? "").trim().replace("%", "");
    const v = Number(s);
    if (!Number.isFinite(v)) return 0;
    if (v > 1) return clamp(v / 100, 0, 1);
    return clamp(v, 0, 1);
  };

  // ------------------------------ SalaryMath fallback ------------------------------
  const ensureSalaryMath = () => {
    if (window.SalaryMath && typeof window.SalaryMath === "object") {
      const sm = window.SalaryMath;
      if (
        typeof sm.stepForYear === "function" &&
        typeof sm.computeCellValue === "function" &&
        typeof sm.computeSalaryAt === "function"
      ) return;
    }

    const stepForYearLocal = (baseStep, yearIdx) => {
      const s0 = clamp(baseStep, 1, 22);
      if (yearIdx <= 1) return s0;
      return clamp(s0 + (yearIdx - 1), 1, 22);
    };

    const computeCellValueLocal = (base, yearIdx, paramsOverride) => {
      const b = Number(base);
      if (!Number.isFinite(b)) return null;
      if (yearIdx === 0) return b;

      let v = b;
      for (let j = 1; j <= yearIdx; j += 1) {
        const flat =
          paramsOverride?.increases?.[j]?.flat ??
          (Number(document.getElementById(`flat${j}`)?.value || 0) || 0);
        const rate =
          paramsOverride?.increases?.[j]?.rate ??
          (Number(document.getElementById(`year${j}`)?.value || 0) || 0);

        // Apply % raise first, then add flat (flat is NOT multiplied by the %)
        v = v * (1 + Number(rate || 0)) + Number(flat || 0);
      }
      return v;
    };

    const computeSalaryAtLocal = (step, col, fte, yearIdx, paramsOverride) => {
      const s = clamp(step, 1, 22);
      const row = baseTable.find((r) => r.step === s);
      if (!row) return null;
      const base = row[col];
      if (base == null) return null;
      const gross = computeCellValueLocal(base, yearIdx, paramsOverride);
      if (gross == null) return null;
      const f = Number(fte || 1);
      return +(gross * (Number.isFinite(f) ? f : 1)).toFixed(2);
    };

    const computeHealthInsuranceNetLocal = (gross, pct, premiumYear) =>
      +(Number(gross || 0) - Number(premiumYear || 0) * Number(pct || 0)).toFixed(2);

    const explainSalaryAtLocal = (startStep, column, fte, yearIdx, paramsOverride) => {
      const stepReason =
        yearIdx <= 1
          ? "Step does not advance in Year 0/1."
          : `Step advances +${yearIdx - 1} by Year ${yearIdx}, capped at 22.`;
      const finalSalary = computeSalaryAtLocal(startStep, column, fte, yearIdx, paramsOverride);

      const flatAdds = [];
      const pctIncreases = [];
      for (let j = 1; j <= yearIdx; j += 1) {
        const flat = paramsOverride?.increases?.[j]?.flat ?? null;
        const rate = paramsOverride?.increases?.[j]?.rate ?? null;
        if (flat != null) flatAdds.push({ year: j, amount: Number(flat) });
        if (rate != null) pctIncreases.push({ year: j, rate: Number(rate) * 100 });
      }

      return {
        startStep,
        column,
        stepReason,
        flatAdds,
        pctIncreases,
        finalSalary
      };
    };

    const runSelfCheckLocal = () => {
      const v = getBaseSalary(10, "M50");
      if (!Number.isFinite(v)) return { status: "FAIL", reason: "Base table missing Step10 M50" };
      return { status: "PASS" };
    };

    window.SalaryMath = {
      stepForYear: stepForYearLocal,
      computeCellValue: computeCellValueLocal,
      computeSalaryAt: computeSalaryAtLocal,
      computeHealthInsuranceNet: computeHealthInsuranceNetLocal,
      explainSalaryAt: explainSalaryAtLocal,
      runSelfCheck: runSelfCheckLocal,
      systemSelfCheck: runSelfCheckLocal
    };
  };

  const SalaryMath = () => window.SalaryMath || {};

  // ------------------------------ UI Params ------------------------------
  const getUIParams = () => {
    const pct = (id) => clamp(parseFloat(document.getElementById(id)?.value || "0"), 0, 1);
    const flat = (id) => clamp(parseFloat(document.getElementById(id)?.value || "0"), -1e9, 1e9);

    const yPct = [null, pct("year1"), pct("year2"), pct("year3"), pct("year4"), pct("year5")];
    const yFlat = [null, flat("flat1"), flat("flat2"), flat("flat3"), flat("flat4"), flat("flat5")];

    const contrib = (id) => normalizeHiPct(document.getElementById(id)?.value ?? "0.19");
    const hiPct = [
      null,
      contrib("contributionY1"),
      contrib("contributionY2"),
      contrib("contributionY3"),
      contrib("contributionY4"),
      contrib("contributionY5")
    ];

    const hiFlat = [
      null,
      clamp(parseFloat(document.getElementById("hiFlatY1")?.value || "0"), 0, 1e9),
      clamp(parseFloat(document.getElementById("hiFlatY2")?.value || "0"), 0, 1e9),
      clamp(parseFloat(document.getElementById("hiFlatY3")?.value || "0"), 0, 1e9),
      clamp(parseFloat(document.getElementById("hiFlatY4")?.value || "0"), 0, 1e9),
      clamp(parseFloat(document.getElementById("hiFlatY5")?.value || "0"), 0, 1e9)
    ];

    return { yPct, yFlat, hiPct, hiFlat };
  };

  const serializeScenarioFromUI = () => {
    const { yPct, yFlat, hiPct, hiFlat } = getUIParams();
    return {
      yPct,
      yFlat,
      hiPct,
      hiFlat,

      gfBase: +document.getElementById("gfBase")?.value || 0,
      gfGrowthPct: +document.getElementById("gfGrowthPct")?.value || 0,
      adderPct: +document.getElementById("adderPct")?.value || 0,
      otherPct: +document.getElementById("otherPct")?.value || 0,
      budget: +document.getElementById("budget")?.value || 0,
      maxBudgetPct: +document.getElementById("maxBudgetPct")?.value || 0,
      maxBudgetFlat: +document.getElementById("maxBudgetFlat")?.value || 0,
      stateAidPct: +document.getElementById("stateAidPct")?.value || 0,
      addlRevenue: +document.getElementById("addlRevenue")?.value || 0,
      otherSavings: +document.getElementById("otherSavings")?.value || 0,
      recurringSurplus: +document.getElementById("recurringSurplus")?.value || 0,
      salaryBudgetEnvelope: +document.getElementById("salaryBudgetEnvelope")?.value || 0,
      oneTimeFund: +document.getElementById("oneTimeFund")?.value || 0,
      reallocPct: +document.getElementById("reallocPct")?.value || 0,
      oneTimeMode: document.getElementById("oneTimeMode")?.value || "y1"
    };
  };

  const applyScenarioToUI = (payload) => {
    if (!payload) return;

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };

    // Percent dropdown values are stored as fixed 4-decimal fractions (e.g., 0.0300).
    // If we set a select to "0" it won't match any option ("0.0000"), and the UI will silently fall back.
    const toUiRate = (v, fallback = 0.0275) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(4) : Number(fallback).toFixed(4);
    };

    setVal("year1", toUiRate(payload.yPct?.[1]));
    setVal("year2", toUiRate(payload.yPct?.[2]));
    setVal("year3", toUiRate(payload.yPct?.[3]));
    setVal("year4", toUiRate(payload.yPct?.[4]));
    setVal("year5", toUiRate(payload.yPct?.[5]));

    setVal("flat1", String(payload.yFlat?.[1] ?? 1200));
    setVal("flat2", String(payload.yFlat?.[2] ?? 1200));
    setVal("flat3", String(payload.yFlat?.[3] ?? 1200));
    setVal("flat4", String(payload.yFlat?.[4] ?? 1200));
    setVal("flat5", String(payload.yFlat?.[5] ?? 1200));

    const toUiPct = (p) => {
      const v = Number(p ?? 0.19);
      return v <= 1 ? String(v * 100) : String(v);
    };

    setVal("contributionY1", toUiPct(payload.hiPct?.[1]));
    setVal("contributionY2", toUiPct(payload.hiPct?.[2]));
    setVal("contributionY3", toUiPct(payload.hiPct?.[3]));
    setVal("contributionY4", toUiPct(payload.hiPct?.[4]));
    setVal("contributionY5", toUiPct(payload.hiPct?.[5]));

    setVal("hiFlatY1", String(payload.hiFlat?.[1] ?? 0));
    setVal("hiFlatY2", String(payload.hiFlat?.[2] ?? 0));
    setVal("hiFlatY3", String(payload.hiFlat?.[3] ?? 0));
    setVal("hiFlatY4", String(payload.hiFlat?.[4] ?? 0));
    setVal("hiFlatY5", String(payload.hiFlat?.[5] ?? 0));

    setVal("gfBase", String(payload.gfBase ?? ""));
    setVal("gfGrowthPct", String(payload.gfGrowthPct ?? ""));
    setVal("adderPct", String(payload.adderPct ?? ""));
    setVal("otherPct", String(payload.otherPct ?? ""));
    setVal("budget", String(payload.budget ?? ""));
    setVal("maxBudgetPct", String(payload.maxBudgetPct ?? ""));
    setVal("maxBudgetFlat", String(payload.maxBudgetFlat ?? ""));
    setVal("stateAidPct", String(payload.stateAidPct ?? ""));
    setVal("addlRevenue", String(payload.addlRevenue ?? ""));
    setVal("otherSavings", String(payload.otherSavings ?? ""));
    setVal("recurringSurplus", String(payload.recurringSurplus ?? ""));
    setVal("salaryBudgetEnvelope", String(payload.salaryBudgetEnvelope ?? ""));
    setVal("oneTimeFund", String(payload.oneTimeFund ?? ""));
    setVal("reallocPct", String(payload.reallocPct ?? ""));
    setVal("oneTimeMode", payload.oneTimeMode || "y1");
  };

  const SCENARIO_KEY_A = "bta_scenario_A_v1";
  const SCENARIO_KEY_B = "bta_scenario_B_v1";

  const formatSavedAt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "";
    // compact, local
    return d.toLocaleString(undefined, { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const saveScenario = (which) => {
    // Always overwrite. Track existence only for a helpful status message.
    const existing = loadScenario(which);

    const payload = serializeScenarioFromUI();
    payload._savedAt = new Date().toISOString();
    payload._scenario = which;
    try {
      localStorage.setItem(which === "A" ? SCENARIO_KEY_A : SCENARIO_KEY_B, JSON.stringify(payload));
      updateScenarioStatus();
      setStatus(`Scenario ${which} saved${existing ? " (overwritten)" : ""}.`);
    } catch {
      // ignore
    }
  };

  const loadScenario = (which) => {
    try {
      const raw = localStorage.getItem(which === "A" ? SCENARIO_KEY_A : SCENARIO_KEY_B);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearScenarios = () => {
    const hasA = !!loadScenario("A");
    const hasB = !!loadScenario("B");
    if (!hasA && !hasB) {
      setStatus("No saved scenarios to clear.");
      return;
    }
    const ok = window.confirm("Clear saved Scenario A and Scenario B? This cannot be undone.");
    if (!ok) return;
    try {
      localStorage.removeItem(SCENARIO_KEY_A);
      localStorage.removeItem(SCENARIO_KEY_B);
    } catch {
      // ignore
    }
    updateScenarioStatus();
    setStatus("Saved scenarios cleared.");
  };

  const updateScenarioStatus = () => {
    const el = document.getElementById("scenarioStatus");
    if (!el) return;
    const a = loadScenario("A");
    const b = loadScenario("B");
    const aTxt = a ? `saved${a._savedAt ? ` (${formatSavedAt(a._savedAt)})` : ""}` : "—";
    const bTxt = b ? `saved${b._savedAt ? ` (${formatSavedAt(b._savedAt)})` : ""}` : "—";
    el.textContent = `A: ${aTxt} | B: ${bTxt}`;
  };

  // ------------------------------ Schedule Builders ------------------------------
  const isStep23Enabled = () => !!document.getElementById("toggleStep23")?.checked;
  const isStep23Year1AllEnabled = () => isStep23Enabled() && !!document.getElementById("toggleStep23Year1All")?.checked;

  const buildSchedules = (params) => {
    const schedules = [];
    schedules[0] = {};
    for (let s = 1; s <= 22; s += 1) {
      schedules[0][s] = {};
      for (const c of COLS) {
        const value = getBaseSalary(s, c);
        schedules[0][s][c] = value == null ? null : value;
      }
    }
    schedules[0][23] = {};
    for (const c of COLS) {
      const step22 = schedules[0][22]?.[c];
      schedules[0][23][c] = step22 == null ? null : step22 * 1.015;
    }

    for (let y = 1; y <= 5; y += 1) {
      schedules[y] = {};
      for (let s = 1; s <= 22; s += 1) {
        schedules[y][s] = {};
        for (const c of COLS) {
          const prev = schedules[y - 1][s][c];
          const flatAdd = params?.yFlat?.[y] || 0;
          const rate = params?.yPct?.[y] || 0;
          // Apply flat first, then apply % raise (flat IS multiplied by the %)
          schedules[y][s][c] = prev == null ? null : (prev + flatAdd) * (1 + rate);
        }
      }
      schedules[y][23] = {};
      for (const c of COLS) {
        const step22 = schedules[y][22]?.[c];
        schedules[y][23][c] = step22 == null ? null : step22 * 1.015;
      }
    }
    return schedules;
  };

  const salaryAt = (schedules, year, step, col) => {
    const rosterTools = window.BtaRoster;
    const normScale = rosterTools?.normScale || ((value) => value);
    const y = clamp(year, 0, 5);
    const s = clamp(step, 1, isStep23Enabled() ? 23 : 22);
    const c = normScale(col);
    const value = schedules?.[y]?.[s]?.[c];
    return value == null ? null : Number(value);
  };

  const stepForYear = (baseStep, year, options = {}) => {
    const sm = SalaryMath();
    if (typeof sm.stepForYear === "function") return sm.stepForYear(baseStep, year, options);
    const enabled = isStep23Enabled();
    const eligible = !!options?.step23Year1Eligible;
    const allYear1 = isStep23Year1AllEnabled();
    let current = clamp(baseStep, 1, enabled ? 23 : 22);
    if (!enabled && current > 22) current = 22;
    if (year <= 0) return current;
    current = enabled && (current >= 23 || eligible || (allYear1 && current >= 22)) ? 23 : Math.min(current, 22);
    if (year === 1) return current;
    for (let y = 2; y <= year; y += 1) {
      if (enabled) current = current >= 22 ? 23 : current + 1;
      else current = Math.min(22, current + 1);
    }
    return current;
  };

  const rosterStepForYear = (entry, year) =>
    stepForYear(entry?.Step, year, { step23Year1Eligible: !!entry?.Step23Year1Eligible });

  const baselineStepForYear = (entry, year) => {
    const base = clamp(entry?.Step, 1, 22);
    if (year <= 1) return base;
    return clamp(base + (year - 1), 1, 22);
  };


  const getSelectedPremiumModes = () => {
    const familyChecked = !!document.getElementById("netPremiumFamily")?.checked;
    const individualChecked = !!document.getElementById("netPremiumIndividual")?.checked;
    const modes = [];
    if (familyChecked) modes.push("family");
    if (individualChecked) modes.push("individual");
    return modes.length ? modes : ["family"];
  };

  const getPrimaryPremiumMode = () => getSelectedPremiumModes()[0] || "family";

  const getPremiumConfig = (mode) => ({
    type: mode,
    label: mode === "individual" ? "Individual" : "Family",
    annual: mode === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR
  });

  // ------------------------------ AI payload (numbers, not DOM) ------------------------------
  const buildTablesPayload = ({ years, premiumType, compareMode, scheduleBlocks }) => {
    const renderArea = document.getElementById("renderArea");
    const hideTa = !!document.getElementById("toggleHideTA")?.checked;
    const showNet = !!document.getElementById("toggleNetPay")?.checked;
    const showDelta = !!document.getElementById("toggleCompareY0")?.checked;

    const columns = COLS.filter((c) => !(hideTa && c === "TA"));

    const premiumModes = Array.isArray(premiumType) ? premiumType : [premiumType];
    const premiumConfigs = premiumModes.map((mode) => getPremiumConfig(mode));

    const tables = [];
    (scheduleBlocks || []).forEach((block) => {
      const { title, schedules, hiPct } = block;
      years.forEach((year) => {
        const hiYearIdx = Math.max(1, year);
        const pct = hiPct?.[hiYearIdx] ?? 0;

        const rows = [];
        for (let step = 1; step <= (isStep23Enabled() ? 23 : 22); step += 1) {
          const cells = {};
          for (const col of columns) {
            const gross = schedules?.[year]?.[step]?.[col];
            const baseStep = step === 23 ? 22 : step;
            const base = schedules?.[0]?.[baseStep]?.[col];
            const delta = gross == null || base == null ? null : +(gross - base).toFixed(2);
            const net = gross == null
              ? []
              : premiumConfigs.map((cfg) => ({
                  type: cfg.type,
                  label: cfg.label,
                  value: +(Number(gross) - cfg.annual * Number(pct || 0)).toFixed(2)
                }));
            cells[col] = { gross: gross == null ? null : +Number(gross).toFixed(2), delta, net };
          }
          rows.push({ step, cells });
        }

        tables.push({
          title,
          year,
          columns,
          premium: premiumConfigs,
          hiPct: pct,
          rows
        });
      });
    });

    const payload = {
      generatedAt: new Date().toISOString(),
      mode: compareMode ? "compare" : "single",
      toggles: {
        hideTa,
        showNet,
        showDelta,
        premiumType: premiumModes
      },
      tables
    };

    // Cache where bee-ai.js looks first
    window.__BEE_LAST_TABLES_PAYLOAD__ = payload;
    window.BtaAI = window.BtaAI || {};
    window.BtaAI.__lastTablesPayload = payload;

    // If renderArea exists, also annotate state (helps debugging)
    if (renderArea) renderArea.dataset.lastPayloadAt = payload.generatedAt;

    return payload;
  };

  // ------------------------------ UI widgets ------------------------------
  const buildPctDropdowns = () => {
    const ids = ["year1", "year2", "year3", "year4", "year5"];
    const options = [];
    // Include 0% option for each contract-year percent dropdown.
    for (let p = 0.0; p <= 3.5 + 1e-9; p += 0.25) {
      const val = (p / 100).toFixed(4);
      const label = `${p.toFixed(2).replace(/\.00$/, "")}%`;
      options.push({ val, label });
    }

    // Add 2.9% and 3.1% as extra raise options without changing the existing quarter-point options.
    const extraRaiseOptions = [
      { val: "0.0290", label: "2.9%" },
      { val: "0.0310", label: "3.1%" }
    ];
    extraRaiseOptions.forEach((extra) => {
      if (!options.some((opt) => opt.val === extra.val)) options.push(extra);
    });
    options.sort((a, b) => Number(a.val) - Number(b.val));

    ids.forEach((id) => {
      const sel = document.getElementById(id);
      if (!sel) return;

      // Preserve a real existing value when rebuilding; otherwise use the intended default.
      // Important: after innerHTML is set, browsers auto-select the first option (0%).
      // So checking !sel.value AFTER rebuilding is not enough and silently defaults to 0%.
      const priorValue = sel.value;
      sel.innerHTML = options.map((opt) => `<option value="${opt.val}">${opt.label}</option>`).join("");

      const hasPriorValue = options.some((opt) => opt.val === priorValue);
      sel.value = hasPriorValue ? priorValue : "0.0275";
    });
  };

  const updateSystemDiagnostics = () => {
    const diagEl = document.getElementById("systemDiagnostics");
    const libPill = document.getElementById("libStatusPill");
    const xlsxOk = typeof window.XLSX !== "undefined";
    const jsPdfOk = Boolean(window.jspdf?.jsPDF || window.jsPDF);

    if (diagEl) diagEl.textContent = `XLSX: ${xlsxOk ? "OK" : "missing"} | jsPDF: ${jsPdfOk ? "OK" : "missing"}`;

    if (libPill) {
      libPill.textContent = "libs";
      libPill.classList.toggle("ok", xlsxOk && jsPdfOk);
      libPill.classList.toggle("error", !xlsxOk || !jsPdfOk);
    }
  };

  const showAppError = (msg) => {
    const banner = document.getElementById("appLoadError");
    if (banner) banner.style.display = "block";
    const msgEl = document.getElementById("appLoadErrorMsg");
    if (msgEl && msg) msgEl.textContent = msg;
    const retryBtn = document.getElementById("retryBtn");
    if (retryBtn) retryBtn.addEventListener("click", () => location.reload());
  };

  const updateSystemStatus = (status, detail) => {
    const statusText = document.getElementById("systemStatusText");
    if (statusText) {
      statusText.textContent = status;
      statusText.classList.toggle("ok", status === "OK");
      statusText.classList.toggle("error", status !== "OK");
    }
    const selfCheck = document.getElementById("systemSelfCheck");
    if (selfCheck && detail) selfCheck.textContent = detail;
  };

  const checkSalaryEngine = () => {
    const sm = SalaryMath();
    const ok =
      typeof sm.stepForYear === "function" &&
      typeof sm.computeCellValue === "function" &&
      typeof sm.computeSalaryAt === "function";

    if (ok) {
      window.__APP_BOOTED__ = true;

      const selfCheck = sm.systemSelfCheck || sm.runSelfCheck;
      if (typeof selfCheck === "function") {
        const result = selfCheck();
        const detail = result?.status === "PASS" ? "PASS" : `FAIL (${result?.reason || "Unknown"})`;
        updateSystemStatus("OK", detail);
      } else {
        updateSystemStatus("OK", "n/a");
      }
    } else {
      setTimeout(checkSalaryEngine, 50);
    }
  };

  // ------------------------------ Roster highlighting / toggles ------------------------------
  const buildRosterCellMap = (schedules, year) => {
    const rosterTools = window.BtaRoster;
    const normScale = rosterTools?.normScale || ((value) => value);
    const currentRoster = rosterTools?.getRoster?.() || [];
    const map = new Map();

    currentRoster.forEach((entry) => {
      const stepY = rosterStepForYear(entry, year);
      const col = normScale(entry.Column);
      const salary = salaryAt(schedules, year, stepY, col);
      if (salary == null) return;

      const key = `${stepY}|${col}`;
      const item = map.get(key) || { names: [], totalCost: 0, totalFte: 0 };
      item.names.push(entry.Name);

      const fte = entry.FTE || 1;
      item.totalCost += salary * fte;
      item.totalFte += fte;

      map.set(key, item);
    });

    return map;
  };

  const updateRosterDisplayFromToggles = () => {
    const renderArea = document.getElementById("renderArea");
    if (!renderArea) return;

    const highlightOn = !!document.getElementById("toggleRosterHighlight")?.checked;
    const showDetails = !!document.getElementById("toggleRosterDetails")?.checked;
    const hideTa = !!document.getElementById("toggleHideTA")?.checked;
    const showDelta = !!document.getElementById("toggleCompareY0")?.checked;
    const showNet = !!document.getElementById("toggleNetPay")?.checked;

    renderArea.classList.toggle("roster-highlight-off", !highlightOn);
    renderArea.classList.toggle("hide-ta", hideTa);
    renderArea.classList.toggle("show-delta", showDelta);
    renderArea.classList.toggle("show-net", showNet);

    renderArea.querySelectorAll(".detail").forEach((node) => node.classList.toggle("show", showDetails));
  };

  // ------------------------------ Rendering ------------------------------
  const renderSalaryTable = (schedules, years, title, hiPct, opts = {}) => {
    const rosterTools = window.BtaRoster;
    const hiFlat = opts?.hiFlat || null;
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.style.marginBottom = "14px";

    const heading = document.createElement("h3");
    heading.textContent = title;
    wrap.appendChild(heading);

    years.forEach((year) => {
      const rosterMap = buildRosterCellMap(schedules, year);
      const rosterOnly = !!opts.rosterOnly;
      const stepsWithRoster = rosterOnly
        ? Array.from(new Set(Array.from(rosterMap.keys()).map((k) => Number(String(k).split("|")[0]) || 0)))
            .filter((n) => n >= 1 && n <= (isStep23Enabled() ? 23 : 22))
            .sort((a, b) => a - b)
        : null;
      const hiYearIdx = Math.max(1, year);

      const sub = document.createElement("div");
      sub.style.margin = "10px 0 6px";
      sub.innerHTML = `<strong>Year ${year}</strong>`;
      wrap.appendChild(sub);

      const tableContainer = document.createElement("div");
      tableContainer.className = "table-container";

      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const trh = document.createElement("tr");
      trh.innerHTML = `<th>Step</th>${COLS.map((c) => `<th data-col="${c}">${c}</th>`).join("")}`;
      thead.appendChild(trh);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      const stepsToRender = rosterOnly
        ? (stepsWithRoster.length ? stepsWithRoster : [])
        : Array.from({ length: isStep23Enabled() ? 23 : 22 }, (_, i) => i + 1);

      if (rosterOnly && !stepsToRender.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="${COLS.length + 1}" style="padding:10px; color:#475569">No roster entries were found for Year ${year}. Load a roster and try again.</td>`;
        tbody.appendChild(tr);
      }

      for (const step of stepsToRender) {
        const tr = document.createElement("tr");
        const rowHtml = COLS.map((col) => {
          const value = schedules?.[year]?.[step]?.[col];
          const baseStep = step === 23 ? 22 : step;
          const baseValue = schedules?.[0]?.[baseStep]?.[col];
          const rosterEntry = rosterMap.get(`${step}|${col}`);
          const hasRoster = Boolean(rosterEntry);

          // "Steps w/ roster only" mode: keep the grid, but only show numbers for cells that have roster.
          const showCellValue = !rosterOnly || hasRoster;

          const premiumModes = getSelectedPremiumModes();
          const premiumConfigs = premiumModes.map((mode) => getPremiumConfig(mode));

          const pct = hiPct?.[hiYearIdx] ?? 0;
          const flatHi = hiFlat?.[hiYearIdx] ?? 0;
          const netValues =
            !showCellValue || value == null
              ? []
              : premiumConfigs.map((cfg) => ({
                  type: cfg.type,
                  label: cfg.label,
                  value: Number((value - cfg.annual * pct - flatHi).toFixed(2))
                }));
          const deltaValue = !showCellValue || value == null || baseValue == null ? null : value - baseValue;

          const detailText = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}<br/>Total FTE: ${rosterEntry.totalFte.toFixed(2)}<br/>Cell total: ${money(rosterEntry.totalCost)}`
            : "";

          const tooltip = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}\nTotal FTE: ${rosterEntry.totalFte.toFixed(2)}\nCell total: ${money(rosterEntry.totalCost)}`
            : "";

          const tooltipAttr = tooltip ? tooltip.replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "";

          const deltaLine = `<div class="delta-line">Δ vs Y0: ${deltaValue == null ? "—" : (deltaValue >= 0 ? "+" : "") + moneyWhole(deltaValue)}</div>`;
          const netLine = netValues.length
            ? netValues.map((entry) => `<div class="net-line">Net (${entry.label}): ${moneyWhole(entry.value)}</div>`).join("")
            : `<div class="net-line">Net: —</div>`;

          return (
            `<td data-col="${col}" class="${hasRoster ? "cell-has-roster" : ""}" ${tooltipAttr ? `title="${tooltipAttr}"` : ""}>` +
            `<span class="main">${!showCellValue || value == null ? "—" : moneyWhole(value)}</span>` +
            deltaLine +
            netLine +
            (hasRoster ? `<div class="detail">${detailText}</div>` : "") +
            "</td>"
          );
        }).join("");

        tr.innerHTML = `<td>${step}</td>${rowHtml}`;
        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      tableContainer.appendChild(table);
      wrap.appendChild(tableContainer);
    });

    if (rosterTools && typeof rosterTools.onRenderedTable === "function") rosterTools.onRenderedTable(wrap);
    return wrap;
  };

  const generateSalaryTable = ({ mode = "inline" } = {}) => {
    const years = parseYearInput(document.getElementById("tableYear")?.value);
    if (!years.length) {
      setStatus("Invalid year range.");
      return;
    }

    const renderArea = document.getElementById("renderArea");
    if (!renderArea) return;

    renderArea.classList.toggle("is-hidden", mode === "newWindow");
    renderArea.innerHTML = "";

    const compareOn = !!document.getElementById("compareOnGenerate")?.checked;
    const rosterOnly = !!document.getElementById("showRosterStepsOnly")?.checked;
    const scenarioA = loadScenario("A");
    const scenarioB = loadScenario("B");

    const uiParams = getUIParams();
    const schedulesUI = buildSchedules(uiParams);

    const blocks = [];
    const scheduleBlocks = []; // used for AI payload

    if (compareOn && scenarioA && scenarioB) {
      const scheduleA = buildSchedules({ yPct: scenarioA.yPct, yFlat: scenarioA.yFlat, hiPct: scenarioA.hiPct });
      const scheduleB = buildSchedules({ yPct: scenarioB.yPct, yFlat: scenarioB.yFlat, hiPct: scenarioB.hiPct });

      const compareWrap = document.createElement("div");
      compareWrap.className = "compare-wrap";
      compareWrap.appendChild(
        renderSalaryTable(scheduleA, years, "Salary Table — Scenario A", scenarioA.hiPct, {
          rosterOnly,
          hiFlat: scenarioA.hiFlat
        })
      );
      compareWrap.appendChild(
        renderSalaryTable(scheduleB, years, "Salary Table — Scenario B", scenarioB.hiPct, {
          rosterOnly,
          hiFlat: scenarioB.hiFlat
        })
      );
      blocks.push(compareWrap);

      scheduleBlocks.push({ title: "Salary Table — Scenario A", schedules: scheduleA, hiPct: scenarioA.hiPct, hiFlat: scenarioA.hiFlat });
      scheduleBlocks.push({ title: "Salary Table — Scenario B", schedules: scheduleB, hiPct: scenarioB.hiPct, hiFlat: scenarioB.hiFlat });
    } else {
      blocks.push(
        renderSalaryTable(schedulesUI, years, "Salary Table — Current UI", uiParams.hiPct, {
          rosterOnly,
          hiFlat: uiParams.hiFlat
        })
      );
      scheduleBlocks.push({ title: "Salary Table — Current UI", schedules: schedulesUI, hiPct: uiParams.hiPct, hiFlat: uiParams.hiFlat });
    }

    blocks.forEach((block) => renderArea.appendChild(block));

    window.BtaAffordability?.computeAffordability?.();
    updateRosterDisplayFromToggles();

    // Always build payload for Bee/export (works even if renderArea is hidden)
    const premiumType = getSelectedPremiumModes();
    const payload = buildTablesPayload({
      years,
      premiumType,
      compareMode: compareOn && scenarioA && scenarioB,
      scheduleBlocks
    });

    // If bee-ai.js registered a cache hook, update it too
    if (window.BtaAI) window.BtaAI.__beeLastTablesPayload = payload;

    if (mode === "newWindow") {
      const w = window.open("", "_blank");
      if (!w) return;

      const highlightOn = !!document.getElementById("toggleRosterHighlight")?.checked;
      const hideTa = !!document.getElementById("toggleHideTA")?.checked;
      const showDelta = !!document.getElementById("toggleCompareY0")?.checked;
      const showNet = !!document.getElementById("toggleNetPay")?.checked;

      const wrapperClass = [highlightOn ? "" : "roster-highlight-off", hideTa ? "hide-ta" : "", showDelta ? "show-delta" : "", showNet ? "show-net" : ""]
        .filter(Boolean)
        .join(" ");

      const recurringBanner = document.getElementById("affordabilitySummaryRecurring")?.outerHTML || "";
      const cashBanner = document.getElementById("affordabilitySummaryCash")?.outerHTML || "";

      const html = `
        <!doctype html><html><head><meta charset="utf-8"/>
        <title>BTA Salary Table</title>
        <style>
          body{font-family:Arial,system-ui;margin:16px;color:#111}
          .banner{border-left:10px solid #999;background:#fff;padding:10px 12px;border-radius:8px;margin-bottom:12px}
          .banner.pass{border-color:#2f855a}
          .banner.fail{border-color:#c53030}
          .table-container{overflow-x:auto;border:1px solid #ddd;border-radius:10px;margin:10px 0;background:#fff}
          table{border-collapse:collapse;width:100%;min-width:900px}
          th,td{border:1px solid #ddd;padding:6px 8px;white-space:nowrap;font-size:12px;vertical-align:top}
          thead th{background:#2d3748;color:#fff;position:sticky;top:0}
          h3{margin:10px 0 4px}
          .btns{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}
          button{padding:8px 12px;border:0;border-radius:8px;background:#334155;color:#fff;cursor:pointer}
          .cell-has-roster{ background:#facc15 !important; }
          .cell-has-roster .main{ color:#78350f; }
          .roster-highlight-off .cell-has-roster{ background:inherit !important; }
          .roster-highlight-off .cell-has-roster .main{ color:inherit; }
          .hide-ta th[data-col="TA"], .hide-ta td[data-col="TA"]{display:none}
          .delta-line,.net-line{display:none;margin-top:2px;font-size:.78rem;color:#475569}
          .show-delta .delta-line{display:block}
          .show-net .net-line{display:block}
          .detail{display:none;margin-top:2px;font-size:.78rem;color:#334155;white-space:normal;line-height:1.15}
          .detail.show{display:block}

          /* Print: landscape + shrink to fit */
          @media print{
            @page{ size: landscape; margin: 0.4in; }
            html,body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .btns{display:none !important;}
            .table-container{overflow:visible !important;border:none !important}
            table{min-width:0 !important;width:100% !important}
            thead th{position:static !important}
            th,td{font-size:8px !important;padding:3px 4px !important}
            .detail{font-size:7px !important}
            /* browser-dependent zoom; helps squeeze */
            body{ zoom: 0.78; }
          }
        </style>
        </head><body>
          <div class="btns">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          ${recurringBanner}
          ${cashBanner}
          <div class="${wrapperClass}">${renderArea.innerHTML}</div>
          <script>
            // keep payload accessible for debugging
            window.__BTA_TABLES_PAYLOAD__ = ${JSON.stringify(payload).replace(/</g,"\\u003c")};
          </script>
        </body></html>
      `;
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  // ------------------------------ Report (PDF) ------------------------------

  const generateReport = () => {
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) {
      alert("jsPDF is not loaded.");
      return;
    }

    // -------------------- helpers --------------------
    const getPremium = () => {
      const premiumType = getPrimaryPremiumMode();
      return {
        premiumType,
        premiumLabel: premiumType === "individual" ? "Individual" : "Family",
        premiumValue: premiumType === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR
      };
    };

    const hiForYear = (payload, year) => {
      const y = Math.max(1, year);
      const pct = normalizeHiPct(payload?.hiPct?.[y] ?? 0);
      const flat = Number(payload?.hiFlat?.[y] ?? 0) || 0;
      return { pct, flat };
    };

    const computeNet = (gross, payload, year, premiumYear) => {
      if (gross == null) return null;
      const { pct, flat } = hiForYear(payload, year);
      const sm = SalaryMath();
      const netBase =
        typeof sm.computeHealthInsuranceNet === "function"
          ? sm.computeHealthInsuranceNet(gross, pct, premiumYear)
          : Number((Number(gross) - Number(premiumYear) * Number(pct)).toFixed(2));
      return Number((netBase - flat).toFixed(2));
    };

    const rosterTotalsForScenario = (payload) => {
      const rosterTools = window.BtaRoster;
      const roster = rosterTools?.getRoster?.() || [];
      const normScale = rosterTools?.normScale || ((v) => v);

      const schedules = buildSchedules(payload);
      const schedules0 = schedules[0];

      const years = [1, 2, 3, 4, 5];
      const out = [];

      const adderPct = clamp(Number(payload?.adderPct || 0), 0, 100) / 100;

      const addlRevenue = Number(payload?.addlRevenue || 0) || 0;
      const otherSavings = Number(payload?.otherSavings || 0) || 0;
      const recurringSurplus = Number(payload?.recurringSurplus || 0) || 0;
      const salaryBudgetEnvelope = Number(payload?.salaryBudgetEnvelope || 0) || 0;
      const oneTimeFund = Number(payload?.oneTimeFund || 0) || 0;
      const reallocPct = clamp(Number(payload?.reallocPct || 0), 0, 100) / 100;
      const oneTimeMode = payload?.oneTimeMode || "y1";

      const budget = Number(payload?.budget || 0) || 0;
      const maxBudgetFlat = Number(payload?.maxBudgetFlat || 0) || 0;
      const maxBudgetPct = clamp(Number(payload?.maxBudgetPct || 0), 0, 100) / 100;
      const stateAidPct = clamp(Number(payload?.stateAidPct || 0), 0, 100) / 100;
      const otherPct = clamp(Number(payload?.otherPct || 0), 0, 1);

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

      const oneTimePerYear = oneTimeMode === "spread" ? oneTimeFund / 5 : 0;

      const contractPayrollForYear = (year) => {
        let total = 0;
        roster.forEach((entry) => {
          const stepY = rosterStepForYear(entry, year);
          const col = normScale(entry.Column);
          const value = schedules?.[year]?.[stepY]?.[col];
          if (value == null) return;
          total += Number(value) * (entry.FTE || 1);
        });
        return total;
      };

      const baselinePayrollForYear = (year) => {
        let total = 0;
        roster.forEach((entry) => {
          const stepY = baselineStepForYear(entry, year);
          const col = normScale(entry.Column);
          const value = schedules0?.[stepY]?.[col];
          if (value == null) return;
          total += Number(value) * (entry.FTE || 1);
        });
        return total;
      };

      let anyFailRecurring = false;
      let anyFailCash = false;

      years.forEach((year) => {
        const contract = contractPayrollForYear(year);
        const baseline = baselinePayrollForYear(year);

        const incremental = contract - baseline;
        const incWithAdders = incremental * (1 + adderPct);

        const cumulativeBudgetCapacity = cumulativeBudgetCapacityForYear(year);
        const cumulativeOffsets = recurringOffsets * year;
        const netRecurring = incWithAdders - cumulativeOffsets;

        const oneTimeApplied = oneTimeMode === "y1" ? (year === 1 ? oneTimeFund : 0) : oneTimePerYear * year;
        const netCash = incWithAdders - (cumulativeOffsets + oneTimeApplied);

        const passSalaryEnvelope = salaryBudgetEnvelope <= 0 || contract <= salaryBudgetEnvelope;
        const passRecurring = netRecurring <= cumulativeBudgetCapacity;
        const passCash = netCash <= cumulativeBudgetCapacity;

        if (!passRecurring) anyFailRecurring = true;
        if (!passCash) anyFailCash = true;

        out.push({
          year,
          contract,
          baseline,
          incWithAdders,
          salaryBudgetEnvelope,
          passSalaryEnvelope,
          recurringOffsets: cumulativeOffsets,
          oneTimeApplied,
          netRecurring,
          netCash,
          baseCap: cumulativeBudgetCapacity,
          passRecurring,
          passCash
        });
      });

      return {
        rows: out,
        inputs: {
          adderPct,
          budget,
          maxBudgetFlat,
          maxBudgetPct,
          budgetIncreaseCapacity: firstYearIncrease,
          additionalStateAid: additionalStateAidY1,
          salaryBudgetEnvelope,
          stateAidPct,
          otherPct,
          addlRevenue,
          otherSavings,
          recurringSurplus,
          reallocPct,
          oneTimeFund,
          oneTimeMode
        },
        derived: {
          baseCap: cumulativeBudgetCapacityForYear(5),
          recurringOffsets,
          anyFailRecurring,
          anyFailCash
        }
      };
    };

    const buildSalarySnapshot = (label, payload, years) => {
      const schedules = buildSchedules(payload);
      const { premiumLabel, premiumValue } = getPremium();

      const cols = ["BA", "BA30", "M", "M50"];
      const steps = [1, 10, 22];

      const header = ["Year", "Step"].concat(
        cols.flatMap((c) => [`${c} Gross`, `${c} Net`])
      );

      const data = [];
      years.forEach((year) => {
        steps.forEach((step) => {
          const row = [String(year), String(step)];
          cols.forEach((col) => {
            const gross = schedules?.[year]?.[step]?.[col];
            const net = computeNet(gross, payload, year, premiumValue);
            row.push(gross == null ? "—" : money(gross));
            row.push(net == null ? "—" : money(net));
          });
          data.push(row);
        });
      });

      return { title: `${label} — Salary Snapshot (Net uses ${premiumLabel} premium)`, header, data };
    };

    const buildIncreasesSummary = (payload) => {
      const rows = [];
      for (let y = 1; y <= 5; y += 1) {
        const pct = Number(payload?.yPct?.[y] ?? 0) || 0;
        const flat = Number(payload?.yFlat?.[y] ?? 0) || 0;
        const { pct: hiPct, flat: hiFlat } = hiForYear(payload, y);
        rows.push([
          `Y${y}`,
          `${(pct * 100).toFixed(2)}%`,
          money(flat),
          `${(hiPct * 100).toFixed(2)}%`,
          money(hiFlat)
        ]);
      }
      return {
        header: ["Year", "Raise %", "Flat $", "HI %", "HI Flat $/yr"],
        data: rows
      };
    };

    // -------------------- collect scenarios --------------------
    const years = parseYearInput(document.getElementById("tableYear")?.value);
    const compareOn = !!document.getElementById("compareOnGenerate")?.checked;

    const scenarioA = loadScenario("A");
    const scenarioB = loadScenario("B");

    const scenarios = [];
    if (compareOn && scenarioA && scenarioB) {
      scenarios.push({ key: "A", label: "Scenario A", payload: scenarioA });
      scenarios.push({ key: "B", label: "Scenario B", payload: scenarioB });
    } else if (scenarioA) {
      scenarios.push({ key: "A", label: "Scenario A", payload: scenarioA });
    } else if (scenarioB) {
      scenarios.push({ key: "B", label: "Scenario B", payload: scenarioB });
    } else {
      scenarios.push({ key: "UI", label: "Current UI", payload: serializeScenarioFromUI() });
    }

    // -------------------- PDF layout --------------------
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    const margin = 40;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;

    const addPageIfNeeded = (neededH) => {
      if (y + neededH <= pageH - margin) return;
      doc.addPage();
      y = margin;
    };

    const h1 = (text) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(text, margin, y);
      y += 18;
    };

    const h2 = (text) => {
      addPageIfNeeded(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(text, margin, y);
      y += 16;
    };

    const p = (text) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(String(text || ""), pageW - margin * 2);
      addPageIfNeeded(lines.length * 12 + 6);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 6;
    };

    const table = (header, rows, colWidths) => {
      const rowH = 14;
      const fontSize = 8.5;
      doc.setFontSize(fontSize);

      const widths =
        colWidths && colWidths.length === header.length
          ? colWidths
          : Array(header.length).fill((pageW - margin * 2) / header.length);

      const drawRow = (cells, isHeader) => {
        const x0 = margin;
        let x = x0;

        // wrap text in cells (simple)
        const cellLines = cells.map((c, i) =>
          doc.splitTextToSize(String(c ?? ""), widths[i] - 6)
        );
        const linesMax = Math.max(...cellLines.map((l) => l.length), 1);
        const h = rowH * linesMax + 6;

        addPageIfNeeded(h + 2);

        // background header
        if (isHeader) {
          doc.setFillColor(45, 55, 72);
          doc.rect(margin, y, widths.reduce((a, b) => a + b, 0), h, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(17, 24, 39);
          doc.setFont("helvetica", "normal");
        }

        // borders + text
        cells.forEach((c, i) => {
          doc.setDrawColor(210);
          doc.rect(x, y, widths[i], h);
          const lines = cellLines[i];
          const tx = x + 3;
          const ty = y + 11;
          doc.text(lines, tx, ty);
          x += widths[i];
        });

        y += h;
        doc.setTextColor(17, 24, 39);
      };

      drawRow(header, true);
      rows.forEach((r) => drawRow(r, false));
      y += 8;
      doc.setFontSize(10);
    };

    // -------------------- report content --------------------
    h1("BTA Salary Tool Report");
    p(`Generated: ${new Date().toLocaleString()}`);
    p(`Years: ${years.join(", ")}  |  Mode: ${compareOn && scenarioA && scenarioB ? "Compare A vs B" : "Single scenario"}`);

    scenarios.forEach((sc, idx) => {
      if (idx > 0) {
        addPageIfNeeded(40);
        doc.setDrawColor(200);
        doc.line(margin, y, pageW - margin, y);
        y += 14;
      }

      h2(sc.label);

      // Inputs summary
      const inc = buildIncreasesSummary(sc.payload);
      p("Raises and insurance contribution settings:");
      table(inc.header, inc.data, [40, 60, 75, 60, 85]);

      // Budget inputs (so you can compare)
      const bi = sc.payload || {};
      p("Budget inputs:");
      table(
        ["Field", "Value"],
        [
          ["Budget base", money(bi.budget || 0)],
          ["Max budget (flat)", money(bi.maxBudgetFlat || 0)],
          ["Max budget (% of base)", `${Number(bi.maxBudgetPct || 0).toFixed(2)}%`],
          ["State aid (% of base)", `${Number(bi.stateAidPct || 0).toFixed(2)}%`],
          ["Other obligations (% of base)", `${Number(bi.otherPct || 0).toFixed(3)}`],
          ["Adders (% on incremental)", `${Number(bi.adderPct || 0).toFixed(2)}%`],
          ["Additional revenue", money(bi.addlRevenue || 0)],
          ["Other savings", money(bi.otherSavings || 0)],
          ["Historical recurring cushion", money(bi.recurringSurplus || 0)],
          ["Salary-code envelope", money(bi.salaryBudgetEnvelope || 0)],
          ["Realloc (% of other obligations)", `${Number(bi.reallocPct || 0).toFixed(2)}%`],
          ["One-time fund", money(bi.oneTimeFund || 0)],
          ["One-time mode", String(bi.oneTimeMode || "y1")]
        ],
        [220, pageW - margin * 2 - 220]
      );

      // Affordability summary
      const aff = rosterTotalsForScenario(sc.payload);
      p("Affordability (roster-based):");
      table(
        ["Year", "Contract", "Salary Env", "Env", "Inc+Adders", "Offsets", "Net Recurring", "Cum. Cap", "PASS?"],
        aff.rows.map((r) => [
          `Y${r.year}`,
          money(r.contract),
          money(r.salaryBudgetEnvelope),
          r.passSalaryEnvelope ? "PASS" : "FAIL",
          money(r.incWithAdders),
          money(r.recurringOffsets),
          money(r.netRecurring),
          money(r.baseCap),
          r.passRecurring ? "PASS" : "FAIL"
        ]),
        [32, 62, 62, 34, 62, 58, 62, 58, 38]
      );
      p(`Recurring result: ${aff.derived.anyFailRecurring ? "FAIL (at least one year)" : "PASS (all years)"} — cumulative Year 5 budget-growth capacity ${money(aff.derived.baseCap)}; annual recurring cushion ${money(aff.derived.recurringOffsets)}.`);

      table(
        ["Year", "Net Cash (one-time applied)", "One-time applied", "PASS?"],
        aff.rows.map((r) => [
          `Y${r.year}`,
          money(r.netCash),
          money(r.oneTimeApplied),
          r.passCash ? "PASS" : "FAIL"
        ]),
        [36, 120, 120, 50]
      );
      p(`Cash coverage result: ${aff.derived.anyFailCash ? "FAIL (at least one year)" : "PASS (all years)"} — One-time mode: ${sc.payload.oneTimeMode || "y1"}.`);

      // Salary snapshot
      const snap = buildSalarySnapshot(sc.label, sc.payload, years);
      h2(snap.title);
      table(snap.header, snap.data);
    });

    // Compare section if A and B present
    if (compareOn && scenarioA && scenarioB) {
      doc.addPage();
      y = margin;
      h1("Scenario A vs Scenario B — Quick Compare");

      const affA = rosterTotalsForScenario(scenarioA);
      const affB = rosterTotalsForScenario(scenarioB);

      p("Recurring net impact (Inc+Adders - Offsets). Positive means cost to cover. Lower is better.");

      table(
        ["Year", "A Net Recurring", "B Net Recurring", "A - B"],
        [1,2,3,4,5].map((yr) => {
          const a = affA.rows.find(r => r.year === yr);
          const b = affB.rows.find(r => r.year === yr);
          const d = (a?.netRecurring ?? 0) - (b?.netRecurring ?? 0);
          return [`Y${yr}`, money(a?.netRecurring ?? 0), money(b?.netRecurring ?? 0), money(d)];
        }),
        [40, 120, 120, 120]
      );

      p("Cash net impact (with one-time applied). Lower is better.");
      table(
        ["Year", "A Net Cash", "B Net Cash", "A - B"],
        [1,2,3,4,5].map((yr) => {
          const a = affA.rows.find(r => r.year === yr);
          const b = affB.rows.find(r => r.year === yr);
          const d = (a?.netCash ?? 0) - (b?.netCash ?? 0);
          return [`Y${yr}`, money(a?.netCash ?? 0), money(b?.netCash ?? 0), money(d)];
        }),
        [40, 120, 120, 120]
      );

      p("If the numbers look 'stale', it means the scenarios saved in your browser storage are stale. Use Clear Scenarios, then Save again.");
    }

    doc.save(`bta_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };


  // ------------------------------ Event wiring ------------------------------
  const safeAddListener = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  const wireCoreButtons = () => {
    safeAddListener("generateTableButton", "click", () => generateSalaryTable({ mode: "newWindow" }));

    // Topbar "Report" button triggers a click on #buildReportButton.
    safeAddListener("buildReportButton", "click", () => generateReport());

    safeAddListener("saveScenarioA", "click", () => saveScenario("A"));
    safeAddListener("saveScenarioB", "click", () => saveScenario("B"));
    safeAddListener("clearScenarios", "click", () => clearScenarios());

    safeAddListener("loadScenarioA", "click", () => {
      const s = loadScenario("A");
      if (!s) return;
      applyScenarioToUI(s);
      window.BtaAffordability?.computeAffordability?.();
    });

    safeAddListener("loadScenarioB", "click", () => {
      const s = loadScenario("B");
      if (!s) return;
      applyScenarioToUI(s);
      window.BtaAffordability?.computeAffordability?.();
    });

    // Salary Lookup
    safeAddListener("sl_btn", "click", () => {
      const rosterTools = window.BtaRoster;
      const normScale = rosterTools?.normScale || ((value) => value);

      const year = clamp(+document.getElementById("sl_year")?.value || 0, 0, 5);
      const step = clamp(+document.getElementById("sl_step")?.value || 1, 1, isStep23Enabled() ? 23 : 22);
      const col = normScale(document.getElementById("sl_scale")?.value || "M50");

      const scenario = document.getElementById("sl_scenario")?.value || "ui";
      const showHi = (document.getElementById("sl_show_hi")?.value || "yes") === "yes";
      const hiYearIdx = Math.max(1, year);

      const premiumModes = getSelectedPremiumModes();
      const premiumConfigs = premiumModes.map((mode) => getPremiumConfig(mode));

      const doOne = (label, schedules, hiPct, hiFlat) => {
        const effectiveStep = stepForYear(step, year);
        const gross = salaryAt(schedules, year, effectiveStep, col);
        if (gross == null) return `${label}: —`;
        if (!showHi) return `${label}: ${money(gross)}`;

        const sm = SalaryMath();
        const pct = hiPct?.[hiYearIdx] ?? 0;
        const flatAdd = hiFlat?.[hiYearIdx] ?? 0;
        const netText = premiumConfigs
          .map((cfg) => {
            const baseNet =
              typeof sm.computeHealthInsuranceNet === "function"
                ? sm.computeHealthInsuranceNet(gross, pct, cfg.annual)
                : Number((gross - cfg.annual * pct).toFixed(2));
            const net = Number((baseNet - flatAdd).toFixed(2));
            return `Net (${cfg.label} premium): ${money(net)}`;
          })
          .join(" | ");

        return `${label}: Gross ${money(gross)} | ${netText}`;
      };

      const output = [];
      const paramsUI = getUIParams();
      const schedulesUI = buildSchedules(paramsUI);

      if (scenario === "A" || scenario === "both") {
        const sA = loadScenario("A");
        if (sA) output.push(doOne("Scenario A", buildSchedules(sA), sA.hiPct, sA.hiFlat));
        else output.push("Scenario A: (not saved)");
      }

      if (scenario === "B" || scenario === "both") {
        const sB = loadScenario("B");
        if (sB) output.push(doOne("Scenario B", buildSchedules(sB), sB.hiPct, sB.hiFlat));
        else output.push("Scenario B: (not saved)");
      }

      if (scenario === "ui") output.push(doOne("Current UI", schedulesUI, paramsUI.hiPct, paramsUI.hiFlat));

      const el = document.getElementById("sl_out");
      if (el) el.textContent = output.join("\n").trim();
    });

    // Salary Explain
    safeAddListener("sl_explain_btn", "click", () => {
      const rosterTools = window.BtaRoster;
      const normScale = rosterTools?.normScale || ((value) => value);

      const sm = SalaryMath();
      if (typeof sm.explainSalaryAt !== "function") return;

      const year = clamp(+document.getElementById("sl_year")?.value || 0, 0, 5);
      const step = clamp(+document.getElementById("sl_step")?.value || 1, 1, isStep23Enabled() ? 23 : 22);
      const col = normScale(document.getElementById("sl_scale")?.value || "M50");

      const params = getUIParams();
      const scenario = document.getElementById("sl_scenario")?.value || "ui";

      let payload = params;
      if (scenario === "A") {
        const sA = loadScenario("A");
        if (sA) payload = sA;
      }
      if (scenario === "B") {
        const sB = loadScenario("B");
        if (sB) payload = sB;
      }
      const schedulesForExplain = buildSchedules(payload);
      const el = document.getElementById("sl_explain_out");
      if (!el) return;

      if (isStep23Enabled() && step === 23) {
        const step22Value = salaryAt(schedulesForExplain, year, 22, col);
        const step23Value = salaryAt(schedulesForExplain, year, 23, col);
        if (step22Value == null || step23Value == null) {
          el.textContent = "Unable to explain this salary.";
          return;
        }
        el.textContent = [
          "Step 23 is derived from the same year’s Step 22 value, then multiplied by 1.015.",
          `Year ${year} Step 22 ${col}: ${moneyWhole(step22Value)}`,
          `Year ${year} Step 23 ${col}: ${moneyWhole(step23Value)}`,
          `Calculation: ${moneyWhole(step22Value)} × 1.015 = ${moneyWhole(step23Value)}`
        ].join("\n");
        return;
      }

      const explanation = sm.explainSalaryAt(step, col, 1, year, {
        increases: {
          1: { flat: payload.yFlat?.[1], rate: payload.yPct?.[1] },
          2: { flat: payload.yFlat?.[2], rate: payload.yPct?.[2] },
          3: { flat: payload.yFlat?.[3], rate: payload.yPct?.[3] },
          4: { flat: payload.yFlat?.[4], rate: payload.yPct?.[4] },
          5: { flat: payload.yFlat?.[5], rate: payload.yPct?.[5] }
        }
      });

      const lines = [
        `Start step: ${explanation.startStep}`,
        `Column: ${explanation.column}`,
        explanation.stepReason || "",
        explanation.flatAdds?.length
          ? `Flat adds: ${explanation.flatAdds.map((f) => `Y${f.year}: $${f.amount}`).join(", ")}`
          : "Flat adds: none",
        explanation.pctIncreases?.length
          ? `Percent adds: ${explanation.pctIncreases.map((p) => `Y${p.year}: ${p.rate}%`).join(", ")}`
          : "Percent adds: none",
        `Final salary: ${money(explanation.finalSalary)}`
      ].filter(Boolean);

      el.textContent = lines.join("\n");
    });

    // Toggles
    safeAddListener("toggleRosterHighlight", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleRosterDetails", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleHideTA", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleCompareY0", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleNetPay", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleStep23", "change", () => {
      updateRosterDisplayFromToggles();
      window.BtaAffordability?.computeAffordability?.();
      const renderArea = document.getElementById("renderArea");
      if (renderArea && renderArea.children && renderArea.children.length) {
        generateSalaryTable({ mode: "inline" });
      }
    });
    safeAddListener("toggleStep23Year1All", "change", () => {
      updateRosterDisplayFromToggles();
      window.BtaAffordability?.computeAffordability?.();
      const renderArea = document.getElementById("renderArea");
      if (renderArea && renderArea.children && renderArea.children.length) {
        generateSalaryTable({ mode: "inline" });
      }
    });

    // Filter: Steps w/ roster only (affects generation)
    safeAddListener("showRosterStepsOnly", "change", () => {
      const renderArea = document.getElementById("renderArea");
      if (renderArea && renderArea.children && renderArea.children.length) {
        generateSalaryTable({ mode: "inline" });
      }
    });

    ["netPremiumFamily", "netPremiumIndividual"].forEach((id) => {
      safeAddListener(id, "change", () => {
        const renderArea = document.getElementById("renderArea");
        if (renderArea && renderArea.children && renderArea.children.length) {
          generateSalaryTable({ mode: "inline" });
        }
      });
    });

    // Affordability recalcs
    const watchIds = [
      "year1","year2","year3","year4","year5",
      "flat1","flat2","flat3","flat4","flat5",
      "adderPct","otherPct","budget","maxBudgetPct","maxBudgetFlat",
      "stateAidPct","addlRevenue","otherSavings","recurringSurplus","salaryBudgetEnvelope",
      "oneTimeFund","reallocPct","oneTimeMode",
      "contributionY1","contributionY2","contributionY3","contributionY4","contributionY5",
      "hiFlatY1","hiFlatY2","hiFlatY3","hiFlatY4","hiFlatY5",
      "netPremiumFamily","netPremiumIndividual","toggleStep23","toggleStep23Year1All"
    ];

    watchIds.forEach((id) => {
      safeAddListener(id, "change", () => window.BtaAffordability?.computeAffordability?.());
      safeAddListener(id, "input", () => window.BtaAffordability?.computeAffordability?.());
    });
  };

  const initDiagnostics = () => {
    const buildTimeEl = document.getElementById("buildTimeText");
    if (buildTimeEl) buildTimeEl.textContent = BUILD_TIME;
    const buildVersionEl = document.getElementById("buildVersionText");
    if (buildVersionEl) buildVersionEl.textContent = `version: ${BUILD_VERSION}`;
  };

  const setupErrorHandlers = () => {
    window.addEventListener("error", (e) => {
      try {
        const msg = e?.error?.stack || e?.message || "Unknown JS error";
        showAppError(msg);
        updateSystemStatus("ERROR", "FAIL");
      } catch {
        // ignore
      }
    });

    window.addEventListener("unhandledrejection", (e) => {
      try {
        const msg = e?.reason?.stack || String(e?.reason || "Unhandled promise rejection");
        showAppError(msg);
        updateSystemStatus("ERROR", "FAIL");
      } catch {
        // ignore
      }
    });
  };

  const startBootWatchdog = () => {
    window.__APP_BOOTED__ = false;
    setTimeout(() => {
      if (window.__APP_BOOTED__) return;

      const sm = SalaryMath();
      const hasCoreFns =
        typeof sm.stepForYear === "function" &&
        typeof sm.computeCellValue === "function" &&
        typeof sm.computeSalaryAt === "function";

      if (!hasCoreFns) {
        showAppError(
          "Salary engine missing. The app tried to load salary-math.js, but it didn’t provide required exports. This build includes a fallback engine — if you still see this, there is a JS syntax error earlier in the file."
        );
        updateSystemStatus("ERROR", "FAIL (engine missing)");
      } else {
        showAppError("App is taking longer than expected to finish booting. If it finishes after a few seconds, ignore this.");
      }
    }, 6000);
  };

  // ------------------------------ DOM Ready ------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    ensureSalaryMath();

    window.baseTable = baseTable;

    // Do NOT overwrite bee-ai.js exports if loaded first
    window.BtaAI = window.BtaAI || {};
    if (typeof window.BtaAI.getSalaryTablesPayload !== "function") {
      window.BtaAI.getSalaryTablesPayload = () =>
        window.BtaAI.__lastTablesPayload ||
        window.BtaAI.__beeLastTablesPayload ||
        window.__BEE_LAST_TABLES_PAYLOAD__ ||
        null;
    }

    window.BtaApp = {
      COLS,
      baseTable,
      money,
      clamp,
      parseYearInput,
      stepForYear,
      rosterStepForYear,
      baselineStepForYear,
      getUIParams,
      buildSchedules,
      salaryAt,
      serializeScenarioFromUI,
      applyScenarioToUI,
      saveScenario,
      loadScenario,
      clearScenarios,
      updateScenarioStatus,
      generateSalaryTable,
      setStatus
    };

    buildPctDropdowns();
    initDiagnostics();
    updateScenarioStatus();
    updateSystemDiagnostics();
    setupErrorHandlers();
    startBootWatchdog();
    checkSalaryEngine();
    wireCoreButtons();

    document.getElementById("systemStatusText")?.classList.remove("error");

    window.addEventListener("bta-roster-updated", () => {
      updateRosterDisplayFromToggles();
      window.BtaAffordability?.computeAffordability?.();
    });

    updateRosterDisplayFromToggles();
    window.BtaAffordability?.computeAffordability?.();
  });
})();
