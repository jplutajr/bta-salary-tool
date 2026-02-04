(() => {
  let roster = [];
  let rosterStats = { ignoredRows: 0, totalDataRows: 0 };

  const rosterStorageRawKey = "bta_roster_raw_csv";
  const rosterStorageParsedKey = "bta_roster_parsed";
  const rosterLegacyKey = "bta_roster_json";

  const setRosterStatus = (msg) => {
    const el = document.getElementById("rosterStatus");
    if (el) el.textContent = msg || "";
  };

  const getEmbeddedRosterCSV = () => {
    const el = document.getElementById("embeddedRoster");
    return el ? (el.value || "").trim() : "";
  };

  const getRosterTextCSV = () => {
    const el = document.getElementById("rosterText");
    return el ? (el.value || "").trim() : "";
  };

  const saveRosterToStorage = (rawCsv) => {
    try {
      localStorage.setItem(rosterStorageRawKey, rawCsv || "");
      localStorage.setItem(rosterStorageParsedKey, JSON.stringify(roster));
    } catch (e) {
      // ignore
    }
  };

  const loadRosterFromStorage = () => {
    try {
      return (localStorage.getItem(rosterStorageRawKey) || "").trim();
    } catch (e) {
      return "";
    }
  };

  const clearRosterStorage = () => {
    try {
      localStorage.removeItem(rosterStorageRawKey);
      localStorage.removeItem(rosterStorageParsedKey);
      localStorage.removeItem(rosterLegacyKey);
    } catch (e) {
      // ignore
    }
  };

  const normScale = (value) => {
    if (!value) return "";
    let s = String(value).toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    const map = {
      "M+50": "M50",
      "M+40": "M40",
      "M+30": "M30",
      "M+20": "M20",
      "M+10": "M10",
      "MA+50": "M50",
      "MA+40": "M40",
      "MA+30": "M30",
      "MA+20": "M20",
      "MA+10": "M10",
      "MA50": "M50",
      "MA40": "M40",
      "MA30": "M30",
      "MA20": "M20",
      "MA10": "M10",
      "MA": "M",
      "MS": "M",
      "M": "M",
      "BA+50": "BA50",
      "BA+40": "BA40",
      "BA+30": "BA30",
      "BA+20": "BA20",
      "BA+10": "BA10",
      "B+50": "BA50",
      "B+40": "BA40",
      "B+30": "BA30",
      "B+20": "BA20",
      "B+10": "BA10",
      "B50": "BA50",
      "B40": "BA40",
      "B30": "BA30",
      "B20": "BA20",
      "B10": "BA10",
      "BACHELORS": "BA",
      "BACHELOR": "BA",
      "B.A.": "BA",
      "M.A.": "M"
    };
    if (map[s]) return map[s];
    let match;
    if ((match = s.match(/^M\D*(\d+)$/))) return `M${match[1]}`;
    if ((match = s.match(/^BA\D*(\d+)$/))) return `BA${match[1]}`;
    return s;
  };

  const tryParseCsv = (csvStr, delim) => {
    const s = csvStr.replace(/\uFEFF/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows = [];
    let row = [];
    let field = "";
    let inQ = false;
    for (let i = 0; i < s.length; i += 1) {
      const c = s[i];
      if (c === '"') {
        if (inQ && s[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQ = !inQ;
        }
      } else if (c === delim && !inQ) {
        row.push(field);
        field = "";
      } else if (c === "\n" && !inQ) {
        row.push(field);
        field = "";
        if (row.some((x) => x.trim() !== "")) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      if (row.some((x) => x.trim() !== "")) rows.push(row);
    }
    return rows;
  };

  const parseCSVWithStats = (csvStr) => {
    if (!csvStr) return { rows: [], ignoredRows: 0, totalDataRows: 0 };
    const candidates = [",", ";", "\t"];
    let rows = tryParseCsv(csvStr, ",");
    candidates.forEach((delim) => {
      const parsed = tryParseCsv(csvStr, delim);
      if ((parsed?.[0] || []).length >= (rows?.[0] || []).length) rows = parsed;
    });
    if (!rows.length) return { rows: [], ignoredRows: 0, totalDataRows: 0 };

    const header = rows[0].map((h) => String(h || "").trim());
    const findIdx = (names) => {
      const exactIdx = header.findIndex((h) => names.some((n) => new RegExp(`^${n}$`, "i").test(h)));
      if (exactIdx >= 0) return exactIdx;
      return header.findIndex((h) => names.some((n) => h.toLowerCase().includes(n.toLowerCase())));
    };

    const idxName = findIdx(["name", "employee name", "employee", "full name"]);
    const idxStep = findIdx(["step", "salary step", "current step"]);
    const idxColumn = findIdx(["column", "lane", "degree", "scale"]);
    const idxFTE = findIdx(["fte", "percent", "pct", "fte %", "fte pct"]);

    const out = [];
    let ignored = 0;
    const totalDataRows = Math.max(0, rows.length - 1);

    for (let r = 1; r < rows.length; r += 1) {
      const c = rows[r];
      const name = (idxName >= 0 ? c[idxName] : "").toString().trim();
      if (!name) { ignored += 1; continue; }

      const stepStr = (idxStep >= 0 ? c[idxStep] : "").toString().trim();
      const match = stepStr.match(/(\d{1,2})/);
      const step = match ? Math.max(1, Math.min(parseInt(match[1], 10), 22)) : null;
      if (!step) { ignored += 1; continue; }

      const columnRaw = (idxColumn >= 0 ? c[idxColumn] : "").toString().trim();
      const column = normScale(columnRaw);
      if (!column) { ignored += 1; continue; }

      const fteRaw = (idxFTE >= 0 ? c[idxFTE] : "1").toString().trim();
      let fte = 1;
      if (/%$/.test(fteRaw)) fte = parseFloat(fteRaw) / 100;
      else if (!Number.isNaN(parseFloat(fteRaw))) fte = parseFloat(fteRaw);
      if (!(fte > 0)) fte = 1;

      out.push({ Name: name, Step: step, Column: column, FTE: fte });
    }

    return { rows: out, ignoredRows: ignored, totalDataRows };
  };

  const parseCSV = (csvStr) => parseCSVWithStats(csvStr).rows;

  const notifyRosterUpdated = () => {
    window.dispatchEvent(new CustomEvent("bta-roster-updated", { detail: { roster } }));
  };

  const applyRosterFromCSV = (rawCsv, sourceLabel) => {
    const parsed = parseCSVWithStats(rawCsv);
    roster = parsed?.rows || [];
    rosterStats = { ignoredRows: parsed?.ignoredRows || 0, totalDataRows: parsed?.totalDataRows || 0 };
    saveRosterToStorage(rawCsv);
    const ignoredMsg = rosterStats.ignoredRows ? ` (${rosterStats.ignoredRows} ignored)` : "";
    setRosterStatus(`${sourceLabel}: ${roster.length} rows loaded${ignoredMsg}`);
    notifyRosterUpdated();
  };

  const ensureDefaultRosterLoaded = () => {
    const saved = loadRosterFromStorage();
    if (saved) return applyRosterFromCSV(saved, "Saved roster");

    const pasted = getRosterTextCSV();
    if (pasted) return applyRosterFromCSV(pasted, "Pasted roster");

    const embedded = getEmbeddedRosterCSV();
    if (embedded) return applyRosterFromCSV(embedded, "Default roster");

    setRosterStatus("No roster found (embeddedRoster is empty).");
    return null;
  };

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read failed"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsText(file);
  });

  const readFileAsArrayBuffer = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File read failed"));
    r.onload = () => resolve(r.result);
    r.readAsArrayBuffer(file);
  });

  const loadRosterFromFile = async (file) => {
    const name = (file?.name || "").toLowerCase();
    if (!file) return;

    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const text = await readFileAsText(file);
      applyRosterFromCSV(text, "File CSV");
      return;
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      if (typeof XLSX === "undefined") {
        throw new Error("XLSX library is not loaded (CDN missing/blocked).");
      }
      const buf = await readFileAsArrayBuffer(file);
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(ws);
      applyRosterFromCSV(csv, "File XLSX");
      return;
    }

    throw new Error("Unsupported file type. Use .csv or .xlsx");
  };

  const safeAddListener = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  const exportRosterCsv = () => {
    const app = window.BtaApp;
    if (!app) return;
    const year = app.clamp(+document.getElementById("exportYear")?.value || 1, 0, 5);
    const scenario = document.getElementById("exportScenario")?.value || "ui";

    const uiSchedules = app.buildSchedules(app.getUIParams());
    const scenarioA = app.loadScenario("A");
    const scenarioB = app.loadScenario("B");
    const scheduleA = scenarioA ? app.buildSchedules({ yPct: scenarioA.yPct, yFlat: scenarioA.yFlat, hiPct: scenarioA.hiPct }) : null;
    const scheduleB = scenarioB ? app.buildSchedules({ yPct: scenarioB.yPct, yFlat: scenarioB.yFlat, hiPct: scenarioB.hiPct }) : null;

    const header = ["Name", "Step", "Column", "FTE"];
    let rows = [];

    if (scenario === "both") {
      header.push("Salary_A", "Salary_B");
      rows = roster.map((entry) => {
        const stepY = app.stepForYear(entry.Step, year);
        const a = scheduleA ? app.salaryAt(scheduleA, year, stepY, entry.Column) : null;
        const b = scheduleB ? app.salaryAt(scheduleB, year, stepY, entry.Column) : null;
        return [
          entry.Name,
          entry.Step,
          entry.Column,
          entry.FTE,
          a == null ? "" : (a * (entry.FTE || 1)).toFixed(2),
          b == null ? "" : (b * (entry.FTE || 1)).toFixed(2)
        ];
      });
    } else {
      header.push("Salary");
      const schedules = scenario === "A" ? scheduleA : scenario === "B" ? scheduleB : uiSchedules;
      rows = roster.map((entry) => {
        const stepY = app.stepForYear(entry.Step, year);
        const value = schedules ? app.salaryAt(schedules, year, stepY, entry.Column) : null;
        return [
          entry.Name,
          entry.Step,
          entry.Column,
          entry.FTE,
          value == null ? "" : (value * (entry.FTE || 1)).toFixed(2)
        ];
      });
    }

    const csv = [header.join(",")]
      .concat(
        rows.map((row) => row.map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(","))
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bta_roster_year${year}_${scenario}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportRosterXlsx = () => {
    if (typeof XLSX === "undefined") {
      alert("XLSX library not loaded.");
      return;
    }
    const app = window.BtaApp;
    if (!app) return;

    const years = app.parseYearInput(document.getElementById("tableYear")?.value);
    const scenario = document.getElementById("exportScenario")?.value || "ui";

    const uiSchedules = app.buildSchedules(app.getUIParams());
    const scenarioA = app.loadScenario("A");
    const scenarioB = app.loadScenario("B");
    const scheduleA = scenarioA ? app.buildSchedules({ yPct: scenarioA.yPct, yFlat: scenarioA.yFlat, hiPct: scenarioA.hiPct }) : null;
    const scheduleB = scenarioB ? app.buildSchedules({ yPct: scenarioB.yPct, yFlat: scenarioB.yFlat, hiPct: scenarioB.hiPct }) : null;

    const wb = XLSX.utils.book_new();

    years.forEach((year) => {
      const header = ["Name", "BaseStep", "YearStep", "Column", "FTE"];
      let data = [];

      if (scenario === "both") {
        header.push("Salary_A", "Salary_B");
        data = roster.map((entry) => {
          const stepY = app.stepForYear(entry.Step, year);
          const a = scheduleA ? app.salaryAt(scheduleA, year, stepY, entry.Column) : null;
          const b = scheduleB ? app.salaryAt(scheduleB, year, stepY, entry.Column) : null;
          return [
            entry.Name,
            entry.Step,
            stepY,
            entry.Column,
            entry.FTE,
            a == null ? "" : (a * (entry.FTE || 1)),
            b == null ? "" : (b * (entry.FTE || 1))
          ];
        });
      } else {
        header.push("Salary");
        const schedules = scenario === "A" ? scheduleA : scenario === "B" ? scheduleB : uiSchedules;
        data = roster.map((entry) => {
          const stepY = app.stepForYear(entry.Step, year);
          const value = schedules ? app.salaryAt(schedules, year, stepY, entry.Column) : null;
          return [
            entry.Name,
            entry.Step,
            stepY,
            entry.Column,
            entry.FTE,
            value == null ? "" : (value * (entry.FTE || 1))
          ];
        });
      }

      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, `Year${year}`);
    });

    XLSX.writeFile(wb, `bta_roster_export_${scenario}.xlsx`);
  };

  const wireRosterUI = () => {
    const loadBtn = document.getElementById("loadRosterBtn");
    const useSampleBtn = document.getElementById("useSampleRosterBtn");
    const clearBtn = document.getElementById("clearRosterBtn");
    const clearSavedBtn = document.getElementById("clearSavedRosterBtn");
    const fileInput = document.getElementById("rosterFile");
    const rosterTextEl = document.getElementById("rosterText");

    if (loadBtn) {
      loadBtn.addEventListener("click", () => {
        const pasted = getRosterTextCSV();
        if (!pasted) {
          setRosterStatus("Paste CSV into the box OR choose a file.");
          return;
        }
        applyRosterFromCSV(pasted, "Pasted roster");
      });
    }

    if (useSampleBtn) {
      useSampleBtn.addEventListener("click", () => {
        const embedded = getEmbeddedRosterCSV();
        if (!embedded) {
          setRosterStatus("embeddedRoster is empty.");
          return;
        }
        if (rosterTextEl) rosterTextEl.value = "";
        applyRosterFromCSV(embedded, "Default roster");
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        roster = [];
        if (rosterTextEl) rosterTextEl.value = "";
        saveRosterToStorage("");
        setRosterStatus("Roster cleared (saved roster not deleted).");
        notifyRosterUpdated();
      });
    }

    if (clearSavedBtn) {
      clearSavedBtn.addEventListener("click", () => {
        clearRosterStorage();
        setRosterStatus("Saved roster cleared.");
        ensureDefaultRosterLoaded();
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", async () => {
        try {
          const f = fileInput.files && fileInput.files[0];
          if (!f) return;
          await loadRosterFromFile(f);
        } catch (err) {
          setRosterStatus(`Upload error: ${err.message || err}`);
        } finally {
          fileInput.value = "";
        }
      });
    }

    safeAddListener("exportCsvBtn", "click", exportRosterCsv);
    safeAddListener("exportXlsxBtn", "click", exportRosterXlsx);
  };

  document.addEventListener("DOMContentLoaded", () => {
    window.BtaRoster = {
      getRoster: () => roster,
      getRosterStats: () => rosterStats,
      setRoster: (nextRoster) => {
        roster = nextRoster || [];
        notifyRosterUpdated();
      },
      parseCSV,
      normScale,
      onRenderedTable: () => {},
      exportRosterCsv,
      exportRosterXlsx
    };

    try {
      wireRosterUI();
      ensureDefaultRosterLoaded();
    } catch (e) {
      setRosterStatus(`Roster init error: ${e.message || e}`);
    }
  });
})();
