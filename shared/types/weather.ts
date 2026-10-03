export interface CurrentWeather {
  temperature: number
  temperatureApparent: number
  humidity: number
  windSpeed: number
  windGust: number
  pressureSurfaceLevel: number
  solarGHI: number
  moonPhase: number
  particulateMatter25: number
  particulateMatter10: number
  pollutantO3: number
  pollutantNO2: number
  pollutantCO: number
  pollutantSO2: number
  epaHealthConcern: number
  treeIndex: number
  weedIndex: number
  grassIndex: number
  weatherCode: number
  conditionText: string
  updatedAt: string
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
}
