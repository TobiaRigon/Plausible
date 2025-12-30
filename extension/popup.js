const STORAGE_KEY = "pendingInstrument_v1";

const statusEl = document.getElementById("status");
const captureBtn = document.getElementById("capture");
const resetBtn = document.getElementById("reset");
const form = document.getElementById("instrument-form");

const fields = {
  label: document.getElementById("label"),
  isin: document.getElementById("isin"),
  code: document.getElementById("code"),
  assetClass: document.getElementById("assetClass"),
  simModel: document.getElementById("simModel"),
  ter: document.getElementById("ter"),
  mu3: document.getElementById("mu3"),
  mu10: document.getElementById("mu10"),
  sigma3: document.getElementById("sigma3"),
  sigma10: document.getElementById("sigma10"),
};

const setStatus = (message) => {
  statusEl.textContent = message;
};

const readStorage = (key) =>
  new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key]));
  });

const writeStorage = (key, value) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

const getPlausibleTab = async () => {
  const urls = [
    "http://localhost:5173/*",
    "http://localhost:4173/*",
    "http://127.0.0.1:5173/*",
    "http://127.0.0.1:4173/*",
    "https://plausible-mc.vercel.app/*",
  ];
  const tabs = await chrome.tabs.query({ url: urls });
  return tabs[0];
};

const getTabUrl = async (tabId) => {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.location.href,
    });
    return typeof result === "string" ? result : "";
  } catch {
    return "";
  }
};

const isPlausibleUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "plausible-mc.vercel.app") return true;
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isAllowedPort = parsed.port === "5173" || parsed.port === "4173";
    return isLocal && isAllowedPort;
  } catch {
    return false;
  }
};

const fillForm = (payload) => {
  const toFieldValue = (value) =>
    value === null || value === undefined ? "" : value;
  fields.label.value = payload.label || "";
  fields.isin.value = payload.isin || "";
  fields.code.value = payload.code || "";
  fields.assetClass.value = payload.assetClass || "";
  fields.simModel.value = payload.simModel || "risky";
  fields.ter.value = toFieldValue(payload.ter ?? 0);
  fields.mu3.value = toFieldValue(payload.mu3);
  fields.mu10.value = toFieldValue(payload.mu10);
  fields.sigma3.value = toFieldValue(payload.sigma3);
  fields.sigma10.value = toFieldValue(payload.sigma10);
};

const getFormPayload = () => {
  const roundTo3 = (value) => Math.round(value * 1000) / 1000;
  const parseOptionalNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? roundTo3(numeric) : null;
  };

  return {
    label: fields.label.value.trim(),
    isin: fields.isin.value.trim(),
    code: fields.code.value.trim(),
    assetClass: fields.assetClass.value.trim(),
    simModel: fields.simModel.value,
    ter: roundTo3(Number(fields.ter.value || 0)),
    mu3: parseOptionalNumber(fields.mu3.value),
    mu10: parseOptionalNumber(fields.mu10.value),
    sigma3: parseOptionalNumber(fields.sigma3.value),
    sigma10: parseOptionalNumber(fields.sigma10.value),
  };
};

