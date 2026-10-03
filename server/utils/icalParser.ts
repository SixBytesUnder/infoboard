import nodeIcal from 'node-ical'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween.js'
import duration from 'dayjs/plugin/duration.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import type { CalendarEvent } from '~~/shared'

dayjs.extend(isBetween)
dayjs.extend(duration)
dayjs.extend(relativeTime)

interface ParsedEventList {
  events: CalendarEvent[]
  grouped: Record<string, CalendarEvent[]>
}

function extractString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object' && 'val' in val && typeof (val as { val: unknown }).val === 'string') {
    return (val as { val: string }).val
  }
  return fallback
}

function toDate(val: unknown): Date | null {
  if (val instanceof Date) return val
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    if (!Number.isNaN(d.getTime())) return d
  }
  if (val && typeof val === 'object' && 'val' in val) {
    const inner = (val as { val: unknown }).val
    if (inner instanceof Date) return inner
    if (typeof inner === 'string' || typeof inner === 'number') {
      const d = new Date(inner)
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  return null
}

export function parseICalEvents(
  rawIcs: string,
  limit = 10,
  horizonDays = 60,
  dateFormat = 'YYYY-MM-DD',
  timeFormat = 'HH:mm'
): ParsedEventList {
  const eventsList: CalendarEvent[] = []
  const parsedData = nodeIcal.sync.parseICS(rawIcs)
  const rangeStart = dayjs().startOf('day')
  const rangeEnd = dayjs().add(horizonDays, 'day').endOf('day')

  for (const key of Object.keys(parsedData)) {
    const item = parsedData[key]
    if (!item || item.type !== 'VEVENT') continue

    const summary = extractString(item.summary, 'Untitled Event')
    const startDateObj = toDate(item.start)
    const endDateObj = toDate(item.end)
    if (!startDateObj || !endDateObj) continue

    const eventStart = dayjs(startDateObj)
    const eventEnd = dayjs(endDateObj)
    const durationMs = eventEnd.diff(eventStart)

    // Check if event is all-day
    const isAllDay = Boolean(
      (item as { datetype?: string }).datetype === 'date' ||
      (eventStart.format('HH:mm') === '00:00' && eventEnd.format('HH:mm') === '00:00') ||
      eventStart.isSame(eventEnd)
    )

    // Simple non-recurring event
    if (!item.rrule) {
      if (eventEnd.isAfter(rangeStart) && eventStart.isBefore(rangeEnd)) {
        eventsList.push({
          title: summary,
          sort: eventStart.unix(),
          startDate: eventStart.format(dateFormat),
          startTime: isAllDay ? 'All Day' : eventStart.format(timeFormat),
          endDate: eventEnd.format(dateFormat),
          endTime: isAllDay ? 'All Day' : eventEnd.format(timeFormat),
          duration: dayjs.duration(durationMs).humanize(),
          isAllDay
        })
      }
    } else {
      // Recurring event with RRULE
      const rule = item.rrule
      const dates = rule.between(rangeStart.toDate(), rangeEnd.toDate(), true)

      for (const occurrenceDate of dates) {
        let currentSummary = summary
        let currentStart = dayjs(occurrenceDate)
        let currentDurationMs = durationMs
        let showEvent = true

        const dateLookupKey = occurrenceDate.toISOString().substring(0, 10)

        // Check for recurrence overrides
        if (item.recurrences && item.recurrences[dateLookupKey]) {
          const override = item.recurrences[dateLookupKey]
          if (override.summary) currentSummary = extractString(override.summary, currentSummary)
          const overrideStart = toDate(override.start)
          const overrideEnd = toDate(override.end)

          if (overrideStart) currentStart = dayjs(overrideStart)
          if (overrideEnd && overrideStart) {
            currentDurationMs = dayjs(overrideEnd).diff(dayjs(overrideStart))
          }
        } else if (item.exdate && item.exdate[dateLookupKey]) {
          // Excluded date
          showEvent = false
        }

        const currentEnd = currentStart.add(currentDurationMs, 'millisecond')

        if (currentEnd.isBefore(rangeStart) || currentStart.isAfter(rangeEnd)) {
          showEvent = false
        }

        if (showEvent) {
          eventsList.push({
            title: currentSummary,
            sort: currentStart.unix(),
            startDate: currentStart.format(dateFormat),
            startTime: isAllDay ? 'All Day' : currentStart.format(timeFormat),
            endDate: currentEnd.format(dateFormat),
            endTime: isAllDay ? 'All Day' : currentEnd.format(timeFormat),
            duration: dayjs.duration(currentDurationMs).humanize(),
            isAllDay
          })
        }
      }
    }
  }

  // Sort chronologically and take up to limit
  eventsList.sort((a, b) => a.sort - b.sort)
  const sliced = eventsList.slice(0, limit)

  // Group by date
  const grouped: Record<string, CalendarEvent[]> = {}
  for (const ev of sliced) {
    if (!grouped[ev.startDate]) {
      grouped[ev.startDate] = []
    }
    const bucket = grouped[ev.startDate]
    if (bucket) {
      bucket.push(ev)
    }
  }

  return {
    events: sliced,
    grouped
  }
}
