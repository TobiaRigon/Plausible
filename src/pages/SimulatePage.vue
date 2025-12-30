<template>
  <section class="page card shadow-sm p-4 d-flex flex-column gap-3">
    <h1>Simulation</h1>
    <p>Portfolio: <strong>{{ portfolioLabel }}</strong></p>
    <p class="disclaimer">
      This tool does not predict returns. It explores plausible outcomes based
      on the assumptions you choose. If you are looking for certainty, this is
      not the right tool.
    </p>

    <div class="section-header d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-outline-primary btn-sm toggle-button"
        @click="showSimulator = !showSimulator"
        aria-label="Show or hide simulator"
      >
        <span :class="['chevron', { open: showSimulator }]">▶</span>
      </button>
      <h2>Simulator</h2>
    </div>

    <form
      v-if="showSimulator"
      class="simulation-form row g-3"
      @submit.prevent="runSimulation"
    >
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Initial capital</span>
        <input
          v-model.number="form.initialCapital"
          type="number"
          min="0"
          step="100"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Monthly contribution</span>
        <input
          v-model.number="form.monthlyContribution"
          type="number"
          min="0"
          step="1"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Expected annual return (%)</span>
        <input
          v-model.number="form.annualReturn"
          type="number"
          step="0.1"
          class="form-control"
          @blur="roundPercentInputs"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Annual volatility (%)</span>
        <input
          v-model.number="form.annualVolatility"
          type="number"
          min="0"
          max="100"
          step="0.1"
          class="form-control"
          readonly
          @blur="roundPercentInputs"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Annual inflation (%)</span>
        <input
          v-model.number="form.annualInflation"
          type="number"
          step="0.1"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Annual fee (%)</span>
        <input
          v-model.number="form.annualFee"
          type="number"
          step="0.01"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Horizon (years)</span>
        <input
          v-model.number="form.years"
          type="number"
          min="1"
          max="60"
          step="1"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Number of simulations</span>
        <input
          v-model.number="form.simulations"
          type="number"
          min="100"
          max="20000"
          step="100"
          class="form-control"
        />
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Rebalancing</span>
        <select v-model="form.rebalanceInterval" class="form-select">
          <option value="none">Never</option>
          <option value="6">Every 6 months</option>
          <option value="12">Every year</option>
          <option value="24">Every 2 years</option>
          <option value="60">Every 5 years</option>
        </select>
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span>Window</span>
        <select v-model="form.window" class="form-select" @change="updateDefaultsForWindow">
          <option v-for="window in windows" :key="window" :value="window">
            {{ window }}
          </option>
        </select>
      </label>
      <label class="field col-12 col-md-6 col-lg-4">
        <span class="field-label">
          <InfoTooltip
            text="Reference final threshold. Indicates the probability that the final portfolio value exceeds this amount at the end of the chosen horizon. It does not affect the simulation: it is only used to interpret risk."
          >
            <strong>Threshold (EUR)</strong>
          </InfoTooltip>
        </span>
        <input
          v-model.number="form.threshold"
          type="number"
          min="0"
          step="100"
          class="form-control"
        />
      </label>

      <div class="col-12">
        <button class="btn btn-primary simulate-test" type="submit">
        Run simulation
        </button>
      </div>
    </form>

    <p v-if="defaultAssumptionsMessage" class="info">
      {{ defaultAssumptionsMessage }}
    </p>
    <p v-if="hasRateInstrument" class="info">
      Note: cash-like instruments are treated as deterministic rates.
    </p>
    <p v-if="showCorrelationNote" class="info">
      Portfolio volatility estimated with default correlations (0 for unspecified pairs).
    </p>
    <p v-if="missingInstruments" class="warning">
      Some instruments in the portfolio are missing from the catalog and were ignored.
    </p>
    <p v-if="missingWindowData" class="warning">
      Some instruments are missing mu/sigma for the selected window.
    </p>
    <p v-if="warningMessage" class="warning">{{ warningMessage }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="progress.total > 0 && progress.completed > 0" class="progress">
      Progress: {{ formatProgress(progress.completed, progress.total) }}
    </p>

    <div v-if="currentPortfolio" class="section-header d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-outline-primary btn-sm toggle-button"
        @click="showAllocation = !showAllocation"
        aria-label="Show or hide instrument allocation"
      >
        <span :class="['chevron', { open: showAllocation }]">▶</span>
      </button>
      <h2>Instrument allocation (simulation)</h2>
    </div>
    <AllocationEditor
      v-if="currentPortfolio && showAllocation"
      :portfolio-id="currentPortfolio.id"
      :instruments="pinnedInstruments"
      :default-weights="defaultWeights"
      @update="handleSimulationAllocationUpdate"
      @pin="handlePinnedUpdate"
    />

    <div v-if="pinnedSimulation" class="section-header d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-outline-primary btn-sm toggle-button"
        @click="showDifferences = !showDifferences"
        aria-label="Show or hide settings differences"
      >
        <span :class="['chevron', { open: showDifferences }]">▶</span>
      </button>
      <h2>Settings differences</h2>
    </div>
    <div v-if="pinnedSimulation && showDifferences" class="settings-diff">
      <div class="settings-header">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm icon-button"
          aria-label="Remove pinned simulation"
          @click="clearPinnedSimulation"
        >
          <span class="icon-stack" aria-hidden="true">
            <i class="fa-solid fa-thumbtack"></i>
            <i class="fa-solid fa-xmark"></i>
          </span>
          <span class="icon-label">Unpin simulation</span>
        </button>
      </div>
      <p
        v-if="
          settingsDiffs.length === 0 && allocationDiffDetails.length === 0
        "
      >
        No differences.
      </p>
      <ul v-else>
        <li v-for="diff in settingsDiffs" :key="diff">{{ diff }}</li>
        <li v-for="diff in allocationDiffDetails" :key="diff">{{ diff }}</li>
      </ul>
    </div>

    <div v-if="summary && pinnedSimulation" class="comparison-split">
      <div class="sim-column">
        <div class="summary">
          <div class="section-header d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm toggle-button"
              @click="showCurrentSimulation = !showCurrentSimulation"
              aria-label="Show or hide current simulation"
            >
              <span :class="['chevron', { open: showCurrentSimulation }]">▶</span>
            </button>
            <h2 class="summary-title mb-0">Current simulation</h2>
          </div>
          <div v-if="showCurrentSimulation">
            <div class="summary-grid">
              <div>
                <h3>Nominal</h3>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Unfavorable scenario. Only 10% of simulations end below this value."
                  >
                    <strong>p10</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(
                        summary.nominal.p10,
                        pinnedSimulation.summary.nominal.p10
                      )
                    "
                  >
                    {{ formatCurrency(summary.nominal.p10) }}
                  </span>
                </p>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
                  >
                    <strong>p50</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(
                        summary.nominal.p50,
                        pinnedSimulation.summary.nominal.p50
                      )
                    "
                  >
                    {{ formatCurrency(summary.nominal.p50) }}
                  </span>
                </p>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Very favorable scenario. Only 10% of simulations end above this value."
                  >
                    <strong>p90</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(
                        summary.nominal.p90,
                        pinnedSimulation.summary.nominal.p90
                      )
                    "
                  >
                    {{ formatCurrency(summary.nominal.p90) }}
                  </span>
                </p>
              </div>
              <div>
                <h3>Real</h3>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Unfavorable scenario. Only 10% of simulations end below this value."
                  >
                    <strong>p10</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(summary.real.p10, pinnedSimulation.summary.real.p10)
                    "
                  >
                    {{ formatCurrency(summary.real.p10) }}
                  </span>
                </p>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
                  >
                    <strong>p50</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(summary.real.p50, pinnedSimulation.summary.real.p50)
                    "
                  >
                    {{ formatCurrency(summary.real.p50) }}
                  </span>
                </p>
                <p class="percentile-row">
                  <InfoTooltip
                    text="Very favorable scenario. Only 10% of simulations end above this value."
                  >
                    <strong>p90</strong>
                  </InfoTooltip>
                  :
                  <span
                    :class="
                      comparisonClass(summary.real.p90, pinnedSimulation.summary.real.p90)
                    "
                  >
                    {{ formatCurrency(summary.real.p90) }}
                  </span>
                </p>
              </div>
              <div>
                <h3>Threshold probability</h3>
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
            <p class="timing">Compute time: {{ computeTimeMs }} ms</p>
          </div>
        </div>
        <div class="charts">
          <div>
            <div class="chart-header">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm toggle-button"
                @click="showPercentileTrend = !showPercentileTrend"
                aria-label="Show or hide percentile trend"
              >
                <span :class="['chevron', { open: showPercentileTrend }]">▶</span>
              </button>
              <h2>Percentile trend</h2>
            </div>
            <PercentileChart v-if="showPercentileTrend" :series="percentileSeries" />
          </div>
          <div>
            <h2>Final distribution</h2>
            <DistributionChart :distribution="finalDistribution" />
          </div>
        </div>
      </div>

      <div class="sim-column">
        <div class="summary">
          <h2 class="summary-title">Pinned simulation</h2>
          <div class="summary-grid">
            <div>
              <h3>Nominal</h3>
              <p class="percentile-row">
                <InfoTooltip
                  text="Unfavorable scenario. Only 10% of simulations end below this value."
                >
                  <strong>p10</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.nominal.p10) }}
              </p>
              <p class="percentile-row">
                <InfoTooltip
                  text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
                >
                  <strong>p50</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.nominal.p50) }}
              </p>
              <p class="percentile-row">
                <InfoTooltip
                  text="Very favorable scenario. Only 10% of simulations end above this value."
                >
                  <strong>p90</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.nominal.p90) }}
              </p>
            </div>
            <div>
              <h3>Real</h3>
              <p class="percentile-row">
                <InfoTooltip
                  text="Unfavorable scenario. Only 10% of simulations end below this value."
                >
                  <strong>p10</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.real.p10) }}
              </p>
              <p class="percentile-row">
                <InfoTooltip
                  text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
                >
                  <strong>p50</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.real.p50) }}
              </p>
              <p class="percentile-row">
                <InfoTooltip
                  text="Very favorable scenario. Only 10% of simulations end above this value."
                >
                  <strong>p90</strong>
                </InfoTooltip>
                : {{ formatCurrency(pinnedSimulation.summary.real.p90) }}
              </p>
            </div>
            <div>
              <h3>Threshold probability</h3>
              <p>{{ formatPercent(pinnedSimulation.summary.probabilityAboveThreshold) }}</p>
            </div>
          </div>
          <p class="timing">
            Compute time: {{ pinnedSimulation.computeTimeMs }} ms
          </p>
        </div>
        <div class="charts">
          <div>
            <div class="chart-header">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm toggle-button"
                @click="showPercentileTrend = !showPercentileTrend"
                aria-label="Show or hide percentile trend"
              >
                <span :class="['chevron', { open: showPercentileTrend }]">▶</span>
              </button>
              <h2>Percentile trend</h2>
            </div>
            <PercentileChart
              v-if="showPercentileTrend"
              :series="pinnedSimulation.percentileSeries"
            />
          </div>
          <div>
            <h2>Final distribution</h2>
            <DistributionChart :distribution="pinnedSimulation.finalDistribution" />
          </div>
        </div>
      </div>
    </div>

    

    <div v-else-if="summary" class="summary">
      <h2 class="summary-title">Summary</h2>
      <div class="summary-actions">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm icon-button"
          aria-label="Pin current simulation"
          @click="pinCurrentSimulation"
        >
          <i class="fa-solid fa-thumbtack" aria-hidden="true"></i>
          <span class="icon-label">Pin simulation</span>
        </button>
      </div>
      <div class="summary-grid">
        <div>
          <h3>Nominal</h3>
          <p class="percentile-row">
            <InfoTooltip
              text="Unfavorable scenario. Only 10% of simulations end below this value."
            >
              <strong>p10</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.nominal.p10) }}
          </p>
          <p class="percentile-row">
            <InfoTooltip
              text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
            >
              <strong>p50</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.nominal.p50) }}
          </p>
          <p class="percentile-row">
            <InfoTooltip
              text="Very favorable scenario. Only 10% of simulations end above this value."
            >
              <strong>p90</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.nominal.p90) }}
          </p>
        </div>
        <div>
          <h3>Real</h3>
          <p class="percentile-row">
            <InfoTooltip
              text="Unfavorable scenario. Only 10% of simulations end below this value."
            >
              <strong>p10</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.real.p10) }}
          </p>
          <p class="percentile-row">
            <InfoTooltip
              text="Central scenario (median). 50% of simulations end above and 50% below this value. This is the most representative value."
            >
              <strong>p50</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.real.p50) }}
          </p>
          <p class="percentile-row">
            <InfoTooltip
              text="Very favorable scenario. Only 10% of simulations end above this value."
            >
              <strong>p90</strong>
            </InfoTooltip>
            : {{ formatCurrency(summary.real.p90) }}
          </p>
        </div>
        <div>
          <h3>Threshold probability</h3>
          <p>{{ formatPercent(summary.probabilityAboveThreshold) }}</p>
        </div>
      </div>
      <p class="timing">Compute time: {{ computeTimeMs }} ms</p>
    </div>

    <div v-if="summary && !pinnedSimulation" class="charts">
      <div>
        <div class="chart-header">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm toggle-button"
            @click="showPercentileTrend = !showPercentileTrend"
            aria-label="Show or hide percentile trend"
          >
            <span :class="['chevron', { open: showPercentileTrend }]">▶</span>
          </button>
          <h2>Percentile trend</h2>
        </div>
        <PercentileChart v-if="showPercentileTrend" :series="percentileSeries" />
      </div>
      <div>
        <h2>Final distribution</h2>
        <DistributionChart :distribution="finalDistribution" />
      </div>
    </div>

    <div v-if="summary" class="info-panel">
      <div class="chart-header">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm toggle-button"
          @click="toggleInfoPanel"
          aria-label="Show or hide What you're seeing"
        >
          <span :class="['chevron', { open: showInfoPanel }]">▶</span>
        </button>
        <h2>What you're seeing</h2>
      </div>
      <div v-if="showInfoPanel" class="info-body">
        <p>
          <a
            href="https://en.wikipedia.org/wiki/Monte_Carlo_method"
            target="_blank"
            rel="noreferrer"
          >
            Monte Carlo
          </a>
          generates many plausible paths. It is not a forecast and does not predict
          returns.
        </p>
        <p>
          <InfoTooltip text="A percentile is a statistical cutoff. p10 means 10% of outcomes are below it.">
            <span class="term">Percentiles</span>
          </InfoTooltip>
          (p10 / p50 / p90) show unfavorable, typical, and favorable outcomes.
        </p>
        <p>
          <InfoTooltip text="Nominal values are not adjusted for inflation.">
            <span class="term">Nominal</span>
          </InfoTooltip>
          vs
          <InfoTooltip text="Real values are adjusted for inflation to reflect purchasing power.">
            <span class="term">Real</span>
          </InfoTooltip>
          shows the difference between raw and inflation-adjusted results.
        </p>
        <p>
          <InfoTooltip text="Threshold is a target final value used to compute a probability.">
            <span class="term">Threshold</span>
          </InfoTooltip>
          indicates the probability of reaching a target value by the chosen horizon.
        </p>
        <p>
          10Y / 3Y labels indicate the historical window used for mu and sigma
          inputs (e.g., 10-year or 3-year estimates).
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
import AllocationEditor from "../components/AllocationEditor.vue";
import { useAppConfig } from "@/composables/useAppConfig";
import { useInstrumentCatalog } from "@/composables/useInstrumentCatalog";
import { useUserStorage } from "@/composables/useUserStorage";

