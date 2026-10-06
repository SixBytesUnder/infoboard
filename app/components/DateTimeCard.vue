<template>
  <div class="glass-panel datetime-card">
    <h1 class="time-display">{{ time }}</h1>
    <p class="date-display">{{ date }}</p>
  </div>
</template>

<script setup lang="ts">
import { useSystemClock } from '~/composables/useSystemClock'

const props = withDefaults(defineProps<{
  timeFormat?: string
  dateFormat?: string
}>(), {
  timeFormat: 'HH:mm:ss',
  dateFormat: 'dddd, Do MMMM YYYY'
})

const { time, date } = useSystemClock(props.timeFormat, props.dateFormat)
</script>

<style scoped>
.datetime-card {
  padding: 0.85rem 1.25rem;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  width: fit-content;
}

.time-display {
  font-family: var(--font-mono);
  font-size: 5.5rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.date-display {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 0.6rem;
  letter-spacing: 0.02em;
}

@media (max-width: 768px) {
  .time-display {
    font-size: 3.2rem;
  }
  .date-display {
    font-size: 1.05rem;
  }
}

@media (max-width: 480px) {
  .time-display {
    font-size: 2.5rem;
  }
  .date-display {
    font-size: 0.95rem;
  }
}
</style>
