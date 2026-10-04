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

        <div class="temp-section">
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

        <div class="attribution-section">
          <a href="https://www.tomorrow.io/" target="_blank" rel="noopener noreferrer" class="attribution-link">Powered by Tomorrow.io</a>
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
  padding: 0.85rem 1.25rem;
  width: fit-content;
  max-width: 440px;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 1.1rem;
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
  transform: scale(1.06);
}

.weather-icon-btn:active {
  transform: scale(0.95);
}

.weather-icon {
  width: 4.6rem;
  height: 4.6rem;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pin-icon {
  width: 0.9rem;
  height: 0.9rem;
  opacity: 0.85;
}

.location-name {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.temp-section {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.temp-val {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.feels-like {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.condition-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-top: 0.1rem;
}

.condition-text {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

.more-btn {
  padding: 0.15rem 0.55rem;
  font-size: 0.7rem;
}

.more-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.attribution-section {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.2rem;
}

.attribution-link {
  font-size: 0.55rem;
  color: var(--text-muted);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.attribution-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.updated-time {
  font-size: 0.55rem;
  color: var(--text-muted);
  opacity: 0.75;
}

@media (max-width: 576px) {
  .weather-card {
    padding: 0.75rem 1rem;
  }
  .weather-icon {
    width: 3.6rem;
    height: 3.6rem;
  }
  .temp-val {
    font-size: 2rem;
  }
}
</style>