const route = useRoute();
const portfolioId = computed(() => route.params.portfolioId ?? "");

const form = ref({
  initialCapital: 0,
  monthlyContribution: 0,
  annualReturn: 0,
  annualVolatility: 0,
  annualInflation: 0,
  annualFee: 0,
  years: 0,
  simulations: 0,
  threshold: 0,
  window: "",
  rebalanceInterval: "none",
});

const showSimulator = ref(true);
const showAllocation = ref(true);
const showDifferences = ref(true);
const showInfoPanel = ref(true);
const showCurrentSimulation = ref(true);
const showPercentileTrend = ref(true);
const pinnedInstrumentIds = ref<string[]>([]);

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
const STORAGE_PIN_KEY = "simulation_pin_v1";
const hasPreset = ref(false);
const missingInstruments = ref(false);
const {
  listPortfolios,
  listUserInstruments,
  loadLastParams,
  saveLastParams,
  loadPreferences,
} =
  useUserStorage();
const { catalog } = useInstrumentCatalog();
const config = useAppConfig();
const preferences = loadPreferences();
const FALLBACK_DEFAULTS = {
  inflation: 2,
  simulations: 5000,
  fee: 0.2,
  threshold: 50000,
  horizon: 10,
};

const portfolios = computed(() => listPortfolios());
const userInstruments = computed(() => listUserInstruments());
const currentPortfolio = computed(() =>
  portfolios.value.find((portfolio) => portfolio.id === String(portfolioId.value))
);
const simulationAllocation = ref<Record<string, number>>({});
const portfolioLabel = computed(
  () => currentPortfolio.value?.name ?? String(portfolioId.value)
);
const pinnedStorageKey = computed(
  () => `sim_pinned_instruments_v1_${String(portfolioId.value || "default")}`
);
const infoPanelKey = computed(
  () => `sim_info_panel_v1_${String(portfolioId.value || "default")}`
);

