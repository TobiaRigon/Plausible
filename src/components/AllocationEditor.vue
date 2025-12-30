<template>
  <div class="allocation-card">
    <table class="allocation-table">
      <thead>
        <tr>
          <th>Instrument</th>
          <th>Weight (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(instrument, index) in instruments" :key="instrument.id">
          <td>{{ instrument.label }}</td>
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
      <span>Total: {{ totalWeight.toFixed(2) }}%</span>
      <span v-if="!isTotalValid" class="warning">Somma diversa da 100%</span>
    </div>

    <div class="actions">
      <button type="button" @click="normalizeWeights">Normalizza</button>
      <button type="button" class="secondary" @click="resetToDefaults">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type Instrument = {
  id: string;
  label: string;
  targetWeight: number;
};

const props = defineProps<{
  portfolioId: string;
  instruments: Instrument[];
  defaultWeights: Record<string, number>;
}>();

const emit = defineEmits<{
  (event: "update", value: Record<string, number>): void;
}>();

const buildWeights = (instruments: Instrument[]): number[] => {
  const provided = instruments.map((asset) =>
    typeof asset.targetWeight === "number" ? asset.targetWeight * 100 : 0
  );
  const sum = provided.reduce((acc, value) => acc + value, 0);
  if (sum > 0) {
    return provided;
  }
  const equal = instruments.length > 0 ? 100 / instruments.length : 0;
  return instruments.map(() => equal);
};

const weights = ref<number[]>(buildWeights(props.instruments));

watch(
  () => [props.portfolioId, props.instruments.length],
  () => {
    weights.value = buildWeights(props.instruments);
  }
);

const totalWeight = computed(() =>
  weights.value.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0)
);

const isTotalValid = computed(() => Math.abs(totalWeight.value - 100) < 0.1);

const emitUpdate = () => {
  const updated = props.instruments.reduce<Record<string, number>>(
    (acc, instrument, index) => {
      const value = Math.max(
        0,
        Math.min(100, Number.isFinite(weights.value[index]) ? weights.value[index] : 0)
      );
      acc[instrument.id] = value / 100;
      return acc;
    },
    {}
  );
  emit("update", updated);
};

const normalizeWeights = () => {
  const sum = totalWeight.value;
  if (sum <= 0) return;
  weights.value = weights.value.map((value) => (value / sum) * 100);
  emitUpdate();
};

const resetToDefaults = () => {
  const updated = props.instruments.map((instrument) =>
    (props.defaultWeights[instrument.id] ?? 0) * 100
  );
  weights.value = updated.length ? updated : buildWeights(props.instruments);
  emitUpdate();
};
</script>

<style scoped>
.allocation-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.allocation-table {
  width: 100%;
  border-collapse: collapse;
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
