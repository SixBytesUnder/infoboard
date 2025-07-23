
// Use defineAppConfig to get type-safety and auto-completion
export default defineAppConfig({
  // Namespace the configuration for our infoboard app
  infoboard: {
    // Settings for the Date and Time component
    dateTime: {
      // The locale to use for formatting (e.g., 'en-US', 'en-GB', 'de-DE')
      // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation
      locale: 'en-GB',

      // Options for formatting the time.
      // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },

      // Options for formatting the date.
      date: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    },
    weather: {
      apiKey: process.env.WEATHER_API_KEY ?? '',
      latitude: process.env.WEATHER_LATITUDE ?? '',
      longitude: process.env.WEATHER_LONGITUDE ?? '',
      units: process.env.WEATHER_UNITS ?? 'metric',
      fields: process.env.WEATHER_FIELDS?.split(',') ?? ['temperature','temperatureApparent','humidity','windSpeed','windGust','pressureSurfaceLevel','moonPhase','weatherCode','solarGHI','particulateMatter25','particulateMatter10','pollutantO3','pollutantNO2','pollutantCO','pollutantSO2','epaHealthConcern','treeIndex','weedIndex','grassIndex'],
      timesteps: ['1h', '1d'],
      timezone: process.env.WEATHER_TIMEZONE ?? 'Europe/London',
    }
  }
})