const mergedInstruments = computed(() => {
  const portfolio = currentPortfolio.value;
  if (!portfolio) return [];
  missingInstruments.value = false;
  return portfolio.items
    .map((item) => {
      const ref = item.instrumentRef;
      const instrument =
        ref.kind === "catalog"
          ? catalog[ref.id]
          : userInstruments.value.find((entry) => entry.id === ref.id);
      if (!instrument) {
        missingInstruments.value = true;
        return null;
      }
      const overrideWeight = simulationAllocation.value[ref.id];
      return {
        id: ref.id,
        code: instrument.code ?? instrument.label ?? ref.id,
        isin: instrument.isin ?? "",
        label: instrument.label,
        simModel: instrument.simModel,
        targetWeight:
          typeof overrideWeight === "number" ? overrideWeight : item.targetWeight,
      };
    })
    .filter(
      (value): value is {
        id: string;
        code: string;
        isin: string;
        label: string;
        simModel: "risky" | "rate";
        targetWeight: number;
      } => value !== null
    );
});

const pinnedInstruments = computed(() => {
  const pinnedSet = new Set(pinnedInstrumentIds.value);
  const pinned = mergedInstruments.value.filter((item) => pinnedSet.has(item.id));
  const rest = mergedInstruments.value.filter((item) => !pinnedSet.has(item.id));
  return [...pinned, ...rest];
});

