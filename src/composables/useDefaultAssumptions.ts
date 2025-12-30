import assumptions from "@/data/defaultAssumptions.json";
import type { DefaultAssumptionsV2 } from "@/types/assumptions";

type Instrument = {
  id: string;
  targetWeight?: number;
  simModel?: "risky" | "rate";
};

const data = assumptions as DefaultAssumptionsV2;

const resolveWeights = (instruments: Instrument[]): number[] => {
  const provided = instruments.map((instrument) =>
    typeof instrument.targetWeight === "number" ? instrument.targetWeight : 0
  );
  const sum = provided.reduce((acc, value) => acc + value, 0);
  if (sum > 0) {
    return provided.map((value) => value / sum);
  }
  const equal = instruments.length > 0 ? 1 / instruments.length : 0;
  return instruments.map(() => equal);
};

export const getSelectedWindow = (): string =>
  data.defaults?.selectedWindow || "10Y";

export const getInflation = (window: string): number =>
  data.defaults?.inflation?.[window] ?? 0.02;

export const getInstrumentAssumption = (
  instrumentId: string,
  window: string
): { mu: number; sigma: number } | undefined => {
  const instrument = data.instruments?.[instrumentId];
  if (!instrument) return undefined;
  const mu = instrument.mu?.[window];
  const sigma = instrument.sigma?.[window];
  if (typeof mu !== "number" || typeof sigma !== "number") {
    return undefined;
  }
  return { mu, sigma };
};

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
  instruments: Instrument[],
  window: string
): boolean => {
  const risky = instruments.filter((instrument) => instrument.simModel !== "rate");
  for (let i = 0; i < risky.length; i += 1) {
    for (let j = i + 1; j < risky.length; j += 1) {
      const map = data.correlations?.[window] ?? {};
      const direct = map[risky[i].id]?.[risky[j].id];
      const reverse = map[risky[j].id]?.[risky[i].id];
      if (typeof direct !== "number" && typeof reverse !== "number") {
        return true;
      }
    }
  }
  return false;
};

export const getBucketDefaults = (
  bucketInstruments: Instrument[],
  window: string
): { mu: number; sigma: number; inflation: number } => {
  if (bucketInstruments.length === 0) {
    return { mu: 0, sigma: 0, inflation: getInflation(window) };
  }

  const weights = resolveWeights(bucketInstruments);
  let mu = 0;
  let variance = 0;
  const riskyIndexes = bucketInstruments
    .map((instrument, index) =>
      instrument.simModel === "rate" ? null : index
    )
    .filter((index): index is number => index !== null);

  bucketInstruments.forEach((instrument, index) => {
    const assumption = getInstrumentAssumption(instrument.id, window);
    if (!assumption) return;
    const weight = weights[index];
    mu += weight * assumption.mu;
  });

  if (riskyIndexes.length === 1) {
    const index = riskyIndexes[0];
    const assumption = getInstrumentAssumption(bucketInstruments[index].id, window);
    if (assumption) {
      variance =
        weights[index] *
        weights[index] *
        assumption.sigma *
        assumption.sigma;
    }
  } else {
    riskyIndexes.forEach((i) => {
      riskyIndexes.forEach((j) => {
        const instrumentI = bucketInstruments[i];
        const instrumentJ = bucketInstruments[j];
        const assumptionI = getInstrumentAssumption(instrumentI.id, window);
        const assumptionJ = getInstrumentAssumption(instrumentJ.id, window);
        if (!assumptionI || !assumptionJ) return;
        const corr = getCorrelation(window, instrumentI.id, instrumentJ.id);
        variance +=
          weights[i] *
          weights[j] *
          assumptionI.sigma *
          assumptionJ.sigma *
          corr;
      });
    });
  }

  return { mu, sigma: Math.sqrt(Math.max(0, variance)), inflation: getInflation(window) };
};

export const useDefaultAssumptions = () => ({
  asOf: data.asOf,
  getSelectedWindow,
  getInflation,
  getInstrumentAssumption,
  hasMissingCorrelations,
  getBucketDefaults,
});
