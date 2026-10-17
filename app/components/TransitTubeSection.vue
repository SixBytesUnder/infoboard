<template>
  <div class="glass-panel transit-card" :class="{ 'is-minimal': isMinimal, 'is-expanded': isOpen }">
    <button
      type="button"
      class="header-toggle"
      :class="{ 'is-minimal': isMinimal && !isOpen }"
      :aria-label="isMinimal && !isOpen ? 'Transport Status' : undefined"
      :aria-expanded="isOpen"
      :title="isMinimal && !isOpen ? (hasDisruptions ? 'Transport Status: Disruptions' : 'Transport Status: Good Service') : undefined"
      @click="$emit('toggle')"
    >
      <img src="/images/tube.svg" alt="" aria-hidden="true" class="transit-header-icon">
      <template v-if="!isMinimal || isOpen">
        <span class="header-title">Transport Status</span>
        <span v-if="hasDisruptions" class="stale-pill alert">Disruptions</span>
        <span v-else class="event-count status-good">Good Service</span>
        <span class="chevron" aria-hidden="true">{{ isOpen ? '▼' : '▶' }}</span>
      </template>
    </button>

    <div v-if="isOpen" class="transit-content">
      <div class="tube-lines-grid">
        <div
          v-for="line in lines"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TFL_LINE_COLORS } from '~~/shared'
import type { TfLLineStatus } from '~~/shared'

const props = defineProps<{
  lines: TfLLineStatus[]
  isMinimal: boolean
  isOpen: boolean
}>()

defineEmits<{
  toggle: []
}>()

const hasDisruptions = computed(() => {
  return props.lines.some(l => l.statusSeverity < 10)
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