const defaultWeights = computed(() => {
  const portfolio = currentPortfolio.value;
  if (!portfolio) return {};
  return portfolio.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.instrumentRef.id] = item.targetWeight;
    return acc;
  }, {});
});

const hasRateInstrument = computed(() =>
  mergedInstruments.value.some((asset) => asset.simModel === "rate")
);

const showCorrelationNote = computed(() => {
  const riskyIds = mergedInstruments.value
    .filter((asset) => asset.simModel === "risky")
    .map((asset) => asset.id);
  if (!riskyIds.length) return false;
  const map = config.correlations?.[form.value.window] ?? {};
  for (let i = 0; i < riskyIds.length; i += 1) {
    for (let j = i + 1; j < riskyIds.length; j += 1) {
      const direct = map[riskyIds[i]]?.[riskyIds[j]];
      const reverse = map[riskyIds[j]]?.[riskyIds[i]];
      if (typeof direct !== "number" && typeof reverse !== "number") {
        return true;
      }
    }
  }
  return false;
});

const windows = computed(() => config.windows ?? ["10Y"]);

const resolveInstrument = (id: string) =>
  catalog[id] ?? userInstruments.value.find((entry) => entry.id === id);

const missingWindowData = computed(() =>
  mergedInstruments.value.some((asset) => {
    const instrument = resolveInstrument(asset.id);
    if (!instrument) return true;
    return (
      typeof instrument.mu?.[form.value.window] !== "number" ||
      typeof instrument.sigma?.[form.value.window] !== "number"
    );
  })
);

