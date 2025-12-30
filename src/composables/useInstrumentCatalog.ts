import type { InstrumentConfig } from "@/types/assumptions";

type InstrumentModule = { default: InstrumentConfig };

const modules = import.meta.glob("@/data/instruments/*.json", { eager: true });

const catalog: Record<string, InstrumentConfig> = {};
const list: InstrumentConfig[] = [];

Object.values(modules).forEach((mod) => {
  const data = (mod as InstrumentModule).default ?? mod;
  if (!data || typeof data !== "object") return;
  const raw = data as InstrumentConfig;
  const id = raw.id;
  if (!id || typeof id !== "string") return;
  if (catalog[id]) return;
  catalog[id] = raw;
  list.push(raw);
});

list.sort((a, b) => (a.label || a.id || "").localeCompare(b.label || b.id || ""));

export const useInstrumentCatalog = () => ({
  catalog,
  list,
});
