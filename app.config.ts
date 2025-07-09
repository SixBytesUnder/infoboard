
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
      apiKey: process.env.TOMORROW_IO_API_KEY ?? '',
      latitude: process.env.TOMORROW_IO_LATITUDE ?? '',
      longitude: process.env.TOMORROW_IO_LONGITUDE ?? '',
      units: process.env.TOMORROW_IO_UNITS ?? 'metric',
      fields: process.env.TOMORROW_IO_FIELDS?.split(',') ?? ['temperature','temperatureApparent','humidity','windSpeed','windGust','pressureSurfaceLevel','moonPhase','weatherCode','solarGHI','particulateMatter25','particulateMatter10','pollutantO3','pollutantNO2','pollutantCO','pollutantSO2','epaHealthConcern','treeIndex','weedIndex','grassIndex'],
      timesteps: ['current', '1d']
    }
  }
})
