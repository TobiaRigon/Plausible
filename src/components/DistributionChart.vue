<template>
  <div class="chart-card">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

const props = defineProps<{
  distribution: number[];
  bins?: number;
}>();

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const binsCount = computed(() => Math.max(props.bins ?? 20, 5));

const histogram = computed(() => {
  const values = props.distribution;
  if (values.length === 0) {
    return { labels: [], counts: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const binSize = span / binsCount.value;
  const counts = Array.from({ length: binsCount.value }, () => 0);

  values.forEach((value) => {
    const index = Math.min(
      Math.floor((value - min) / binSize),
      binsCount.value - 1
    );
    counts[index] += 1;
  });

  const labels = counts.map((_, idx) => {
    const start = min + idx * binSize;
    const end = start + binSize;
    const format = new Intl.NumberFormat("it-IT", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return `${format.format(start)} - ${format.format(end)}`;
  });

  return { labels, counts };
});

const buildChart = () => {
  if (!canvasRef.value) return;
  chart?.destroy();

  chart = new Chart(canvasRef.value, {
    type: "bar",
    data: {
      labels: histogram.value.labels,
      datasets: [
        {
          label: "Distribuzione finale",
          data: histogram.value.counts,
          backgroundColor: "rgba(14, 165, 233, 0.5)",
          borderColor: "#0ea5e9",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
};

onMounted(buildChart);
onBeforeUnmount(() => chart?.destroy());

watch(
  () => [props.distribution, binsCount.value],
  () => buildChart(),
  { deep: true }
);
</script>

<style scoped>
.chart-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  min-height: 260px;
}

canvas {
  width: 100%;
  height: 220px;
}
</style>
