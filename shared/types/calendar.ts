export interface CalendarEvent {
  title: string
  sort: number
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  duration: string
  isAllDay: boolean
}

export interface CalendarPayload {
  events: CalendarEvent[]
  grouped: Record<string, CalendarEvent[]>
  fetchedAt: string
  isStale?: boolean
}
