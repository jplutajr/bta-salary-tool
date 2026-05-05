(() => {
  const state = { isOpen: false };

  const setChatOpen = (open) => {
    const panel = document.getElementById("beeAiChat");
    if (!panel) return;

    state.isOpen = open;
    panel.style.display = open ? "flex" : "none";

    // If closing, also collapse so it doesn't re-open huge unexpectedly
    if (!open) {
      panel.classList.remove("is-expanded");
      const expandBtn = document.getElementById("beeAiExpand");
      if (expandBtn) expandBtn.textContent = "Expand";
    }
  };

  const toggleChat = () => setChatOpen(!state.isOpen);

  // ---------- helpers ----------
  const parseMoney = (text) => {
    if (!text) return null;
    const cleaned = String(text).replace(/[^0-9.-]+/g, "");
    if (!cleaned) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  };

  const getSelectedPremiumModes = () => {
    const familyChecked = !!document.getElementById("netPremiumFamily")?.checked;
    const individualChecked = !!document.getElementById("netPremiumIndividual")?.checked;
    const modes = [];
    if (familyChecked) modes.push("family");
    if (individualChecked) modes.push("individual");
    return modes.length ? modes : ["family"];
  };


  const readRenderedTables = () => {
    const renderArea = document.getElementById("renderArea");
    if (!renderArea) return null;

    const hideTa = renderArea.classList.contains("hide-ta");
    const showNet = renderArea.classList.contains("show-net");
    const showDelta = renderArea.classList.contains("show-delta");
    const premiumType = getSelectedPremiumModes();

    const results = [];
    const cards = Array.from(renderArea.querySelectorAll(".card"));

    cards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent?.trim() || "Salary Table";
      const yearLabels = Array.from(card.querySelectorAll("strong"));

      yearLabels.forEach((label) => {
        const match = label.textContent?.match(/Year\s+(\d+)/i);
        if (!match) return;
        const year = Number(match[1]);

        const table = label.parentElement?.nextElementSibling?.querySelector("table");
        if (!table) return;

        const headers = Array.from(table.querySelectorAll("thead th"))
          .map((th) => th.getAttribute("data-col") || th.textContent?.trim())
          .filter((col) => col && col !== "Step");

        const columns = headers.filter((col) => !(hideTa && col === "TA"));

        const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) => {
          const step = Number(row.querySelector("td")?.textContent?.trim() || "0");
          const cells = {};

          columns.forEach((col) => {
            const cell = row.querySelector(`td[data-col="${col}"]`);
            if (!cell) return;

            const gross = parseMoney(cell.querySelector(".main")?.textContent || "");
            const deltaText = cell.querySelector(".delta-line")?.textContent || "";
            const netText = cell.querySelector(".net-line")?.textContent || "";

            const delta = showDelta ? parseMoney(deltaText) : null;
            const net = showNet ? parseMoney(netText) : null;

            cells[col] = {
              gross,
              net: showNet ? net : null,
              delta: showDelta ? delta : null
            };
          });

          return { step, cells };
        });

        results.push({ title, year, columns, rows });
      });
    });

    if (!results.length) return null;

    return {
      generatedAt: new Date().toISOString(),
      toggles: { hideTa, showNet, showDelta, premiumType },
      tables: results
    };
  };

  // Prefer app.js payload; fallback to DOM scrape; fallback to cached.
  const getBestTablesPayload = () => {
    const fromGetter = window.BtaAI?.getSalaryTablesPayload?.();
    if (fromGetter?.tables?.length) return fromGetter;

    const fromStored = window.BtaAI?.__lastTablesPayload;
    if (fromStored?.tables?.length) return fromStored;

    const scraped = readRenderedTables();
    if (scraped?.tables?.length) return scraped;

    const cached =
      window.__BEE_LAST_TABLES_PAYLOAD__ ||
      window.BtaAI?.__beeLastTablesPayload ||
      null;

    if (cached?.tables?.length) return cached;

    return null;
  };

  const cacheTablesPayload = (payload) => {
    if (!payload?.tables?.length) return;
    window.__BEE_LAST_TABLES_PAYLOAD__ = payload;
    if (window.BtaAI) {
      window.BtaAI.__beeLastTablesPayload = payload;
      window.BtaAI.__lastTablesPayload = payload;
    }
  };

  const buildMarkdownSummary = (payload) => {
    if (!payload) return "No salary tables are available.";
    const lines = [
      "# Salary Table Export (AI)",
      `Generated: ${payload.generatedAt}`,
      `Mode: ${payload.mode || "unknown"}`,
      `Toggles: Hide TA=${payload.toggles?.hideTa}, Net=${payload.toggles?.showNet}, Delta=${payload.toggles?.showDelta}, Premium=${payload.toggles?.premiumType}`,
      ""
    ];

    (payload.tables || []).forEach((table) => {
      lines.push(`## ${table.title} — Year ${table.year}`);
      lines.push(`Columns: ${(table.columns || []).join(", ")}`);
      lines.push(`Rows: ${(table.rows || []).length}`);

      const sample = (table.rows || []).slice(0, 3).map((row) => {
        const firstCol = (table.columns || [])[0];
        const value = row?.cells?.[firstCol]?.gross ?? "—";
        return `- Step ${row.step}: ${firstCol} gross ${value}`;
      });

      if (sample.length) {
        lines.push("Sample:");
        lines.push(...sample);
      }
      lines.push("");
    });

    return lines.join("\n");
  };

  const downloadTextFile = (text, filename, mime = "text/plain;charset=utf-8") => {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---------- main UI wiring ----------
  const wireBeeUI = () => {
    const button = document.getElementById("beeAiButton");
    const panel = document.getElementById("beeAiChat");
    const closeBtn = document.getElementById("beeAiClose");
    const clearBtn = document.getElementById("beeAiClear");
    const sendBtn = document.getElementById("beeAiSend");
    const researchBtn = document.getElementById("beeAiResearch");
    const expandBtn = document.getElementById("beeAiExpand");
    const saveBtn = document.getElementById("beeAiSave");
    const input = document.getElementById("beeAiInput");
    const log = document.getElementById("beeAiLog");

    if (!button || !panel || !closeBtn || !log || !input) return;

    const syncExpandLabel = () => {
      if (!expandBtn) return;
      expandBtn.textContent = panel.classList.contains("is-expanded") ? "Collapse" : "Expand";
    };

    const appendMessage = (text, role) => {
      const row = document.createElement("div");
      row.className = `bee-ai-msg ${role === "user" ? "bee-ai-user" : "bee-ai-bot"}`;
      const bubble = document.createElement("div");
      bubble.className = "bee-ai-bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    };

    button.addEventListener("click", () => {
      toggleChat();
      syncExpandLabel();
    });

    closeBtn.addEventListener("click", () => {
      setChatOpen(false);
      syncExpandLabel();
    });

    researchBtn?.addEventListener("click", () => {
      if (!input.value.trim().toLowerCase().startsWith("research:")) {
        input.value = "research: ";
      }
      setChatOpen(true);
      input.focus();
    });

    expandBtn?.addEventListener("click", () => {
      panel.classList.toggle("is-expanded");
      syncExpandLabel();
    });

    clearBtn?.addEventListener("click", () => {
      log.innerHTML = "";
    });

    const ASK_URL =
      window.BEE_AI_ENDPOINT ||
      "https://gemini-rag-chatbot-m6qcajeezq-uc.a.run.app/ask";

    const callAskApi = async ({ question, context }) => {
      const res = await fetch(ASK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Ask API ${res.status}: ${t || res.statusText}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return (
          data.answer ||
          data.response ||
          data.text ||
          data.message ||
          JSON.stringify(data)
        );
      }
      return await res.text();
    };

    sendBtn?.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) return;

      appendMessage(text, "user");
      input.value = "";

      const effectiveTablesPayload = getBestTablesPayload();
      if (!effectiveTablesPayload?.tables?.length) {
        appendMessage(
          "Generate the salary table first (and if comparing, turn on 'Show A & B when generating'), then ask Bee.",
          "bot"
        );
        return;
      }

      cacheTablesPayload(effectiveTablesPayload);

      const renderArea = document.getElementById("renderArea");
      const context = {
        generatedAt: effectiveTablesPayload.generatedAt || null,
        toggles: effectiveTablesPayload.toggles || {
          hideTa: renderArea?.classList.contains("hide-ta") || false,
          showNet: renderArea?.classList.contains("show-net") || false,
          showDelta: renderArea?.classList.contains("show-delta") || false,
          premiumType: getSelectedPremiumModes()
        },
        tables: effectiveTablesPayload.tables || [],
        roster: {
          pastedCsv: document.getElementById("rosterText")?.value?.trim() || "",
          embeddedCsv: document.getElementById("embeddedRoster")?.value?.trim() || ""
        },
        page: {
          url: location.href,
          premiumType: getSelectedPremiumModes()
        }
      };

      appendMessage("Thinking…", "bot");
      const lastBubble = log.querySelector(".bee-ai-msg:last-child .bee-ai-bubble");

      try {
        const answer = await callAskApi({ question: text, context });
        if (lastBubble) lastBubble.textContent = answer || "(empty response)";
      } catch (err) {
        if (lastBubble) {
          lastBubble.textContent =
            `Couldn’t reach Bee AI backend.\n` +
            `Endpoint: ${ASK_URL}\n` +
            `Error: ${err?.message || err}`;
        }
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendBtn?.click();
      }
    });

    saveBtn?.addEventListener("click", () => {
      const text = Array.from(log.querySelectorAll(".bee-ai-bubble"))
        .map((el) => el.textContent)
        .join("\n\n");
      downloadTextFile(text, "bee-ai-log.txt", "text/plain;charset=utf-8");
    });
  };

  // ---------- export ----------
  const exportSalaryTables = async () => {
    const payload = getBestTablesPayload();
    if (!payload) return;

    cacheTablesPayload(payload);

    // 1) JSON (machine-readable)
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `bta_salary_table_export_${Date.now()}.json`,
      "application/json;charset=utf-8"
    );

    // 2) Markdown summary (human-readable)
    const markdown = buildMarkdownSummary(payload);
    downloadTextFile(
      markdown,
      `bta_salary_table_export_${Date.now()}.md`,
      "text/markdown;charset=utf-8"
    );

    // 3) Clipboard (best-effort)
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      // ignore
    }
  };

  const wireExportButton = () => {
    const btn = document.getElementById("exportSalaryTableAI");
    if (!btn) return;
    btn.addEventListener("click", () => {
      exportSalaryTables().catch(() => {});
    });
  };

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    try {
      window.BtaAI = window.BtaAI || {};
      window.BtaAI.init = wireBeeUI;
      window.BtaAI.exportSalaryTables = exportSalaryTables;

      if (typeof window.BtaAI.getSalaryTablesPayload !== "function") {
        window.BtaAI.getSalaryTablesPayload = () =>
          window.BtaAI.__lastTablesPayload ||
          window.BtaAI.__beeLastTablesPayload ||
          window.__BEE_LAST_TABLES_PAYLOAD__ ||
          null;
      }

      wireBeeUI();
      wireExportButton();
    } catch {
      // fail silently
    }
  });
})();
