<template>
  <div v-if="weather" class="glass-panel weather-card">
    <div class="weather-main">
      <button 
        type="button" 
        class="weather-icon-btn" 
        :title="'Toggle forecast for ' + weather.current.conditionText" 
        @click="$emit('toggle-forecast')"
      >
        <img
          :src="`/images/${weather.current.weatherCode}.svg`"
          :alt="weather.current.conditionText"
          class="weather-icon"
          @error="handleIconError"
        >
      </button>

      <div class="weather-info">
        <div class="location-row">
          <img src="/images/pin.svg" alt="Location" class="pin-icon">
          <span class="location-name">{{ weather.locationName }}</span>
          <span v-if="weather.isStale" class="stale-pill">
            <span class="stale-dot" />
            Cached
          </span>
        </div>

        <div class="temp-row">
          <span class="temp-val">{{ weather.current.temperature }}°{{ tempUnitLetter }}</span>
          <span class="feels-like">Feels like {{ weather.current.temperatureApparent }}°{{ tempUnitLetter }}</span>
        </div>

        <div class="condition-row">
          <span class="condition-text">{{ weather.current.conditionText }}</span>
          <button
            type="button"
            class="kiosk-btn more-btn"
            :class="{ active: showMore }"
            @click="$emit('toggle-more')"
          >
            {{ showMore ? 'Less' : 'More' }}
          </button>
        </div>

        <div class="attribution-row">
          <a href="https://www.tomorrow.io/" target="_blank" rel="noopener noreferrer">Powered by Tomorrow.io</a>
          <span class="updated-time">Updated: {{ weather.current.updatedAt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherPayload } from '~~/shared'

const props = defineProps<{
  weather: WeatherPayload | null
  showMore: boolean
}>()

defineEmits<{
  'toggle-forecast': []
  'toggle-more': []
}>()

const tempUnitLetter = computed(() => {
  return props.weather?.units === 'imperial' ? 'F' : 'C'
})

const handleIconError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = '/images/missing.svg'
}
</script>

<style scoped>
.weather-card {
  padding: 1.25rem 1.75rem;
  width: fit-content;
  max-width: 480px;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.weather-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.weather-icon-btn:hover {
  transform: scale(1.08);
}

.weather-icon-btn:active {
  transform: scale(0.95);
}

.weather-icon {
  width: 6.5rem;
  height: 6.5rem;
  object-fit: contain;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4));
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pin-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.85;
}

.location-name {
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.temp-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.temp-val {
  font-family: var(--font-mono);
  font-size: 3.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.feels-like {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.condition-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.condition-text {
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-primary);
}

.more-btn {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
}

.more-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.attribution-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
  gap: 0.75rem;
}

.attribution-row a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.attribution-row a:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}

@media (max-width: 576px) {
  .weather-card {
    padding: 1rem;
  }
  .weather-icon {
    width: 4.8rem;
    height: 4.8rem;
  }
  .temp-val {
    font-size: 2.5rem;
  }
}
</style>
