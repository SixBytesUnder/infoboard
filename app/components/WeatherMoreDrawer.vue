<template>
  <div v-if="weather" class="glass-panel weather-more-drawer">
    <div class="metrics-container">
      <div v-for="group in groupedMetrics" :key="group.title || 'core'" class="metric-group">
        <div v-if="group.title && groupedMetrics.length > 1" class="section-title">
          {{ group.title }}
        </div>
        <div class="metrics-grid">
          <div v-for="item in group.items" :key="item.key" class="metric-row">
            <span class="metric-label">{{ item.label }}</span>
            <span class="metric-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildWeatherMetricGroups } from '~~/shared'
import type { WeatherPayload, MetricGroup } from '~~/shared'

const props = defineProps<{
  weather: WeatherPayload
}>()

const groupedMetrics = computed<MetricGroup[]>(() => {
  return buildWeatherMetricGroups(props.weather)
})
</script>

<style scoped>
.weather-more-drawer {
  padding: 0.75rem 1rem;
  width: fit-content;
  max-width: 480px;
  max-height: 75vh;
  overflow-y: auto;
  animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.metrics-container {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.metric-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent, #60a5fa);
  padding-bottom: 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.78rem;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-label {
  color: var(--text-secondary);
}

.metric-value {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
  white-space: nowrap;
}
</style>
