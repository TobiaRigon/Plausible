import type { AppConfig, PortfolioConfig } from "@/types/assumptions";
import { useAppConfig } from "@/composables/useAppConfig";
import { useInstrumentCatalog } from "@/composables/useInstrumentCatalog";

const data = useAppConfig() as AppConfig;
const { catalog } = useInstrumentCatalog();

export const getConfig = (): AppConfig => data;

export const getSelectedWindow = (): string =>
  data.defaults?.selectedWindow || data.windows?.[0] || "10Y";

export const getInflation = (window: string): number =>
  data.defaults?.inflationByWindow?.[window] ?? 0.02;

export const getInstrumentConfig = (instrumentId: string) => catalog[instrumentId];

export const getPortfolioConfig = (portfolioId: string): PortfolioConfig | undefined =>
  data.portfolios?.[portfolioId];

export const listPortfolios = (): PortfolioConfig[] =>
  Object.values(data.portfolios ?? {});

const getCorrelation = (window: string, a: string, b: string): number => {
  if (a === b) return 1;
  const map = data.correlations?.[window] ?? {};
  const direct = map[a]?.[b];
  if (typeof direct === "number") return direct;
  const reverse = map[b]?.[a];
  if (typeof reverse === "number") return reverse;
  return 0;
};

export const hasMissingCorrelations = (
  instrumentIds: string[],
  window: string
): boolean => {
  for (let i = 0; i < instrumentIds.length; i += 1) {
    for (let j = i + 1; j < instrumentIds.length; j += 1) {
      const map = data.correlations?.[window] ?? {};
      const direct = map[instrumentIds[i]]?.[instrumentIds[j]];
      const reverse = map[instrumentIds[j]]?.[instrumentIds[i]];
      if (typeof direct !== "number" && typeof reverse !== "number") {
        return true;
      }
    }
  }
  return false;
};

export const getPortfolioDefaults = (
  portfolio: PortfolioConfig,
  window: string
): { mu: number; sigma: number; inflation: number } => {
  if (!portfolio.instruments.length) {
    return { mu: 0, sigma: 0, inflation: getInflation(window) };
  }

  const weights = portfolio.instruments.map((instrument) => instrument.targetWeight);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  const normalized = sum > 0 ? weights.map((value) => value / sum) : weights;

  let mu = 0;
  let variance = 0;
  const riskyIds: string[] = [];

  portfolio.instruments.forEach((entry, index) => {
    const instrument = getInstrumentConfig(entry.instrumentId);
    if (!instrument) return;
    const weight = normalized[index];
    const muValue = instrument.mu?.[window];
    const sigmaValue = instrument.sigma?.[window];
    if (typeof muValue !== "number" || typeof sigmaValue !== "number") return;
    mu += weight * muValue;
    if (instrument.simModel !== "rate") {
      riskyIds.push(entry.instrumentId);
    }
  });

  const riskyIndexes = portfolio.instruments
    .map((entry, index) => {
      const instrument = getInstrumentConfig(entry.instrumentId);
      return instrument?.simModel === "rate" ? null : index;
    })
    .filter((index): index is number => index !== null);

  if (riskyIndexes.length === 1) {
    const index = riskyIndexes[0];
    const instrument = getInstrumentConfig(portfolio.instruments[index].instrumentId);
    if (instrument) {
      const sigmaValue = instrument.sigma?.[window];
      if (typeof sigmaValue === "number") {
        variance = normalized[index] * normalized[index] * sigmaValue * sigmaValue;
      }
    }
  } else if (riskyIndexes.length > 1) {
    riskyIndexes.forEach((i) => {
      riskyIndexes.forEach((j) => {
        const instrumentI = getInstrumentConfig(
          portfolio.instruments[i].instrumentId
        );
        const instrumentJ = getInstrumentConfig(
          portfolio.instruments[j].instrumentId
        );
        if (!instrumentI || !instrumentJ) return;
        const sigmaI = instrumentI.sigma?.[window];
        const sigmaJ = instrumentJ.sigma?.[window];
        if (typeof sigmaI !== "number" || typeof sigmaJ !== "number") return;
        const corr = getCorrelation(
          window,
          portfolio.instruments[i].instrumentId,
          portfolio.instruments[j].instrumentId
        );
        variance += normalized[i] * normalized[j] * sigmaI * sigmaJ * corr;
      });
    });
  }

  return { mu, sigma: Math.sqrt(Math.max(0, variance)), inflation: getInflation(window) };
};

export const useDefaultAssumptions = () => ({
  config: data,
  getConfig,
  getSelectedWindow,
  getInflation,
  getInstrumentConfig,
  getPortfolioConfig,
  listPortfolios,
  hasMissingCorrelations,
  getPortfolioDefaults,
});