const extractJustetfData = () => {
  const label =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    document.title?.trim() ||
    "";

  const pickText = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        const text = el.textContent.trim();
        if (text) return text;
      }
    }
    return "";
  };

  const normalizeLabel = (value) =>
    value.toLowerCase().replace(/\s+/g, " ").replace(/[()]/g, "").trim();

  const pickByLabel = (labelText, root = document) => {
    const labelCandidates = Array.from(
      root.querySelectorAll("dt, th, td, span, div")
    ).filter(
      (el) => normalizeLabel(el.textContent || "") === normalizeLabel(labelText)
    );

    for (const el of labelCandidates) {
      const sibling = el.nextElementSibling;
      if (sibling?.textContent?.trim()) return sibling.textContent.trim();
      const parent = el.parentElement;
      if (parent) {
        const value = parent.querySelector("dd, td");
        if (value?.textContent?.trim()) return value.textContent.trim();
      }
    }
    return "";
  };

  const isinText =
    pickText(["[data-qa='isin']", ".isin", ".product__isin"]) ||
    pickByLabel("isin") ||
    "";
  const codeText =
    pickText(["[data-qa='ticker']", ".ticker", ".product__ticker"]) ||
    pickByLabel("ticker") ||
    pickByLabel("ticker symbol") ||
    "";
  const terText =
    pickText(["[data-qa='ter']", ".ter", ".product__ter"]) ||
    pickByLabel("ter") ||
    pickByLabel("total expense ratio") ||
    "";

  const parseIsin = (value) => {
    const match = value.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
    return match ? match[1] : "";
  };

  const parsePercent = (value) => {
    if (value === null || value === undefined) return null;
    const stringValue = String(value);
    const match = stringValue.match(/(-?[\d,.]+)\s*%/);
    const raw = match ? match[1] : stringValue;
    const normalized = raw.replace(",", ".").trim();
    if (!normalized) return null;
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) return null;
    const fraction = numeric / 100;
    return Math.round(fraction * 1000) / 1000;
  };

  const parseTer = (value) => {
    const parsed = parsePercent(value);
    return typeof parsed === "number" ? parsed : null;
  };

  const extractYearPercent = (text, year) => {
    const patterns = [
      new RegExp(`${year}\\s*(?:y|yr|years)\\s*[:\\-]?\\s*([-\\d.,]+)\\s*%`, "i"),
      new RegExp(`([-\\d.,]+)\\s*%\\s*\\(?\\s*${year}\\s*(?:y|yr|years)\\s*\\)?`, "i"),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parsePercent(match[1]);
    }
    return null;
  };

  const pickMetricValue = (labelCandidates, yearToken) => {
    for (const labelText of labelCandidates) {
      const value =
        pickByLabel(labelText) ||
        pickByLabel(`${labelText} ${yearToken}`) ||
        pickByLabel(`${yearToken} ${labelText}`);
      if (value) return parsePercent(value);
    }
    return null;
  };

  const parseTableMetrics = () => {
    const metrics = { mu3: null, mu10: null, sigma3: null, sigma10: null };
    const tables = Array.from(document.querySelectorAll("table"));
    const isYearHeader = (text) => /(^|\s)(3y|10y|3 years|10 years)(\s|$)/.test(text);

    tables.forEach((table) => {
      const headerCells = Array.from(table.querySelectorAll("thead th"));
      const headers =
        headerCells.length > 0
          ? headerCells.map((cell) => normalizeLabel(cell.textContent || ""))
          : [];
      const fallbackHeaderRow = headers.length === 0 ? table.querySelector("tr") : null;
      const fallbackHeaders = fallbackHeaderRow
        ? Array.from(fallbackHeaderRow.querySelectorAll("th, td")).map((cell) =>
            normalizeLabel(cell.textContent || "")
          )
        : [];
      const headerSet = headers.length > 0 ? headers : fallbackHeaders;
      if (!headerSet.some((text) => isYearHeader(text))) return;

      const rows = Array.from(table.querySelectorAll("tbody tr"));
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        if (cells.length < 2) return;
        const label = normalizeLabel(cells[0].textContent || "");
        const isVolatility = label.includes("volatility");
        const isReturn =
          label.includes("return") ||
          label.includes("performance") ||
          label.includes("annualised") ||
          label.includes("cagr");
        if (!isVolatility && !isReturn) return;

        const getValueAt = (token) => {
          const index = headerSet.findIndex((text) => text.includes(token));
          if (index >= 0 && cells[index]) {
            return parsePercent(cells[index].textContent || "");
          }
          return "";
        };

          const value3 = getValueAt("3y") || getValueAt("3 years");
          const value10 = getValueAt("10y") || getValueAt("10 years");

        if (isReturn) {
          if (typeof value3 === "number") metrics.mu3 ??= value3;
          if (typeof value10 === "number") metrics.mu10 ??= value10;
        }
        if (isVolatility) {
          if (typeof value3 === "number") metrics.sigma3 ??= value3;
          if (typeof value10 === "number") metrics.sigma10 ??= value10;
        }
      });
    });

    return metrics;
  };

  const parseBlockMetrics = () => {
    const metrics = { mu3: null, mu10: null, sigma3: null, sigma10: null };
    const blocks = Array.from(document.querySelectorAll("section, table, dl, div, article"));

    blocks.forEach((block) => {
      const text = normalizeLabel(block.textContent || "");
      if (!text) return;
      const hasVolatility = text.includes("volatility");
      const hasReturn =
        text.includes("return") ||
        text.includes("performance") ||
        text.includes("cagr") ||
        text.includes("annualised") ||
        text.includes("annualized");
      if (!hasVolatility && !hasReturn) return;

      if (hasReturn) {
        metrics.mu3 ??= extractYearPercent(text, "3");
        metrics.mu10 ??= extractYearPercent(text, "10");
      }
      if (hasVolatility) {
        metrics.sigma3 ??= extractYearPercent(text, "3");
        metrics.sigma10 ??= extractYearPercent(text, "10");
      }
    });

    return metrics;
  };

  const findContainerByHeading = (headingText) => {
    const normalized = normalizeLabel(headingText);
    const heading = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).find((el) => normalizeLabel(el.textContent || "") === normalized);
    return heading?.closest("section, article, div") || heading?.parentElement || null;
  };

  const parseRiskOverviewMetrics = () => {
    const metrics = {
      sigma3: null,
      sigma5: null,
      sigma10: null,
      sigmaSince: null,
      rpr3: null,
      rpr5: null,
      rpr10: null,
      rprSince: null,
    };

    const overviewRoot =
      findContainerByHeading("Panoramica del rischio") ||
      findContainerByHeading("Risk overview") ||
      findContainerByHeading("Rischio") ||
      findContainerByHeading("Risk");

    if (!overviewRoot) return metrics;

    const pickInOverview = (labels) => {
      for (const label of labels) {
        const value = pickByLabel(label, overviewRoot);
        if (value) return parsePercent(value);
      }
      return null;
    };

    metrics.sigma3 = pickInOverview([
      "Volatilità a 3 anni",
      "Volatilità 3 anni",
      "Volatilità 3y",
      "Volatility 3 years",
    ]);
    metrics.sigma5 = pickInOverview([
      "Volatilità a 5 anni",
      "Volatilità 5 anni",
      "Volatilità 5y",
      "Volatility 5 years",
    ]);
    metrics.sigma10 = pickInOverview([
      "Volatilità a 10 anni",
      "Volatilità 10 anni",
      "Volatilità 10y",
      "Volatility 10 years",
    ]);
    metrics.sigmaSince = pickInOverview([
      "Volatilità dal lancio",
      "Volatility since launch",
      "Volatility since inception",
    ]);

    metrics.rpr3 = pickInOverview([
      "Rendimento per rischio a 3 anni",
      "Rendimento per rischio 3 anni",
      "Rendimento per rischio 3y",
      "Risk return 3 years",
      "Risk-adjusted return 3 years",
    ]);
    metrics.rpr5 = pickInOverview([
      "Rendimento per rischio a 5 anni",
      "Rendimento per rischio 5 anni",
      "Rendimento per rischio 5y",
      "Risk return 5 years",
      "Risk-adjusted return 5 years",
    ]);
    metrics.rpr10 = pickInOverview([
      "Rendimento per rischio a 10 anni",
      "Rendimento per rischio 10 anni",
      "Rendimento per rischio 10y",
      "Risk return 10 years",
      "Risk-adjusted return 10 years",
    ]);
    metrics.rprSince = pickInOverview([
      "Rendimento per rischio dal lancio",
      "Risk return since launch",
      "Risk-adjusted return since inception",
    ]);

    const tables = Array.from(overviewRoot.querySelectorAll("table"));
    const isYearHeader = (text) =>
      /(^|\s)(3y|5y|10y|3 years|5 years|10 years|since launch|since inception|dal lancio)(\s|$)/.test(
        text
      );

    tables.forEach((table) => {
      const headerCells = Array.from(table.querySelectorAll("thead th"));
      const headers =
        headerCells.length > 0
          ? headerCells.map((cell) => normalizeLabel(cell.textContent || ""))
          : [];
      const fallbackHeaderRow = headers.length === 0 ? table.querySelector("tr") : null;
      const fallbackHeaders = fallbackHeaderRow
        ? Array.from(fallbackHeaderRow.querySelectorAll("th, td")).map((cell) =>
            normalizeLabel(cell.textContent || "")
          )
        : [];
      const headerSet = headers.length > 0 ? headers : fallbackHeaders;
      if (!headerSet.some((text) => isYearHeader(text))) return;

      const indexFor = (tokens) =>
        headerSet.findIndex((text) => tokens.some((token) => text.includes(token)));

      const idx3 = indexFor(["3y", "3 years", "3 anni"]);
      const idx5 = indexFor(["5y", "5 years", "5 anni"]);
      const idx10 = indexFor(["10y", "10 years", "10 anni"]);
      const idxSince = indexFor(["since launch", "since inception", "dal lancio"]);

      const rows = Array.from(table.querySelectorAll("tbody tr"));
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        if (cells.length < 2) return;
        const label = normalizeLabel(cells[0].textContent || "");
        const isVolatility = label.includes("volatility") || label.includes("volatilità");
        const isRiskReturn =
          label.includes("rendimento per rischio") ||
          label.includes("risk return") ||
          label.includes("risk-adjusted");
        if (!isVolatility && !isRiskReturn) return;

        const readCell = (index) =>
          index >= 0 && cells[index] ? parsePercent(cells[index].textContent || "") : null;

        if (isVolatility) {
          if (idx3 >= 0) metrics.sigma3 ??= readCell(idx3);
          if (idx5 >= 0) metrics.sigma5 ??= readCell(idx5);
          if (idx10 >= 0) metrics.sigma10 ??= readCell(idx10);
          if (idxSince >= 0) metrics.sigmaSince ??= readCell(idxSince);
        }
        if (isRiskReturn) {
          if (idx3 >= 0) metrics.rpr3 ??= readCell(idx3);
          if (idx5 >= 0) metrics.rpr5 ??= readCell(idx5);
          if (idx10 >= 0) metrics.rpr10 ??= readCell(idx10);
          if (idxSince >= 0) metrics.rprSince ??= readCell(idxSince);
        }
      });
    });

    return metrics;
  };

  const tableMetrics = parseTableMetrics();
  const blockMetrics = parseBlockMetrics();
  const riskOverviewMetrics = parseRiskOverviewMetrics();

  const roundTo3 = (value) => Math.round(value * 1000) / 1000;
  const riskSigma3 =
    typeof riskOverviewMetrics.sigma3 === "number"
      ? roundTo3(riskOverviewMetrics.sigma3)
      : null;
  const riskSigma10Raw =
    riskOverviewMetrics.sigma10 ??
    riskOverviewMetrics.sigma5 ??
    riskOverviewMetrics.sigmaSince ??
    null;
  const riskSigma10 =
    typeof riskSigma10Raw === "number" ? roundTo3(riskSigma10Raw) : null;
  const riskMu3 =
    typeof riskOverviewMetrics.sigma3 === "number" &&
    typeof riskOverviewMetrics.rpr3 === "number"
      ? roundTo3(riskOverviewMetrics.sigma3 * riskOverviewMetrics.rpr3)
      : null;
  const riskMu10 =
    typeof riskSigma10Raw === "number" &&
    typeof (riskOverviewMetrics.rpr10 ??
      riskOverviewMetrics.rpr5 ??
      riskOverviewMetrics.rprSince ??
      null) === "number"
      ? roundTo3(
          riskSigma10Raw *
            (riskOverviewMetrics.rpr10 ??
              riskOverviewMetrics.rpr5 ??
              riskOverviewMetrics.rprSince)
        )
      : null;

  const mu3 =
    riskMu3 ??
    tableMetrics.mu3 ??
    blockMetrics.mu3 ??
    pickMetricValue(["return", "performance", "cagr", "annualised"], "3y");
  const mu10 =
    riskMu10 ??
    tableMetrics.mu10 ??
    blockMetrics.mu10 ??
    pickMetricValue(["return", "performance", "cagr", "annualised"], "10y");
  const sigma3 =
    riskSigma3 ??
    tableMetrics.sigma3 ??
    blockMetrics.sigma3 ??
    pickMetricValue(["volatility"], "3y");
  const sigma10 =
    riskSigma10 ??
    tableMetrics.sigma10 ??
    blockMetrics.sigma10 ??
    pickMetricValue(["volatility"], "10y");

  return {
    label,
    isin: parseIsin(isinText),
    code: codeText,
    ter: parseTer(terText),
    mu3,
    mu10,
    sigma3,
    sigma10,
  };
};

