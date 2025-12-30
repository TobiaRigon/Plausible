<template>
  <section class="d-flex flex-column gap-3">
    <div class="card shadow-sm p-4 d-flex flex-column gap-3">
      <div>
        <h1>Planning beats forecasting.</h1>
        <p class="subtitle">
          Explore plausible ranges of outcomes based on explicit assumptions. No
          predictions. No hype.
        </p>
        <p class="disclaimer">
          This tool does not predict returns. It explores plausible outcomes
          based on your assumptions. Markets may behave differently. If you are
          looking for certainty, this is not the right tool.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <RouterLink class="btn btn-primary" to="/dashboard"
          >Go to dashboard</RouterLink
        >
        <RouterLink class="btn btn-outline-primary" to="/portfolio/new"
          >Create portfolio</RouterLink
        >
      </div>
    </div>

    <div class="card shadow-sm p-3 panel">
      <h2>Core principles</h2>
      <ul>
        <li>Planning beats forecasting.</li>
        <li>Explicit assumptions over hidden averages.</li>
        <li>Ranges and probabilities over single numbers.</li>
        <li>No optimization, no recommendations, no hype.</li>
      </ul>
    </div>

    <div class="card shadow-sm p-3 panel">
      <h2>Local-first</h2>
      <p>
        Your configurations are personal and saved locally in this browser. Use
        Export/Import in Settings for backup or transfer.
      </p>
    </div>

    <div
      class="card shadow-sm p-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
    >
      <p>
        If Plausible helped you reason about risk, support its continued
        development.
      </p>
      <a
        class="btn btn-primary"
        href="https://buymeacoffee.com/tobiarigon"
        target="_blank"
        rel="noreferrer"
      >
        Support Plausible
      </a>
    </div>

    <p class="privacy-link mb-0">
      <RouterLink class="text-decoration-none fw-semibold" to="/privacy"
        >Privacy Policy</RouterLink
      >
    </p>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>

.subtitle {
  color: #1f2937;
  margin: 8px 0 0 0;
}

.disclaimer {
  color: #475569;
  max-width: 640px;
}

.panel ul {
  margin: 12px 0 0 18px;
  padding: 0;
  color: #1f2937;
}
.privacy-link a {
  color: #475569;
}
</style>
