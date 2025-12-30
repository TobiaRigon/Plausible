<template>
  <div class="app-shell">
    <header class="app-header">
      <nav class="navbar">
        <span class="brand">Wallet Simulator</span>
        <div class="nav-links">
          <RouterLink to="/">Dashboard</RouterLink>
          <RouterLink to="/simulate/alpha">Simulate</RouterLink>
          <RouterLink to="/settings">Settings</RouterLink>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-shell {
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  color: #1f2937;
  background: #f5f7fb;
  min-height: 100vh;
}

.app-header {
  background: #0f172a;
  color: #f8fafc;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.nav-links a {
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a.router-link-active {
  color: #38bdf8;
}

.app-main {
  padding: 24px;
}

@media (max-width: 640px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .nav-links {
    flex-wrap: wrap;
  }
}
</style>
