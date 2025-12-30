export type PortfolioConfig = {
  id: string;
  label: string;
  instruments: Array<{ instrumentId: string; targetWeight: number }>;
  rebalanceDefault?: "none" | "annual" | "semiannual";
  simMode?: "portfolio_gbm" | "per_instrument";
};

export type InstrumentConfig = {
  label: string;
  assetClass: string;
  instrumentType?: string;
  exposure?: string;
  simModel: "risky" | "rate";
  ter: number;
  id?: string;
  mu: Record<string, number>;
  sigma: Record<string, number>;
  notes?: string;
};

export type AppConfig = {
  version: number;
  asOf: string;
  baseCurrency: string;
  units: Record<string, string>;
  methodology: Record<string, string>;
  windows: string[];
  simulationModels?: string[];
  correlations?: Record<string, Record<string, Record<string, number>>>;
};
