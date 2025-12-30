<template>
  <div class="allocation-card">
    <h2>Allocazione strumenti</h2>
    <table class="allocation-table">
      <thead>
        <tr>
          <th>Strumento</th>
          <th>Peso (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(instrument, index) in bucket.assets" :key="instrument.id">
          <td>{{ instrument.name }}</td>
          <td>
            <input
              v-model.number="weights[index]"
              type="number"
              min="0"
              max="100"
              step="0.1"
              @input="emitUpdate"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <span>Totale: {{ totalWeight.toFixed(2) }}%</span>
      <span v-if="!isTotalValid" class="warning">Somma diversa da 100%</span>
    </div>

    <div class="actions">
      <button type="button" @click="normalizeWeights">Normalizza</button>
      <button type="button" class="secondary" @click="resetToSeed">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import seedPortfolio from "@/data/portfolio.default.json";

type Instrument = {
  id: string;
  name: string;
  targetWeight?: number;
  simModel?: "risky" | "rate";
};

type Bucket = {
  id: string;
  name: string;
  assets: Instrument[];
};

const props = defineProps<{
  bucket: Bucket;
}>();

const emit = defineEmits<{
  (event: "update", value: Bucket): void;
}>();

const buildWeights = (bucket: Bucket): number[] => {
  const provided = bucket.assets.map((asset) =>
    typeof asset.targetWeight === "number" ? asset.targetWeight * 100 : 0
  );
  const sum = provided.reduce((acc, value) => acc + value, 0);
  if (sum > 0) {
    return provided;
  }
  const equal = bucket.assets.length > 0 ? 100 / bucket.assets.length : 0;
  return bucket.assets.map(() => equal);
};

const weights = ref<number[]>(buildWeights(props.bucket));

watch(
  () => [props.bucket.id, props.bucket.assets.length],
  () => {
    weights.value = buildWeights(props.bucket);
  }
);

const totalWeight = computed(() =>
  weights.value.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0)
);

const isTotalValid = computed(() => Math.abs(totalWeight.value - 100) < 0.1);

const emitUpdate = () => {
  const updated: Bucket = {
    ...props.bucket,
    assets: props.bucket.assets.map((asset, index) => ({
      ...asset,
      targetWeight: Math.max(
        0,
        Math.min(100, Number.isFinite(weights.value[index]) ? weights.value[index] : 0)
      ) / 100,
    })),
  };
  emit("update", updated);
};

const normalizeWeights = () => {
  if (weights.value.length === 0) return;
  const coreIndex = Math.max(
    0,
    props.bucket.assets.findIndex((asset) => asset.id === "vwce")
  );
  const coreWeight = Math.max(
    0,
    Math.min(100, Number.isFinite(weights.value[coreIndex]) ? weights.value[coreIndex] : 0)
  );
  const remaining = Math.max(0, 100 - coreWeight);
  const others = weights.value.map((value, index) =>
    index === coreIndex ? 0 : Number.isFinite(value) ? value : 0
  );
  const othersSum = others.reduce((acc, value) => acc + value, 0);
  weights.value = weights.value.map((value, index) => {
    if (index === coreIndex) return coreWeight;
    if (othersSum <= 0) {
      const count = weights.value.length - 1;
      return count > 0 ? remaining / count : 0;
    }
    return (others[index] / othersSum) * remaining;
  });
  emitUpdate();
};

const resetToSeed = () => {
  const seed = seedPortfolio as { buckets: Bucket[] };
  const bucket = seed.buckets.find((entry) => entry.id === props.bucket.id);
  if (!bucket) return;
  weights.value = buildWeights(bucket);
  emit("update", bucket);
};
</script>

<style scoped>
.allocation-card {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.allocation-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.allocation-table th,
.allocation-table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.allocation-table input {
  width: 100%;
  max-width: 120px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
}

.summary {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-weight: 600;
}

.warning {
  color: #b45309;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

button {
  border: none;
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.secondary {
  background: #334155;
}
</style>
