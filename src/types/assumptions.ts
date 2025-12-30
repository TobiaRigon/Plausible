export type DefaultAssumptionsV2 = {
  version: number;
  asOf: string;
  defaults: {
    inflation: Record<string, number>;
    selectedWindow: string;
  };
  correlations?: Record<string, Record<string, Record<string, number>>>;
  instruments: Record<
    string,
    {
      label?: string;
      mu: Record<string, number>;
      sigma: Record<string, number>;
      notes?: string;
    }
  >;
};
