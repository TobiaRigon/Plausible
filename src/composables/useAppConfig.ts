import config from "@/data/config.json";
import type { AppConfig } from "@/types/assumptions";

const data = config as AppConfig;

export const useAppConfig = () => data;
