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
      apiKey: process.env.NUXT_WEATHER_API_KEY || process.env.WEATHER_API_KEY || '',
      latitude: Number(process.env.NUXT_WEATHER_LATITUDE || process.env.WEATHER_LAT || 51.5074),
      longitude: Number(process.env.NUXT_WEATHER_LONGITUDE || process.env.WEATHER_LON || -0.1278),
      units: (process.env.NUXT_WEATHER_UNITS || process.env.WEATHER_UNITS || 'metric') as 'metric' | 'imperial',
      roundTemp: (process.env.NUXT_WEATHER_ROUND_TEMP || process.env.WEATHER_ROUNDED || 'true') === 'true',
      cacheTtl: Number(process.env.NUXT_WEATHER_CACHE_TTL || 300),
      forecastDays: Number(process.env.NUXT_WEATHER_FORECAST_DAYS || process.env.WEATHER_FORECAST_DAYS || 7)
    },
    transit: {
      tflAppId: process.env.NUXT_TRANSIT_TFL_APP_ID || process.env.TFL_APP_ID || '',
      tflAppKey: process.env.NUXT_TRANSIT_TFL_APP_KEY || process.env.TFL_APP_KEY || '',
      busStops: (process.env.NUXT_TRANSIT_BUS_STOPS || process.env.TFL_BUS_STOPS || '').split(',').map(s => s.trim()).filter(Boolean),
      lineModes: (process.env.NUXT_TRANSIT_LINE_MODES || process.env.TFL_STATUS || 'tube,overground,dlr,elizabeth-line,tram').split(',').map(s => s.trim()).filter(Boolean),
      cacheTtl: Number(process.env.NUXT_TRANSIT_CACHE_TTL || 60)
    },
    calendar: {
      icalUrl: process.env.NUXT_CALENDAR_ICAL_URL || process.env.CALENDAR_ICAL || '',
      maxEvents: Number(process.env.NUXT_CALENDAR_MAX_EVENTS || process.env.CALENDAR_LIMIT || 10),
      cacheTtl: Number(process.env.NUXT_CALENDAR_CACHE_TTL || 900)
    },
    media: {
      source: (process.env.NUXT_MEDIA_SOURCE || process.env.IMAGES_SOURCE || 'local') as 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr',
      localDir: process.env.NUXT_MEDIA_LOCAL_DIR || process.env.IMAGES_DIR || '',
      interval: Number(process.env.NUXT_MEDIA_INTERVAL || process.env.IMAGE_INTERVAL || 60),
      allowVideo: (process.env.NUXT_MEDIA_ALLOW_VIDEO || process.env.VIDEO || 'false') === 'true',
      videoMuted: (process.env.NUXT_MEDIA_VIDEO_MUTED || process.env.VIDEO_MUTED || 'true') === 'true',
      weatherTagged: (process.env.NUXT_MEDIA_WEATHER_TAGGED || process.env.UNSPLASH_WEATHER_TAGGED || process.env.PEXELS_WEATHER_TAGGED || 'true') === 'true',
      unsplashKey: process.env.NUXT_MEDIA_UNSPLASH_KEY || process.env.UNSPLASH_ACCESS || '',
      pexelsKey: process.env.NUXT_MEDIA_PEXELS_KEY || process.env.PEXELS_KEY || '',
      flickrKey: process.env.NUXT_MEDIA_FLICKR_KEY || process.env.FLICKR_API_KEY || ''
    },
    sensor: {
      dhtEnabled: (process.env.NUXT_SENSOR_DHT_ENABLED || process.env.DHT || 'false') === 'true',
      dhtType: (process.env.NUXT_SENSOR_DHT_TYPE || process.env.DHT_SENSOR_TYPE || '22') === '11' ? 'dht11' : 'dht22',
      dhtPin: Number(process.env.NUXT_SENSOR_DHT_PIN || process.env.DHT_GPIO_PIN || 4),
      senseHatEnabled: (process.env.NUXT_SENSOR_SENSEHAT_ENABLED || process.env.SENSE_HAT || 'false') === 'true',
      sdsEnabled: (process.env.NUXT_SENSOR_SDS_ENABLED || process.env.SDS011 || 'false') === 'true',
      sdsPort: process.env.NUXT_SENSOR_SDS_PORT || process.env.SDS_PORT || '/dev/ttyUSB0'
    },
    // Public keys exposed to the client
    public: {
      app: {
        magicMirror: (process.env.NUXT_APP_MAGIC_MIRROR || process.env.MAGIC_MIRROR || 'false') === 'true',
        lowPowerMode: (process.env.NUXT_APP_LOW_POWER_MODE || 'false') === 'true',
        timeFormat: process.env.NUXT_APP_TIME_FORMAT || process.env.TIME_FORMAT || 'HH:mm:ss',
        dateFormat: process.env.NUXT_APP_DATE_FORMAT || process.env.DATE_FORMAT || 'dddd, Do MMMM YYYY',
        autoExpandWeather: (process.env.NUXT_APP_AUTO_EXPAND_WEATHER || process.env.AE_WEATHER_DETAILS || 'false') === 'true',
        autoExpandForecast: (process.env.NUXT_APP_AUTO_EXPAND_FORECAST || process.env.AE_FORECAST || 'false') === 'true',
        autoExpandTransit: (process.env.NUXT_APP_AUTO_EXPAND_TRANSIT || process.env.AE_TFL || 'false') === 'true',
        autoExpandCalendar: (process.env.NUXT_APP_AUTO_EXPAND_CALENDAR || process.env.AE_CALENDAR || 'false') === 'true',
        navButtons: (process.env.NUXT_APP_NAV_BUTTONS || process.env.NAV_BUTTONS || 'true') === 'true',
        showExif: (process.env.NUXT_APP_SHOW_EXIF || process.env.EXIF || 'true') === 'true'
      },
      weather: {
        enabled: (process.env.NUXT_WEATHER_ENABLED || process.env.WEATHER || 'true') === 'true',
        locationName: process.env.NUXT_WEATHER_LOCATION_NAME || process.env.WEATHER_LOCATION_NAME || 'London, UK',
        units: (process.env.NUXT_WEATHER_UNITS || process.env.WEATHER_UNITS || 'metric') as 'metric' | 'imperial',
        roundTemp: (process.env.NUXT_WEATHER_ROUND_TEMP || process.env.WEATHER_ROUNDED || 'true') === 'true',
        refreshMs: Number(process.env.NUXT_WEATHER_REFRESH_MS || process.env.WEATHER_REFRESH || 300000)
      },
      transit: {
        enabled: (process.env.NUXT_TRANSIT_ENABLED || process.env.TFL || 'true') === 'true',
        refreshMs: 60000
      },
      calendar: {
        enabled: (process.env.NUXT_CALENDAR_ENABLED || process.env.CALENDAR_ENABLE || 'true') === 'true',
        dateFormat: process.env.NUXT_CALENDAR_DATE_FORMAT || process.env.CALENDAR_DATE_FORMAT || 'YYYY-MM-DD',
        timeFormat: process.env.NUXT_CALENDAR_TIME_FORMAT || process.env.CALENDAR_TIME_FORMAT || 'HH:mm',
        refreshMs: 900000
      },
      media: {
        source: (process.env.NUXT_MEDIA_SOURCE || process.env.IMAGES_SOURCE || 'local') as 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr',
        interval: Number(process.env.NUXT_MEDIA_INTERVAL || process.env.IMAGE_INTERVAL || 60),
        allowVideo: (process.env.NUXT_MEDIA_ALLOW_VIDEO || process.env.VIDEO || 'false') === 'true',
        videoMuted: (process.env.NUXT_MEDIA_VIDEO_MUTED || process.env.VIDEO_MUTED || 'true') === 'true',
        weatherTagged: (process.env.NUXT_MEDIA_WEATHER_TAGGED || process.env.UNSPLASH_WEATHER_TAGGED || process.env.PEXELS_WEATHER_TAGGED || 'true') === 'true'
      },
      sensor: {
        dhtEnabled: (process.env.NUXT_SENSOR_DHT_ENABLED || process.env.DHT || 'false') === 'true',
        senseHatEnabled: (process.env.NUXT_SENSOR_SENSEHAT_ENABLED || process.env.SENSE_HAT || 'false') === 'true',
        sdsEnabled: (process.env.NUXT_SENSOR_SDS_ENABLED || process.env.SDS011 || 'false') === 'true',
        refreshMs: Number(process.env.NUXT_SENSOR_REFRESH_MS || process.env.DHT_TIMER || 300) * 1000
      }
    }
  }
})
