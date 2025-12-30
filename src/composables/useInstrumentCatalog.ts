import type { InstrumentConfig } from "@/types/assumptions";

type InstrumentModule = { default: InstrumentConfig };

const modules = import.meta.glob("@/data/instruments/*.json", { eager: true });

const catalog: Record<string, InstrumentConfig> = {};
const list: InstrumentConfig[] = [];
const isinPattern = /^[A-Z0-9]{12}$/;

Object.entries(modules).forEach(([path, mod]) => {
  const data = (mod as InstrumentModule).default ?? mod;
  if (!data || typeof data !== "object") return;
  const raw = data as InstrumentConfig;
  const id = raw.id;
  if (!id || typeof id !== "string") return;
  if (catalog[id]) return;
  if (!raw.code) raw.code = id.toUpperCase();
  if (!raw.isin || !isinPattern.test(raw.isin)) {
    console.warn(`Invalid ISIN for instrument '${id}' in ${path}:`, raw.isin);
  }
  catalog[id] = raw;
  list.push(raw);
});

list.sort((a, b) => (a.label || a.id || "").localeCompare(b.label || b.id || ""));

export const useInstrumentCatalog = () => ({
  catalog,
  list,
});
