<template>
  <section class="page card shadow-sm p-4 d-flex flex-column gap-3">
    <h1>{{ isEdit ? "Edit portfolio" : "Create portfolio" }}</h1>
    <p class="helper">
      Portfolios are stored locally in this browser. You can export or import them in Settings.
    </p>

    <form class="form d-flex flex-column gap-3" @submit.prevent="savePortfolio">
      <label class="field d-flex flex-column gap-2">
        <span>Name</span>
        <input v-model="name" type="text" class="form-control" required />
      </label>
      <div class="field d-flex flex-column gap-2">
        <span>Card color</span>
        <div class="color-grid">
          <button
            v-for="option in colorOptions"
            :key="option"
            type="button"
            class="color-swatch"
            :class="{ active: color === option }"
            :style="{ backgroundColor: option }"
            @click="color = option"
            :aria-label="`Select ${option}`"
          ></button>
        </div>
      </div>
      <label class="field d-flex flex-column gap-2">
        <span>Notes (optional)</span>
        <textarea v-model="notes" rows="3" class="form-control"></textarea>
      </label>

      <div class="section-header d-flex align-items-center justify-content-between gap-2">
        <h2>Instruments</h2>
        <button type="button" class="btn btn-outline-primary" @click="normalize">
          Normalize
        </button>
      </div>

      <table class="table table-sm">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Weight (%)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <span class="instrument-label">{{ resolveLabel(item) }}</span>
              <span v-if="resolveCode(item)" class="code-badge">{{ resolveCode(item) }}</span>
              <span v-if="resolveIsin(item)" class="meta secondary-line">
                ISIN: {{ resolveIsin(item) }}
              </span>
            </td>
            <td>
              <input
                v-model.number="item.weight"
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="form-control"
              />
            </td>
            <td>
              <button
                type="button"
                class="btn btn-outline-primary"
                @click="removeItem(item.id)"
              >
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="summary" :class="{ warn: totalWeight !== 100 }">
        Total: {{ totalWeight.toFixed(1) }}%
      </p>

      <div class="catalog">
        <div class="catalog-controls">
          <label class="field d-flex flex-column gap-2">
            <span>Search instruments</span>
            <input
              v-model="catalogSearch"
              type="text"
              class="form-control"
              placeholder="Type name, code, or ISIN"
            />
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>Type</span>
            <select v-model="catalogTypeFilter" class="form-select">
              <option value="all">All</option>
              <option v-for="item in catalogTypeFilters" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>Exposure</span>
            <select v-model="catalogExposureFilter" class="form-select">
              <option value="all">All</option>
              <option v-for="item in catalogExposureFilters" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
        </div>
        <div class="catalog-list">
          <div
            v-for="instrument in filteredCatalog"
            :key="instrument.id"
            class="catalog-item"
          >
            <div>
              <strong>{{ instrument.label }}</strong>
              <span class="code-badge">{{ instrument.code }}</span>
              <span class="meta secondary-line">ISIN: {{ instrument.isin }}</span>
              <p class="meta">
                {{ instrument.instrumentType || "Other" }} ·
                {{ instrument.exposure || "Other" }} ·
                {{ instrument.assetClass || "Unclassified" }} ·
                {{ instrument.simModel || "risky" }} ·
                TER {{ (instrument.ter * 100).toFixed(2) }}%
              </p>
            </div>
            <button
              type="button"
              class="btn btn-primary"
              @click="addCatalogInstrument(instrument.id)"
            >
              Add
            </button>
          </div>
          <p v-if="filteredCatalog.length === 0" class="catalog-empty">
            No instruments match your search.
          </p>
        </div>
      </div>

      <details class="custom">
        <summary>Create custom instrument</summary>
        <div class="custom-grid">
          <label class="field d-flex flex-column gap-2">
            <span>Name</span>
            <input v-model="custom.label" type="text" class="form-control" />
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>SimModel</span>
            <select v-model="custom.simModel" class="form-select">
              <option value="risky">risky</option>
              <option value="rate">rate</option>
            </select>
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>TER</span>
            <input
              v-model.number="custom.ter"
              type="number"
              step="0.0001"
              class="form-control"
            />
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>Mu (10Y)</span>
            <input
              v-model.number="custom.mu"
              type="number"
              step="0.001"
              class="form-control"
            />
          </label>
          <label class="field d-flex flex-column gap-2">
            <span>Sigma (10Y)</span>
            <input
              v-model.number="custom.sigma"
              type="number"
              step="0.001"
              class="form-control"
            />
          </label>
        </div>
        <button type="button" class="btn btn-primary" @click="createCustomInstrument">
          Add custom
        </button>
      </details>

      <div class="footer d-flex flex-wrap gap-2">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-outline-primary" @click="goBack">
          Cancel
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useInstrumentCatalog } from "@/composables/useInstrumentCatalog";
import { useUserStorage } from "@/composables/useUserStorage";
import type { UserPortfolio, UserPortfolioItem } from "@/types/user";

const router = useRouter();
const route = useRoute();
const { listPortfolios, createPortfolio, updatePortfolio, listUserInstruments, createUserInstrument } =
  useUserStorage();
const { list: catalogList } = useInstrumentCatalog();

const isEdit = computed(() => route.params.id !== undefined);
const existing = computed(() =>
  listPortfolios().find((p) => p.id === route.params.id)
);

