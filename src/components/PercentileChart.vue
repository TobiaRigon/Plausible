<template>
  <div class="chart-card">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

type PercentilePoint = {
  p10: number;
  p50: number;
  p90: number;
};

const props = defineProps<{
  series: PercentilePoint[];
}>();

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const buildChart = () => {
  if (!canvasRef.value) return;
  chart?.destroy();

  const labels = props.series.map((_, index) => `${index + 1}`);
  chart = new Chart(canvasRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "p10",
          data: props.series.map((point) => point.p10),
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: "p50",
          data: props.series.map((point) => point.p50),
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.1)",
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: "p90",
          data: props.series.map((point) => point.p90),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
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
            callback: (value) =>
              new Intl.NumberFormat("it-IT", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(Number(value)),
          },
        },
      },
    },
  });
};

onMounted(buildChart);
onBeforeUnmount(() => chart?.destroy());

watch(
  () => props.series,
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
