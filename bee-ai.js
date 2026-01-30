(() => {
  const state = {
    isOpen: false
  };

  const setChatOpen = (open) => {
    const panel = document.getElementById("beeAiChat");
    if (!panel) return;
    state.isOpen = open;
    panel.style.display = open ? "flex" : "none";
  };

  const toggleChat = () => {
    setChatOpen(!state.isOpen);
  };

  const parseMoney = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.-]+/g, "");
    if (!cleaned) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  };

  const readRenderedTables = () => {
    const renderArea = document.getElementById("renderArea");
    if (!renderArea) return null;

    const hideTa = renderArea.classList.contains("hide-ta");
    const showNet = renderArea.classList.contains("show-net");
    const showDelta = renderArea.classList.contains("show-delta");
    const premiumType = document.getElementById("netPremiumType")?.value || "family";

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

        results.push({
          title,
          year,
          columns,
          rows
        });
      });
    });

    return {
      generatedAt: new Date().toISOString(),
      toggles: {
        hideTa,
        showNet,
        showDelta,
        premiumType
      },
      tables: results
    };
  };

  const buildMarkdownSummary = (payload) => {
    if (!payload) return "No salary tables are rendered.";
    const lines = [
      "# Salary Table Export (AI)",
      `Generated: ${payload.generatedAt}`,
      `Toggles: Hide TA=${payload.toggles.hideTa}, Net=${payload.toggles.showNet}, Delta=${payload.toggles.showDelta}, Premium=${payload.toggles.premiumType}`,
      ""
    ];

    payload.tables.forEach((table) => {
      lines.push(`## ${table.title} — Year ${table.year}`);
      lines.push(`Columns: ${table.columns.join(", ")}`);
      lines.push(`Rows: ${table.rows.length}`);
      const sample = table.rows.slice(0, 3).map((row) => {
        const firstCol = table.columns[0];
        const value = row.cells[firstCol]?.gross ?? "—";
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

  const exportSalaryTables = async () => {
    const payload = readRenderedTables();
    if (!payload) return;

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bta_salary_table_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    const markdown = buildMarkdownSummary(payload);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (e) {
      // fail silently
    }
  };

  const gatherContext = () => {
    const renderedTables = readRenderedTables();
    return {
      renderedTables,
      ui: {
        scenario: document.getElementById("sl_scenario")?.value || "ui",
        yearInput: document.getElementById("tableYear")?.value || "",
        exportYear: document.getElementById("exportYear")?.value || "",
        compareOnGenerate: !!document.getElementById("compareOnGenerate")?.checked,
        premiumType: document.getElementById("netPremiumType")?.value || "family",
        toggles: {
          hideTa: !!document.getElementById("toggleHideTA")?.checked,
          showDelta: !!document.getElementById("toggleCompareY0")?.checked,
          showNet: !!document.getElementById("toggleNetPay")?.checked,
          rosterHighlight: !!document.getElementById("toggleRosterHighlight")?.checked,
          rosterDetails: !!document.getElementById("toggleRosterDetails")?.checked
        }
      },
      app: {
        version: document.getElementById("buildVersionText")?.textContent || "",
        buildTime: document.getElementById("buildTimeText")?.textContent || ""
      }
    };
  };

  const wireBeeUI = () => {
    const button = document.getElementById("beeAiButton");
    const closeBtn = document.getElementById("beeAiClose");
    const clearBtn = document.getElementById("beeAiClear");
    const sendBtn = document.getElementById("beeAiSend");
    const saveBtn = document.getElementById("beeAiSave");
    const input = document.getElementById("beeAiInput");
    const log = document.getElementById("beeAiLog");

    if (!button || !closeBtn || !log || !input) return;

    const appendMessage = (text, role) => {
      const row = document.createElement("div");
      row.className = `bee-ai-msg ${role === "user" ? "bee-ai-user" : "bee-ai-bot"}`;
      const bubble = document.createElement("div");
      bubble.className = "bee-ai-bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
      return bubble;
    };

    button.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", () => setChatOpen(false));

    clearBtn?.addEventListener("click", () => {
      log.innerHTML = "";
    });

    const handleSend = async () => {
      const text = input.value.trim();
      if (!text) return;
      appendMessage(text, "user");
      input.value = "";

      const thinkingBubble = appendMessage("Thinking...", "bot");
      const endpoint = window.BEE_AI_ENDPOINT;
      const payload = {
        question: text,
        context: gatherContext()
      };

      if (!endpoint) {
        thinkingBubble.textContent = "Bee AI endpoint is not configured.";
        return;
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          thinkingBubble.textContent = `Bee AI request failed (${response.status}).`;
          return;
        }

        const textResponse = await response.text();
        let answer = "";
        try {
          const json = JSON.parse(textResponse);
          answer = json.answer || json.text || "";
        } catch (e) {
          answer = textResponse;
        }

        if (!payload.context.renderedTables) {
          const note = "No salary tables are rendered yet. Generate the tables first for best answers.";
          answer = answer ? `${answer}\n\n${note}` : note;
        }

        thinkingBubble.textContent = answer || "Bee AI did not return a response.";
      } catch (e) {
        thinkingBubble.textContent = "Bee AI request failed. Please try again.";
      }
    };

    sendBtn?.addEventListener("click", () => {
      handleSend().catch(() => {});
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
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bee-ai-log.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  };

  const wireExportButton = () => {
    const btn = document.getElementById("exportSalaryTableAI");
    if (!btn) return;
    btn.addEventListener("click", () => {
      exportSalaryTables().catch(() => {});
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      window.BtaAI = {
        init: wireBeeUI,
        exportSalaryTables
      };
      wireBeeUI();
      wireExportButton();
    } catch (e) {
      // fail silently
    }
  });
})();
