import type { ClientDashboardConfig } from '~~/shared'

export default defineEventHandler((event): ClientDashboardConfig => {
  const config = useRuntimeConfig(event)
  const env = process.env
  const pub = config.public as unknown as ClientDashboardConfig

  return {
    ...pub,
    app: {
      ...pub.app,
      magicMirror: (env.NUXT_APP_MAGIC_MIRROR || env.MAGIC_MIRROR || String(pub.app.magicMirror)) === 'true',
      autoExpandTransit: (env.NUXT_APP_AUTO_EXPAND_TRANSIT || env.AE_TFL || String(pub.app.autoExpandTransit)) === 'true',
      autoExpandCalendar: (env.NUXT_APP_AUTO_EXPAND_CALENDAR || env.AE_CALENDAR || String(pub.app.autoExpandCalendar)) === 'true',
      autoExpandWeather: (env.NUXT_APP_AUTO_EXPAND_WEATHER || env.AE_WEATHER_DETAILS || String(pub.app.autoExpandWeather)) === 'true',
      autoExpandForecast: (env.NUXT_APP_AUTO_EXPAND_FORECAST || env.AE_FORECAST || String(pub.app.autoExpandForecast)) === 'true'
    },
    transit: {
      ...pub.transit,
      enabled: (env.NUXT_TRANSIT_ENABLED || env.NUXT_PUBLIC_TRANSIT_ENABLED || env.TFL || String(pub.transit.enabled)) === 'true'
    },
    calendar: {
      ...pub.calendar,
      enabled: (env.NUXT_CALENDAR_ENABLED || env.NUXT_PUBLIC_CALENDAR_ENABLED || env.CALENDAR_ENABLE || String(pub.calendar.enabled)) === 'true'
    }
  }
})
