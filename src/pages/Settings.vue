<template>
  <section class="page">
    <h1>Settings</h1>
    <p class="info">
      Configurations are personal and saved locally in this browser.
      Use Export/Import for backup or transfer.
    </p>

    <div class="panel">
      <h2>Export</h2>
      <p>Export profile, instruments, and parameters as JSON.</p>
      <div class="actions">
        <button type="button" @click="generateExport">Genera JSON</button>
        <button type="button" @click="downloadExport" :disabled="!exportJson">
          Scarica
        </button>
      </div>
      <textarea
        class="textarea"
        readonly
        rows="8"
        :value="exportJson"
        placeholder="Press 'Generate JSON' to create the export."
      ></textarea>
    </div>

    <div class="panel">
      <h2>Preferenze simulazione</h2>
      <p>Valori di default applicati alle nuove simulazioni.</p>
      <label class="field">
        <span>Annual inflation (%)</span>
        <input
          v-model.number="preferencesForm.inflationDefault"
          type="number"
          step="0.1"
          @input="persistPrefs"
        />
      </label>
      <label class="field">
        <span>Number of simulations</span>
        <input
          v-model.number="preferencesForm.simulationsDefault"
          type="number"
          min="0"
          step="100"
          @input="persistPrefs"
        />
      </label>
      <label class="field">
        <span>Horizon (years)</span>
        <input
          v-model.number="preferencesForm.horizonDefaultYears"
          type="number"
          min="0"
          step="1"
          @input="persistPrefs"
        />
      </label>
      <label class="field">
        <span>Annual fee (%)</span>
        <input
          v-model.number="preferencesForm.feeDefault"
          type="number"
          step="0.01"
          @input="persistPrefs"
        />
      </label>
      <label class="field">
        <span>Threshold (EUR)</span>
        <input
          v-model.number="preferencesForm.thresholdDefault"
          type="number"
          min="0"
          step="100"
          @input="persistPrefs"
        />
      </label>
    </div>

    <div class="panel">
      <h2>Import</h2>
      <p>Paste an exported JSON and import the profile.</p>
      <div class="actions">
        <label class="radio">
          <input type="radio" value="merge" v-model="importMode" />
          Merge
        </label>
        <label class="radio">
          <input type="radio" value="replace" v-model="importMode" />
          Replace
        </label>
      </div>
      <textarea
        v-model="importJson"
        class="textarea"
        rows="8"
        placeholder="Incolla qui il JSON..."
      ></textarea>
      <div class="actions">
        <button type="button" @click="importData">Import</button>
        <span v-if="importMessage" class="message">{{ importMessage }}</span>
      </div>
    </div>

    <div class="panel">
      <h2>Reset</h2>
      <p>Removes all locally saved configurations.</p>
      <button type="button" class="danger" @click="resetData">Reset</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStorage } from "@/composables/useUserStorage";

const STORAGE_PORTFOLIOS_KEY = "sim_user_portfolios_v1";
const STORAGE_INSTRUMENTS_KEY = "sim_user_instruments_v1";
const STORAGE_PARAMS_KEY = "sim_last_params_v1";
const STORAGE_PREFS_KEY = "sim_user_preferences_v1";

type ExportPayload = {
  version: number;
  portfolios?: unknown;
  instruments?: unknown;
  params?: unknown;
  preferences?: unknown;
};

const exportJson = ref("");
const importJson = ref("");
const importMessage = ref("");
const importMode = ref<"merge" | "replace">("merge");
const preferencesForm = ref({
  inflationDefault: 0,
  simulationsDefault: 0,
  feeDefault: 0,
  thresholdDefault: 0,
  horizonDefaultYears: 0,
});

const {
  listPortfolios,
  listUserInstruments,
  loadLastParams,
  loadPreferences,
  savePreferences,
} = useUserStorage();

const loadPrefs = () => {
  const prefs = loadPreferences();
  preferencesForm.value = {
    inflationDefault: Number(prefs.inflationDefault ?? 0),
    simulationsDefault: Number(prefs.simulationsDefault ?? 0),
    feeDefault: Number(prefs.feeDefault ?? 0),
    thresholdDefault: Number(prefs.thresholdDefault ?? 0),
    horizonDefaultYears: Number(prefs.horizonDefaultYears ?? 0),
  };
};

const persistPrefs = () => {
  savePreferences({
    inflationDefault: preferencesForm.value.inflationDefault,
    simulationsDefault: preferencesForm.value.simulationsDefault,
    feeDefault: preferencesForm.value.feeDefault,
    thresholdDefault: preferencesForm.value.thresholdDefault,
    horizonDefaultYears: preferencesForm.value.horizonDefaultYears,
  });
};

