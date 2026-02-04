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
  const BUILD_VERSION = "v0.5.2";
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

        v = (v + Number(flat || 0)) * (1 + Number(rate || 0));
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

    return { yPct, yFlat, hiPct };
  };

  const serializeScenarioFromUI = () => {
    const { yPct, yFlat, hiPct } = getUIParams();
    return {
      yPct,
      yFlat,
      hiPct,
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

    setVal("year1", String(payload.yPct?.[1] ?? 0.0275));
    setVal("year2", String(payload.yPct?.[2] ?? 0.0275));
    setVal("year3", String(payload.yPct?.[3] ?? 0.0275));
    setVal("year4", String(payload.yPct?.[4] ?? 0.0275));
    setVal("year5", String(payload.yPct?.[5] ?? 0.0275));

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
    setVal("oneTimeFund", String(payload.oneTimeFund ?? ""));
    setVal("reallocPct", String(payload.reallocPct ?? ""));
    setVal("oneTimeMode", payload.oneTimeMode || "y1");
  };

  const SCENARIO_KEY_A = "bta_scenario_A_v1";
  const SCENARIO_KEY_B = "bta_scenario_B_v1";

  const saveScenario = (which) => {
    const payload = serializeScenarioFromUI();
    try {
      localStorage.setItem(which === "A" ? SCENARIO_KEY_A : SCENARIO_KEY_B, JSON.stringify(payload));
      updateScenarioStatus();
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

  const updateScenarioStatus = () => {
    const el = document.getElementById("scenarioStatus");
    if (!el) return;
    const hasA = !!loadScenario("A");
    const hasB = !!loadScenario("B");
    el.textContent = `A: ${hasA ? "saved" : "—"} | B: ${hasB ? "saved" : "—"}`;
  };

  // ------------------------------ Schedule Builders ------------------------------
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

    for (let y = 1; y <= 5; y += 1) {
      schedules[y] = {};
      for (let s = 1; s <= 22; s += 1) {
        schedules[y][s] = {};
        for (const c of COLS) {
          const prev = schedules[y - 1][s][c];
          const flatAdd = params?.yFlat?.[y] || 0;
          const rate = params?.yPct?.[y] || 0;
          schedules[y][s][c] = prev == null ? null : (prev + flatAdd) * (1 + rate);
        }
      }
    }
    return schedules;
  };

  const salaryAt = (schedules, year, step, col) => {
    const rosterTools = window.BtaRoster;
    const normScale = rosterTools?.normScale || ((value) => value);
    const y = clamp(year, 0, 5);
    const s = clamp(step, 1, 22);
    const c = normScale(col);
    const value = schedules?.[y]?.[s]?.[c];
    return value == null ? null : Number(value);
  };

  const stepForYear = (baseStep, year) => {
    const sm = SalaryMath();
    if (typeof sm.stepForYear === "function") return sm.stepForYear(baseStep, year);
    const s0 = clamp(baseStep, 1, 22);
    if (year <= 1) return s0;
    return clamp(s0 + (year - 1), 1, 22);
  };

  // ------------------------------ AI payload (numbers, not DOM) ------------------------------
  const buildTablesPayload = ({ years, premiumType, compareMode, scheduleBlocks }) => {
    const renderArea = document.getElementById("renderArea");
    const hideTa = !!document.getElementById("toggleHideTA")?.checked;
    const showNet = !!document.getElementById("toggleNetPay")?.checked;
    const showDelta = !!document.getElementById("toggleCompareY0")?.checked;

    const columns = COLS.filter((c) => !(hideTa && c === "TA"));

    const premiumLabel = premiumType === "individual" ? "Individual" : "Family";
    const premiumValue = premiumType === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR;

    const tables = [];
    (scheduleBlocks || []).forEach((block) => {
      const { title, schedules, hiPct } = block;
      years.forEach((year) => {
        const hiYearIdx = Math.max(1, year);
        const pct = hiPct?.[hiYearIdx] ?? 0;

        const rows = [];
        for (let step = 1; step <= 22; step += 1) {
          const cells = {};
          for (const col of columns) {
            const gross = schedules?.[year]?.[step]?.[col];
            const base = schedules?.[0]?.[step]?.[col];
            const delta = gross == null || base == null ? null : +(gross - base).toFixed(2);
            const net = gross == null ? null : +(Number(gross) - premiumValue * Number(pct || 0)).toFixed(2);
            cells[col] = { gross: gross == null ? null : +Number(gross).toFixed(2), delta, net };
          }
          rows.push({ step, cells });
        }

        tables.push({
          title,
          year,
          columns,
          premium: { type: premiumType, label: premiumLabel, annual: premiumValue },
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
        premiumType
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
    for (let p = 0.5; p <= 3.5 + 1e-9; p += 0.25) {
      const val = (p / 100).toFixed(4);
      const label = `${p.toFixed(2).replace(/\.00$/, "")}%`;
      options.push({ val, label });
    }
    ids.forEach((id) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = options.map((opt) => `<option value="${opt.val}">${opt.label}</option>`).join("");
      if (!sel.value) sel.value = "0.0275";
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
      const stepY = stepForYear(entry.Step, year);
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
            .filter((n) => n >= 1 && n <= 22)
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
        : Array.from({ length: 22 }, (_, i) => i + 1);

      if (rosterOnly && !stepsToRender.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="${COLS.length + 1}" style="padding:10px; color:#475569">No roster entries were found for Year ${year}. Load a roster and try again.</td>`;
        tbody.appendChild(tr);
      }

      for (const step of stepsToRender) {
        const tr = document.createElement("tr");
        const rowHtml = COLS.map((col) => {
          const value = schedules?.[year]?.[step]?.[col];
          const baseValue = schedules?.[0]?.[step]?.[col];
          const rosterEntry = rosterMap.get(`${step}|${col}`);
          const hasRoster = Boolean(rosterEntry);

          // "Steps w/ roster only" mode: keep the grid, but only show numbers for cells that have roster.
          const showCellValue = !rosterOnly || hasRoster;

          const premiumType = document.getElementById("netPremiumType")?.value || "family";
          const premiumLabel = premiumType === "individual" ? "Individual" : "Family";
          const premium = premiumType === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR;

          const pct = hiPct?.[hiYearIdx] ?? 0;
          const netValue = !showCellValue || value == null ? null : Number((value - premium * pct).toFixed(2));
          const deltaValue = !showCellValue || value == null || baseValue == null ? null : value - baseValue;

          const detailText = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}<br/>Total FTE: ${rosterEntry.totalFte.toFixed(2)}<br/>Cell total: ${money(rosterEntry.totalCost)}`
            : "";

          const tooltip = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}\nTotal FTE: ${rosterEntry.totalFte.toFixed(2)}\nCell total: ${money(rosterEntry.totalCost)}`
            : "";

          const tooltipAttr = tooltip ? tooltip.replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "";

          const deltaLine = `<div class="delta-line">Δ vs Y0: ${deltaValue == null ? "—" : (deltaValue >= 0 ? "+" : "") + money(deltaValue)}</div>`;
          const netLine = `<div class="net-line">Net (${premiumLabel}): ${netValue == null ? "—" : money(netValue)}</div>`;

          return (
            `<td data-col="${col}" class="${hasRoster ? "cell-has-roster" : ""}" ${tooltipAttr ? `title="${tooltipAttr}"` : ""}>` +
            `<span class="main">${!showCellValue || value == null ? "—" : money(value)}</span>` +
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
        renderSalaryTable(scheduleA, years, "Salary Table — Scenario A", scenarioA.hiPct, { rosterOnly })
      );
      compareWrap.appendChild(
        renderSalaryTable(scheduleB, years, "Salary Table — Scenario B", scenarioB.hiPct, { rosterOnly })
      );
      blocks.push(compareWrap);

      scheduleBlocks.push({ title: "Salary Table — Scenario A", schedules: scheduleA, hiPct: scenarioA.hiPct });
      scheduleBlocks.push({ title: "Salary Table — Scenario B", schedules: scheduleB, hiPct: scenarioB.hiPct });
    } else {
      blocks.push(renderSalaryTable(schedulesUI, years, "Salary Table — Current UI", uiParams.hiPct, { rosterOnly }));
      scheduleBlocks.push({ title: "Salary Table — Current UI", schedules: schedulesUI, hiPct: uiParams.hiPct });
    }

    blocks.forEach((block) => renderArea.appendChild(block));

    window.BtaAffordability?.computeAffordability?.();
    updateRosterDisplayFromToggles();

    // Always build payload for Bee/export (works even if renderArea is hidden)
    const premiumType = document.getElementById("netPremiumType")?.value || "family";
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
    // Prefer jsPDF if present; fallback to printable HTML.
    const JsPdf = window.jspdf?.jsPDF || window.jsPDF;
    const hasPdf = !!JsPdf;
    const rosterCount = (window.BtaRoster?.getRoster?.() || []).length;

    const params = getUIParams();
    const scenarioA = loadScenario("A");
    const scenarioB = loadScenario("B");

    const pct = (v) => `${(Number(v || 0) * 100).toFixed(2).replace(/\.00$/, "")}%`;
    const hiLabel = (v) => `${(Number(v || 0) * 100).toFixed(1)}%`;

    const increases = [1, 2, 3, 4, 5].map((y) => [
      `Y${y}`,
      money(params.yFlat?.[y] || 0),
      pct(params.yPct?.[y] || 0),
      hiLabel(params.hiPct?.[y] || 0)
    ]);

    // Pull affordability table from DOM if available
    const affRows = Array.from(document.querySelectorAll("#affordabilityTableBody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim())
    );

    const recurringBannerText = document.getElementById("affordabilitySummaryRecurring")?.innerText?.trim() || "";
    const cashBannerText = document.getElementById("affordabilitySummaryCash")?.innerText?.trim() || "";

    if (!hasPdf) {
      // HTML fallback
      const w = window.open("", "_blank");
      if (!w) return;
      const html = `<!doctype html><html><head><meta charset="utf-8"/>
        <title>BTA Report</title>
        <style>
          body{font-family:Arial,system-ui;margin:18px;color:#111}
          h1{margin:0 0 6px}
          .meta{color:#475569;margin:0 0 10px}
          table{border-collapse:collapse;width:100%;margin:10px 0}
          th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;white-space:nowrap}
          thead th{background:#2d3748;color:#fff}
          .block{margin:12px 0}
          .note{color:#475569;font-size:12px}
          button{padding:8px 12px;border:0;border-radius:8px;background:#334155;color:#fff;cursor:pointer}
        </style></head><body>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
        </div>
        <h1>BTA Salary Lookup — Report</h1>
        <p class="meta">Generated: ${new Date().toLocaleString()} | Roster rows: ${rosterCount} | Scenarios saved: A=${scenarioA ? "yes" : "no"}, B=${scenarioB ? "yes" : "no"}</p>
        <div class="block"><h3>Contract Inputs</h3>
          <table><thead><tr><th>Year</th><th>Flat</th><th>%</th><th>HI %</th></tr></thead>
          <tbody>${increases.map(r => `<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>
        </div>
        <div class="block"><h3>Affordability Summary</h3>
          <pre>${(recurringBannerText + "\n\n" + cashBannerText).trim()}</pre>
          ${affRows.length ? `<table><thead><tr><th>Year</th><th>Contract Payroll</th><th>Baseline Payroll</th><th>Incremental+Adders</th><th>Recurring Offsets</th><th>Net Impact (Recurring)</th><th>Base Cap</th><th>Recurring</th><th>Cash</th></tr></thead><tbody>${affRows.map(r => `<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "<p class=\"note\">Affordability table not available. Load roster + ensure the affordability section is present.</p>"}
        </div>
        <p class="note">Tip: Use “Generate Salary Table” for the full schedule view (and print from the popup).</p>
        </body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
      return;
    }

    const doc = new JsPdf({ orientation: "landscape", unit: "pt", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const left = 40;
    let y = 40;

    doc.setFontSize(18);
    doc.text("BTA Salary Lookup — Report", left, y);
    y += 18;
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}   |   Roster rows: ${rosterCount}   |   Scenarios saved: A=${scenarioA ? "yes" : "no"}, B=${scenarioB ? "yes" : "no"}`,
      left,
      y
    );
    y += 16;

    // Contract inputs table
    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: y,
        head: [["Year", "Flat", "%", "HI %"]],
        body: increases,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [45, 55, 72] }
      });
      y = doc.lastAutoTable.finalY + 16;
    } else {
      doc.text("Contract Inputs:", left, y);
      y += 12;
      increases.forEach((r) => {
        doc.text(r.join("  |  "), left, y);
        y += 11;
      });
      y += 8;
    }

    // Affordability summaries
    doc.setFontSize(11);
    doc.text("Affordability Summary", left, y);
    y += 12;
    doc.setFontSize(9);
    const summaryText = (recurringBannerText + "\n\n" + cashBannerText).trim();
    const wrap = doc.splitTextToSize(summaryText || "(no affordability summary)", pageW - left * 2);
    doc.text(wrap, left, y);
    y += Math.min(140, wrap.length * 11) + 8;

    // Affordability table
    if (affRows.length && typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: y,
        head: [["Year", "Contract Payroll", "Baseline Payroll", "Incremental+Adders", "Recurring Offsets", "Net Impact (Recurring)", "Base Cap", "Recurring", "Cash"]],
        body: affRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [45, 55, 72] }
      });
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
      const step = clamp(+document.getElementById("sl_step")?.value || 1, 1, 22);
      const col = normScale(document.getElementById("sl_scale")?.value || "M50");

      const scenario = document.getElementById("sl_scenario")?.value || "ui";
      const showHi = (document.getElementById("sl_show_hi")?.value || "yes") === "yes";
      const hiYearIdx = Math.max(1, year);

      const premiumType = document.getElementById("netPremiumType")?.value || "family";
      const premiumLabel = premiumType === "individual" ? "Individual" : "Family";
      const premiumValue = premiumType === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR;

      const doOne = (label, schedules, hiPct) => {
        const effectiveStep = stepForYear(step, year);
        const gross = salaryAt(schedules, year, effectiveStep, col);
        if (gross == null) return `${label}: —`;
        if (!showHi) return `${label}: ${money(gross)}`;

        const sm = SalaryMath();
        const pct = hiPct?.[hiYearIdx] ?? 0;
        const net =
          typeof sm.computeHealthInsuranceNet === "function"
            ? sm.computeHealthInsuranceNet(gross, pct, premiumValue)
            : Number((gross - premiumValue * pct).toFixed(2));

        return `${label}: Gross ${money(gross)} | Net (${premiumLabel} premium): ${money(net)}`;
      };

      const output = [];
      const paramsUI = getUIParams();
      const schedulesUI = buildSchedules(paramsUI);

      if (scenario === "A" || scenario === "both") {
        const sA = loadScenario("A");
        if (sA) output.push(doOne("Scenario A", buildSchedules(sA), sA.hiPct));
        else output.push("Scenario A: (not saved)");
      }

      if (scenario === "B" || scenario === "both") {
        const sB = loadScenario("B");
        if (sB) output.push(doOne("Scenario B", buildSchedules(sB), sB.hiPct));
        else output.push("Scenario B: (not saved)");
      }

      if (scenario === "ui") output.push(doOne("Current UI", schedulesUI, paramsUI.hiPct));

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
      const step = clamp(+document.getElementById("sl_step")?.value || 1, 1, 22);
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

      const el = document.getElementById("sl_explain_out");
      if (el) el.textContent = lines.join("\n");
    });

    // Toggles
    safeAddListener("toggleRosterHighlight", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleRosterDetails", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleHideTA", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleCompareY0", "change", updateRosterDisplayFromToggles);
    safeAddListener("toggleNetPay", "change", updateRosterDisplayFromToggles);

    // Filter: Steps w/ roster only (affects generation)
    safeAddListener("showRosterStepsOnly", "change", () => {
      const renderArea = document.getElementById("renderArea");
      if (renderArea && renderArea.children && renderArea.children.length) {
        generateSalaryTable({ mode: "inline" });
      }
    });

    safeAddListener("netPremiumType", "change", () => {
      const renderArea = document.getElementById("renderArea");
      if (renderArea && renderArea.children && renderArea.children.length) {
        generateSalaryTable({ mode: "inline" });
      }
    });

    // Affordability recalcs
    const watchIds = [
      "year1","year2","year3","year4","year5",
      "flat1","flat2","flat3","flat4","flat5",
      "adderPct","otherPct","budget","maxBudgetPct","maxBudgetFlat",
      "stateAidPct","addlRevenue","otherSavings","recurringSurplus",
      "oneTimeFund","reallocPct","oneTimeMode",
      "contributionY1","contributionY2","contributionY3","contributionY4","contributionY5",
      "netPremiumType"
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
      getUIParams,
      buildSchedules,
      salaryAt,
      serializeScenarioFromUI,
      applyScenarioToUI,
      saveScenario,
      loadScenario,
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
