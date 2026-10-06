<template>
  <div class="transit-container" :class="{ 'is-minimal': isMinimal }">
    <!-- Loading Placeholder -->
    <div v-if="!transit" class="glass-panel transit-card" :class="{ 'is-minimal': isMinimal }">
      <div
        class="header-toggle"
        :class="{ 'is-minimal': isMinimal }"
        :title="isMinimal ? 'Transport for London: Connecting...' : undefined"
      >
        <img src="/images/bus.svg" alt="Transit" class="transit-header-icon">
        <template v-if="!isMinimal">
          <span class="header-title">Transport for London</span>
          <span class="event-count loading">Connecting...</span>
        </template>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="transit.errorMessage && !hasBuses && transit.lines.length === 0" class="glass-panel transit-card" :class="{ 'is-minimal': isMinimal }">
      <div
        class="header-toggle"
        :class="{ 'is-minimal': isMinimal }"
        :title="isMinimal ? 'Transport for London: Sync Error' : undefined"
      >
        <img src="/images/tube.svg" alt="Transit" class="transit-header-icon">
        <template v-if="!isMinimal">
          <span class="header-title">Transport for London</span>
          <span class="stale-pill">Sync Error</span>
        </template>
      </div>
      <div class="transit-content">
        <p class="error-msg">{{ transit.errorMessage }}</p>
      </div>
    </div>

    <template v-else>
      <!-- Bus Timetables Section -->
      <div v-if="hasBuses" class="transit-block">
        <div class="glass-panel transit-card" :class="{ 'is-minimal': isMinimal, 'is-expanded': showBuses }">
          <button
            type="button"
            class="header-toggle"
            :class="{ 'is-minimal': isMinimal && !showBuses }"
            :aria-label="isMinimal && !showBuses ? 'Live Bus Arrivals' : undefined"
            :aria-expanded="showBuses"
            :title="isMinimal && !showBuses ? `Live Bus Arrivals (${busStopCount} ${busStopCount === 1 ? 'stop' : 'stops'})` : undefined"
            @click="showBuses = !showBuses"
          >
            <img src="/images/bus.svg" alt="Buses" class="transit-header-icon">
            <template v-if="!isMinimal || showBuses">
              <span class="header-title">Live Bus Arrivals</span>
              <span class="event-count">{{ busStopCount }} {{ busStopCount === 1 ? 'stop' : 'stops' }}</span>
              <span class="chevron">{{ showBuses ? '▼' : '▶' }}</span>
            </template>
          </button>

          <div v-if="showBuses" class="transit-content">
            <div v-for="(lines, stopName) in transit.buses" :key="stopName" class="bus-stop-group">
              <h4 class="stop-name">{{ stopName }}</h4>
              <div class="bus-lines">
                <div v-for="(times, lineNum) in lines" :key="lineNum" class="bus-line-row">
                  <span class="kiosk-badge bus-badge">{{ lineNum }}</span>
                  <div class="times-list">
                    <span
                      v-for="(t, idx) in times"
                      :key="idx"
                      class="time-item"
                      :class="{ 'is-due': t === 'Due' }"
                    >
                      {{ t }}<span v-if="idx + 1 < times.length" class="comma">,</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rail & Tube Status Section -->
      <div v-if="transit.lines.length > 0" class="transit-block">
        <div class="glass-panel transit-card" :class="{ 'is-minimal': isMinimal, 'is-expanded': showTube }">
          <button
            type="button"
            class="header-toggle"
            :class="{ 'is-minimal': isMinimal && !showTube }"
            :aria-label="isMinimal && !showTube ? 'Transport Status' : undefined"
            :aria-expanded="showTube"
            :title="isMinimal && !showTube ? (hasDisruptions ? 'Transport Status: Disruptions' : 'Transport Status: Good Service') : undefined"
            @click="showTube = !showTube"
          >
            <img src="/images/tube.svg" alt="Underground" class="transit-header-icon">
            <template v-if="!isMinimal || showTube">
              <span class="header-title">Transport Status</span>
              <span v-if="hasDisruptions" class="stale-pill alert">Disruptions</span>
              <span v-else class="event-count status-good">Good Service</span>
              <span class="chevron">{{ showTube ? '▼' : '▶' }}</span>
            </template>
          </button>

          <div v-if="showTube" class="transit-content">
            <div class="tube-lines-grid">
              <div
                v-for="line in transit.lines"
                :key="line.id"
                class="tube-line-row"
              >
                <span
                  class="kiosk-badge tube-badge"
                  :style="getLineStyle(line.id)"
                >
                  {{ line.name }}
                </span>
                <span
                  class="tube-status"
                  :class="{ 'status-alert': line.statusSeverity < 10 }"
                >
                  {{ line.statusSeverityDescription }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TFL_LINE_COLORS } from '~~/shared'
