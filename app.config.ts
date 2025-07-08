
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
    }
  }
})
