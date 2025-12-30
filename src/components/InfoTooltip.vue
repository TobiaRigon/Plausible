<template>
  <span class="info-tooltip" @mouseleave="hide">
    <button
      type="button"
      class="info-button"
      :aria-label="text"
      :aria-expanded="open"
      @mouseenter="show"
      @focus="show"
      @click="toggle"
      @blur="hide"
    >
      <slot>ⓘ</slot>
    </button>
    <span v-show="open" class="tooltip" role="tooltip">
      {{ text }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  text: string;
}>();

const open = ref(false);

const show = () => {
  open.value = true;
};

const hide = () => {
  open.value = false;
};

const toggle = () => {
  open.value = !open.value;
};
</script>

<style scoped>
.info-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-button {
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
  margin-left: 6px;
}

.tooltip {
  position: absolute;
  left: 0;
  top: 24px;
  z-index: 10;
  background: var(--primary);
  color: #f8fafc;
  padding: 10px 12px;
  border-radius: 8px;
  max-width: 240px;
  font-size: 0.85rem;
  line-height: 1.3;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
}
</style>
