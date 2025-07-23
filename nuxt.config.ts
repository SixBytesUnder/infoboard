// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/scripts',
    '@nuxt/test-utils'
  ],

  fonts: {
    families: [
      { name: 'Cousine', provider: 'google' },
    ]
  },

  runtimeConfig: {
    public: {
      infoboard: {
        weather: {
          refresh: process.env.WEATHER_REFRESH
        }
      }
    }
  }
})