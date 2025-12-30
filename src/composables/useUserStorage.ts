import type { UserInstrument, UserPortfolio, UserPortfolioItem } from "@/types/user";

const PORTFOLIOS_KEY = "sim_user_portfolios_v1";
const INSTRUMENTS_KEY = "sim_user_instruments_v1";
const PARAMS_KEY = "sim_last_params_v1";
const PREFS_KEY = "sim_user_preferences_v1";

const readJson = (key: string): unknown => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const uuid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const normalizeWeights = (items: UserPortfolioItem[]): UserPortfolioItem[] => {
  const sum = items.reduce((acc, item) => acc + (item.targetWeight || 0), 0);
  if (sum <= 0) return items;
  return items.map((item) => ({
    ...item,
    targetWeight: item.targetWeight / sum,
  }));
};

const listPortfolios = (): UserPortfolio[] => {
  const raw = readJson(PORTFOLIOS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw as UserPortfolio[];
};

const savePortfolios = (items: UserPortfolio[]) => writeJson(PORTFOLIOS_KEY, items);

const createPortfolio = (payload: Omit<UserPortfolio, "id" | "createdAt" | "updatedAt">) => {
  const now = new Date().toISOString();
  const portfolio: UserPortfolio = {
    ...payload,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  };
  const items = [...listPortfolios(), portfolio];
  savePortfolios(items);
  return portfolio;
};

const updatePortfolio = (portfolioId: string, updates: Partial<UserPortfolio>) => {
  const items = listPortfolios().map((item) =>
    item.id === portfolioId
      ? { ...item, ...updates, updatedAt: new Date().toISOString() }
      : item
  );
  savePortfolios(items);
};

const deletePortfolio = (portfolioId: string) => {
  const items = listPortfolios().filter((item) => item.id !== portfolioId);
  savePortfolios(items);
};

const duplicatePortfolio = (portfolioId: string) => {
  const original = listPortfolios().find((item) => item.id === portfolioId);
  if (!original) return;
  const now = new Date().toISOString();
  const copy: UserPortfolio = {
    ...original,
    id: uuid(),
    name: `${original.name} (copia)`,
    createdAt: now,
    updatedAt: now,
  };
  const items = [...listPortfolios(), copy];
  savePortfolios(items);
};

const listUserInstruments = (): UserInstrument[] => {
  const raw = readJson(INSTRUMENTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw as UserInstrument[];
};

const saveUserInstruments = (items: UserInstrument[]) => writeJson(INSTRUMENTS_KEY, items);

const createUserInstrument = (payload: Omit<UserInstrument, "id">) => {
  const instrument: UserInstrument = { ...payload, id: uuid() };
  const items = [...listUserInstruments(), instrument];
  saveUserInstruments(items);
  return instrument;
};

const updateUserInstrument = (instrumentId: string, updates: Partial<UserInstrument>) => {
  const items = listUserInstruments().map((item) =>
    item.id === instrumentId ? { ...item, ...updates } : item
  );
  saveUserInstruments(items);
};

const deleteUserInstrument = (instrumentId: string) => {
  const items = listUserInstruments().filter((item) => item.id !== instrumentId);
  saveUserInstruments(items);
};

const loadLastParams = (): Record<string, unknown> => {
  const raw = readJson(PARAMS_KEY);
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
};

const saveLastParams = (params: Record<string, unknown>) => writeJson(PARAMS_KEY, params);

const loadPreferences = (): Record<string, unknown> => {
  const raw = readJson(PREFS_KEY);
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
};

const savePreferences = (prefs: Record<string, unknown>) => writeJson(PREFS_KEY, prefs);

export const useUserStorage = () => ({
  normalizeWeights,
  listPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  duplicatePortfolio,
  listUserInstruments,
  createUserInstrument,
  updateUserInstrument,
  deleteUserInstrument,
  loadLastParams,
  saveLastParams,
  loadPreferences,
  savePreferences,
});
