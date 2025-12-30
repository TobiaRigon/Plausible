<template>
  <span class="info-tooltip">
    <button
      ref="trigger"
      type="button"
      class="btn btn-link p-0 info-button"
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      :data-bs-title="text"
      :aria-label="text"
    >
      <slot />
    </button>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Tooltip } from "bootstrap";

const props = defineProps<{
  text: string;
}>();

const trigger = ref<HTMLButtonElement | null>(null);
let tooltip: Tooltip | null = null;

onMounted(() => {
  if (!trigger.value) return;
  tooltip = new Tooltip(trigger.value);
});

onBeforeUnmount(() => {
  tooltip?.dispose();
  tooltip = null;
});

watch(
  () => props.text,
  (value) => {
    if (!trigger.value || !tooltip) return;
    trigger.value.setAttribute("data-bs-title", value);
    tooltip.setContent({ ".tooltip-inner": value });
  }
);
</script>

<style scoped>
.info-tooltip {
  display: inline-flex;
  align-items: center;
}

.info-button {
  color: var(--primary);
  font-size: 0.9rem;
  line-height: 1;
  margin-left: 0;
  font-weight: 600;
  text-decoration: underline dotted;
}
</style>
