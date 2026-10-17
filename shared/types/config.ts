export interface ClientDashboardConfig {
  app: {
    magicMirror: boolean
    lowPowerMode: boolean
    timeFormat: string
    dateFormat: string
    autoExpandWeather: boolean
    autoExpandForecast: boolean
    autoExpandTransit: boolean
    autoExpandCalendar: boolean
    navButtons: boolean
    showExif: boolean
  }
  weather: {
    enabled: boolean
    locationName: string
    units: 'metric' | 'imperial'
    roundTemp: boolean
    refreshMs: number
  }
  transit: {
    enabled: boolean
    buttonStyle: 'verbose' | 'minimal'
    refreshMs: number
  }
  calendar: {
    enabled: boolean
    buttonStyle: 'verbose' | 'minimal'
    dateFormat: string
    timeFormat: string
    refreshMs: number
  }
  media: {
    source: 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr'
    interval: number
    allowVideo: boolean
    videoMuted: boolean
    weatherTagged: boolean
  }
  sensor: {
    dhtEnabled: boolean
    senseHatEnabled: boolean
    sdsEnabled: boolean
    refreshMs: number
  }
}

const VALID_MEDIA_SOURCES = ['local', 'single', 'nasa', 'unsplash', 'pexels', 'flickr'] as const

export function toClientDashboardConfig(raw: unknown): ClientDashboardConfig {
  const pub = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | undefined>
  const app = pub.app || {}
  const weather = pub.weather || {}
  const transit = pub.transit || {}
  const calendar = pub.calendar || {}
  const media = pub.media || {}
  const sensor = pub.sensor || {}

  const rawSource = String(media.source || 'local')
  const source: ClientDashboardConfig['media']['source'] = VALID_MEDIA_SOURCES.includes(
    rawSource as (typeof VALID_MEDIA_SOURCES)[number]
  )
    ? (rawSource as ClientDashboardConfig['media']['source'])
    : 'local'

  return {
    app: {
      magicMirror: Boolean(app.magicMirror),
      lowPowerMode: Boolean(app.lowPowerMode),
      timeFormat: typeof app.timeFormat === 'string' ? app.timeFormat : 'HH:mm:ss',
      dateFormat: typeof app.dateFormat === 'string' ? app.dateFormat : 'dddd, Do MMMM YYYY',
      autoExpandWeather: Boolean(app.autoExpandWeather),
      autoExpandForecast: Boolean(app.autoExpandForecast),
      autoExpandTransit: Boolean(app.autoExpandTransit),
      autoExpandCalendar: Boolean(app.autoExpandCalendar),
      navButtons: app.navButtons !== false,
      showExif: app.showExif !== false
    },
    weather: {
      enabled: weather.enabled !== false,
      locationName: typeof weather.locationName === 'string' ? weather.locationName : 'London, UK',
      units: weather.units === 'imperial' ? 'imperial' : 'metric',
      roundTemp: weather.roundTemp !== false,
      refreshMs: Number(weather.refreshMs || 300000)
    },
    transit: {
      enabled: transit.enabled !== false,
      buttonStyle: transit.buttonStyle === 'minimal' ? 'minimal' : 'verbose',
      refreshMs: Number(transit.refreshMs || 60000)
    },
    calendar: {
      enabled: calendar.enabled !== false,
      buttonStyle: calendar.buttonStyle === 'minimal' ? 'minimal' : 'verbose',
      dateFormat: typeof calendar.dateFormat === 'string' ? calendar.dateFormat : 'YYYY-MM-DD',
      timeFormat: typeof calendar.timeFormat === 'string' ? calendar.timeFormat : 'HH:mm',
      refreshMs: Number(calendar.refreshMs || 900000)
    },
    media: {
      source,
      interval: Number(media.interval || 60),
      allowVideo: Boolean(media.allowVideo),
      videoMuted: media.videoMuted !== false,
      weatherTagged: media.weatherTagged !== false
    },
    sensor: {
      dhtEnabled: Boolean(sensor.dhtEnabled),
      senseHatEnabled: Boolean(sensor.senseHatEnabled),
      sdsEnabled: Boolean(sensor.sdsEnabled),
      refreshMs: Number(sensor.refreshMs || 300000)
    }
  }
}
