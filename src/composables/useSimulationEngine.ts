export type SimulationParams = {
  initialCapital: number;
  monthlyContribution: number;
  annualReturn: number;
  annualVolatility: number;
  annualFee: number;
};

export type SimulationResult = {
  series: number[];
  finalValue: number;
};

export type MonteCarloParams = SimulationParams & {
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

export type PercentileSeriesPoint = {
  p10: number;
  p50: number;
  p90: number;
};

export type MonteCarloSummary = {
  nominal: PercentileSeriesPoint;
  real: PercentileSeriesPoint;
  probabilityAboveThreshold: number;
};

export type MonteCarloResult = {
  finalDistribution: number[];
  seriesPercentiles: PercentileSeriesPoint[];
  summary: MonteCarloSummary;
};

export type MonteCarloProgress = {
  completed: number;
  total: number;
};

type WorkerRequest = {
  type: "run";
  id: number;
  params: MonteCarloParams;
};

type WorkerProgress = {
  type: "progress";
  id: number;
  completed: number;
  total: number;
};

type WorkerResult = {
  type: "result";
  id: number;
  result: MonteCarloResult;
};

type WorkerError = {
  type: "error";
  id: number;
  message: string;
};

const gaussian = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export const simulateSinglePath = (
  params: SimulationParams,
  months: number
): SimulationResult => {
  const monthlyReturn = params.annualReturn / 12;
  const monthlyVolatility = params.annualVolatility / Math.sqrt(12);
  const monthlyFee = params.annualFee / 12;

  const series: number[] = [];
  let value = params.initialCapital;

  for (let i = 0; i < months; i += 1) {
    const shock = gaussian();
    const growth = Math.exp(
      (monthlyReturn - 0.5 * monthlyVolatility * monthlyVolatility) +
        monthlyVolatility * shock
    );
    value = (value + params.monthlyContribution) * growth;
    value *= 1 - monthlyFee;
    series.push(value);
  }

  return { series, finalValue: value };
};

let worker: Worker | null = null;
let requestId = 0;
const pending = new Map<
  number,
  { resolve: (result: MonteCarloResult) => void; reject: (error: Error) => void }
>();
const progressListeners = new Set<(progress: MonteCarloProgress) => void>();

const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL("../workers/monteCarlo.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<WorkerProgress | WorkerResult | WorkerError>) => {
      const payload = event.data;
      if (payload.type === "progress") {
        progressListeners.forEach((listener) =>
          listener({ completed: payload.completed, total: payload.total })
        );
        return;
      }
      const handlers = pending.get(payload.id);
      if (!handlers) return;
      if (payload.type === "result") {
        handlers.resolve(payload.result);
        pending.delete(payload.id);
        return;
      }
      if (payload.type === "error") {
        handlers.reject(new Error(payload.message));
        pending.delete(payload.id);
      }
    };
  }
  return worker;
};

export const onMonteCarloProgress = (
  listener: (progress: MonteCarloProgress) => void
): (() => void) => {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
};

export const runMonteCarlo = (params: MonteCarloParams): Promise<MonteCarloResult> => {
  const currentId = requestId + 1;
  requestId = currentId;

  return new Promise((resolve, reject) => {
    pending.set(currentId, { resolve, reject });
    const message: WorkerRequest = { type: "run", id: currentId, params };
    getWorker().postMessage(message);
  });
};
