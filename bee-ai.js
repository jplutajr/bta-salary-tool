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
    };

    button.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", () => setChatOpen(false));

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
    body: JSON.stringify({ question, context }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Ask API ${res.status}: ${t || res.statusText}`);
  }

  // Accept either plain text or JSON with common keys
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

  // Optional: include salary table context so AI can answer with real numbers
  const tablesPayload = readRenderedTables();

if (!tablesPayload || !tablesPayload.tables?.length) {
  appendMessage(
    "Generate the salary table first, then ask Bee.",
    "bot"
  );
  return;
}

const context = {
  generatedAt: tablesPayload.generatedAt,
  toggles: tablesPayload.toggles,
  tables: tablesPayload.tables, // <-- THIS is the critical fix
  page: {
    url: location.href,
    premiumType: document.getElementById("netPremiumType")?.value || "family",
  },
};


  // Simple “typing…” line
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
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bee-ai-log.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
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
