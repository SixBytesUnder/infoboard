import { ref, onMounted, onScopeDispose, computed } from 'vue'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'

dayjs.extend(advancedFormat)

const now = ref(dayjs())
let listenerCount = 0
let timerId: ReturnType<typeof setInterval> | null = null

function tick() {
  now.value = dayjs()
}

export function useSystemClock(timeFormat = 'HH:mm:ss', dateFormat = 'dddd, Do MMMM YYYY') {
  onMounted(() => {
    listenerCount++
    if (listenerCount === 1) {
      tick()
      timerId = setInterval(tick, 1000)
    }
  })

  onScopeDispose(() => {
    listenerCount--
    if (listenerCount <= 0) {
      listenerCount = 0
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    }
  })

  const formattedTime = computed(() => now.value.format(timeFormat))
  const formattedDate = computed(() => now.value.format(dateFormat))

  return {
    now,
    time: formattedTime,
    date: formattedDate
  }
}
