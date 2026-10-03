export interface WeatherUnitsMap {
  temperature: string
  temperatureApparent: string
  humidity: string
  windSpeed: string
  windGust: string
  pressureSurfaceLevel: string
  solarGHI: string
  particulateMatter25: string
  particulateMatter10: string
  pollutantO3: string
  pollutantNO2: string
  pollutantCO: string
  pollutantSO2: string
  visibility: string
}

export const WEATHER_UNITS: Record<'metric' | 'imperial', WeatherUnitsMap> = {
  metric: {
    temperature: '°C',
    temperatureApparent: '°C',
    humidity: '%',
    windSpeed: 'm/s',
    windGust: 'm/s',
    pressureSurfaceLevel: 'hPa',
    solarGHI: 'W/m²',
    particulateMatter25: 'μg/m³',
    particulateMatter10: 'μg/m³',
    pollutantO3: 'ppb',
    pollutantNO2: 'ppb',
    pollutantCO: 'ppb',
    pollutantSO2: 'ppb',
    visibility: 'km'
  },
  imperial: {
    temperature: '°F',
    temperatureApparent: '°F',
    humidity: '%',
    windSpeed: 'mph',
    windGust: 'mph',
    pressureSurfaceLevel: 'inHg',
    solarGHI: 'Btu/ft²',
    particulateMatter25: 'μg/ft³',
    particulateMatter10: 'μg/ft³',
    pollutantO3: 'ppb',
    pollutantNO2: 'ppb',
    pollutantCO: 'ppb',
    pollutantSO2: 'ppb',
    visibility: 'mi'
  }
}

export const WEATHER_CODES: Record<number, string> = {
  0: 'Unknown',
  1000: 'Clear',
  1001: 'Cloudy',
  1100: 'Mostly Clear',
  1101: 'Partly Cloudy',
  1102: 'Mostly Cloudy',
  2000: 'Fog',
  2100: 'Light Fog',
  3000: 'Light Wind',
  3001: 'Wind',
  3002: 'Strong Wind',
  4000: 'Drizzle',
  4001: 'Rain',
  4200: 'Light Rain',
  4201: 'Heavy Rain',
  5000: 'Snow',
  5001: 'Flurries',
  5100: 'Light Snow',
  5101: 'Heavy Snow',
  6000: 'Freezing Drizzle',
  6001: 'Freezing Rain',
  6200: 'Light Freezing Rain',
  6201: 'Heavy Freezing Rain',
  7000: 'Ice Pellets',
  7101: 'Heavy Ice Pellets',
  7102: 'Light Ice Pellets',
  8000: 'Thunderstorm'
}

export const MOON_PHASES: Record<number, string> = {
  0: 'New Moon',
  1: 'Waxing Crescent',
  2: 'First Quarter',
  3: 'Waxing Gibbous',
  4: 'Full Moon',
  5: 'Waning Gibbous',
  6: 'Third Quarter',
  7: 'Waning Crescent'
}

export const EPA_HEALTH_CONCERN: Record<number, string> = {
  0: 'Good',
  1: 'Moderate',
  2: 'Unhealthy for Sensitive Groups',
  3: 'Unhealthy',
  4: 'Very Unhealthy',
  5: 'Hazardous'
}

export const POLLEN_INDEX: Record<number, string> = {
  0: 'None',
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High'
}
