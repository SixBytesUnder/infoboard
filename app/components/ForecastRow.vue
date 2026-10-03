<template>
  <div v-if="forecast.length > 0" class="forecast-container">
    <div v-for="day in forecast" :key="day.date" class="glass-panel forecast-card">
      <span class="day-name">{{ day.dayName }}</span>
      <img
        :src="`/images/${day.weatherCode}.svg`"
        :alt="day.conditionText"
        class="forecast-icon"
        @error="handleIconError"
      >
      <div class="forecast-temps">
        <span class="temp-high">{{ day.tempMax }}°</span>
        <span class="temp-low">{{ day.tempMin }}°</span>
      </div>
      <span class="condition-summary">{{ day.conditionText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DayForecast } from '~~/shared'

defineProps<{
  forecast: DayForecast[]
}>()

const handleIconError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = '/images/missing.svg'
}
</script>

<style scoped>
.forecast-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0;
  scrollbar-width: none;
  animation: fade-in 0.3s ease;
}

.forecast-container::-webkit-scrollbar {
  display: none;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.forecast-card {
  flex: 1 0 110px;
  min-width: 100px;
  padding: 0.85rem 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.4rem;
}

.day-name {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.forecast-icon {
  width: 3.2rem;
  height: 3.2rem;
  object-fit: contain;
  margin: 0.2rem 0;
}

.forecast-temps {
  display: flex;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.temp-high {
  color: var(--text-primary);
}

.temp-low {
  color: var(--text-muted);
}

.condition-summary {
  font-size: 0.7rem;
  color: var(--text-secondary);
  line-height: 1.1;
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 576px) {
  .forecast-card {
    flex: 0 0 95px;
    padding: 0.6rem 0.4rem;
  }
  .forecast-icon {
    width: 2.6rem;
    height: 2.6rem;
  }
}
</style>
