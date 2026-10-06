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
