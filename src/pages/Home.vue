<template>
  <section class="home">
    <div class="hero">
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
      <div class="actions">
        <RouterLink class="primary" to="/dashboard">Go to dashboard</RouterLink>
        <RouterLink class="secondary" to="/portfolio/new"
          >Create portfolio</RouterLink
        >
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
        Your configurations are personal and saved locally in this browser. Use
        Export/Import in Settings for backup or transfer.
      </p>
    </div>

    <div class="panel donate">
      <p>
        If Plausible helped you reason about risk, support its continued
        development.
      </p>
      <a
        class="donate-link"
        href="https://buymeacoffee.com/tobiarigon"
        target="_blank"
        rel="noreferrer"
      >
        Support Plausible
      </a>
    </div>

    <p class="privacy-link">
      <RouterLink to="/privacy">Privacy Policy</RouterLink>
    </p>
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
  color: #1f2937;
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
  background: var(--primary);
  color: #f8fafc;
}

.secondary {
  background: var(--primary-100);
  color: #166534;
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
  color: #1f2937;
}

.donate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.donate-link {
  background: var(--primary);
  color: #f8fafc;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
}

.privacy-link a {
  color: #475569;
  text-decoration: none;
  font-weight: 600;
}
</style>
