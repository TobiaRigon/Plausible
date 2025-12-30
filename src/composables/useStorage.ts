import defaultPortfolio from "../data/portfolio.default.json";

type Portfolio = {
  version: number;
  buckets: unknown[];
};

const STORAGE_KEY = "portfolio_sim_v1";
const CURRENT_VERSION = 1;

const clonePortfolio = (portfolio: Portfolio): Portfolio => {
  if (typeof structuredClone === "function") {
    return structuredClone(portfolio);
  }
  return JSON.parse(JSON.stringify(portfolio)) as Portfolio;
};

const normalizePortfolio = (value: unknown): Portfolio => {
  if (!value || typeof value !== "object") {
    return clonePortfolio(defaultPortfolio as Portfolio);
  }

  const candidate = value as Partial<Portfolio>;
  if (candidate.version !== CURRENT_VERSION || !Array.isArray(candidate.buckets)) {
    return clonePortfolio(defaultPortfolio as Portfolio);
  }

  return {
    version: CURRENT_VERSION,
    buckets: candidate.buckets,
  };
};

export const loadPortfolio = (): Portfolio => {
  if (typeof window === "undefined" || !window.localStorage) {
    return clonePortfolio(defaultPortfolio as Portfolio);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return clonePortfolio(defaultPortfolio as Portfolio);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizePortfolio(parsed);
  } catch {
    return clonePortfolio(defaultPortfolio as Portfolio);
  }
};

export const savePortfolio = (portfolio: Portfolio): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  const payload: Portfolio = {
    version: CURRENT_VERSION,
    buckets: Array.isArray(portfolio.buckets) ? portfolio.buckets : [],
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};
