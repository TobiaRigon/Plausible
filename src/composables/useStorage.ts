const ALLOCATION_KEY = "portfolio_allocations_v1";
const PORTFOLIO_OVERRIDES_KEY = "portfolio_overrides_v1";
const SIM_PARAMS_KEY = "simulation_params_v2";

type AllocationOverrides = Record<string, Record<string, number>>;

export const loadAllocationOverrides = (): AllocationOverrides => {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  const raw = window.localStorage.getItem(ALLOCATION_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveAllocationOverrides = (overrides: AllocationOverrides): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(ALLOCATION_KEY, JSON.stringify(overrides));
};

export const loadPortfolioOverrides = (): Record<
  string,
  Array<{ instrumentId: string; targetWeight: number }>
> => {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  const raw = window.localStorage.getItem(PORTFOLIO_OVERRIDES_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const savePortfolioOverrides = (
  overrides: Record<string, Array<{ instrumentId: string; targetWeight: number }>>
): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(PORTFOLIO_OVERRIDES_KEY, JSON.stringify(overrides));
};

export const loadSimulationParams = (): Record<string, unknown> => {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  const raw = window.localStorage.getItem(SIM_PARAMS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveSimulationParams = (
  params: Record<string, unknown>
): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(SIM_PARAMS_KEY, JSON.stringify(params));
};
