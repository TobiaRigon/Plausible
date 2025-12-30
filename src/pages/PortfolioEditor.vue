<template>
  <section class="page">
    <h1>{{ isEdit ? "Edit portfolio" : "Create portfolio" }}</h1>
    <p class="helper">
      Portfolios are stored locally in this browser. You can export or import them in Settings.
    </p>

    <form class="form" @submit.prevent="savePortfolio">
      <label class="field">
        <span>Name</span>
        <input v-model="name" type="text" required />
      </label>
      <div class="field">
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
      <label class="field">
        <span>Notes (optional)</span>
        <textarea v-model="notes" rows="3"></textarea>
      </label>

      <div class="section-header">
        <h2>Instruments</h2>
        <button type="button" class="secondary" @click="normalize">
          Normalize
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Weight (%)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ resolveLabel(item) }}</td>
            <td>
              <input
                v-model.number="item.weight"
                type="number"
                min="0"
                max="100"
                step="0.1"
              />
            </td>
            <td>
              <button type="button" class="secondary" @click="removeItem(item.id)">
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
          <label class="field">
            <span>Search instruments</span>
            <input v-model="catalogSearch" type="text" placeholder="Type name or id" />
          </label>
          <label class="field">
            <span>Type</span>
            <select v-model="catalogTypeFilter">
              <option value="all">All</option>
              <option v-for="item in catalogTypeFilters" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Exposure</span>
            <select v-model="catalogExposureFilter">
              <option value="all">All</option>
              <option v-for="item in catalogExposureFilters" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
        </div>
        <div class="catalog-list">
          <div v-for="instrument in filteredCatalog" :key="instrument.id" class="catalog-item">
            <div>
              <strong>{{ instrument.label }}</strong>
              <p class="meta">
                {{ instrument.instrumentType || "Other" }} ·
                {{ instrument.exposure || "Other" }} ·
                {{ instrument.assetClass || "Unclassified" }} ·
                {{ instrument.simModel || "risky" }} ·
                TER {{ (instrument.ter * 100).toFixed(2) }}%
              </p>
            </div>
            <button type="button" @click="addCatalogInstrument(instrument.id)">Add</button>
          </div>
          <p v-if="filteredCatalog.length === 0" class="catalog-empty">
            No instruments match your search.
          </p>
        </div>
      </div>

      <details class="custom">
        <summary>Create custom instrument</summary>
        <div class="custom-grid">
          <label class="field">
            <span>Name</span>
            <input v-model="custom.label" type="text" />
          </label>
          <label class="field">
            <span>SimModel</span>
            <select v-model="custom.simModel">
              <option value="risky">risky</option>
              <option value="rate">rate</option>
            </select>
          </label>
          <label class="field">
            <span>TER</span>
            <input v-model.number="custom.ter" type="number" step="0.0001" />
          </label>
          <label class="field">
            <span>Mu (10Y)</span>
            <input v-model.number="custom.mu" type="number" step="0.001" />
          </label>
          <label class="field">
            <span>Sigma (10Y)</span>
            <input v-model.number="custom.sigma" type="number" step="0.001" />
          </label>
        </div>
        <button type="button" @click="createCustomInstrument">Add custom</button>
      </details>

      <div class="footer">
        <button type="submit" class="primary">Save</button>
        <button type="button" class="secondary" @click="goBack">Cancel</button>
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
    return (
      instrument.label.toLowerCase().includes(query) ||
      instrument.id.toLowerCase().includes(query) ||
      instrument.assetClass?.toLowerCase().includes(query)
    );
  });
});
const totalWeight = computed(() =>
  items.value.reduce((acc, item) => acc + (item.weight || 0), 0)
);

const resolveLabel = (item: { ref: UserPortfolioItem["instrumentRef"] }) => {
  if (item.ref.kind === "catalog") {
    return catalogList.find((i) => i.id === item.ref.id)?.label ?? item.ref.id;
  }
  return (
    listUserInstruments().find((i) => i.id === item.ref.id)?.label ?? item.ref.id
  );
};

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
.page {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.helper {
  color: #475569;
  margin: 6px 0 18px 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field input,
.field textarea,
.field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.summary {
  font-weight: 600;
}

.summary.warn {
  color: #b45309;
}

.actions,
.footer {
  display: flex;
  gap: 12px;
  align-items: center;
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

.catalog-empty {
  margin: 0;
  color: #94a3b8;
}

.primary {
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.secondary {
  background: #334155;
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
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
  border-color: #0f172a;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.15);
}
</style>
