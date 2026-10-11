import { WEATHER_CODES } from '~~/shared'
import type { WeatherPayload, DayForecast, CurrentWeather } from '~~/shared'
import dayjs from 'dayjs'

interface TomorrowTimelineItem {
  timestep: 'current' | '1d' | '1h'
  startTime: string
  intervals: Array<{
    startTime: string
    values: Record<string, number>
  }>
}

interface TomorrowResponse {
  data?: {
    timelines?: TomorrowTimelineItem[]
  }
}

// In-memory fallback in case of upstream rate-limiting or network outage
let lastKnownGoodWeather: WeatherPayload | null = null

export default defineEventHandler(async (event): Promise<WeatherPayload> => {
  const config = useRuntimeConfig(event)
  const weatherConf = config.weather
  const publicConf = config.public.weather
  const units: 'metric' | 'imperial' = weatherConf.units === 'imperial' ? 'imperial' : 'metric'

  if (!weatherConf.apiKey) {
    // Generate realistic demo weather data if no API key is provided
    const now = dayjs()
    const isImperial = units === 'imperial'
    const baseTemp = isImperial ? 62 : 17

    const mockCurrent: CurrentWeather = {
      temperature: baseTemp,
      temperatureApparent: baseTemp - 1,
      humidity: 68,
      windSpeed: isImperial ? 8 : 3.6,
      windGust: isImperial ? 14 : 6.2,
      windDirection: 180,
      pressureSurfaceLevel: isImperial ? 29.92 : 1014,
      pressureSeaLevel: isImperial ? 30.01 : 1016,
      precipitationProbability: 10,
      visibility: isImperial ? 10 : 16,
      cloudCover: 25,
      dewPoint: isImperial ? 50 : 10,
      uvIndex: 3,
      uvHealthConcern: 1,
      solarGHI: 240,
      moonPhase: 2,
      particulateMatter25: 7.2,
      particulateMatter10: 12.8,
      pollutantO3: 28,
      pollutantNO2: 12,
      pollutantCO: 0.4,
      pollutantSO2: 1.1,
      epaHealthConcern: 0,
      treeIndex: 1,
      weedIndex: 0,
      grassIndex: 1,
      weatherCode: 1100,
      conditionText: WEATHER_CODES[1100] || 'Mostly Clear',
      updatedAt: now.format('HH:mm:ss')
    }

    const mockForecast: DayForecast[] = []
    const mockCodes = [1000, 1100, 1101, 4001, 1001, 1100, 1000]
    const count = Math.min(Math.max(weatherConf.forecastDays || 7, 1), 14)
    for (let i = 0; i < count; i++) {
      const day = now.add(i, 'day')
      const code = mockCodes[i % mockCodes.length] ?? 1000
      mockForecast.push({
        date: day.format('YYYY-MM-DD'),
        dayName: i === 0 ? 'Today' : day.format('dddd'),
        weatherCode: code,
        conditionText: WEATHER_CODES[code] || 'Clear',
        tempMax: baseTemp + Math.round(Math.sin(i) * 3) + 2,
        tempMin: baseTemp - Math.round(Math.cos(i) * 2) - 3
      })
    }

    return {
      current: mockCurrent,
      forecast: mockForecast,
      locationName: publicConf.locationName,
      units,
      fetchedAt: now.toISOString(),
      isPaidPlan: true,
      hasAirQuality: true,
      hasPollen: true
    }
  }

  try {
    const fields = [
      'temperature',
      'temperatureApparent',
      'temperatureMax',
      'temperatureMin',
      'humidity',
      'windSpeed',
      'windDirection',
      'windGust',
      'pressureSurfaceLevel',
      'pressureSeaLevel',
      'precipitationProbability',
      'visibility',
      'cloudCover',
      'dewPoint',
      'uvIndex',
      'uvHealthConcern',
      'solarGHI',
      'moonPhase',
      'weatherCode',
      // Premium Tier Metrics (included if user account tier has access)
      'particulateMatter25',
      'particulateMatter10',
      'pollutantO3',
      'pollutantNO2',
      'pollutantCO',
      'pollutantSO2',
      'epaHealthConcern',
      'treeIndex',
      'weedIndex',
      'grassIndex'
    ]

    const response = await $fetch<TomorrowResponse>('https://api.tomorrow.io/v4/timelines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: weatherConf.apiKey
      },
      body: {
        location: `${weatherConf.latitude},${weatherConf.longitude}`,
        fields,
        timesteps: ['current', '1d'],
        units
      },
      signal: AbortSignal.timeout(8000)
    })

    const timelines = response.data?.timelines || []
    const currentTimeline = timelines.find(t => t.timestep === 'current')
    const currentInterval = currentTimeline?.intervals[0]
    const values = currentInterval?.values || {}

    const round = (val: number | undefined) => {
      if (val === undefined || val === null || Number.isNaN(val)) return 0
      return weatherConf.roundTemp ? Math.round(val) : Math.round(val * 10) / 10
    }

    const roundOptional = (val: number | undefined) => {
      if (val === undefined || val === null || Number.isNaN(val)) return undefined
      return weatherConf.roundTemp ? Math.round(val) : Math.round(val * 10) / 10
    }

    const roundDecimals = (val: number | undefined, decimals = 0) => {
      if (val === undefined || val === null || Number.isNaN(val)) return undefined
      const factor = 10 ** decimals
      return Math.round(val * factor) / factor
    }

    const weatherCode = values.weatherCode ?? 1000
    const now = dayjs()

    // Determine whether this Tomorrow.io account tier provides air quality or pollen data
    const hasAirQuality = values.particulateMatter25 !== undefined || values.epaHealthConcern !== undefined
    const hasPollen = values.treeIndex !== undefined || values.grassIndex !== undefined || values.weedIndex !== undefined
    const isPaidPlan = hasAirQuality || hasPollen

    const current: CurrentWeather = {
      temperature: round(values.temperature),
      temperatureApparent: round(values.temperatureApparent),
      humidity: Math.round(values.humidity ?? 0),
      windSpeed: roundDecimals(values.windSpeed, 1) ?? 0,
      windGust: roundDecimals(values.windGust, 1) ?? 0,
      windDirection: roundDecimals(values.windDirection),
      pressureSurfaceLevel: Math.round(values.pressureSurfaceLevel ?? 1013),
      pressureSeaLevel: roundDecimals(values.pressureSeaLevel),
      precipitationProbability: roundDecimals(values.precipitationProbability),
      visibility: roundDecimals(values.visibility, 1),
      cloudCover: roundDecimals(values.cloudCover),
      dewPoint: roundOptional(values.dewPoint),
      uvIndex: roundDecimals(values.uvIndex),
      uvHealthConcern: values.uvHealthConcern !== undefined ? Math.round(values.uvHealthConcern) : undefined,
      solarGHI: roundDecimals(values.solarGHI),
      moonPhase: values.moonPhase !== undefined ? Math.round(values.moonPhase) : undefined,
      weatherCode,
      conditionText: WEATHER_CODES[weatherCode] || 'Unknown',
      updatedAt: dayjs(currentInterval?.startTime || now.toISOString()).format('HH:mm:ss'),

      // Premium metrics: only populated when actually returned by upstream plan
      particulateMatter25: roundDecimals(values.particulateMatter25, 1),
      particulateMatter10: roundDecimals(values.particulateMatter10, 1),
      pollutantO3: roundDecimals(values.pollutantO3),
      pollutantNO2: roundDecimals(values.pollutantNO2),
      pollutantCO: roundDecimals(values.pollutantCO, 1),
      pollutantSO2: roundDecimals(values.pollutantSO2, 1),
      epaHealthConcern: values.epaHealthConcern !== undefined ? Math.round(values.epaHealthConcern) : undefined,
      treeIndex: values.treeIndex !== undefined ? Math.round(values.treeIndex) : undefined,
      weedIndex: values.weedIndex !== undefined ? Math.round(values.weedIndex) : undefined,
      grassIndex: values.grassIndex !== undefined ? Math.round(values.grassIndex) : undefined
    }

    const forecastTimeline = timelines.find(t => t.timestep === '1d')
    const forecast: DayForecast[] = []

    if (forecastTimeline?.intervals) {
      const maxDays = Math.max(weatherConf.forecastDays || 7, 1)
      const targetCount = Math.min(forecastTimeline.intervals.length, maxDays)
      for (let i = 0; i < targetCount; i++) {
        const interval = forecastTimeline.intervals[i]
        if (!interval) continue
        const dayTime = dayjs(interval.startTime)
        const code = interval.values.weatherCode ?? 1000
        const temp = interval.values.temperature ?? current.temperature

        forecast.push({
          date: dayTime.format('YYYY-MM-DD'),
          dayName: i === 0 ? 'Today' : dayTime.format('dddd'),
          weatherCode: code,
          conditionText: WEATHER_CODES[code] || 'Unknown',
          tempMax: round(interval.values.temperatureMax ?? temp),
          tempMin: round(interval.values.temperatureMin ?? temp - 3)
        })
      }
    }

    const payload: WeatherPayload = {
      current,
      forecast,
      locationName: publicConf.locationName,
      units,
      fetchedAt: now.toISOString(),
      isPaidPlan,
      hasAirQuality,
      hasPollen
    }

    lastKnownGoodWeather = payload
    return payload
  } catch (err) {
    if (lastKnownGoodWeather) {
      return {
        ...lastKnownGoodWeather,
        isStale: true
      }
    }
    throw createError({
      statusCode: 502,
      statusMessage: `Weather upstream unavailable: ${(err as Error).message}`
    })
  }
})