const addInstrumentToPlausible = (payload) => {
  const STORAGE_KEY = "sim_user_instruments_v1";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  let items = [];
  try {
    items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }

  const normalizeNumber = (value, { allowNull = false } = {}) => {
    if (allowNull && (value === null || value === undefined || value === "")) {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : allowNull ? null : 0;
  };

  const instrument = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    label: String(payload.label || "").trim(),
    isin: String(payload.isin || "").trim() || undefined,
    code: String(payload.code || "").trim() || undefined,
    assetClass: String(payload.assetClass || "").trim() || undefined,
    simModel: payload.simModel === "rate" ? "rate" : "risky",
    ter: normalizeNumber(payload.ter),
    mu: {
      "3Y": normalizeNumber(payload.mu3, { allowNull: true }),
      "10Y": normalizeNumber(payload.mu10, { allowNull: true }),
    },
    sigma: {
      "3Y": normalizeNumber(payload.sigma3, { allowNull: true }),
      "10Y": normalizeNumber(payload.sigma10, { allowNull: true }),
    },
  };

  if (!instrument.label) {
    return { ok: false, message: "Missing label." };
  }

  const duplicateIndex = items.findIndex((item) => {
    if (instrument.isin && item.isin === instrument.isin) return true;
    if (instrument.code && item.code === instrument.code) return true;
    return item.label === instrument.label;
  });

  if (duplicateIndex >= 0 && !payload.override) {
    return { ok: false, message: "Instrument already exists.", duplicate: true };
  }

  if (duplicateIndex >= 0) {
    instrument.id = items[duplicateIndex].id;
    items[duplicateIndex] = instrument;
  } else {
    items.push(instrument);
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  let stored = [];
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    stored = [];
  }
  const verified =
    Array.isArray(stored) && stored.some((item) => item?.id === instrument.id);
  if (!verified) {
    return { ok: false, message: "Saved but verification failed. Reload Plausible." };
  }
  return {
    ok: true,
    message: `Instrument added. Total: ${items.length}. Reload Plausible to see it.`,
    total: items.length,
  };
};

