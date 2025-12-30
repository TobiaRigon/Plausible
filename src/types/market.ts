export type MarketDataPoint = {
  date: string;
  price: number;
};

export interface MarketDataProvider {
  getLatestPrice(isin: string): Promise<number>;
  getHistory(isin: string, days: number): Promise<MarketDataPoint[]>;
}

export class MockProvider implements MarketDataProvider {
  async getLatestPrice(): Promise<number> {
    throw new Error("not implemented");
  }

  async getHistory(): Promise<MarketDataPoint[]> {
    throw new Error("not implemented");
  }
}