const name = ref(existing.value?.name ?? "");
const notes = ref(existing.value?.notes ?? "");
const color = ref(existing.value?.color ?? "");
const items = ref<Array<{ id: string; ref: UserPortfolioItem["instrumentRef"]; weight: number }>>(
  existing.value
    ? existing.value.items.map((item) => ({
        id: `${item.instrumentRef.kind}:${item.instrumentRef.id}`,
        ref: item.instrumentRef,
        weight: item.targetWeight * 100,
      }))
    : []
);

const catalogSearch = ref("");
const catalogTypeFilter = ref("all");
const catalogExposureFilter = ref("all");
const catalogTypeFilters = computed(() => {
  const filters = new Set<string>();
  (catalogList ?? []).forEach((instrument) => {
    if (instrument.instrumentType) filters.add(instrument.instrumentType);
  });
  return Array.from(filters).sort();
});
const catalogExposureFilters = computed(() => {
  const filters = new Set<string>();
  (catalogList ?? []).forEach((instrument) => {
    if (instrument.exposure) filters.add(instrument.exposure);
  });
  return Array.from(filters).sort();
});
const filteredCatalog = computed(() => {
  const query = catalogSearch.value.trim().toLowerCase();
  const typeFilter = catalogTypeFilter.value;
  const exposureFilter = catalogExposureFilter.value;
  return (catalogList ?? []).filter((instrument) => {
    if (typeFilter !== "all" && instrument.instrumentType !== typeFilter) return false;
    if (exposureFilter !== "all" && instrument.exposure !== exposureFilter) return false;
    if (!query) return true;
    const isin = (instrument.isin ?? "").toUpperCase();
    return (
      instrument.label.toLowerCase().includes(query) ||
      instrument.id.toLowerCase().includes(query) ||
      (instrument.code ?? "").toLowerCase().includes(query) ||
      instrument.assetClass?.toLowerCase().includes(query) ||
      (query && isin.includes(query.toUpperCase()))
    );
  });
});
const totalWeight = computed(() =>
  items.value.reduce((acc, item) => acc + (item.weight || 0), 0)
);

const resolveInstrumentByRef = (item: { ref: UserPortfolioItem["instrumentRef"] }) => {
  if (item.ref.kind === "catalog") {
    return catalogList.find((i) => i.id === item.ref.id);
  }
  return listUserInstruments().find((i) => i.id === item.ref.id);
};

const resolveLabel = (item: { ref: UserPortfolioItem["instrumentRef"] }) =>
  resolveInstrumentByRef(item)?.label ?? item.ref.id;

const resolveCode = (item: { ref: UserPortfolioItem["instrumentRef"] }) =>
  resolveInstrumentByRef(item)?.code ?? "";

const resolveIsin = (item: { ref: UserPortfolioItem["instrumentRef"] }) =>
  resolveInstrumentByRef(item)?.isin ?? "";

const addCatalogInstrument = (instrumentId: string) => {
  if (!instrumentId) return;
  items.value.push({
    id: `catalog:${instrumentId}`,
    ref: { kind: "catalog", id: instrumentId },
    weight: 0,
  });
};

const removeItem = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};

const normalize = () => {
  const sum = totalWeight.value;
  if (sum <= 0) return;
  items.value = items.value.map((item) => ({
    ...item,
    weight: (item.weight / sum) * 100,
  }));
};

const custom = ref({
  label: "",
  simModel: "risky",
  ter: 0,
  mu: 0,
  sigma: 0,
});

const colorOptions = [
  "#FDE68A",
  "#BFDBFE",
  "#C7D2FE",
  "#BBF7D0",
  "#FBCFE8",
  "#FECACA",
];

const createCustomInstrument = () => {
  if (!custom.value.label) return;
  const instrument = createUserInstrument({
    label: custom.value.label,
    simModel: custom.value.simModel as "risky" | "rate",
    ter: custom.value.ter,
    mu: { "10Y": custom.value.mu },
    sigma: { "10Y": custom.value.sigma },
  });
  items.value.push({
    id: `user:${instrument.id}`,
    ref: { kind: "user", id: instrument.id },
    weight: 0,
  });
  custom.value = { label: "", simModel: "risky", ter: 0, mu: 0, sigma: 0 };
};

const savePortfolio = () => {
  const payload: Omit<UserPortfolio, "id" | "createdAt" | "updatedAt"> = {
    name: name.value,
    notes: notes.value,
    color: color.value || undefined,
    items: items.value.map((item) => ({
      instrumentRef: item.ref,
      targetWeight: Math.max(0, item.weight) / 100,
    })),
  };
  if (existing.value) {
    updatePortfolio(existing.value.id, payload);
  } else {
    createPortfolio(payload);
  }
  router.push("/dashboard");
};

const goBack = () => router.push("/dashboard");
</script>

<style scoped>
.helper {
  color: #475569;
  margin: 6px 0 18px 0;
}

.summary {
  font-weight: 600;
}

.summary.warn {
  color: #b45309;
}

.catalog {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog-controls {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.catalog-list {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
}

.catalog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  margin: 4px 0 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.secondary-line {
  display: block;
  margin-top: 4px;
}

.catalog-empty {
  margin: 0;
  color: #94a3b8;
}

.custom {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
}

.custom-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin-top: 12px;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-swatch.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.15);
}
</style>
