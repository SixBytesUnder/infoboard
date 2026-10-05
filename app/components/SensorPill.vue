<template>
  <div v-if="hasAnySensor" class="glass-panel sensor-pill-panel">
    <!-- DHT / Sense HAT Indoor Temp -->
    <div v-if="sensors?.temperature !== undefined" class="sensor-chip">
      <div class="sensor-icon-wrap">
        <img src="/images/temperature.svg" alt="Temp" class="sensor-icon">
      </div>
      <span class="sensor-value">{{ formatVal(sensors.temperature) }}°C</span>
    </div>

    <!-- DHT / Sense HAT Indoor Humidity -->
    <div v-if="sensors?.humidity !== undefined" class="sensor-chip">
      <div class="sensor-icon-wrap">
        <img src="/images/humidity.svg" alt="Humidity" class="sensor-icon">
      </div>
      <span class="sensor-value">{{ formatVal(sensors.humidity) }}%</span>
    </div>

    <!-- Sense HAT Pressure -->
    <div v-if="sensors?.pressure !== undefined" class="sensor-chip">
      <div class="sensor-icon-wrap">
        <span class="sensor-sub-label">BARO</span>
      </div>
      <span class="sensor-value">{{ formatVal(sensors.pressure) }} hPa</span>
    </div>

    <!-- SDS011 Air Quality PM2.5 / PM10 -->
    <div v-if="sensors?.pm25 !== undefined" class="sensor-chip sds-chip">
      <div class="sensor-icon-wrap">
        <img
          :src="`/images/sds_${sensors.airQualityRating || 'smile'}.svg`"
          :alt="sensors.airQualityRating || 'smile'"
          class="sensor-icon sds-icon"
        >
      </div>
      <div class="sds-text">
        <span>PM2.5: {{ formatVal(sensors.pm25) }}</span>
        <span v-if="sensors.pm10 !== undefined">PM10: {{ formatVal(sensors.pm10) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SensorReadings } from '~~/shared'

const props = defineProps<{
  sensors: SensorReadings | null
}>()

const hasAnySensor = computed(() => {
  const s = props.sensors
  if (!s) return false
  return s.temperature !== undefined || s.humidity !== undefined || s.pressure !== undefined || s.pm25 !== undefined
})

const formatVal = (val?: number) => {
  if (val === undefined || Number.isNaN(val)) return ''
  return Math.round(val * 10) / 10
}
</script>

<style scoped>
.sensor-pill-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  width: fit-content;
}

.sensor-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sensor-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  flex-shrink: 0;
}

.sensor-icon {
  width: 1.15rem;
  height: 1.15rem;
  object-fit: contain;
}

.sensor-value {
  white-space: nowrap;
}

.sensor-sub-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.sds-chip {
  gap: 0.45rem;
}

.sds-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.sds-text {
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  line-height: 1.2;
}
</style>
