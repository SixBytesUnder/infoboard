<template>
  <div class="glass-panel calendar-card">
    <button type="button" class="header-toggle" @click="isOpen = !isOpen">
      <img src="/images/calendar.svg" alt="Calendar" class="calendar-header-icon">
      <span class="header-title">Upcoming Agenda</span>

      <span v-if="calendar?.errorMessage && calendar.events.length > 0" class="stale-pill" :title="calendar.errorMessage">
        Sync Warning
      </span>
      <span v-else-if="calendar?.errorMessage && calendar.events.length === 0" class="stale-pill alert" :title="calendar.errorMessage">
        Sync Failed
      </span>
      <span v-else-if="!calendar" class="event-count loading">
        Connecting...
      </span>
      <span v-else class="event-count">
        {{ calendar.events.length }} {{ calendar.events.length === 1 ? 'event' : 'events' }}
      </span>

      <span class="chevron">{{ isOpen ? '▼' : '▶' }}</span>
    </button>

    <div v-if="isOpen" class="agenda-content">
      <!-- Loading State -->
      <div v-if="!calendar" class="calendar-status-box">
        <span class="status-msg">Fetching calendar feed...</span>
      </div>

      <!-- Sync / Error State (only shown when no events can be displayed) -->
      <div v-else-if="calendar.errorMessage && calendar.events.length === 0" class="calendar-error-banner">
        <span class="error-badge">Sync Failed</span>
        <p class="error-msg">{{ calendar.errorMessage }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="calendar.events.length === 0" class="calendar-status-box">
        <span class="status-msg">No upcoming events scheduled in the next 60 days.</span>
      </div>

      <!-- Events List Grouped by Day -->
      <div v-else class="days-container">
        <div v-for="(dayEvents, dayLabel) in calendar.grouped" :key="dayLabel" class="day-group">
          <div class="day-header">
            <span class="day-badge">{{ formatDayHeading(dayLabel) }}</span>
          </div>

          <div class="events-list">
            <div v-for="(ev, idx) in dayEvents" :key="idx" class="event-item">
              <div class="event-time-col">
                <span class="event-time" :class="{ 'all-day': ev.isAllDay }">
                  {{ ev.startTime }}
                </span>
              </div>
              <div class="event-details">
                <span class="event-title">{{ ev.title }}</span>
                <span v-if="!ev.isAllDay && ev.duration" class="event-duration">{{ ev.duration }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import type { CalendarPayload } from '~~/shared'

const props = withDefaults(defineProps<{
  calendar: CalendarPayload | null
  initialExpand?: boolean
}>(), {
  initialExpand: false
})

const isOpen = ref(props.initialExpand)

const formatDayHeading = (dateStr: string) => {
  const target = dayjs(dateStr)
  const today = dayjs().startOf('day')

  if (target.isSame(today, 'day')) return 'Today'
  if (target.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow'
  return target.format('ddd, D MMM')
}
</script>

<style scoped>
.calendar-card {
  padding: 0.65rem 0.95rem;
  width: fit-content;
  max-width: 100%;
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
  font-weight: 600;
  text-align: left;
}

.calendar-header-icon {
  width: 1.8rem;
  height: 1.8rem;
  object-fit: contain;
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

.chevron {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.agenda-content {
  margin-top: 0.85rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.calendar-status-box {
  padding: 0.75rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
}

.calendar-error-banner {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.error-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #f87171;
  letter-spacing: 0.05em;
}

.error-msg {
  font-size: 0.78rem;
  color: #fca5a5;
  line-height: 1.35;
}

.days-container {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.day-header {
  margin-bottom: 0.1rem;
}

.day-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.82rem;
  line-height: 1.3;
}

.event-time-col {
  min-width: 65px;
}

.event-time {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.event-time.all-day {
  color: #38bdf8;
  font-weight: 600;
}

.event-details {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.event-title {
  color: var(--text-primary);
  word-break: break-word;
}

.event-duration {
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
