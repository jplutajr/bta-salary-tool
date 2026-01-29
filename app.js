(() => {
  "use strict";

  const SalaryMath = () => window.SalaryMath || {};

  const BUILD_VERSION = "v0.5.0";
  const BUILD_TIME = new Date().toLocaleString();
  const IND_PREM_YEAR = 19599.96;
  const FAM_PREM_YEAR = 43965.48;

  const COLS = [
    "TA",
    "BA",
    "BA10",
    "BA20",
    "BA30",
    "BA40",
    "BA50",
    "BA60",
    "M",
    "M10",
    "M20",
    "M30",
    "M40",
    "M50"
  ];
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

  const money = (value) => Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });

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
      for (let y = Math.min(start, end); y <= Math.max(start, end); y += 1) {
        out.push(y);
      }
      return out;
    }
    return raw
      .split(/[, ]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 5);
  };

  const stepForYear = (baseStep, year) => {
    const sm = SalaryMath();
    if (typeof sm.stepForYear === "function") {
      return sm.stepForYear(baseStep, year);
    }
    const s0 = clamp(baseStep, 1, 22);
    if (year <= 1) return s0;
    const advanced = s0 + (year - 1);
    return clamp(advanced, 1, 22);
  };

  const getUIParams = () => {
    const pct = (id) => clamp(parseFloat(document.getElementById(id)?.value || "0"), 0, 1);
    const flat = (id) => clamp(parseFloat(document.getElementById(id)?.value || "0"), -1e9, 1e9);

    const yPct = [null, pct("year1"), pct("year2"), pct("year3"), pct("year4"), pct("year5")];
    const yFlat = [null, flat("flat1"), flat("flat2"), flat("flat3"), flat("flat4"), flat("flat5")];

    const contrib = (id) => clamp(parseFloat(document.getElementById(id)?.value || "0"), 0, 100) / 100;
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

    setVal("contributionY1", String((payload.hiPct?.[1] ?? 0.19) * 100));
    setVal("contributionY2", String((payload.hiPct?.[2] ?? 0.19) * 100));
    setVal("contributionY3", String((payload.hiPct?.[3] ?? 0.19) * 100));
    setVal("contributionY4", String((payload.hiPct?.[4] ?? 0.19) * 100));
    setVal("contributionY5", String((payload.hiPct?.[5] ?? 0.19) * 100));

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

  const getBaseSalary = (step, col) => {
    const row = baseTable.find((r) => r.step === step);
    if (!row) return null;
    const value = row[col];
    return value == null ? null : Number(value);
  };

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
          schedules[y][s][c] =
            prev == null ? null : (prev + (params?.yFlat?.[y] || 0)) * (1 + (params?.yPct?.[y] || 0));
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
      // default
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
    if (selfCheck && detail) {
      selfCheck.textContent = detail;
    }
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

  const renderSalaryTable = (schedules, years, title, hiPct) => {
    const rosterTools = window.BtaRoster;

    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.style.marginBottom = "14px";

    const heading = document.createElement("h3");
    heading.textContent = title;
    wrap.appendChild(heading);

    years.forEach((year) => {
      const rosterMap = buildRosterCellMap(schedules, year);
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
      for (let step = 1; step <= 22; step += 1) {
        const tr = document.createElement("tr");
        const rowHtml = COLS.map((col) => {
          const value = schedules?.[year]?.[step]?.[col];
          const baseValue = schedules?.[0]?.[step]?.[col];
          const rosterEntry = rosterMap.get(`${step}|${col}`);
          const hasRoster = Boolean(rosterEntry);
          const premiumType = document.getElementById("netPremiumType")?.value || "family";
          const premiumLabel = premiumType === "individual" ? "Individual" : "Family";
          const premium = premiumType === "individual" ? IND_PREM_YEAR : FAM_PREM_YEAR;
          const pct = hiPct?.[hiYearIdx] ?? 0;
          const netValue = value == null ? null : Number((value - premium * pct).toFixed(2));
          const deltaValue = value == null || baseValue == null ? null : value - baseValue;
          const detailText = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}<br/>Total FTE: ${rosterEntry.totalFte.toFixed(2)}<br/>Cell total: ${money(rosterEntry.totalCost)}`
            : "";
          const tooltip = hasRoster
            ? `Staff: ${rosterEntry.names.join(", ")}\nTotal FTE: ${rosterEntry.totalFte.toFixed(2)}\nCell total: ${money(rosterEntry.totalCost)}`
            : "";
          const tooltipAttr = tooltip
            ? tooltip.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
            : "";
          const deltaLine = `<div class="delta-line">Δ vs Y0: ${deltaValue == null ? "—" : (deltaValue >= 0 ? "+" : "") + money(deltaValue)}</div>`;
          const netLine = `<div class="net-line">Net (${premiumLabel}): ${netValue == null ? "—" : money(netValue)}</div>`;
          return `<td data-col="${col}" class="${hasRoster ? "cell-has-roster" : ""}" ${tooltipAttr ? `title="${tooltipAttr}"` : ""}>`
            + `<span class="main">${value == null ? "—" : money(value)}</span>`
            + deltaLine
            + netLine
            + (hasRoster ? `<div class="detail">${detailText}</div>` : "")
            + "</td>";
        }).join("");

        tr.innerHTML = `<td>${step}</td>${rowHtml}`;
        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      tableContainer.appendChild(table);
      wrap.appendChild(tableContainer);
    });

    if (rosterTools && typeof rosterTools.onRenderedTable === "function") {
      rosterTools.onRenderedTable(wrap);
    }

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
    renderArea.innerHTML = "";

    const compareOn = !!document.getElementById("compareOnGenerate")?.checked;
    const scenarioA = loadScenario("A");
    const scenarioB = loadScenario("B");

    const uiParams = getUIParams();
    const schedulesUI = buildSchedules(uiParams);

    const blocks = [];

    if (compareOn && scenarioA && scenarioB) {
      const scheduleA = buildSchedules({ yPct: scenarioA.yPct, yFlat: scenarioA.yFlat, hiPct: scenarioA.hiPct });
      const scheduleB = buildSchedules({ yPct: scenarioB.yPct, yFlat: scenarioB.yFlat, hiPct: scenarioB.hiPct });

      const compareWrap = document.createElement("div");
      compareWrap.className = "compare-wrap";
      compareWrap.appendChild(renderSalaryTable(scheduleA, years, "Salary Table — Scenario A", scenarioA.hiPct));
      compareWrap.appendChild(renderSalaryTable(scheduleB, years, "Salary Table — Scenario B", scenarioB.hiPct));
      blocks.push(compareWrap);
    } else {
      blocks.push(renderSalaryTable(schedulesUI, years, "Salary Table — Current UI", uiParams.hiPct));
    }

    blocks.forEach((block) => renderArea.appendChild(block));

    window.BtaAffordability?.computeAffordability?.();
    updateRosterDisplayFromToggles();

    if (mode === "newWindow") {
      const w = window.open("", "_blank");
      if (!w) return;

      const highlightOn = !!document.getElementById("toggleRosterHighlight")?.checked;
      const hideTa = !!document.getElementById("toggleHideTA")?.checked;
      const showDelta = !!document.getElementById("toggleCompareY0")?.checked;
      const showNet = !!document.getElementById("toggleNetPay")?.checked;

      const wrapperClass = [
        highlightOn ? "" : "roster-highlight-off",
        hideTa ? "hide-ta" : "",
        showDelta ? "show-delta" : "",
        showNet ? "show-net" : ""
      ]
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
          th,td{border:1px solid #ddd;padding:6px 8px;white-space:nowrap;font-size:12px}
          thead th{background:#2d3748;color:#fff;position:sticky;top:0}
          h3{margin:10px 0 4px}
          .btns{display:flex;gap:8px;margin:10px 0}
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
        </style>
        </head><body>
          <div class="btns">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
          ${recurringBanner}
          ${cashBanner}
          <div class="${wrapperClass}">${renderArea.innerHTML}</div>
        </body></html>
      `;
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const safeAddListener = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  const wireCoreButtons = () => {
    safeAddListener("generateTableButton", "click", () => generateSalaryTable({ mode: "inline" }));
    safeAddListener("generateTableNewWindow", "click", () => generateSalaryTable({ mode: "newWindow" }));

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

    // Premium type impacts net pay lines (re-render if a table exists)
    safeAddListener("netPremiumType", "change", () => {
      if (document.getElementById("renderArea")?.children?.length) generateSalaryTable({ mode: "inline" });
    });

    // ✅ Affordability should recalc when any of these change
    const watchIds = [
      "year1",
      "year2",
      "year3",
      "year4",
      "year5",
      "flat1",
      "flat2",
      "flat3",
      "flat4",
      "flat5",
      "contributionY1",
      "contributionY2",
      "contributionY3",
      "contributionY4",
      "contributionY5",
      "adderPct",
      "otherPct",
      "budget",
      "maxBudgetPct",
      "maxBudgetFlat",
      "stateAidPct",
      "addlRevenue",
      "otherSavings",
      "recurringSurplus",
      "oneTimeFund",
      "reallocPct",
      "oneTimeMode",
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
          "salary-math.js did not load (or missing exports). Open DevTools → Network and confirm salary-math.js returns 200."
        );
        updateSystemStatus("ERROR", "FAIL (engine missing)");
      } else {
        showAppError("App is taking longer than expected to finish booting. If it finishes after a few seconds, ignore this.");
      }
    }, 6000);
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.baseTable = baseTable;

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
