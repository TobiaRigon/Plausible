<template>
  <section class="page">
    <h1>Privacy Policy</h1>
    <p>
      Plausible runs entirely in your browser. There is no backend, no user
      accounts, no cookies, no analytics, and no tracking.
      <br />
      We do not collect, store, or transmit personal data. All computations
      happen locally on your device.
      <br />
      Your configurations are saved in your browser using localStorage. This
      data stays on your device and never leaves it unless you export it.
      <br />
      External links (such as GitHub or donation platforms) are subject to their
      own privacy policies.
    </p>

    <h2>Changes to this policy</h2>
    <p>
      If this policy changes, the updated version will be published on this
      page.
    </p>

    <h2>Contact</h2>
    <p>
      For questions, open an issue on GitHub:
      <a
        href="https://github.com/TobiaRigon/Plausible"
        target="_blank"
        rel="noreferrer"
      >
        https://github.com/TobiaRigon/Plausible
      </a>
    </p>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.page {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
