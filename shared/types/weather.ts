export interface CurrentWeather {
  temperature: number
  temperatureApparent: number
  humidity: number
  windSpeed: number
  windGust: number
  windDirection?: number
  pressureSurfaceLevel: number
  pressureSeaLevel?: number
  precipitationProbability?: number
  visibility?: number
  cloudCover?: number
  dewPoint?: number
  uvIndex?: number
  uvHealthConcern?: number
  solarGHI?: number
  moonPhase?: number
  weatherCode: number
  conditionText: string
  updatedAt: string

  // Premium tier metrics (only present if Tomorrow.io account tier permits)
  particulateMatter25?: number
  particulateMatter10?: number
  pollutantO3?: number
  pollutantNO2?: number
  pollutantCO?: number
  pollutantSO2?: number
  epaHealthConcern?: number
  treeIndex?: number
  weedIndex?: number
  grassIndex?: number
}

export interface DayForecast {
  date: string
  dayName: string
  weatherCode: number
  conditionText: string
  tempMax: number
  tempMin: number
}

export interface WeatherPayload {
  current: CurrentWeather
  forecast: DayForecast[]
  locationName: string
  units: 'metric' | 'imperial'
  fetchedAt: string
  isStale?: boolean
  isPaidPlan?: boolean
  hasAirQuality?: boolean
  hasPollen?: boolean
}
