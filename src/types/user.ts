export type PortfolioItemRef =
  | { kind: "catalog"; id: string }
  | { kind: "user"; id: string };

export type UserPortfolioItem = {
  instrumentRef: PortfolioItemRef;
  targetWeight: number;
};

export type UserPortfolio = {
  id: string;
  name: string;
  notes?: string;
  color?: string;
  items: UserPortfolioItem[];
  createdAt: string;
  updatedAt: string;
};

export type UserInstrument = {
  id: string;
  code?: string;
  isin?: string;
  label: string;
  simModel: "risky" | "rate";
  ter: number;
  mu: Record<string, number>;
  sigma: Record<string, number>;
  assetClass?: string;
};