const warningMessage = computed(() =>
  form.value.simulations >= 10000
    ? "High number of simulations: performance may degrade."
    : ""
);

const runSimulation = async () => {
  errorMessage.value = "";
  if (!currentPortfolio.value) {
    errorMessage.value = "Invalid portfolio.";
    return;
  }
  if (form.value.years <= 0 || form.value.simulations <= 0) {
    errorMessage.value = "Complete the main parameters before running.";
    return;
  }
  if (missingWindowData.value) {
    errorMessage.value = "Missing mu/sigma data for the selected window.";
    return;
  }
  if (form.value.years < 1 || form.value.years > 60) {
    errorMessage.value = "Horizon must be between 1 and 60 years.";
    return;
  }
  if (form.value.annualVolatility < 0 || form.value.annualVolatility > 100) {
    errorMessage.value = "Volatility must be between 0 and 100%.";
    return;
  }
  if (form.value.simulations < 100 || form.value.simulations > 20000) {
    errorMessage.value = "Simulations must be between 100 and 20000.";
    return;
  }

  saveSimulationParamsLocal();
  const months = Math.max(1, Math.round(form.value.years * 12));
  const start = performance.now();
  progress.value = { completed: 0, total: form.value.simulations };
  const unsubscribe = onMonteCarloProgress((payload) => {
    progress.value = payload;
  });

  try {
    const useInstrumentModel =
      hasRateInstrument.value || form.value.rebalanceInterval !== "none";
    const instrumentsPayload = useInstrumentModel
      ? mergedInstruments.value.map((item) => {
          const instrument = resolveInstrument(item.id);
          return {
            id: item.id,
            simModel: instrument?.simModel ?? "risky",
            targetWeight: item.targetWeight,
            mu: instrument?.mu?.[form.value.window] ?? 0,
            sigma: instrument?.sigma?.[form.value.window] ?? 0,
          };
        })
      : undefined;

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
        form.value.rebalanceInterval === "none"
          ? null
          : Number(form.value.rebalanceInterval),
    });
    const end = performance.now();
    computeTimeMs.value = Math.round(end - start);
    summary.value = result.summary;
    percentileSeries.value = result.seriesPercentiles;
    finalDistribution.value = result.finalDistribution;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Simulation error.";
  } finally {
    unsubscribe();
  }
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number): string =>
  new Intl.NumberFormat("en-US", {
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
    initialCapital: "Initial capital",
    monthlyContribution: "Monthly contribution",
    annualReturn: "Expected annual return (%)",
    annualVolatility: "Annual volatility (%)",
    annualInflation: "Annual inflation (%)",
    annualFee: "Annual fee (%)",
    years: "Horizon (years)",
    simulations: "Number of simulations",
    threshold: "Threshold (EUR)",
    window: "Window",
    rebalanceInterval: "Rebalancing",
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

const allocationDiffDetails = computed(() => {
  if (!pinnedSimulation.value) return [];
  const pinnedAllocation = pinnedSimulation.value.allocation ?? [];
  if (pinnedAllocation.length === 0) return [];
  const currentMap = new Map(
    mergedInstruments.value.map((asset) => [
      asset.id,
      { name: asset.label, weight: asset.targetWeight ?? 0 },
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

const loadSavedParams = (): Record<string, unknown> => loadLastParams();

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

const loadInfoPanelState = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(infoPanelKey.value) ?? "{}");
    if (stored && typeof stored === "object" && typeof stored.expanded === "boolean") {
      showInfoPanel.value = stored.expanded;
    }
  } catch {
    showInfoPanel.value = true;
  }
};

const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value;
  window.localStorage.setItem(
    infoPanelKey.value,
    JSON.stringify({ expanded: showInfoPanel.value })
  );
};

const loadPinnedInstrumentIds = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(pinnedStorageKey.value) ?? "[]");
    pinnedInstrumentIds.value = Array.isArray(stored) ? stored : [];
  } catch {
    pinnedInstrumentIds.value = [];
  }
};

