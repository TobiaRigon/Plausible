<template>
  <div class="app-shell">
    <header class="app-header">
      <nav class="navbar">
        <RouterLink class="brand" to="/">
          <img class="logo" :src="logoUrl" alt="Plausible logo" />
          <span>Plausible</span>
        </RouterLink>
        <div class="nav-links">
          <RouterLink to="/dashboard">Dashboard</RouterLink>
          <RouterLink to="/settings">Settings</RouterLink>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
const logoUrl = "/plausible-logo.png";
</script>

<style scoped>
.app-shell {
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
  color: #1f2937;
  background: #f5f7fb;
  min-height: 100vh;
}

.app-header {
  background: #ffffff;
  color: var(--primary);
  border-bottom: 1px solid var(--border);
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
  color: var(--primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.nav-links a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.nav-links a.router-link-active {
  color: var(--primary-600);
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
