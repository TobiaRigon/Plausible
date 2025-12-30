export type AssetLike = {
  targetWeight?: number;
  ter?: number;
  [key: string]: unknown;
};

export type BucketLike = {
  assets?: AssetLike[];
  [key: string]: unknown;
};

const DEFAULT_TOLERANCE = 1e-4;

const clamp = (value: number): number => (Number.isFinite(value) ? value : 0);

const toWeights = (assets: AssetLike[]): number[] =>
  assets.map((asset) => clamp(asset.targetWeight ?? 0));

export const normalizeWeights = (bucket: BucketLike): BucketLike => {
  const assets = bucket.assets ?? [];
  if (assets.length === 0) {
    return { ...bucket, assets };
  }

  const weights = toWeights(assets);
  const sum = weights.reduce((acc, value) => acc + value, 0);

  if (sum > 0) {
    return {
      ...bucket,
      assets: assets.map((asset, index) => ({
        ...asset,
        targetWeight: weights[index] / sum,
      })),
    };
  }

  const equalWeight = 1 / assets.length;
  return {
    ...bucket,
    assets: assets.map((asset) => ({
      ...asset,
      targetWeight: equalWeight,
    })),
  };
};

export const validateWeights = (
  bucket: BucketLike,
  tolerance = DEFAULT_TOLERANCE
): boolean => {
  const assets = bucket.assets ?? [];
  if (assets.length === 0) {
    return true;
  }

  const sum = toWeights(assets).reduce((acc, value) => acc + value, 0);
  return Math.abs(1 - sum) <= tolerance;
};

export const calculateWeightedTer = (bucket: BucketLike): number => {
  const assets = bucket.assets ?? [];
  if (assets.length === 0) {
    return 0;
  }

  const weights = toWeights(assets);
  const weightSum = weights.reduce((acc, value) => acc + value, 0);
  if (weightSum === 0) {
    return 0;
  }

  const weightedTer = assets.reduce((acc, asset, index) => {
    const ter = clamp(asset.ter ?? 0);
    return acc + ter * weights[index];
  }, 0);

  return weightedTer / weightSum;
};

export const usePortfolio = () => ({
  calculateWeightedTer,
  normalizeWeights,
  validateWeights,
});
