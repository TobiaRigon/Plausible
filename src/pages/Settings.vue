<template>
  <section class="page">
    <h1>Settings</h1>

    <div class="panel">
      <h2>Export</h2>
      <p>Esporta portfolio e parametri in JSON.</p>
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
        placeholder="Premi 'Genera JSON' per creare l'export."
      ></textarea>
    </div>

    <div class="panel">
      <h2>Import</h2>
      <p>Incolla un JSON esportato e importa i dati.</p>
      <textarea
        v-model="importJson"
        class="textarea"
        rows="8"
        placeholder="Incolla qui il JSON..."
      ></textarea>
      <div class="actions">
        <button type="button" @click="importData">Importa</button>
        <span v-if="importMessage" class="message">{{ importMessage }}</span>
      </div>
    </div>

    <div class="panel">
      <h2>Reset</h2>
      <p>Ripristina i dati di default.</p>
      <button type="button" class="danger" @click="resetData">Reset</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { loadPortfolio, savePortfolio } from "../composables/useStorage";

const STORAGE_PORTFOLIO_KEY = "portfolio_sim_v1";
const STORAGE_PARAMS_KEY = "simulation_params_v1";

type ExportPayload = {
  version: number;
  portfolio: unknown;
  params?: unknown;
};

const exportJson = ref("");
const importJson = ref("");
const importMessage = ref("");

const generateExport = () => {
  const portfolio = loadPortfolio();
  const paramsRaw = window.localStorage.getItem(STORAGE_PARAMS_KEY);
  const params = paramsRaw ? safeParse(paramsRaw) : undefined;
  const payload: ExportPayload = {
    version: 1,
    portfolio,
    params,
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
    importMessage.value = "JSON non valido.";
    return;
  }

  const payload = parsed as Partial<ExportPayload>;
  if (!payload.portfolio || !isPortfolioLike(payload.portfolio)) {
    importMessage.value = "Portfolio non valido.";
    return;
  }

  savePortfolio(payload.portfolio as { version: number; buckets: unknown[] });
  if (payload.params && isObject(payload.params)) {
    window.localStorage.setItem(
      STORAGE_PARAMS_KEY,
      JSON.stringify(payload.params)
    );
  }

  importMessage.value = "Import completato.";
};

const resetData = () => {
  window.localStorage.removeItem(STORAGE_PORTFOLIO_KEY);
  window.localStorage.removeItem(STORAGE_PARAMS_KEY);
  exportJson.value = "";
  importJson.value = "";
  importMessage.value = "Dati ripristinati ai default.";
};

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

const isPortfolioLike = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  const version = value.version;
  const buckets = value.buckets;
  return typeof version === "number" && Array.isArray(buckets);
};
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

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0;
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

.danger {
  background: #b91c1c;
}

.message {
  color: #0f172a;
  font-weight: 600;
}
</style>
