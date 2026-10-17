import { ref, onMounted, onScopeDispose, computed, toValue, type MaybeRefOrGetter } from 'vue'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'

dayjs.extend(advancedFormat)

const now = ref(dayjs())
let listenerCount = 0
let timerId: ReturnType<typeof setInterval> | null = null

function tick() {
  now.value = dayjs()
}

export function useSystemClock(
  timeFormat: MaybeRefOrGetter<string> = 'HH:mm:ss',
  dateFormat: MaybeRefOrGetter<string> = 'dddd, Do MMMM YYYY'
) {
  if (import.meta.server) {
    const serverNow = dayjs()
    return {
      now: ref(serverNow),
      time: computed(() => serverNow.format(toValue(timeFormat))),
      date: computed(() => serverNow.format(toValue(dateFormat)))
    }
  }

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

  const formattedTime = computed(() => now.value.format(toValue(timeFormat)))
  const formattedDate = computed(() => now.value.format(toValue(dateFormat)))

  return {
    now,
    time: formattedTime,
    date: formattedDate
  }
}
