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
import { WEATHER_UNITS, MOON_PHASES, EPA_HEALTH_CONCERN } from '~~/shared'
import type { WeatherPayload } from '~~/shared'

const props = defineProps<{
  weather: WeatherPayload
}>()

const units = computed(() => {
  return WEATHER_UNITS[props.weather.units] || WEATHER_UNITS.metric
})

const current = computed(() => props.weather.current)

const degreesToCompass = (deg: number): string => {
  const val = Math.floor((deg / 22.5) + 0.5)
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return directions[val % 16] || ''
}

const getEuropeanAqiLabel = (aqi: number): string => {
  if (aqi <= 20) return 'Very Good'
  if (aqi <= 40) return 'Good'
  if (aqi <= 60) return 'Medium'
  if (aqi <= 80) return 'Poor'
  if (aqi <= 100) return 'Very Poor'
  return 'Extremely Poor'
}

interface MetricItem {
  key: string
  label: string
  value: string
}

interface MetricGroup {
  title?: string
  items: MetricItem[]
}

const groupedMetrics = computed<MetricGroup[]>(() => {
  const c = current.value
  const u = units.value

  const groups: MetricGroup[] = []

  // 1. Core atmospheric & astronomical metrics
  const atmosphericCandidates: Array<{ key: string; label: string; value: string | null }> = [
    {
      key: 'humidity',
      label: 'Humidity',
      value: c.humidity !== undefined ? `${c.humidity}${u.humidity}` : null
    },
    {
      key: 'dewPoint',
      label: 'Dew point',
      value: c.dewPoint !== undefined ? `${c.dewPoint}${u.dewPoint || u.temperature}` : null
    },
    {
      key: 'precipitationProbability',
      label: 'Precipitation chance',
      value: c.precipitationProbability !== undefined ? `${c.precipitationProbability}%` : null
    },
    {
      key: 'cloudCover',
      label: 'Cloud cover',
      value: c.cloudCover !== undefined ? `${c.cloudCover}%` : null
    },
    {
      key: 'windSpeed',
      label: 'Wind speed',
      value: c.windSpeed !== undefined ? `${c.windSpeed} ${u.windSpeed}` : null
    },
    {
      key: 'windDirection',
      label: 'Wind direction',
      value: c.windDirection !== undefined ? `${c.windDirection}° (${degreesToCompass(c.windDirection)})` : null
    },
    {
      key: 'windGust',
      label: 'Wind gust',
      value: c.windGust !== undefined ? `${c.windGust} ${u.windGust}` : null
    },
    {
      key: 'pressure',
      label: 'Barometric pressure',
      value: c.pressureSurfaceLevel !== undefined ? `${c.pressureSurfaceLevel} ${u.pressureSurfaceLevel}` : null
    },
    {
      key: 'pressureSeaLevel',
      label: 'Sea level pressure',
      value: c.pressureSeaLevel !== undefined ? `${c.pressureSeaLevel} ${u.pressureSeaLevel}` : null
    },
    {
      key: 'visibility',
      label: 'Visibility',
      value: c.visibility !== undefined ? `${c.visibility} ${u.visibility}` : null
    },
    {
      key: 'uvIndex',
      label: 'UV index',
      value: c.uvIndex !== undefined ? `${c.uvIndex}` : null
    },
    {
      key: 'solarGHI',
      label: 'Solar radiation (GHI)',
      value: c.solarGHI !== undefined ? `${c.solarGHI} ${u.solarGHI}` : null
    },
    {
      key: 'sunshineDuration',
      label: 'Sunshine duration',
      value: c.sunshineDuration !== undefined ? `${c.sunshineDuration} ${u.sunshineDuration}` : null
    },
    {
      key: 'sunrise',
      label: 'Sunrise',
      value: c.sunrise || null
    },
    {
      key: 'sunset',
      label: 'Sunset',
      value: c.sunset || null
    },
    {
      key: 'moonPhase',
      label: 'Moon phase',
      value: c.moonPhase !== undefined ? (MOON_PHASES[c.moonPhase] ?? null) : null
    }
  ]

  const atmosphericItems = atmosphericCandidates.filter(
    (item): item is MetricItem => item.value !== null
  )

  if (atmosphericItems.length > 0) {
    groups.push({
      title: 'Atmospheric & Solar',
      items: atmosphericItems
    })
  }

  // 2. Air Quality metrics (Provided for free via Open-Meteo Air Quality API)
  const airQualityCandidates: Array<{ key: string; label: string; value: string | null }> = [
    {
      key: 'usAqi',
      label: 'US Air Quality (AQI)',
      value: c.usAqi !== undefined ? `${c.usAqi} (${EPA_HEALTH_CONCERN[c.epaHealthConcern ?? 0] || 'Good'})` : null
    },
    {
      key: 'europeanAqi',
      label: 'European AQI',
      value: c.europeanAqi !== undefined ? `${c.europeanAqi} (${getEuropeanAqiLabel(c.europeanAqi)})` : null
    },
    {
      key: 'pm25',
      label: 'Particulate PM 2.5',
      value: c.particulateMatter25 !== undefined ? `${c.particulateMatter25} ${u.particulateMatter25}` : null
    },
    {
      key: 'pm10',
      label: 'Particulate PM 10',
      value: c.particulateMatter10 !== undefined ? `${c.particulateMatter10} ${u.particulateMatter10}` : null
    },
    {
      key: 'no2',
      label: 'Nitrogen Dioxide (NO₂)',
      value: c.pollutantNO2 !== undefined ? `${c.pollutantNO2} ${u.pollutantNO2}` : null
    },
    {
      key: 'o3',
      label: 'Ozone (O₃)',
      value: c.pollutantO3 !== undefined ? `${c.pollutantO3} ${u.pollutantO3}` : null
    },
    {
      key: 'so2',
      label: 'Sulfur Dioxide (SO₂)',
      value: c.pollutantSO2 !== undefined ? `${c.pollutantSO2} ${u.pollutantSO2}` : null
    },
    {
      key: 'co',
      label: 'Carbon Monoxide (CO)',
      value: c.pollutantCO !== undefined ? `${c.pollutantCO} ${u.pollutantCO}` : null
    }
  ]

  const airQualityItems = airQualityCandidates.filter(
    (item): item is MetricItem => item.value !== null
  )

  if (airQualityItems.length > 0) {
    groups.push({
      title: 'Air Quality',
      items: airQualityItems
    })
  }

  // 3. Pollen metrics (Provided for free via Open-Meteo Air Quality API)
  const pollenCandidates: Array<{ key: string; label: string; value: string | null }> = [
    {
      key: 'grassPollen',
      label: 'Grass pollen',
      value: c.grassPollen !== undefined ? `${c.grassPollen} ${u.pollen}` : null
    },
    {
      key: 'birchPollen',
      label: 'Birch pollen',
      value: c.birchPollen !== undefined ? `${c.birchPollen} ${u.pollen}` : null
    },
    {
      key: 'alderPollen',
      label: 'Alder pollen',
      value: c.alderPollen !== undefined ? `${c.alderPollen} ${u.pollen}` : null
    },
    {
      key: 'ragweedPollen',
      label: 'Ragweed pollen',
      value: c.ragweedPollen !== undefined ? `${c.ragweedPollen} ${u.pollen}` : null
    },
    {
      key: 'olivePollen',
      label: 'Olive pollen',
      value: c.olivePollen !== undefined ? `${c.olivePollen} ${u.pollen}` : null
    },
    {
      key: 'mugwortPollen',
      label: 'Mugwort pollen',
      value: c.mugwortPollen !== undefined ? `${c.mugwortPollen} ${u.pollen}` : null
    }
  ]

  const pollenItems = pollenCandidates.filter(
    (item): item is MetricItem => item.value !== null
  )

  if (pollenItems.length > 0) {
    groups.push({
      title: 'Pollen Forecast',
      items: pollenItems
    })
  }

  return groups
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
