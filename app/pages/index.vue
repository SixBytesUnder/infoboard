<template>
  <main class="kiosk-layout" :class="{ 'is-magic-mirror': isMagicMirror }">
    <!-- Fullscreen Dynamic Background Layer -->
    <BackgroundHost
      ref="bgRef"
      :source="config.media.source"
      :interval-seconds="config.media.interval"
      :is-muted="isMuted"
      :magic-mirror="isMagicMirror"
      :weather-tag="weatherData?.current?.conditionText"
      @update:active-asset="activeAsset = $event"
      @update:is-video="isVideoActive = $event"
    />

    <!-- Foreground Content Layer -->
    <div class="kiosk-content">
      <!-- Top Row: Time & Date (Left) | Weather Hero (Right) -->
      <header class="top-row">
        <DateTimeCard
          :time-format="config.app.timeFormat"
          :date-format="config.app.dateFormat"
        />

        <WeatherCard
          v-if="config.weather.enabled"
          :weather="weatherData"
          :show-more="showWeatherMore"
          @toggle-forecast="showForecast = !showForecast"
          @toggle-more="showWeatherMore = !showWeatherMore"
        />
      </header>

      <!-- 7-Day Forecast Row -->
      <section v-if="config.weather.enabled && showForecast && weatherData" class="forecast-section">
        <ForecastRow :forecast="weatherData.forecast" />
      </section>

      <!-- Bottom Columns: Left (Transit, Agenda) | Right (Microclimate, Sensors) -->
      <div class="bottom-grid">
        <section class="bottom-col left-col">
          <TransitCard
            v-if="config.transit.enabled"
            :transit="transitData"
            :initial-expand="config.app.autoExpandTransit"
          />

          <CalendarCard
            v-if="config.calendar.enabled"
            :calendar="calendarData"
            :initial-expand="config.app.autoExpandCalendar"
          />
        </section>

        <section class="bottom-col right-col">
          <WeatherMoreDrawer
            v-if="config.weather.enabled && showWeatherMore && weatherData"
            :weather="weatherData"
          />

          <SensorPill
            v-if="hasSensorsEnabled"
            :sensors="sensorData"
          />
        </section>
      </div>
    </div>

    <!-- Floating Action Bar & EXIF Modal -->
    <KioskActionBar
      v-if="config.app.navButtons && !isMagicMirror"
      :is-video="isVideoActive"
      :is-muted="isMuted"
      :show-exif-button="config.app.showExif && activeAsset?.type === 'image' && isLocalMedia"
      :show-nav-buttons="config.app.navButtons"
      :is-local-source="isLocalMedia"
      :is-nav-disabled="false"
      @toggle-mute="isMuted = !isMuted"
      @toggle-exif="toggleExifModal"
      @next-image="bgRef?.nextImage()"
      @next-folder="bgRef?.nextFolder()"
    />

    <ExifModal
      v-if="showExifModal"
      :exif="exifData"
      @close="showExifModal = false"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePolling } from '~/composables/usePolling'
import type {
  ClientDashboardConfig,
  WeatherPayload,
  TransitPayload,
  CalendarPayload,
  SensorReadings,
  MediaAsset,
  ExifMetadata
} from '~~/shared'

const runtimeConfig = useRuntimeConfig()
const config = runtimeConfig.public as unknown as ClientDashboardConfig

const isMagicMirror = computed(() => config.app.magicMirror)
const hasSensorsEnabled = computed(() => {
  return config.sensor.dhtEnabled || config.sensor.senseHatEnabled || config.sensor.sdsEnabled
})
const isLocalMedia = computed(() => config.media.source === 'local' || config.media.source === 'single')

// UI Expand/Collapse States
const showForecast = ref(config.app.autoExpandForecast)
const showWeatherMore = ref(config.app.autoExpandWeather)
const isMuted = ref(config.media.videoMuted)
const isVideoActive = ref(false)
const activeAsset = ref<MediaAsset | null>(null)
const showExifModal = ref(false)
const exifData = ref<ExifMetadata | null>(null)

const bgRef = ref<{ nextImage: () => void; nextFolder: () => void } | null>(null)

// 1. Weather Polling
const { data: weatherData } = usePolling<WeatherPayload>({
  fn: (signal) => $fetch<WeatherPayload>('/api/weather', { signal }),
  intervalMs: config.weather.refreshMs
})

// 2. Transit Polling
const { data: transitData } = usePolling<TransitPayload>({
  fn: (signal) => $fetch<TransitPayload>('/api/tfl', { signal }),
  intervalMs: config.transit.refreshMs
})

// 3. Calendar Polling
const { data: calendarData } = usePolling<CalendarPayload>({
  fn: (signal) => $fetch<CalendarPayload>('/api/calendar', { signal }),
  intervalMs: config.calendar.refreshMs
})

// 4. Sensors Polling
const { data: sensorData } = usePolling<SensorReadings>({
  fn: (signal) => $fetch<SensorReadings>('/api/sensors', { signal }),
  intervalMs: config.sensor.refreshMs
})

// EXIF modal handler
const toggleExifModal = async () => {
  if (showExifModal.value) {
    showExifModal.value = false
    return
  }
  if (!activeAsset.value?.identifier) return

  try {
    const data = await $fetch<ExifMetadata>(`/api/exif?file=${encodeURIComponent(activeAsset.value.identifier)}`)
    exifData.value = data
    showExifModal.value = true
  } catch (err) {
    console.warn('Failed to load EXIF:', (err as Error).message)
  }
}
</script>

<style scoped>
.kiosk-layout {
  position: relative;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

.kiosk-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  min-height: 100vh;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.forecast-section {
  width: 100%;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.bottom-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-col {
  align-items: flex-end;
}

@media (max-width: 900px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .right-col {
    align-items: flex-start;
  }
}

@media (max-width: 576px) {
  .kiosk-content {
    padding: 0.75rem;
    gap: 0.85rem;
  }
  .top-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
