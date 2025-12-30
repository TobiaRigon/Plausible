<template>
  <div class="app-shell">
    <header class="app-header">
      <nav class="navbar navbar-expand-sm">
        <div class="container-fluid">
          <RouterLink class="navbar-brand brand" to="/">
            <img class="logo" :src="logoUrl" alt="Plausible logo" />
            <span>Plausible</span>
          </RouterLink>
          <div class="navbar-nav ms-auto nav-links">
            <RouterLink class="nav-link" to="/dashboard">Dashboard</RouterLink>
            <RouterLink class="nav-link" to="/settings">Settings</RouterLink>
          </div>
        </div>
      </nav>
    </header>

    <main class="app-main container-lg">
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
</style>
