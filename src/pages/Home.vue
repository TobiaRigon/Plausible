<template>
  <section class="home">
    <div class="hero">
      <div>
        <h1>Planning beats forecasting.</h1>
        <p class="subtitle">
          Explore plausible ranges of outcomes based on explicit assumptions.
          No predictions. No hype.
        </p>
        <p class="disclaimer">
          This tool does not predict returns. It explores plausible outcomes based on
          your assumptions. Markets may behave differently. If you are looking for
          certainty, this is not the right tool.
        </p>
      </div>
      <div class="actions">
        <RouterLink class="primary" to="/dashboard">Go to dashboard</RouterLink>
        <RouterLink class="secondary" to="/portfolio/new">Create portfolio</RouterLink>
      </div>
    </div>

    <div class="panel">
      <h2>Core principles</h2>
      <ul>
        <li>Planning beats forecasting.</li>
        <li>Explicit assumptions over hidden averages.</li>
        <li>Ranges and probabilities over single numbers.</li>
        <li>No optimization, no recommendations, no hype.</li>
      </ul>
    </div>

    <div class="panel">
      <h2>Local-first</h2>
      <p>
        Your configurations are personal and saved locally in this browser.
        Use Export/Import in Settings for backup or transfer.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.subtitle {
  color: #334155;
  margin: 8px 0 0 0;
}

.disclaimer {
  color: #475569;
  max-width: 640px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primary,
.secondary {
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 600;
}

.primary {
  background: #0f172a;
  color: #f8fafc;
}

.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.panel ul {
  margin: 12px 0 0 18px;
  padding: 0;
  color: #334155;
}
</style>
