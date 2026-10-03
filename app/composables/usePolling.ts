import { ref, onMounted, onScopeDispose, type Ref } from 'vue'

export interface PollingOptions<T> {
  fn: (signal: AbortSignal) => Promise<T>
  intervalMs: number
  immediate?: boolean
  onError?: (err: Error) => void
}

export interface PollingReturn<T> {
  data: Ref<T | null>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
  stop: () => void
  start: () => void
}

export function usePolling<T>(options: PollingOptions<T>): PollingReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const pending = ref(false)
  const error = ref<Error | null>(null)

  let timerId: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null
  let isRunning = false
  let isMounted = false

  const clearExistingTimer = () => {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  const abortActiveRequest = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const execute = async () => {
    if (!isRunning) return

    // If tab is currently hidden, pause execution until visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }

    abortActiveRequest()
    abortController = new AbortController()
    pending.value = true
    error.value = null

    try {
      const result = await options.fn(abortController.signal)
      data.value = result
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== 'AbortError') {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        error.value = errorObj
        options.onError?.(errorObj)
      }
    } finally {
      pending.value = false
      scheduleNext()
    }
  }

  const scheduleNext = () => {
    clearExistingTimer()
    if (isRunning && typeof window !== 'undefined') {
      timerId = setTimeout(execute, options.intervalMs)
    }
  }

  const start = () => {
    if (isRunning) return
    isRunning = true
    execute()
  }

  const stop = () => {
    isRunning = false
    clearExistingTimer()
    abortActiveRequest()
  }

  const refresh = async () => {
    clearExistingTimer()
    await execute()
  }

  // Handle visibility changes to save Pi CPU and avoid background rate burns
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isRunning) {
      execute()
    } else {
      clearExistingTimer()
      abortActiveRequest()
    }
  }

  // Resume immediately on network reconnect
  const handleOnline = () => {
    if (isRunning) {
      execute()
    }
  }

  onMounted(() => {
    isMounted = true
    isRunning = true

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    if (options.immediate !== false) {
      execute()
    } else {
      scheduleNext()
    }
  })

  onScopeDispose(() => {
    isMounted = false
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
    }
  })

  return {
    data,
    pending,
    error,
    refresh,
    stop,
    start
  }
}