const generateExport = () => {
  const portfolios = listPortfolios();
  const instruments = listUserInstruments();
  const params = loadLastParams();
  const preferences = loadPreferences();
  const payload: ExportPayload = {
    version: 1,
    portfolios,
    instruments,
    params,
    preferences,
  };
  exportJson.value = JSON.stringify(payload, null, 2);
};

const downloadExport = () => {
  if (!exportJson.value) return;
  const blob = new Blob([exportJson.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wallet-simulator-export.json";
  link.click();
  URL.revokeObjectURL(url);
};

const importData = () => {
  importMessage.value = "";
  const parsed = safeParse(importJson.value);
  if (!parsed || typeof parsed !== "object") {
    importMessage.value = "Invalid JSON.";
    return;
  }

  const payload = parsed as Partial<ExportPayload>;
  if (importMode.value === "replace") {
    if (Array.isArray(payload.portfolios)) {
      window.localStorage.setItem(
        STORAGE_PORTFOLIOS_KEY,
        JSON.stringify(payload.portfolios)
      );
    }
    if (Array.isArray(payload.instruments)) {
      window.localStorage.setItem(
        STORAGE_INSTRUMENTS_KEY,
        JSON.stringify(payload.instruments)
      );
    }
  if (payload.params && isObject(payload.params)) {
      window.localStorage.setItem(
        STORAGE_PARAMS_KEY,
        JSON.stringify(payload.params)
      );
    }
    if (payload.preferences && isObject(payload.preferences)) {
      window.localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify(payload.preferences)
      );
    }
  } else {
    const existingPortfolios = listPortfolios();
    const incomingPortfolios = Array.isArray(payload.portfolios)
      ? payload.portfolios
      : [];
    const portfolioMap = new Map(
      existingPortfolios.map((item) => [item.id, item])
    );
    incomingPortfolios.forEach((item: any) => {
      if (item && item.id) portfolioMap.set(item.id, item);
    });
    window.localStorage.setItem(
      STORAGE_PORTFOLIOS_KEY,
      JSON.stringify(Array.from(portfolioMap.values()))
    );

    const existingInstruments = listUserInstruments();
    const incomingInstruments = Array.isArray(payload.instruments)
      ? payload.instruments
      : [];
    const instrumentMap = new Map(
      existingInstruments.map((item) => [item.id, item])
    );
    incomingInstruments.forEach((item: any) => {
      if (item && item.id) instrumentMap.set(item.id, item);
    });
    window.localStorage.setItem(
      STORAGE_INSTRUMENTS_KEY,
      JSON.stringify(Array.from(instrumentMap.values()))
    );

    if (payload.params && isObject(payload.params)) {
      const merged = { ...loadLastParams(), ...payload.params };
      window.localStorage.setItem(STORAGE_PARAMS_KEY, JSON.stringify(merged));
    }
    if (payload.preferences && isObject(payload.preferences)) {
      const mergedPrefs = { ...loadPreferences(), ...payload.preferences };
      window.localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(mergedPrefs));
    }
  }
  if (payload.preferences && isObject(payload.preferences)) {
    savePreferences(payload.preferences as Record<string, unknown>);
    loadPrefs();
  }

  importMessage.value = "Import completed.";
};

const resetData = () => {
  window.localStorage.removeItem(STORAGE_PORTFOLIOS_KEY);
  window.localStorage.removeItem(STORAGE_INSTRUMENTS_KEY);
  window.localStorage.removeItem(STORAGE_PARAMS_KEY);
  window.localStorage.removeItem(STORAGE_PREFS_KEY);
  exportJson.value = "";
  importJson.value = "";
  importMessage.value = "Local data reset to defaults.";
  preferencesForm.value = {
    inflationDefault: 0,
    simulationsDefault: 0,
    feeDefault: 0,
    thresholdDefault: 0,
    horizonDefaultYears: 0,
  };
};

loadPrefs();

const safeParse = (value: string): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}

.info {
  color: #475569;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}

.field select,
.field input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
  font-size: 0.95rem;
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

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0;
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.summary {
  margin-top: 8px;
  font-weight: 600;
}

.textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
  padding: 10px;
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  font-size: 0.9rem;
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

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary {
  background: #334155;
}

.danger {
  background: #b91c1c;
}

.message {
  color: #0f172a;
  font-weight: 600;
}
</style>
