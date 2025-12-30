<template>
  <section class="dashboard">
    <div class="header">
      <div>
        <h1>My Portfolios</h1>
      </div>
      <RouterLink class="primary" to="/portfolio/new">New portfolio</RouterLink>
    </div>

    <div v-if="portfolios.length === 0" class="empty">
      <p>Dashboard is empty. No portfolios saved yet.</p>
      <p class="empty-note">
        Configurations are personal and saved locally in this browser.
      </p>
      <RouterLink class="primary" to="/portfolio/new">New portfolio</RouterLink>
    </div>

    <div v-else class="grid">
      <article
        v-for="portfolio in portfolios"
        :key="portfolio.id"
        class="card"
        :style="{ '--card-accent': portfolio.color || '#e2e8f0' }"
      >
        <header>
          <h2>{{ portfolio.name }}</h2>
          <p v-if="portfolio.notes" class="notes">{{ portfolio.notes }}</p>
        </header>
        <ul>
          <li v-for="item in resolveItems(portfolio)" :key="item.label">
            {{ item.label }} — {{ item.weight }}
          </li>
        </ul>
        <div class="actions">
          <button type="button" @click="goToSimulation(portfolio.id)">
            Simulate
          </button>
          <button
            type="button"
            class="secondary"
            @click="goToEdit(portfolio.id)"
          >
            Edit
          </button>
          <button
            type="button"
            class="secondary"
            @click="duplicate(portfolio.id)"
          >
            Duplicate
          </button>
          <button type="button" class="danger" @click="remove(portfolio.id)">
            Delete
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInstrumentCatalog } from "@/composables/useInstrumentCatalog";
import { useUserStorage } from "@/composables/useUserStorage";

const router = useRouter();
const { catalog } = useInstrumentCatalog();
const {
  listPortfolios,
  listUserInstruments,
  deletePortfolio,
  duplicatePortfolio,
} = useUserStorage();

const userInstruments = listUserInstruments();
const portfolios = computed(() => listPortfolios());

const resolveItems = (portfolio: ReturnType<typeof listPortfolios>[number]) => {
  return portfolio.items.map((item) => {
    const ref = item.instrumentRef;
    const instrument =
      ref.kind === "catalog"
        ? catalog[ref.id]
        : userInstruments.find((entry) => entry.id === ref.id);
    const label = instrument?.label ?? "Instrument not found";
    return { label, weight: `${(item.targetWeight * 100).toFixed(1)}%` };
  });
};

const goToSimulation = (id: string) => router.push(`/simulate/${id}`);
const goToEdit = (id: string) => router.push(`/portfolio/${id}/edit`);
const duplicate = (id: string) => duplicatePortfolio(id);
const remove = (id: string) => {
  if (window.confirm("Delete this portfolio?")) {
    deletePortfolio(id);
  }
};
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 4px solid var(--card-accent, #e2e8f0);
}

.notes {
  color: #475569;
  margin: 6px 0 0 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.primary {
  background: var(--primary);
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}

button {
  border: none;
  background: var(--primary);
  color: #f8fafc;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.secondary {
  background: var(--primary-600);
}

.danger {
  background: #b91c1c;
}

.empty {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.disclaimer {
  margin-top: 10px;
  color: #475569;
  max-width: 520px;
}

.empty-note {
  color: #64748b;
}
</style>
