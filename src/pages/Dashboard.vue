<template>
  <section class="dashboard">
    <h1>Dashboard</h1>
    <div class="bucket-grid">
      <article v-for="bucket in bucketsToShow" :key="bucket.id" class="bucket-card">
        <header class="bucket-header">
          <h2>{{ bucket.name }}</h2>
          <span class="bucket-ter">TER medio: {{ formatTer(bucket) }}</span>
        </header>

        <ul class="bucket-assets">
          <li v-for="asset in bucket.assets" :key="asset.id">
            {{ asset.name }}
          </li>
        </ul>

        <button class="bucket-action" type="button" @click="goToSimulation(bucket.id)">
          Simula
        </button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { loadPortfolio } from "../composables/useStorage";
import { calculateWeightedTer } from "../composables/usePortfolio";

type Asset = {
  id: string;
  name: string;
  isin?: string;
  assetClass?: string;
  ter: number;
  targetWeight: number;
};

type Bucket = {
  id: string;
  name: string;
  assets: Asset[];
};

type Portfolio = {
  baseCurrency?: string;
  buckets: Bucket[];
};

const router = useRouter();
const portfolio = ref(loadPortfolio() as Portfolio);

const bucketsToShow = computed(() => portfolio.value.buckets.slice(0, 2));

const formatTer = (bucket: Bucket): string => {
  const ter = calculateWeightedTer(bucket);
  return `${(ter * 100).toFixed(2)}%`;
};

const goToSimulation = (bucketId: string) => {
  router.push(`/simulate/${bucketId}`);
};
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bucket-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.bucket-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bucket-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bucket-ter {
  font-size: 0.9rem;
  color: #475569;
}

.bucket-assets {
  margin: 0;
  padding-left: 18px;
  color: #1f2937;
}

.bucket-action {
  align-self: flex-start;
  border: none;
  background: #0f172a;
  color: #f8fafc;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}
</style>
