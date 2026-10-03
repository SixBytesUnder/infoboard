<template>
  <div v-if="hasAnySensor" class="glass-panel sensor-pill-panel">
    <!-- DHT / Sense HAT Indoor Temp -->
    <div v-if="sensors?.temperature !== undefined" class="sensor-chip">
      <img src="/images/temperature.svg" alt="Temp" class="sensor-icon">
      <span class="sensor-value">{{ sensors.temperature }}°C</span>
    </div>

    <!-- DHT / Sense HAT Indoor Humidity -->
    <div v-if="sensors?.humidity !== undefined" class="sensor-chip">
      <img src="/images/humidity.svg" alt="Humidity" class="sensor-icon">
      <span class="sensor-value">{{ sensors.humidity }}%</span>
    </div>

    <!-- Sense HAT Pressure -->
    <div v-if="sensors?.pressure !== undefined" class="sensor-chip">
      <span class="sensor-sub-label">BARO</span>
      <span class="sensor-value">{{ sensors.pressure }} hPa</span>
    </div>

    <!-- SDS011 Air Quality PM2.5 / PM10 -->
    <div v-if="sensors?.pm25 !== undefined" class="sensor-chip sds-chip">
      <img
        :src="`/images/sds_${sensors.airQualityRating || 'smile'}.svg`"
        :alt="sensors.airQualityRating || 'smile'"
        class="sensor-icon sds-icon"
      >
      <div class="sds-text">
        <span>PM2.5: {{ sensors.pm25 }}</span>
        <span v-if="sensors.pm10 !== undefined">PM10: {{ sensors.pm10 }}</span>
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
</script>

<style scoped>
.sensor-pill-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem 0.9rem;
  width: fit-content;
}

.sensor-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sensor-icon {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
}

.sensor-sub-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 700;
}

.sds-chip {
  gap: 0.5rem;
}

.sds-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.sds-text {
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  line-height: 1.15;
}
</style>