import type { TransitPayload, ClientDashboardConfig } from '~~/shared'

const props = withDefaults(defineProps<{
  transit: TransitPayload | null
  initialExpand?: boolean
  buttonStyle?: 'verbose' | 'minimal'
}>(), {
  initialExpand: false,
  buttonStyle: undefined
})

const runtimeConfig = useRuntimeConfig()

const isMinimal = computed(() => {
  const style = props.buttonStyle || (runtimeConfig.public as unknown as ClientDashboardConfig)?.transit?.buttonStyle
  return style === 'minimal'
})

const showBuses = ref(props.initialExpand)
const showTube = ref(props.initialExpand)

const hasBuses = computed(() => {
  return !!(props.transit?.buses && Object.keys(props.transit.buses).length > 0)
})

const busStopCount = computed(() => {
  return props.transit?.buses ? Object.keys(props.transit.buses).length : 0
})

const hasDisruptions = computed(() => {
  return props.transit?.lines?.some(l => l.statusSeverity < 10) ?? false
})

const getLineStyle = (lineId: string) => {
  const normalizedId = lineId.toLowerCase().replace(/\s+/g, '-')
  const colors = TFL_LINE_COLORS[normalizedId] || { bg: '#475569', text: '#ffffff' }
  return {
    backgroundColor: colors.bg,
    color: colors.text
  }
}
</script>

<style scoped>
.transit-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: fit-content;
  max-width: 100%;
}

.transit-block {
  width: fit-content;
  max-width: 100%;
}

.transit-card {
  padding: 0.65rem 0.95rem;
  width: fit-content;
  max-width: 100%;
  transition: padding 0.15s ease;
}

.transit-card.is-minimal:not(.is-expanded) {
  padding: 0.55rem 0.65rem;
}

.header-toggle {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  cursor: pointer;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 400;
  text-align: left;
}

.header-toggle.is-minimal {
  gap: 0;
  justify-content: flex-start;
}

.transit-header-icon {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  transition: transform 0.15s ease;
}

.header-toggle:hover .transit-header-icon {
  transform: scale(1.08);
}

.header-toggle:active .transit-header-icon {
  transform: scale(0.95);
}

.header-title {
  flex: 1;
}

.event-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.event-count.loading {
  color: var(--accent-cyan);
  animation: pulse-dot 1.5s infinite;
}

.event-count.status-good {
  color: #34d399;
}

.stale-pill.alert {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.chevron {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.transit-content {
  margin-top: 0.85rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error-msg {
  font-size: 0.78rem;
  color: #fca5a5;
  line-height: 1.35;
}

.bus-stop-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stop-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.bus-line-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.bus-badge {
  background: #ffffff;
  color: #0f172a;
  min-width: 2.2rem;
  font-weight: 700;
}

.times-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.time-item {
  color: var(--text-primary);
}

.time-item.is-due {
  color: #fbbf24;
  font-weight: 700;
}

.tube-lines-grid {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.tube-line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tube-badge {
  min-width: 130px;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.tube-status {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.tube-status.status-alert {
  color: #f87171;
  font-weight: 600;
}
</style>
