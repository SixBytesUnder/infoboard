// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-03',
  future: {
    compatibilityVersion: 4
  },
  devtools: {
    enabled: false
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  nitro: {
    compressPublicAssets: true
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Infoboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: '24/7 Raspberry Pi Infoboard Kiosk' },
        { name: 'theme-color', content: '#121316' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cousine:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  runtimeConfig: {
    // Private server-only runtime config
    weather: {
      apiKey: process.env.NUXT_WEATHER_API_KEY || '',
      latitude: Number(process.env.NUXT_WEATHER_LATITUDE || 51.5074),
      longitude: Number(process.env.NUXT_WEATHER_LONGITUDE || -0.1278),
      units: (process.env.NUXT_WEATHER_UNITS || 'metric') as 'metric' | 'imperial',
      roundTemp: (process.env.NUXT_WEATHER_ROUND_TEMP || 'true') === 'true',
      cacheTtl: Number(process.env.NUXT_WEATHER_CACHE_TTL || 300),
      forecastDays: Number(process.env.NUXT_WEATHER_FORECAST_DAYS || 7)
    },
    transit: {
      tflAppId: process.env.NUXT_TRANSIT_TFL_APP_ID || '',
      tflAppKey: process.env.NUXT_TRANSIT_TFL_APP_KEY || '',
      busStops: (process.env.NUXT_TRANSIT_BUS_STOPS || '').split(',').map(s => s.trim()).filter(Boolean),
      lineModes: (process.env.NUXT_TRANSIT_LINE_MODES || 'tube,overground,dlr,elizabeth-line,tram').split(',').map(s => s.trim()).filter(Boolean),
      cacheTtl: Number(process.env.NUXT_TRANSIT_CACHE_TTL || 60)
    },
    calendar: {
      icalUrl: process.env.NUXT_CALENDAR_ICAL_URL || '',
      maxEvents: Number(process.env.NUXT_CALENDAR_MAX_EVENTS || 10),
      cacheTtl: Number(process.env.NUXT_CALENDAR_CACHE_TTL || 900)
    },
    media: {
      source: (process.env.NUXT_MEDIA_SOURCE || 'local') as 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr',
      localDir: process.env.NUXT_MEDIA_LOCAL_DIR || '',
      interval: Number(process.env.NUXT_MEDIA_INTERVAL || 60),
      allowVideo: (process.env.NUXT_MEDIA_ALLOW_VIDEO || 'false') === 'true',
      videoMuted: (process.env.NUXT_MEDIA_VIDEO_MUTED || 'true') === 'true',
      weatherTagged: (process.env.NUXT_MEDIA_WEATHER_TAGGED || 'true') === 'true',
      unsplashKey: process.env.NUXT_MEDIA_UNSPLASH_KEY || '',
      pexelsKey: process.env.NUXT_MEDIA_PEXELS_KEY || '',
      flickrKey: process.env.NUXT_MEDIA_FLICKR_KEY || ''
    },
    sensor: {
      dhtEnabled: (process.env.NUXT_SENSOR_DHT_ENABLED || 'false') === 'true',
      dhtType: (process.env.NUXT_SENSOR_DHT_TYPE || '22') === '11' ? 'dht11' : 'dht22',
      dhtPin: Number(process.env.NUXT_SENSOR_DHT_PIN || 4),
      senseHatEnabled: (process.env.NUXT_SENSOR_SENSEHAT_ENABLED || 'false') === 'true',
      sdsEnabled: (process.env.NUXT_SENSOR_SDS_ENABLED || 'false') === 'true',
      sdsPort: process.env.NUXT_SENSOR_SDS_PORT || '/dev/ttyUSB0'
    },
    // Public keys exposed to the client
    public: {
      app: {
        magicMirror: (process.env.NUXT_APP_MAGIC_MIRROR || 'false') === 'true',
        lowPowerMode: (process.env.NUXT_APP_LOW_POWER_MODE || 'false') === 'true',
        timeFormat: process.env.NUXT_APP_TIME_FORMAT || 'HH:mm:ss',
        dateFormat: process.env.NUXT_APP_DATE_FORMAT || 'dddd, Do MMMM YYYY',
        autoExpandWeather: (process.env.NUXT_APP_AUTO_EXPAND_WEATHER || 'false') === 'true',
        autoExpandForecast: (process.env.NUXT_APP_AUTO_EXPAND_FORECAST || 'false') === 'true',
        autoExpandTransit: (process.env.NUXT_APP_AUTO_EXPAND_TRANSIT || 'false') === 'true',
        autoExpandCalendar: (process.env.NUXT_APP_AUTO_EXPAND_CALENDAR || 'false') === 'true',
        navButtons: (process.env.NUXT_APP_NAV_BUTTONS || 'true') === 'true',
        showExif: (process.env.NUXT_APP_SHOW_EXIF || 'true') === 'true'
      },
      weather: {
        enabled: (process.env.NUXT_WEATHER_ENABLED || 'true') === 'true',
        locationName: process.env.NUXT_WEATHER_LOCATION_NAME || 'London, UK',
        units: (process.env.NUXT_WEATHER_UNITS || 'metric') as 'metric' | 'imperial',
        roundTemp: (process.env.NUXT_WEATHER_ROUND_TEMP || 'true') === 'true',
        refreshMs: Number(process.env.NUXT_WEATHER_REFRESH_MS || 300000)
      },
      transit: {
        enabled: (process.env.NUXT_TRANSIT_ENABLED || 'true') === 'true',
        buttonStyle: ((process.env.NUXT_TRANSIT_BUTTON_STYLE || process.env.NUXT_TRANSIT_DISPLAY_MODE || 'verbose').toLowerCase() === 'minimal' ? 'minimal' : 'verbose') as 'verbose' | 'minimal',
        refreshMs: 60000
      },
      calendar: {
        enabled: (process.env.NUXT_CALENDAR_ENABLED || 'true') === 'true',
        dateFormat: process.env.NUXT_CALENDAR_DATE_FORMAT || 'YYYY-MM-DD',
        timeFormat: process.env.NUXT_CALENDAR_TIME_FORMAT || 'HH:mm',
        refreshMs: 900000
      },
      media: {
        source: (process.env.NUXT_MEDIA_SOURCE || 'local') as 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr',
        interval: Number(process.env.NUXT_MEDIA_INTERVAL || 60),
        allowVideo: (process.env.NUXT_MEDIA_ALLOW_VIDEO || 'false') === 'true',
        videoMuted: (process.env.NUXT_MEDIA_VIDEO_MUTED || 'true') === 'true',
        weatherTagged: (process.env.NUXT_MEDIA_WEATHER_TAGGED || 'true') === 'true'
      },
      sensor: {
        dhtEnabled: (process.env.NUXT_SENSOR_DHT_ENABLED || 'false') === 'true',
        senseHatEnabled: (process.env.NUXT_SENSOR_SENSEHAT_ENABLED || 'false') === 'true',
        sdsEnabled: (process.env.NUXT_SENSOR_SDS_ENABLED || 'false') === 'true',
        refreshMs: Number(process.env.NUXT_SENSOR_REFRESH_MS || 300000)
      }
    }
  }
})
