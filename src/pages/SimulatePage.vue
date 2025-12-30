<template>
  <section class="page">
    <h1>Simulate</h1>
    <p>Simulating bucket: <strong>{{ bucketId }}</strong></p>

    <div class="section-header">
      <button
        type="button"
        class="toggle-button"
        @click="showSimulator = !showSimulator"
        aria-label="Mostra o nascondi simulatore"
      >
        <span :class="['chevron', { open: showSimulator }]">▶</span>
      </button>
      <h2>Simulatore</h2>
    </div>

    <form v-if="showSimulator" class="simulation-form" @submit.prevent="runSimulation">
      <label class="field">
        <span>Capitale iniziale</span>
        <input v-model.number="form.initialCapital" type="number" min="0" step="100" />
      </label>
      <label class="field">
        <span>Contributo mensile</span>
        <input v-model.number="form.monthlyContribution" type="number" min="0" step="1" />
      </label>
      <label class="field">
        <span>Rendimento annuo atteso (%)</span>
        <input
          v-model.number="form.annualReturn"
          type="number"
          step="0.1"
          @blur="roundPercentInputs"
        />
      </label>
      <label class="field">
        <span>Volatilità annua (%)</span>
        <input
          v-model.number="form.annualVolatility"
          type="number"
          min="0"
          max="100"
          step="0.1"
          @blur="roundPercentInputs"
        />
      </label>
      <label class="field">
        <span>Inflazione annua (%)</span>
        <input v-model.number="form.annualInflation" type="number" step="0.1" />
      </label>
      <label class="field">
        <span>Fee annua (%)</span>
        <input v-model.number="form.annualFee" type="number" step="0.01" />
      </label>
      <label class="field">
        <span>Orizzonte (anni)</span>
        <input v-model.number="form.years" type="number" min="1" max="60" step="1" />
      </label>
      <label class="field">
        <span>Numero simulazioni</span>
        <input
          v-model.number="form.simulations"
          type="number"
          min="100"
          max="20000"
          step="100"
        />
      </label>
      <label class="field">
        <span>Ribilanciamento</span>
        <select v-model="form.rebalanceInterval">
          <option value="none">Mai</option>
          <option value="6">Ogni 6 mesi</option>
          <option value="12">Ogni anno</option>
          <option value="24">Ogni 2 anni</option>
          <option value="60">Ogni 5 anni</option>
        </select>
      </label>
      <label class="field">
        <span>Window</span>
        <select v-model="form.window" @change="updateDefaultsForWindow">
          <option value="3Y">3Y</option>
          <option value="10Y">10Y</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">
          Soglia (EUR)
          <InfoTooltip
            text="Soglia finale di riferimento. Indica la probabilita che il valore finale del portafoglio superi questa cifra al termine dell orizzonte scelto. Non influisce sulla simulazione: serve solo a leggere il rischio."
          />
        </span>
        <input v-model.number="form.threshold" type="number" min="0" step="100" />
      </label>

      <button class="simulate-test" type="submit">
        Esegui simulazione
      </button>
    </form>

    <p v-if="defaultAssumptionsMessage" class="info">
      {{ defaultAssumptionsMessage }}
    </p>
    <p v-if="hasRateInstrument" class="info">
      Nota: XEON viene trattato come tasso (deterministico), non come asset rischioso.
    </p>
    <p v-if="showCorrelationNote" class="info">
      Volatilità portafoglio stimata con correlazioni default (0 per coppie non specificate).
    </p>
    <p v-if="warningMessage" class="warning">{{ warningMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="progress.total > 0 && progress.completed > 0" class="progress">
      Avanzamento: {{ formatProgress(progress.completed, progress.total) }}
    </p>

    <div v-if="currentBucket && currentBucket.id === 'investments'" class="section-header">
      <button
        type="button"
        class="toggle-button"
        @click="showAllocation = !showAllocation"
        aria-label="Mostra o nascondi allocazione strumenti"
      >
        <span :class="['chevron', { open: showAllocation }]">▶</span>
      </button>
      <h2>Allocazione strumenti</h2>
    </div>
    <AllocationEditor
      v-if="currentBucket && currentBucket.id === 'investments' && showAllocation"
      :bucket="currentBucket"
      @update="handleAllocationUpdate"
    />

    <div v-if="pinnedSimulation" class="section-header">
      <button
        type="button"
        class="toggle-button"
        @click="showDifferences = !showDifferences"
        aria-label="Mostra o nascondi differenze impostazioni"
      >
        <span :class="['chevron', { open: showDifferences }]">▶</span>
      </button>
      <h2>Differenze impostazioni</h2>
    </div>
    <div v-if="pinnedSimulation && showDifferences" class="settings-diff">
      <div class="settings-header">
        <button type="button" class="secondary-button" @click="clearPinnedSimulation">
          Rimuovi pin
        </button>
      </div>
      <p
        v-if="
          settingsDiffs.length === 0 && allocationDiffDetails.length === 0
        "
      >
        Nessuna differenza.
      </p>
      <ul v-else>
        <li v-for="diff in settingsDiffs" :key="diff">{{ diff }}</li>
        <li v-for="diff in allocationDiffDetails" :key="diff">{{ diff }}</li>
      </ul>
    </div>

    <div v-if="summary && pinnedSimulation" class="comparison-split">
      <div class="sim-column">
        <div class="summary">
          <h2 class="summary-title">Simulazione attuale</h2>
          <div class="summary-grid">
            <div>
              <h3>Nominale</h3>
            <p class="percentile-row">
                p10:
                <span :class="comparisonClass(summary.nominal.p10, pinnedSimulation.summary.nominal.p10)">
                  {{ formatCurrency(summary.nominal.p10) }}
                </span>
                <InfoTooltip
                  text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
                />
            </p>
            <p class="percentile-row">
                p50:
                <span :class="comparisonClass(summary.nominal.p50, pinnedSimulation.summary.nominal.p50)">
                  {{ formatCurrency(summary.nominal.p50) }}
                </span>
                <InfoTooltip
                  text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
                />
            </p>
            <p class="percentile-row">
                p90:
                <span :class="comparisonClass(summary.nominal.p90, pinnedSimulation.summary.nominal.p90)">
                  {{ formatCurrency(summary.nominal.p90) }}
                </span>
                <InfoTooltip
                  text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
                />
            </p>
            </div>
            <div>
              <h3>Reale</h3>
            <p class="percentile-row">
                p10:
                <span :class="comparisonClass(summary.real.p10, pinnedSimulation.summary.real.p10)">
                  {{ formatCurrency(summary.real.p10) }}
                </span>
                <InfoTooltip
                  text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
                />
            </p>
            <p class="percentile-row">
                p50:
                <span :class="comparisonClass(summary.real.p50, pinnedSimulation.summary.real.p50)">
                  {{ formatCurrency(summary.real.p50) }}
                </span>
                <InfoTooltip
                  text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
                />
            </p>
            <p class="percentile-row">
                p90:
                <span :class="comparisonClass(summary.real.p90, pinnedSimulation.summary.real.p90)">
                  {{ formatCurrency(summary.real.p90) }}
                </span>
                <InfoTooltip
                  text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
                />
            </p>
            </div>
          <div>
            <h3>Probabilità soglia</h3>
            <p>
              <span
                :class="
                  comparisonClass(
                    summary.probabilityAboveThreshold,
                    pinnedSimulation.summary.probabilityAboveThreshold
                  )
                "
              >
                {{ formatPercent(summary.probabilityAboveThreshold) }}
              </span>
            </p>
          </div>
          </div>
          <p class="timing">Tempo di calcolo: {{ computeTimeMs }} ms</p>
        </div>
        <div class="charts">
          <div>
            <h2>Andamento percentili</h2>
            <PercentileChart :series="percentileSeries" />
          </div>
          <div>
            <h2>Distribuzione finale</h2>
            <DistributionChart :distribution="finalDistribution" />
          </div>
        </div>
      </div>

      <div class="sim-column">
        <div class="summary">
          <h2 class="summary-title">Simulazione pin</h2>
          <div class="summary-grid">
            <div>
              <h3>Nominale</h3>
              <p class="percentile-row">
                p10: {{ formatCurrency(pinnedSimulation.summary.nominal.p10) }}
                <InfoTooltip
                  text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
                />
              </p>
              <p class="percentile-row">
                p50: {{ formatCurrency(pinnedSimulation.summary.nominal.p50) }}
                <InfoTooltip
                  text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
                />
              </p>
              <p class="percentile-row">
                p90: {{ formatCurrency(pinnedSimulation.summary.nominal.p90) }}
                <InfoTooltip
                  text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
                />
              </p>
            </div>
            <div>
              <h3>Reale</h3>
              <p class="percentile-row">
                p10: {{ formatCurrency(pinnedSimulation.summary.real.p10) }}
                <InfoTooltip
                  text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
                />
              </p>
              <p class="percentile-row">
                p50: {{ formatCurrency(pinnedSimulation.summary.real.p50) }}
                <InfoTooltip
                  text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
                />
              </p>
              <p class="percentile-row">
                p90: {{ formatCurrency(pinnedSimulation.summary.real.p90) }}
                <InfoTooltip
                  text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
                />
              </p>
            </div>
            <div>
              <h3>Probabilità soglia</h3>
              <p>{{ formatPercent(pinnedSimulation.summary.probabilityAboveThreshold) }}</p>
            </div>
          </div>
          <p class="timing">
            Tempo di calcolo: {{ pinnedSimulation.computeTimeMs }} ms
          </p>
        </div>
        <div class="charts">
          <div>
            <h2>Andamento percentili</h2>
            <PercentileChart :series="pinnedSimulation.percentileSeries" />
          </div>
          <div>
            <h2>Distribuzione finale</h2>
            <DistributionChart :distribution="pinnedSimulation.finalDistribution" />
          </div>
        </div>
      </div>
    </div>

    

    <div v-else-if="summary" class="summary">
      <h2 class="summary-title">Riepilogo</h2>
      <div class="summary-actions">
        <button type="button" class="secondary-button" @click="pinCurrentSimulation">
          Pin simulazione
        </button>
      </div>
      <div class="summary-grid">
        <div>
          <h3>Nominale</h3>
          <p class="percentile-row">
            p10: {{ formatCurrency(summary.nominal.p10) }}
            <InfoTooltip
              text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
            />
          </p>
          <p class="percentile-row">
            p50: {{ formatCurrency(summary.nominal.p50) }}
            <InfoTooltip
              text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
            />
          </p>
          <p class="percentile-row">
            p90: {{ formatCurrency(summary.nominal.p90) }}
            <InfoTooltip
              text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
            />
          </p>
        </div>
        <div>
          <h3>Reale</h3>
          <p class="percentile-row">
            p10: {{ formatCurrency(summary.real.p10) }}
            <InfoTooltip
              text="Scenario sfavorevole. Solo il 10% delle simulazioni termina sotto questo valore."
            />
          </p>
          <p class="percentile-row">
            p50: {{ formatCurrency(summary.real.p50) }}
            <InfoTooltip
              text="Scenario centrale (mediana). Il 50% delle simulazioni termina sopra e il 50% sotto questo valore. E il valore piu rappresentativo."
            />
          </p>
          <p class="percentile-row">
            p90: {{ formatCurrency(summary.real.p90) }}
            <InfoTooltip
              text="Scenario molto favorevole. Solo il 10% delle simulazioni termina sopra questo valore."
            />
          </p>
        </div>
        <div>
          <h3>Probabilità soglia</h3>
          <p>{{ formatPercent(summary.probabilityAboveThreshold) }}</p>
        </div>
      </div>
      <p class="timing">Tempo di calcolo: {{ computeTimeMs }} ms</p>
    </div>

    <div v-if="summary && !pinnedSimulation" class="charts">
      <div>
        <h2>Andamento percentili</h2>
        <PercentileChart :series="percentileSeries" />
      </div>
      <div>
        <h2>Distribuzione finale</h2>
        <DistributionChart :distribution="finalDistribution" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  runMonteCarlo,
  onMonteCarloProgress,
  type MonteCarloSummary,
  type PercentileSeriesPoint,
} from "../composables/useSimulationEngine";
import PercentileChart from "../components/PercentileChart.vue";
import DistributionChart from "../components/DistributionChart.vue";
import InfoTooltip from "../components/InfoTooltip.vue";
import { loadPortfolio, savePortfolio } from "../composables/useStorage";
import { useDefaultAssumptions } from "../composables/useDefaultAssumptions";
import AllocationEditor from "../components/AllocationEditor.vue";

const route = useRoute();
const bucketId = computed(() => route.params.bucketId ?? "");

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

type Portfolio = {
  buckets: Bucket[];
};

const form = ref({
  initialCapital: 10000,
  monthlyContribution: 300,
  annualReturn: 6,
  annualVolatility: 12,
  annualInflation: 2,
  annualFee: 0.2,
  years: 10,
  simulations: 5000,
  threshold: 50000,
  window: "10Y",
  rebalanceInterval: "none",
});

const showSimulator = ref(true);
const showAllocation = ref(true);
const showDifferences = ref(true);

type PinnedSimulation = {
  summary: MonteCarloSummary;
  percentileSeries: PercentileSeriesPoint[];
  finalDistribution: number[];
  params: Record<string, unknown>;
  allocation?: Array<{ id: string; targetWeight?: number }>;
  createdAt: string;
  computeTimeMs: number;
};

const summary = ref<MonteCarloSummary | null>(null);
const percentileSeries = ref<PercentileSeriesPoint[]>([]);
const finalDistribution = ref<number[]>([]);
const pinnedSimulation = ref<PinnedSimulation | null>(null);
const computeTimeMs = ref(0);
const errorMessage = ref("");
const defaultAssumptionsMessage = ref("");
const progress = ref({ completed: 0, total: 0 });
const STORAGE_PARAMS_KEY = "simulation_params_v1";
const STORAGE_PIN_KEY = "simulation_pin_v1";
const fallbackInflation = 2;
const hasPreset = ref(false);
const {
  asOf,
  getSelectedWindow,
  getBucketDefaults,
  getInstrumentAssumption,
  hasMissingCorrelations,
} = useDefaultAssumptions();
const portfolio = ref(loadPortfolio() as Portfolio);

const currentBucket = computed(() =>
  portfolio.value.buckets.find((entry) => entry.id === bucketId.value)
);
const hasRateInstrument = computed(() =>
  currentBucket.value?.assets.some((asset) => asset.simModel === "rate")
);
const showCorrelationNote = computed(() => {
  if (!currentBucket.value) return false;
  return hasMissingCorrelations(currentBucket.value.assets ?? [], form.value.window);
});

const warningMessage = computed(() =>
  form.value.simulations >= 10000
    ? "Numero simulazioni elevato: le performance possono degradare."
    : ""
);

const runSimulation = async () => {
  errorMessage.value = "";
  if (form.value.years < 1 || form.value.years > 60) {
    errorMessage.value = "L'orizzonte deve essere tra 1 e 60 anni.";
    return;
  }
  if (form.value.annualVolatility < 0 || form.value.annualVolatility > 100) {
    errorMessage.value = "La volatilità deve essere tra 0 e 100%.";
    return;
  }
  if (form.value.simulations < 100 || form.value.simulations > 20000) {
    errorMessage.value = "Le simulazioni devono essere tra 100 e 20000.";
    return;
  }

  saveSimulationParams();
  const months = Math.max(1, Math.round(form.value.years * 12));
  const start = performance.now();
  progress.value = { completed: 0, total: form.value.simulations };
  const unsubscribe = onMonteCarloProgress((payload) => {
    progress.value = payload;
  });

  try {
    const instrumentsPayload =
      currentBucket.value?.assets.map((asset) => {
        const assumption = getInstrumentAssumption(asset.id, form.value.window);
        return {
          id: asset.id,
          simModel: asset.simModel ?? "risky",
          targetWeight: asset.targetWeight ?? 0,
          mu: assumption?.mu ?? 0,
          sigma: assumption?.sigma ?? 0,
        };
      }) ?? [];
    const result = await runMonteCarlo({
      initialCapital: form.value.initialCapital,
      monthlyContribution: form.value.monthlyContribution,
      annualReturn: form.value.annualReturn / 100,
      annualVolatility: form.value.annualVolatility / 100,
      annualFee: form.value.annualFee / 100,
      annualInflation: form.value.annualInflation / 100,
      threshold: form.value.threshold,
      simulations: form.value.simulations,
      months,
      instruments: instrumentsPayload,
      rebalanceIntervalMonths:
        form.value.rebalanceInterval == "none"
          ? null
          : Number(form.value.rebalanceInterval),
    });
    const end = performance.now();
    computeTimeMs.value = Math.round(end - start);
    summary.value = result.summary;
    percentileSeries.value = result.seriesPercentiles;
    finalDistribution.value = result.finalDistribution;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Errore simulazione.";
  } finally {
    unsubscribe();
  }
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const formatProgress = (completed: number, total: number): string => {
  if (total <= 0) return "";
  const percent = Math.min(100, Math.round((completed / total) * 100));
  return `${completed}/${total} (${percent}%)`;
};

const settingsDiffs = computed(() => {
  if (!pinnedSimulation.value) return [];
  const pinned = pinnedSimulation.value.params as Record<string, unknown>;
  const labels: Record<string, string> = {
    initialCapital: "Capitale iniziale",
    monthlyContribution: "Contributo mensile",
    annualReturn: "Rendimento annuo atteso (%)",
    annualVolatility: "Volatilita annua (%)",
    annualInflation: "Inflazione annua (%)",
    annualFee: "Fee annua (%)",
    years: "Orizzonte (anni)",
    simulations: "Numero simulazioni",
    threshold: "Soglia (EUR)",
    window: "Window",
    rebalanceInterval: "Ribilanciamento",
  };
  return Object.keys(labels)
    .map((key) => {
      const currentValue = (form.value as Record<string, unknown>)[key];
      const pinnedValue = pinned[key];
      if (currentValue === pinnedValue) return null;
      return `${labels[key]}: ${String(pinnedValue)} → ${String(currentValue)}`;
    })
    .filter((value): value is string => value !== null);
});

const hasAllocationDiff = computed(() => {
  if (!pinnedSimulation.value || !currentBucket.value) return false;
  const pinnedAllocation = pinnedSimulation.value.allocation ?? [];
  if (pinnedAllocation.length === 0) return false;
  const currentMap = new Map(
    currentBucket.value.assets.map((asset) => [
      asset.id,
      asset.targetWeight ?? 0,
    ])
  );
  return pinnedAllocation.some((entry) => {
    const currentWeight = currentMap.get(entry.id) ?? 0;
    return Math.abs(currentWeight - (entry.targetWeight ?? 0)) > 0.0001;
  });
});

const allocationDiffDetails = computed(() => {
  if (!pinnedSimulation.value || !currentBucket.value) return [];
  const pinnedAllocation = pinnedSimulation.value.allocation ?? [];
  if (pinnedAllocation.length === 0) return [];
  const currentMap = new Map(
    currentBucket.value.assets.map((asset) => [
      asset.id,
      { name: asset.name, weight: asset.targetWeight ?? 0 },
    ])
  );
  return pinnedAllocation
    .map((entry) => {
      const current = currentMap.get(entry.id);
      if (!current) return null;
      const pinnedWeight = entry.targetWeight ?? 0;
      if (Math.abs(current.weight - pinnedWeight) <= 0.0001) return null;
      const format = (value: number) => `${(value * 100).toFixed(1)}%`;
      return `${current.name}: ${format(pinnedWeight)} → ${format(current.weight)}`;
    })
    .filter((value): value is string => value !== null);
});

const comparisonClass = (currentValue: number, pinnedValue: number): string => {
  if (!Number.isFinite(currentValue) || !Number.isFinite(pinnedValue)) {
    return "";
  }
  if (currentValue === pinnedValue) return "";
  return currentValue > pinnedValue ? "better" : "worse";
};

const loadSavedParams = (): Record<string, unknown> => {
  const raw = window.localStorage.getItem(STORAGE_PARAMS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const loadPinnedSimulation = () => {
  const raw = window.localStorage.getItem(STORAGE_PIN_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      pinnedSimulation.value = parsed as PinnedSimulation;
    }
  } catch {
    pinnedSimulation.value = null;
  }
};

const pinCurrentSimulation = () => {
  if (!summary.value) return;
  const payload: PinnedSimulation = {
    summary: summary.value,
    percentileSeries: percentileSeries.value,
    finalDistribution: finalDistribution.value,
    params: { ...form.value, bucketId: bucketId.value },
    allocation:
      currentBucket.value?.assets.map((asset) => ({
        id: asset.id,
        targetWeight: asset.targetWeight ?? 0,
      })) ?? [],
    createdAt: new Date().toISOString(),
    computeTimeMs: computeTimeMs.value,
  };
  pinnedSimulation.value = payload;
  window.localStorage.setItem(STORAGE_PIN_KEY, JSON.stringify(payload));
};

const clearPinnedSimulation = () => {
  pinnedSimulation.value = null;
  window.localStorage.removeItem(STORAGE_PIN_KEY);
};

const saveSimulationParams = () => {
  const saved = loadSavedParams();
  const bucketKey = String(bucketId.value || "default");
  const next = {
    ...saved,
    [bucketKey]: {
      initialCapital: form.value.initialCapital,
      monthlyContribution: form.value.monthlyContribution,
      annualReturn: form.value.annualReturn,
      annualVolatility: form.value.annualVolatility,
      annualInflation: form.value.annualInflation,
      annualFee: form.value.annualFee,
      years: form.value.years,
      simulations: form.value.simulations,
      threshold: form.value.threshold,
      window: form.value.window,
      rebalanceInterval: form.value.rebalanceInterval,
    },
  };
  window.localStorage.setItem(STORAGE_PARAMS_KEY, JSON.stringify(next));
};

const applyDefaultsIfEmpty = () => {
  if (!bucketId.value) return;
  const saved = loadSavedParams();
  const bucketKey = String(bucketId.value);
  if (saved[bucketKey]) {
    hasPreset.value = true;
    const preset = saved[bucketKey] as Record<string, unknown>;
    form.value = {
      ...form.value,
      ...preset,
    };
    return;
  }

  hasPreset.value = false;
  const bucket = currentBucket.value;
  if (!bucket) return;

  const defaults = getBucketDefaults(bucket.assets ?? [], form.value.window);
  if (defaults.mu > 0) {
    form.value.annualReturn = defaults.mu * 100;
  }
  if (defaults.sigma > 0) {
    form.value.annualVolatility = defaults.sigma * 100;
  }
  const inflation = defaults.inflation ?? fallbackInflation / 100;
  form.value.annualInflation = inflation * 100;
  defaultAssumptionsMessage.value = `Default assumptions (asOf: ${asOf}) loaded`;
};

onMounted(() => {
  form.value.window = getSelectedWindow();
  applyDefaultsIfEmpty();
  loadPinnedSimulation();
});

const updateDefaultsForWindow = () => {
  if (hasPreset.value) return;
  if (!bucketId.value) return;
  const bucket = currentBucket.value;
  if (!bucket) return;
  const defaults = getBucketDefaults(bucket.assets ?? [], form.value.window);
  if (defaults.mu > 0) {
    form.value.annualReturn = defaults.mu * 100;
  }
  if (defaults.sigma > 0) {
    form.value.annualVolatility = defaults.sigma * 100;
  }
  form.value.annualInflation = defaults.inflation * 100;
  defaultAssumptionsMessage.value = `Default assumptions (asOf: ${asOf}) loaded`;
};

const handleAllocationUpdate = (bucket: Bucket) => {
  portfolio.value = {
    ...portfolio.value,
    buckets: portfolio.value.buckets.map((entry) =>
      entry.id === bucket.id ? bucket : entry
    ),
  };
  savePortfolio(portfolio.value as { version: number; buckets: Bucket[] });
  if (!hasPreset.value) {
    updateDefaultsForWindow();
  }
};

const roundPercentInputs = () => {
  form.value.annualReturn = roundTo(form.value.annualReturn, 1);
  form.value.annualVolatility = roundTo(form.value.annualVolatility, 1);
};

const roundTo = (value: number, digits: number): number => {
  const factor = Math.pow(10, digits);
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
};
</script>

<style scoped>
.page {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.toggle-button {
  border: none;
  background: transparent;
  color: #0f172a;
  padding: 0;
  cursor: pointer;
  font-weight: 600;
}

.chevron {
  display: inline-block;
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(90deg);
}

.simulate-test {
  margin-top: 12px;
  border: none;
  background: #0f172a;
  color: #f8fafc;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.simulation-form {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #334155;
}

.field-label {
  display: inline-flex;
  align-items: center;
}

.field input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
  font-size: 0.95rem;
}

.field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
  font-size: 0.95rem;
}

.summary {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.summary-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.summary h3 {
  margin: 0 0 8px 0;
}

.summary-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.secondary-button {
  border: none;
  background: #334155;
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.percentile-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timing {
  margin-top: 12px;
  color: #475569;
  font-size: 0.9rem;
}

.warning {
  margin-top: 12px;
  color: #b45309;
  font-weight: 600;
}

.info {
  margin-top: 12px;
  color: #1d4ed8;
  font-weight: 600;
}

.error {
  margin-top: 12px;
  color: #b91c1c;
  font-weight: 600;
}

.progress {
  margin-top: 8px;
  color: #0f172a;
  font-weight: 600;
}

.charts {
  margin-top: 24px;
  display: grid;
  gap: 24px;
}

.comparison-split {
  margin-top: 24px;
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.sim-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-diff {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-diff ul {
  margin: 8px 0 0 18px;
}

.better {
  color: #15803d;
  font-weight: 700;
}

.worse {
  color: #b91c1c;
  font-weight: 700;
}
</style>
