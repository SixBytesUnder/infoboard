<template>
  <div v-if="weather" class="glass-panel weather-more-drawer">
    <div class="metrics-grid">
      <div v-for="item in metricItems" :key="item.key" class="metric-row">
        <span class="metric-label">{{ item.label }}</span>
        <span class="metric-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WEATHER_UNITS, MOON_PHASES, EPA_HEALTH_CONCERN, POLLEN_INDEX } from '~~/shared'
import type { WeatherPayload } from '~~/shared'

const props = defineProps<{
  weather: WeatherPayload
}>()

const units = computed(() => {
  return WEATHER_UNITS[props.weather.units] || WEATHER_UNITS.metric
})

const current = computed(() => props.weather.current)

const metricItems = computed(() => {
  const c = current.value
  const u = units.value

  return [
    { key: 'humidity', label: 'Humidity', value: `${c.humidity}${u.humidity}` },
    { key: 'windSpeed', label: 'Wind speed', value: `${c.windSpeed} ${u.windSpeed}` },
    { key: 'windGust', label: 'Wind gust', value: `${c.windGust} ${u.windGust}` },
    { key: 'pressure', label: 'Barometric pressure', value: `${c.pressureSurfaceLevel} ${u.pressureSurfaceLevel}` },
    { key: 'solarGHI', label: 'Solar radiation (GHI)', value: `${c.solarGHI} ${u.solarGHI}` },
    { key: 'moonPhase', label: 'Moon phase', value: MOON_PHASES[c.moonPhase] || 'Unknown' },
    { key: 'pm25', label: 'Particulate PM 2.5', value: `${c.particulateMatter25} ${u.particulateMatter25}` },
    { key: 'pm10', label: 'Particulate PM 10', value: `${c.particulateMatter10} ${u.particulateMatter10}` },
    { key: 'o3', label: 'Ozone (O₃)', value: `${c.pollutantO3} ${u.pollutantO3}` },
    { key: 'no2', label: 'Nitrogen Dioxide (NO₂)', value: `${c.pollutantNO2} ${u.pollutantNO2}` },
    { key: 'co', label: 'Carbon Monoxide (CO)', value: `${c.pollutantCO} ${u.pollutantCO}` },
    { key: 'so2', label: 'Sulfur Dioxide (SO₂)', value: `${c.pollutantSO2} ${u.pollutantSO2}` },
    { key: 'epa', label: 'US EPA Air Quality', value: EPA_HEALTH_CONCERN[c.epaHealthConcern] || 'Good' },
    { key: 'treePollen', label: 'Tree pollen index', value: POLLEN_INDEX[c.treeIndex] || 'None' },
    { key: 'weedPollen', label: 'Weed pollen index', value: POLLEN_INDEX[c.weedIndex] || 'None' },
    { key: 'grassPollen', label: 'Grass pollen index', value: POLLEN_INDEX[c.grassIndex] || 'None' }
  ]
})
</script>

<style scoped>
.weather-more-drawer {
  padding: 0.75rem 1rem;
  width: fit-content;
  max-width: 480px;
  animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
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
}
</style>
