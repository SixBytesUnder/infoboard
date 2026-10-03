import type { CalendarPayload } from '~~/shared'
import { parseICalEvents } from '../utils/icalParser'

let lastKnownCalendar: CalendarPayload | null = null

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

  try {
    const rawIcs = await $fetch<string>(calendarConf.icalUrl, {
      responseType: 'text',
      signal: AbortSignal.timeout(8000)
    })

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
  }
})
