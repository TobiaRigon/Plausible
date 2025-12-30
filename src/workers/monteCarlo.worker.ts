type SimulationParams = {
  initialCapital: number;
  monthlyContribution: number;
  annualReturn: number;
  annualVolatility: number;
  annualFee: number;
};

type MonteCarloParams = SimulationParams & {
  months: number;
  simulations?: number;
  annualInflation?: number;
  threshold?: number;
  instruments?: Array<{
    id: string;
    mu: number;
    sigma: number;
    targetWeight?: number;
    simModel?: "risky" | "rate";
  }>;
  rebalanceAnnual?: boolean;
};

type PercentileSeriesPoint = {
  p10: number;
  p50: number;
  p90: number;
};

type MonteCarloSummary = {
  nominal: PercentileSeriesPoint;
  real: PercentileSeriesPoint;
  probabilityAboveThreshold: number;
};

type MonteCarloResult = {
  finalDistribution: number[];
  seriesPercentiles: PercentileSeriesPoint[];
  summary: MonteCarloSummary;
};

type RequestMessage = {
  type: "run";
  id: number;
  params: MonteCarloParams;
};

type ProgressMessage = {
  type: "progress";
  id: number;
  completed: number;
  total: number;
};

type ResultMessage = {
  type: "result";
  id: number;
  result: MonteCarloResult;
};

type ErrorMessage = {
  type: "error";
  id: number;
  message: string;
};

const PROGRESS_EVERY = 250;

const gaussian = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const simulateSinglePath = (
  params: SimulationParams,
  months: number
): { series: number[]; finalValue: number } => {
  const monthlyReturn = params.annualReturn / 12;
  const monthlyVolatility = params.annualVolatility / Math.sqrt(12);
  const monthlyFee = params.annualFee / 12;

  const series: number[] = [];
  let value = params.initialCapital;

  for (let i = 0; i < months; i += 1) {
    const shock = gaussian();
    const growth = Math.exp(
      monthlyReturn - 0.5 * monthlyVolatility * monthlyVolatility +
        monthlyVolatility * shock
    );
    value = (value + params.monthlyContribution) * growth;
    value *= 1 - monthlyFee;
    series.push(value);
  }

  return { series, finalValue: value };
};

const normalizeWeights = (weights: number[]): number[] => {
  const sum = weights.reduce((acc, value) => acc + value, 0);
  if (sum > 0) {
    return weights.map((value) => value / sum);
  }
  const equal = weights.length > 0 ? 1 / weights.length : 0;
  return weights.map(() => equal);
};

const simulateBucketPath = (
  params: MonteCarloParams
): { series: number[]; finalValue: number } => {
  const instruments = params.instruments ?? [];
  const months = params.months;
  const dt = 1 / 12;
  const monthlyFee = params.annualFee / 12;
  const weights = normalizeWeights(
    instruments.map((instrument) =>
      typeof instrument.targetWeight === "number" ? instrument.targetWeight : 0
    )
  );

  const values = instruments.map((_, index) => params.initialCapital * weights[index]);
  const series: number[] = [];

  for (let monthIndex = 0; monthIndex < months; monthIndex += 1) {
    instruments.forEach((instrument, index) => {
      const contribution = params.monthlyContribution * weights[index];
      const base = values[index] + contribution;
      if (instrument.simModel === "rate") {
        values[index] = base * (1 + instrument.mu * dt);
      } else {
        const shock = gaussian();
        const drift = (instrument.mu - 0.5 * instrument.sigma * instrument.sigma) * dt;
        const diffusion = instrument.sigma * Math.sqrt(dt) * shock;
        values[index] = base * Math.exp(drift + diffusion);
      }
      values[index] *= 1 - monthlyFee;
    });

    if (params.rebalanceAnnual && (monthIndex + 1) % 12 === 0) {
      const total = values.reduce((acc, value) => acc + value, 0);
      values.forEach((_, index) => {
        values[index] = total * weights[index];
      });
    }

    series.push(values.reduce((acc, value) => acc + value, 0));
  }

  return { series, finalValue: series[series.length - 1] ?? 0 };
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const clamped = Math.min(Math.max(p, 0), 100);
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (clamped / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const runMonteCarlo = (params: MonteCarloParams): MonteCarloResult => {
  const simulations = params.simulations ?? 5000;
  const months = params.months;
  const annualInflation = params.annualInflation ?? 0;

  const seriesBuckets: number[][] = Array.from({ length: months }, () => []);
  const finalDistribution: number[] = [];
  const useInstrumentModel =
    (params.instruments ?? []).some((instrument) => instrument.simModel === "rate") &&
    (params.instruments ?? []).length > 0;

  for (let i = 0; i < simulations; i += 1) {
    const { series, finalValue } = useInstrumentModel
      ? simulateBucketPath(params)
      : simulateSinglePath(params, months);
    finalDistribution.push(finalValue);
    for (let monthIndex = 0; monthIndex < months; monthIndex += 1) {
      seriesBuckets[monthIndex].push(series[monthIndex] ?? finalValue);
    }

    if ((i + 1) % PROGRESS_EVERY === 0) {
      const progressMessage: ProgressMessage = {
        type: "progress",
        id: activeRequestId,
        completed: i + 1,
        total: simulations,
      };
      postMessage(progressMessage);
    }
  }

  const seriesPercentiles: PercentileSeriesPoint[] = seriesBuckets.map(
    (monthValues) => ({
      p10: percentile(monthValues, 10),
      p50: percentile(monthValues, 50),
      p90: percentile(monthValues, 90),
    })
  );

  const nominalSummary: PercentileSeriesPoint = {
    p10: percentile(finalDistribution, 10),
    p50: percentile(finalDistribution, 50),
    p90: percentile(finalDistribution, 90),
  };

  const inflationFactor =
    annualInflation === 0 ? 1 : Math.pow(1 + annualInflation, months / 12);

  const realDistribution =
    inflationFactor === 1
      ? finalDistribution
      : finalDistribution.map((value) => value / inflationFactor);

  const realSummary: PercentileSeriesPoint = {
    p10: percentile(realDistribution, 10),
    p50: percentile(realDistribution, 50),
    p90: percentile(realDistribution, 90),
  };

  const threshold = params.threshold;
  const probabilityAboveThreshold =
    typeof threshold === "number" && simulations > 0
      ? finalDistribution.filter((value) => value >= threshold).length /
        simulations
      : 0;

  return {
    finalDistribution,
    seriesPercentiles,
    summary: {
      nominal: nominalSummary,
      real: realSummary,
      probabilityAboveThreshold,
    },
  };
};

let activeRequestId = 0;

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  if (event.data.type !== "run") return;
  activeRequestId = event.data.id;
  try {
    const result = runMonteCarlo(event.data.params);
    const message: ResultMessage = {
      type: "result",
      id: event.data.id,
      result,
    };
    postMessage(message);
  } catch (error) {
    const message: ErrorMessage = {
      type: "error",
      id: event.data.id,
      message: error instanceof Error ? error.message : "Simulation error",
    };
    postMessage(message);
  }
};
