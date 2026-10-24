import { toClientDashboardConfig, type ClientDashboardConfig } from '~~/shared'

const VALID_SOURCES = ['local', 'single', 'nasa', 'unsplash', 'pexels', 'flickr'] as const

export default defineEventHandler((event): ClientDashboardConfig => {
  const config = useRuntimeConfig(event)
  const env = process.env
  const pub = toClientDashboardConfig(config.public)

  const rawSource = String(
    env.NUXT_MEDIA_SOURCE ||
    env.NUXT_PUBLIC_MEDIA_SOURCE ||
    config.media?.source ||
    pub.media.source ||
    'local'
  ).toLowerCase()

  const mediaSource = VALID_SOURCES.includes(rawSource as (typeof VALID_SOURCES)[number])
    ? (rawSource as ClientDashboardConfig['media']['source'])
    : pub.media.source

  return {
    ...pub,
    app: {
      ...pub.app,
      magicMirror: (env.NUXT_APP_MAGIC_MIRROR || env.NUXT_PUBLIC_APP_MAGIC_MIRROR || String(pub.app.magicMirror)) === 'true',
      lowPowerMode: (env.NUXT_APP_LOW_POWER_MODE || env.NUXT_PUBLIC_APP_LOW_POWER_MODE || String(pub.app.lowPowerMode)) === 'true',
      timeFormat: env.NUXT_APP_TIME_FORMAT || env.NUXT_PUBLIC_APP_TIME_FORMAT || pub.app.timeFormat,
      dateFormat: env.NUXT_APP_DATE_FORMAT || env.NUXT_PUBLIC_APP_DATE_FORMAT || pub.app.dateFormat,
      autoExpandTransit: (env.NUXT_APP_AUTO_EXPAND_TRANSIT || env.NUXT_PUBLIC_APP_AUTO_EXPAND_TRANSIT || String(pub.app.autoExpandTransit)) === 'true',
      autoExpandCalendar: (env.NUXT_APP_AUTO_EXPAND_CALENDAR || env.NUXT_PUBLIC_APP_AUTO_EXPAND_CALENDAR || String(pub.app.autoExpandCalendar)) === 'true',
      autoExpandWeather: (env.NUXT_APP_AUTO_EXPAND_WEATHER || env.NUXT_PUBLIC_APP_AUTO_EXPAND_WEATHER || String(pub.app.autoExpandWeather)) === 'true',
      autoExpandForecast: (env.NUXT_APP_AUTO_EXPAND_FORECAST || env.NUXT_PUBLIC_APP_AUTO_EXPAND_FORECAST || String(pub.app.autoExpandForecast)) === 'true',
      navButtons: (env.NUXT_APP_NAV_BUTTONS || env.NUXT_PUBLIC_APP_NAV_BUTTONS || String(pub.app.navButtons)) !== 'false',
      showExif: (env.NUXT_APP_SHOW_EXIF || env.NUXT_PUBLIC_APP_SHOW_EXIF || String(pub.app.showExif)) !== 'false'
    },
    weather: {
      ...pub.weather,
      enabled: (env.NUXT_WEATHER_ENABLED || env.NUXT_PUBLIC_WEATHER_ENABLED || String(pub.weather.enabled)) !== 'false',
      locationName: env.NUXT_WEATHER_LOCATION_NAME || env.NUXT_PUBLIC_WEATHER_LOCATION_NAME || pub.weather.locationName,
      units: ((env.NUXT_WEATHER_UNITS || env.NUXT_PUBLIC_WEATHER_UNITS || config.weather?.units || pub.weather.units) === 'imperial' ? 'imperial' : 'metric'),
      roundTemp: (env.NUXT_WEATHER_ROUND_TEMP || env.NUXT_PUBLIC_WEATHER_ROUND_TEMP || String(config.weather?.roundTemp ?? pub.weather.roundTemp)) !== 'false',
      refreshMs: Number(env.NUXT_WEATHER_REFRESH_MS || env.NUXT_PUBLIC_WEATHER_REFRESH_MS || pub.weather.refreshMs || 300000)
    },
    transit: {
      ...pub.transit,
      enabled: (env.NUXT_TRANSIT_ENABLED || env.NUXT_PUBLIC_TRANSIT_ENABLED || String(pub.transit.enabled)) === 'true',
      buttonStyle: ((env.NUXT_TRANSIT_BUTTON_STYLE || env.NUXT_PUBLIC_TRANSIT_BUTTON_STYLE || env.NUXT_TRANSIT_DISPLAY_MODE || env.NUXT_PUBLIC_TRANSIT_DISPLAY_MODE || pub.transit?.buttonStyle || 'verbose').toLowerCase() === 'minimal' ? 'minimal' : 'verbose') as 'verbose' | 'minimal'
    },
    calendar: {
      ...pub.calendar,
      enabled: (env.NUXT_CALENDAR_ENABLED || env.NUXT_PUBLIC_CALENDAR_ENABLED || String(pub.calendar.enabled)) === 'true',
      buttonStyle: ((env.NUXT_CALENDAR_BUTTON_STYLE || env.NUXT_PUBLIC_CALENDAR_BUTTON_STYLE || env.NUXT_CALENDAR_DISPLAY_MODE || env.NUXT_PUBLIC_CALENDAR_DISPLAY_MODE || pub.calendar?.buttonStyle || 'verbose').toLowerCase() === 'minimal' ? 'minimal' : 'verbose') as 'verbose' | 'minimal',
      dateFormat: env.NUXT_CALENDAR_DATE_FORMAT || env.NUXT_PUBLIC_CALENDAR_DATE_FORMAT || pub.calendar.dateFormat,
      timeFormat: env.NUXT_CALENDAR_TIME_FORMAT || env.NUXT_PUBLIC_CALENDAR_TIME_FORMAT || pub.calendar.timeFormat
    },
    media: {
      ...pub.media,
      source: mediaSource,
      interval: Number(env.NUXT_MEDIA_INTERVAL || env.NUXT_PUBLIC_MEDIA_INTERVAL || config.media?.interval || pub.media.interval || 60),
      allowVideo: (env.NUXT_MEDIA_ALLOW_VIDEO || env.NUXT_PUBLIC_MEDIA_ALLOW_VIDEO || String(config.media?.allowVideo ?? pub.media.allowVideo)) === 'true',
      videoMuted: (env.NUXT_MEDIA_VIDEO_MUTED || env.NUXT_PUBLIC_MEDIA_VIDEO_MUTED || String(config.media?.videoMuted ?? pub.media.videoMuted)) !== 'false',
      weatherTagged: (env.NUXT_MEDIA_WEATHER_TAGGED || env.NUXT_PUBLIC_MEDIA_WEATHER_TAGGED || String(config.media?.weatherTagged ?? pub.media.weatherTagged)) !== 'false'
    },
    sensor: {
      ...pub.sensor,
      dhtEnabled: (env.NUXT_SENSOR_DHT_ENABLED || env.NUXT_PUBLIC_SENSOR_DHT_ENABLED || String(pub.sensor.dhtEnabled)) === 'true',
      senseHatEnabled: (env.NUXT_SENSOR_SENSE_HAT_ENABLED || env.NUXT_SENSOR_SENSEHAT_ENABLED || env.NUXT_PUBLIC_SENSOR_SENSE_HAT_ENABLED || env.NUXT_PUBLIC_SENSOR_SENSEHAT_ENABLED || String(pub.sensor.senseHatEnabled)) === 'true',
      sdsEnabled: (env.NUXT_SENSOR_SDS_ENABLED || env.NUXT_PUBLIC_SENSOR_SDS_ENABLED || String(pub.sensor.sdsEnabled)) === 'true'
    }
  }
})
