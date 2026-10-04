import type { CalendarPayload } from '~~/shared'
import { parseICalEvents } from '../utils/icalParser'

let lastKnownCalendar: CalendarPayload | null = null
let lastFetchedTime = 0
let inFlightFetch: Promise<CalendarPayload> | null = null

export default defineEventHandler(async (event): Promise<CalendarPayload> => {
  const config = useRuntimeConfig(event)
  const calendarConf = config.calendar
  const publicConf = config.public.calendar

  if (!calendarConf.icalUrl) {
    return {
      events: [],
      grouped: {},
      fetchedAt: new Date().toISOString()
    }
  }

  const now = Date.now()
  const cacheTtlMs = Math.max(calendarConf.cacheTtl || 900, 60) * 1000

  // 1. Return fresh cached payload if within TTL
  if (lastKnownCalendar && (now - lastFetchedTime < cacheTtlMs)) {
    return lastKnownCalendar
  }

  // 2. Coalesce concurrent requests into a single in-flight fetch
  if (inFlightFetch) {
    return inFlightFetch
  }

  inFlightFetch = (async () => {
    // Helper to fetch with retry and 20s timeout (accommodating Google's 800KB dynamic generation)
    const fetchIcsWithRetry = async (retries = 1): Promise<string> => {
      try {
        return await $fetch<string>(calendarConf.icalUrl, {
          responseType: 'text',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Infoboard/4.0',
            'Accept': 'text/calendar, text/plain, */*'
          },
          signal: AbortSignal.timeout(20000)
        })
      } catch (err) {
        if (retries > 0) {
          console.warn(`Calendar fetch attempt failed, retrying in 1.5s... (${(err as Error).message})`)
          await new Promise(resolve => setTimeout(resolve, 1500))
          return fetchIcsWithRetry(retries - 1)
        }
        throw err
      }
    }

    try {
      const rawIcs = await fetchIcsWithRetry(1)

      const parsed = parseICalEvents(
        rawIcs,
        calendarConf.maxEvents,
        60,
        publicConf.dateFormat,
        publicConf.timeFormat
      )

      const payload: CalendarPayload = {
        events: parsed.events,
        grouped: parsed.grouped,
        fetchedAt: new Date().toISOString()
      }

      lastKnownCalendar = payload
      lastFetchedTime = Date.now()
      return payload
    } catch (err) {
      const msg = (err as Error).message || 'Failed to fetch calendar'
      console.warn(`Calendar fetch failed (${calendarConf.icalUrl}):`, msg)
      const friendlyError = msg.includes('404')
        ? 'Calendar feed not found (HTTP 404). For Google Calendar, use the "Secret address in iCal format" from Settings.'
        : `Calendar sync error: ${msg}`

      if (lastKnownCalendar) {
        return {
          ...lastKnownCalendar,
          isStale: true,
          errorMessage: friendlyError
        }
      }

      return {
        events: [],
        grouped: {},
        fetchedAt: new Date().toISOString(),
        isStale: true,
        errorMessage: friendlyError
      }
    } finally {
      inFlightFetch = null
    }
  })()

  return inFlightFetch
})
