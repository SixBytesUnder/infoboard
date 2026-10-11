import { WEATHER_CODES } from '~~/shared'
import type { WeatherPayload, DayForecast, CurrentWeather } from '~~/shared'
import dayjs from 'dayjs'

interface OpenMeteoCurrent {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  precipitation: number
  rain: number
  showers: number
  snowfall: number
  weather_code: number
  cloud_cover: number
  pressure_msl: number
  surface_pressure: number
  wind_speed_10m: number
  wind_direction_10m: number
  wind_gusts_10m: number
  uv_index: number
  dew_point_2m?: number
  visibility?: number
  shortwave_radiation_instant?: number
}

interface OpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  apparent_temperature_max: number[]
  apparent_temperature_min: number[]
  sunrise?: string[]
  sunset?: string[]
  uv_index_max?: number[]
  precipitation_sum?: number[]
  precipitation_probability_max?: number[]
  wind_speed_10m_max?: number[]
  wind_gusts_10m_max?: number[]
  daylight_duration?: number[]
  sunshine_duration?: number[]
}

interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrent
  daily?: OpenMeteoDaily
}

interface OpenMeteoAirQualityCurrent {
  time: string
  pm10?: number
  pm2_5?: number
  carbon_monoxide?: number
  nitrogen_dioxide?: number
  sulphur_dioxide?: number
  ozone?: number
  european_aqi?: number
  us_aqi?: number
  alder_pollen?: number
  birch_pollen?: number
  grass_pollen?: number
  mugwort_pollen?: number
  olive_pollen?: number
  ragweed_pollen?: number
}

interface OpenMeteoAirQualityResponse {
  current?: OpenMeteoAirQualityCurrent
}

// Astronomical moon phase calculation based on synodic month (29.53 days)
function calculateMoonPhase(date: Date): number {
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  const day = date.getDate()
  if (month < 3) {
    year--
    month += 12
  }
  month++
  const c = 365.25 * year
  const e = 30.6 * month
  let jd = c + e + day - 694039.09
  jd /= 29.5305882
  const b = Math.floor(jd)
  jd -= b
  let phase = Math.round(jd * 8)
  if (phase >= 8) phase = 0
  return phase
}

// Maps US AQI (0-500) to standard EPA health concern index (0-5)
function usAqiToEpaLevel(aqi: number | undefined): number | undefined {
  if (aqi === undefined || aqi === null) return undefined
  if (aqi <= 50) return 0 // Good
  if (aqi <= 100) return 1 // Moderate
  if (aqi <= 150) return 2 // Unhealthy for Sensitive Groups
  if (aqi <= 200) return 3 // Unhealthy
  if (aqi <= 300) return 4 // Very Unhealthy
  return 5 // Hazardous
}

// In-memory fallback in case of upstream network outage
let lastKnownGoodWeather: WeatherPayload | null = null

