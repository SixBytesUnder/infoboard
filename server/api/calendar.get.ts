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
    if (lastKnownCalendar) {
      return {
        ...lastKnownCalendar,
        isStale: true
      }
    }
    return {
      events: [],
      grouped: {},
      fetchedAt: new Date().toISOString(),
      isStale: true
    }
  }
})