const init = async () => {
  const saved = await readStorage(STORAGE_KEY);
  if (saved) {
    fillForm(saved);
    setStatus("Loaded last captured instrument.");
  }
};

captureBtn.addEventListener("click", async () => {
  setStatus("Capturing from JustETF...");
  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("No active tab found.");
    return;
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJustetfData,
    });
    const payload = {
      ...getFormPayload(),
      label: result.label || fields.label.value,
      isin: result.isin || fields.isin.value,
      code: result.code || fields.code.value,
      ter: typeof result.ter === "number" ? result.ter : fields.ter.value,
      mu3: typeof result.mu3 !== "undefined" ? result.mu3 : fields.mu3.value,
      mu10: typeof result.mu10 !== "undefined" ? result.mu10 : fields.mu10.value,
      sigma3:
        typeof result.sigma3 !== "undefined" ? result.sigma3 : fields.sigma3.value,
      sigma10:
        typeof result.sigma10 !== "undefined" ? result.sigma10 : fields.sigma10.value,
    };
    fillForm(payload);
    await writeStorage(STORAGE_KEY, payload);
    setStatus("Captured from JustETF.");
  } catch (error) {
    setStatus("Capture failed. Ensure you are on a JustETF page.");
  }
});

resetBtn.addEventListener("click", async () => {
  const payload = {
    label: "",
    isin: "",
    code: "",
    assetClass: "",
    simModel: "risky",
    ter: 0,
    mu3: null,
    mu10: null,
    sigma3: null,
    sigma10: null,
  };
  fillForm(payload);
  await writeStorage(STORAGE_KEY, payload);
  setStatus("Form reset.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const tab = await getPlausibleTab();
  if (!tab?.id) {
    setStatus("No Plausible tab found. Open it and try again.");
    return;
  }
  const tabUrl = (await getTabUrl(tab.id)) || tab.url || tab.pendingUrl || "";
  const payload = getFormPayload();
  await writeStorage(STORAGE_KEY, payload);
  setStatus("Adding instrument to Plausible...");

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: addInstrumentToPlausible,
      args: [payload],
    });
    if (!result) {
      setStatus("Add failed. No response from the Plausible tab.");
      return;
    }
    if (result?.ok) {
      setStatus(result?.message || "Instrument added to Plausible.");
      return;
    }
    if (result?.duplicate) {
      const confirmOverride = window.confirm(
        "Instrument already exists in Plausible. Replace it?"
      );
      if (!confirmOverride) {
        setStatus("Add cancelled.");
        return;
      }
      const [{ result: overrideResult }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: addInstrumentToPlausible,
        args: [{ ...payload, override: true }],
      });
      if (overrideResult?.ok) {
        setStatus("Instrument replaced in Plausible.");
      } else {
        setStatus(overrideResult?.message || "Replace failed.");
      }
      return;
    }
    setStatus(result?.message || "Add failed.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    setStatus(`Add failed. ${message}`);
  }
});

init();
