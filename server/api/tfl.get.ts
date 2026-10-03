import type { TransitPayload, TfLLineStatus } from '~~/shared'

interface RawTfLLine {
  id: string
  name: string
  lineStatuses: Array<{
    statusSeverity: number
    statusSeverityDescription: string
    reason?: string
  }>
}

interface RawTfLArrival {
  lineName: string
  destinationName: string
  stationName: string
  timeToStation: number
}

let lastKnownTransit: TransitPayload | null = null

export default defineEventHandler(async (event): Promise<TransitPayload> => {
  const config = useRuntimeConfig(event)
  const transitConf = config.transit

  const authParams = new URLSearchParams()
  if (transitConf.tflAppId) authParams.append('app_id', transitConf.tflAppId)
  if (transitConf.tflAppKey) authParams.append('app_key', transitConf.tflAppKey)
  const authQuery = authParams.toString() ? `?${authParams.toString()}` : ''

  const linesList: TfLLineStatus[] = []
  const busesMap: Record<string, Record<string, string[]>> = {}

  const rawLineModes = transitConf.lineModes as unknown
  const lineModes: string[] = Array.isArray(rawLineModes)
    ? (rawLineModes as string[])
    : (typeof rawLineModes === 'string' ? (rawLineModes as string).split(',') : [])
        .map((s: string) => s.trim())
        .filter(Boolean)

  const rawBusStops = transitConf.busStops as unknown
  const busStops: string[] = Array.isArray(rawBusStops)
    ? (rawBusStops as string[])
    : (typeof rawBusStops === 'string' ? (rawBusStops as string).split(',') : [])
        .map((s: string) => s.trim())
        .filter(Boolean)

  try {
    // 1. Fetch Line statuses
    const modeParam = lineModes.join(',')
    if (modeParam) {
      try {
        const rawLines = await $fetch<RawTfLLine[]>(
          `https://api.tfl.gov.uk/line/mode/${modeParam}/status${authQuery}`,
          { signal: AbortSignal.timeout(8000) }
        )

        for (const line of rawLines) {
          const mainStatus = line.lineStatuses[0]
          linesList.push({
            id: line.id,
            name: line.name,
            statusSeverity: mainStatus?.statusSeverity ?? 10,
            statusSeverityDescription: mainStatus?.statusSeverityDescription ?? 'Good Service',
            reason: mainStatus?.reason
          })
        }
      } catch (err) {
        console.warn('TfL lines status fetch failed:', (err as Error).message)
      }
    }

    // 2. Fetch Bus stop arrivals in parallel
    if (busStops.length > 0) {
      const arrivalsResults = await Promise.allSettled(
        busStops.map(stopId =>
          $fetch<RawTfLArrival[]>(`https://api.tfl.gov.uk/StopPoint/${stopId}/Arrivals${authQuery}`, {
            signal: AbortSignal.timeout(8000)
          })
        )
      )

      for (const res of arrivalsResults) {
        if (res.status !== 'fulfilled') continue
        const arrivals = res.value || []

        for (const arr of arrivals) {
          const stopTitle = `${arr.stationName} ↦ ${arr.destinationName}`
          if (!busesMap[stopTitle]) {
            busesMap[stopTitle] = {}
          }
          const stopObj = busesMap[stopTitle]
          if (stopObj && !stopObj[arr.lineName]) {
            stopObj[arr.lineName] = []
          }

          const minutes = Math.round(arr.timeToStation / 60)
          const timeLabel = minutes <= 0 ? 'Due' : `${minutes}m`

          if (stopObj && stopObj[arr.lineName] && !stopObj[arr.lineName]!.includes(timeLabel)) {
            stopObj[arr.lineName]!.push(timeLabel)
          }
        }
      }

      // Sort bus arrivals for each line
      for (const stop of Object.keys(busesMap)) {
        const stopLines = busesMap[stop]
        if (!stopLines) continue
        for (const lineName of Object.keys(stopLines)) {
          const times = stopLines[lineName]
          if (!times) continue
          times.sort((a, b) => {
            if (a === 'Due') return -1
            if (b === 'Due') return 1
            const numA = Number.parseInt(a, 10) || 0
            const numB = Number.parseInt(b, 10) || 0
            return numA - numB
          })
        }
      }
    }

    const payload: TransitPayload = {
      lines: linesList,
      buses: busesMap,
      fetchedAt: new Date().toISOString()
    }

    lastKnownTransit = payload
    return payload
  } catch (err) {
    const msg = (err as Error).message || 'TfL API request failed'
    console.warn('TfL transit fetch failed:', msg)

    if (lastKnownTransit) {
      return {
        ...lastKnownTransit,
        isStale: true,
        errorMessage: `Transit sync error: ${msg}`
      }
    }
    return {
      lines: [],
      buses: {},
      fetchedAt: new Date().toISOString(),
      isStale: true,
      errorMessage: `Transit sync error: ${msg}`
    }
  }
})