export default defineEventHandler(async (event): Promise<WeatherPayload> => {
  const config = useRuntimeConfig(event)
  const weatherConf = config.weather
  const publicConf = config.public.weather
  const units: 'metric' | 'imperial' = weatherConf.units === 'imperial' ? 'imperial' : 'metric'
  const isImperial = units === 'imperial'

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

  const now = dayjs()
  const days = Math.min(Math.max(weatherConf.forecastDays || 7, 1), 16)

  try {
    const weatherParams = new URLSearchParams({
      latitude: String(weatherConf.latitude),
      longitude: String(weatherConf.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,dew_point_2m,visibility,shortwave_radiation_instant',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,daylight_duration,sunshine_duration',
      timezone: 'auto',
      forecast_days: String(days),
      temperature_unit: isImperial ? 'fahrenheit' : 'celsius',
      wind_speed_unit: isImperial ? 'mph' : 'ms',
      precipitation_unit: isImperial ? 'inch' : 'mm'
    })

    if (weatherConf.apiKey) {
      weatherParams.set('apikey', weatherConf.apiKey)
    }

    const aqParams = new URLSearchParams({
      latitude: String(weatherConf.latitude),
      longitude: String(weatherConf.longitude),
      current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen',
      timezone: 'auto'
    })

    if (weatherConf.apiKey) {
      aqParams.set('apikey', weatherConf.apiKey)
    }

    const [forecastData, aqData] = await Promise.all([
      $fetch<OpenMeteoForecastResponse>(
        `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`,
        { signal: AbortSignal.timeout(8000) }
      ),
      $fetch<OpenMeteoAirQualityResponse>(
        `https://air-quality-api.open-meteo.com/v1/air-quality?${aqParams.toString()}`,
        { signal: AbortSignal.timeout(8000) }
      ).catch(() => null)
    ])

    const cur = forecastData.current
    const daily = forecastData.daily
    const aq = aqData?.current

    if (!cur) {
      throw new Error('No current weather timeline returned from Open-Meteo')
    }

    const code = cur.weather_code ?? 0
    const moonPhase = calculateMoonPhase(now.toDate())

    // Unit conversions for pressure and visibility
    const pressureSurface = isImperial
      ? roundDecimals(cur.surface_pressure * 0.02953, 2) ?? 29.92
      : round(cur.surface_pressure)
    const pressureSea = isImperial
      ? roundDecimals(cur.pressure_msl * 0.02953, 2)
      : round(cur.pressure_msl)

    const visibilityValue = cur.visibility !== undefined
      ? (isImperial ? roundDecimals(cur.visibility / 1609.34, 1) : roundDecimals(cur.visibility / 1000, 1))
      : undefined

    const sunshineHours = daily?.sunshine_duration?.[0] !== undefined
      ? roundDecimals(daily.sunshine_duration[0] / 3600, 1)
      : undefined

    const usAqi = aq?.us_aqi !== undefined ? Math.round(aq.us_aqi) : undefined
    const epaHealthConcern = usAqiToEpaLevel(usAqi)

    const current: CurrentWeather = {
      temperature: round(cur.temperature_2m),
      temperatureApparent: round(cur.apparent_temperature),
      humidity: Math.round(cur.relative_humidity_2m ?? 0),
      windSpeed: roundDecimals(cur.wind_speed_10m, 1) ?? 0,
      windGust: roundDecimals(cur.wind_gusts_10m, 1) ?? 0,
      windDirection: round(cur.wind_direction_10m),
      pressureSurfaceLevel: pressureSurface,
      pressureSeaLevel: pressureSea,
      precipitationProbability: daily?.precipitation_probability_max?.[0] !== undefined ? round(daily.precipitation_probability_max[0]) : undefined,
      visibility: visibilityValue,
      cloudCover: round(cur.cloud_cover),
      dewPoint: roundOptional(cur.dew_point_2m),
      uvIndex: roundDecimals(cur.uv_index, 1),
      solarGHI: round(cur.shortwave_radiation_instant),
      moonPhase,
      weatherCode: code,
      conditionText: WEATHER_CODES[code] || 'Unknown',
      updatedAt: now.format('HH:mm:ss'),

      // Astronomy
      sunrise: daily?.sunrise?.[0] ? dayjs(daily.sunrise[0]).format('HH:mm') : undefined,
      sunset: daily?.sunset?.[0] ? dayjs(daily.sunset[0]).format('HH:mm') : undefined,
      sunshineDuration: sunshineHours,

      // Air Quality (Free on Open-Meteo)
      usAqi,
      europeanAqi: aq?.european_aqi !== undefined ? Math.round(aq.european_aqi) : undefined,
      particulateMatter25: roundDecimals(aq?.pm2_5, 1),
      particulateMatter10: roundDecimals(aq?.pm10, 1),
      pollutantO3: roundDecimals(aq?.ozone, 1),
      pollutantNO2: roundDecimals(aq?.nitrogen_dioxide, 1),
      pollutantCO: roundDecimals(aq?.carbon_monoxide, 1),
      pollutantSO2: roundDecimals(aq?.sulphur_dioxide, 1),
      epaHealthConcern,

      // Pollen (Free on Open-Meteo)
      grassPollen: roundDecimals(aq?.grass_pollen, 1),
      birchPollen: roundDecimals(aq?.birch_pollen, 1),
      alderPollen: roundDecimals(aq?.alder_pollen, 1),
      ragweedPollen: roundDecimals(aq?.ragweed_pollen, 1),
      olivePollen: roundDecimals(aq?.olive_pollen, 1),
      mugwortPollen: roundDecimals(aq?.mugwort_pollen, 1)
    }

    const forecast: DayForecast[] = []
    if (daily && daily.time) {
      const count = Math.min(daily.time.length, days)
      for (let i = 0; i < count; i++) {
        const dayTime = dayjs(daily.time[i])
        const dayCode = daily.weather_code[i] ?? 0
        forecast.push({
          date: dayTime.format('YYYY-MM-DD'),
          dayName: i === 0 ? 'Today' : dayTime.format('dddd'),
          weatherCode: dayCode,
          conditionText: WEATHER_CODES[dayCode] || 'Unknown',
          tempMax: round(daily.temperature_2m_max[i]),
          tempMin: round(daily.temperature_2m_min[i]),
          sunrise: daily.sunrise?.[i] ? dayjs(daily.sunrise[i]).format('HH:mm') : undefined,
          sunset: daily.sunset?.[i] ? dayjs(daily.sunset[i]).format('HH:mm') : undefined,
          uvIndex: daily.uv_index_max?.[i] !== undefined ? round(daily.uv_index_max[i]) : undefined,
          precipitationProbability: daily.precipitation_probability_max?.[i] !== undefined ? round(daily.precipitation_probability_max[i]) : undefined
        })
      }
    }

    const payload: WeatherPayload = {
      current,
      forecast,
      locationName: publicConf.locationName,
      units,
      fetchedAt: now.toISOString(),
      isPaidPlan: true, // Open-Meteo provides all layers for free
      hasAirQuality: Boolean(aq),
      hasPollen: Boolean(aq)
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