const pinCurrentSimulation = () => {
  if (!summary.value) return;
  const payload: PinnedSimulation = {
    summary: summary.value,
    percentileSeries: percentileSeries.value,
    finalDistribution: finalDistribution.value,
    params: { ...form.value, portfolioId: portfolioId.value },
    allocation: mergedInstruments.value.map((asset) => ({
      id: asset.id,
      targetWeight: asset.targetWeight ?? 0,
    })),
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

const saveSimulationParamsLocal = () => {
  const saved = loadSavedParams();
  const portfolioKey = String(portfolioId.value || "default");
  const next = {
    ...saved,
    [portfolioKey]: {
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
      allocationOverrides: simulationAllocation.value,
    },
  };
  saveLastParams(next);
};

const getPortfolioStats = () => {
  const items = mergedInstruments.value;
  const weights = items.map((item) => item.targetWeight);
  const sum = weights.reduce((acc, value) => acc + value, 0);
  const normalized = sum > 0 ? weights.map((value) => value / sum) : weights;
  let mu = 0;
  let variance = 0;
  const riskyIds: string[] = [];

  items.forEach((item, index) => {
    const instrument = resolveInstrument(item.id);
    if (!instrument) return;
    const muValue = instrument.mu?.[form.value.window];
    const sigmaValue = instrument.sigma?.[form.value.window];
    if (typeof muValue !== "number" || typeof sigmaValue !== "number") return;
    mu += normalized[index] * muValue;
    if (instrument.simModel === "risky") {
      riskyIds.push(item.id);
    }
  });

  if (riskyIds.length === 1) {
    const instrument = resolveInstrument(riskyIds[0]);
    const sigmaValue = instrument?.sigma?.[form.value.window];
    const index = items.findIndex((item) => item.id === riskyIds[0]);
    if (typeof sigmaValue === "number" && index >= 0) {
      variance = normalized[index] * normalized[index] * sigmaValue * sigmaValue;
    }
  } else if (riskyIds.length > 1) {
    riskyIds.forEach((a) => {
      riskyIds.forEach((b) => {
        const instrumentA = resolveInstrument(a);
        const instrumentB = resolveInstrument(b);
        if (!instrumentA || !instrumentB) return;
        const sigmaA = instrumentA.sigma?.[form.value.window];
        const sigmaB = instrumentB.sigma?.[form.value.window];
        if (typeof sigmaA !== "number" || typeof sigmaB !== "number") return;
        const idxA = items.findIndex((item) => item.id === a);
        const idxB = items.findIndex((item) => item.id === b);
        const corr =
          config.correlations?.[form.value.window]?.[a]?.[b] ??
          config.correlations?.[form.value.window]?.[b]?.[a] ??
          (a === b ? 1 : 0);
        variance += normalized[idxA] * normalized[idxB] * sigmaA * sigmaB * corr;
      });
    });
  }

  return { mu, sigma: Math.sqrt(Math.max(0, variance)) };
};

const applyDefaultsIfEmpty = () => {
  if (!portfolioId.value) return;
  const saved = loadSavedParams();
  const portfolioKey = String(portfolioId.value);
  if (saved[portfolioKey]) {
    hasPreset.value = true;
    const preset = saved[portfolioKey] as Record<string, unknown>;
    form.value = {
      ...form.value,
      ...preset,
    };
    simulationAllocation.value = (preset.allocationOverrides as Record<string, number>) ?? {};
    const stats = getPortfolioStats();
    form.value.annualVolatility = stats.sigma * 100;
    roundPercentInputs();
    return;
  }

  hasPreset.value = false;
  if (!currentPortfolio.value) return;
  simulationAllocation.value = {};
  const stats = getPortfolioStats();
  form.value.annualReturn = stats.mu * 100;
  form.value.annualVolatility = stats.sigma * 100;
  defaultAssumptionsMessage.value = `Assumptions computed from user profile (asOf: ${config.asOf})`;
  roundPercentInputs();
};

onMounted(() => {
  form.value.window = (preferences.window as string) || config.windows?.[0] || "10Y";
  form.value.annualInflation = Number(
    preferences.inflationDefault ?? FALLBACK_DEFAULTS.inflation
  );
  form.value.simulations = Number(
    preferences.simulationsDefault ?? FALLBACK_DEFAULTS.simulations
  );
  form.value.annualFee = Number(preferences.feeDefault ?? FALLBACK_DEFAULTS.fee);
  form.value.threshold = Number(
    preferences.thresholdDefault ?? FALLBACK_DEFAULTS.threshold
  );
  form.value.years = Number(
    preferences.horizonDefaultYears ?? FALLBACK_DEFAULTS.horizon
  );
  form.value.rebalanceInterval = "none";
  applyDefaultsIfEmpty();
  loadPinnedSimulation();
  loadInfoPanelState();
  loadPinnedInstrumentIds();
});

watch(
  () => portfolioId.value,
  () => {
    form.value.rebalanceInterval = "none";
    applyDefaultsIfEmpty();
    loadInfoPanelState();
    loadPinnedInstrumentIds();
  }
);

watch(
  () => [mergedInstruments.value, form.value.window],
  () => {
    const stats = getPortfolioStats();
    form.value.annualVolatility = stats.sigma * 100;
    roundPercentInputs();
  },
  { deep: true }
);

const updateDefaultsForWindow = () => {
  if (hasPreset.value) return;
  if (!portfolioId.value) return;
  if (!currentPortfolio.value) return;
  const stats = getPortfolioStats();
  form.value.annualReturn = stats.mu * 100;
  form.value.annualVolatility = stats.sigma * 100;
  defaultAssumptionsMessage.value = `Assumptions computed from user profile (asOf: ${config.asOf})`;
  roundPercentInputs();
};

const handleSimulationAllocationUpdate = (updated: Record<string, number>) => {
  simulationAllocation.value = updated;
  const stats = getPortfolioStats();
  form.value.annualReturn = stats.mu * 100;
  form.value.annualVolatility = stats.sigma * 100;
  roundPercentInputs();
};

const handlePinnedUpdate = (ids: string[]) => {
  pinnedInstrumentIds.value = ids;
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
.disclaimer {
  margin-top: 6px;
  color: #475569;
  max-width: 560px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.toggle-button {
  color: var(--primary);
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
}

.icon-button {
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.icon-stack {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
  height: 1.2em;
}

.icon-stack .fa-thumbtack {
  font-size: 1rem;
}

.icon-stack .fa-xmark {
  position: absolute;
  font-size: 0.6rem;
  right: -0.15em;
  top: -0.15em;
  background: #ffffff;
  border-radius: 999px;
  padding: 0 0.05em;
}

.icon-label {
  font-size: 0.9rem;
  color: #1f2937;
}

.simulation-form {
  margin-top: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #1f2937;
}

.field-label {
  display: inline-flex;
  align-items: center;
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
  color: var(--primary);
  font-weight: 600;
}

.charts {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px 16px 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.info-panel {
  margin-top: 16px;
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-body {
  color: var(--text-700);
  font-size: 0.95rem;
}

.term {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--text-900);
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
  color: var(--primary-600);
  font-weight: 700;
}

.worse {
  color: #b91c1c;
  font-weight: 700;
}
</style>
