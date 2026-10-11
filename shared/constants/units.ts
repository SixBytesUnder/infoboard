export interface WeatherUnitsMap {
  temperature: string
  temperatureApparent: string
  humidity: string
  windSpeed: string
  windGust: string
  windDirection: string
  pressureSurfaceLevel: string
  pressureSeaLevel: string
  solarGHI: string
  particulateMatter25: string
  particulateMatter10: string
  pollutantO3: string
  pollutantNO2: string
  pollutantCO: string
  pollutantSO2: string
  visibility: string
  dewPoint: string
  cloudCover: string
  precipitationProbability: string
  uvIndex: string
  sunshineDuration: string
  pollen: string
}

export const WEATHER_UNITS: Record<'metric' | 'imperial', WeatherUnitsMap> = {
  metric: {
    temperature: '°C',
    temperatureApparent: '°C',
    humidity: '%',
    windSpeed: 'm/s',
    windGust: 'm/s',
    windDirection: '°',
    pressureSurfaceLevel: 'hPa',
    pressureSeaLevel: 'hPa',
    solarGHI: 'W/m²',
    particulateMatter25: 'μg/m³',
    particulateMatter10: 'μg/m³',
    pollutantO3: 'μg/m³',
    pollutantNO2: 'μg/m³',
    pollutantCO: 'μg/m³',
    pollutantSO2: 'μg/m³',
    visibility: 'km',
    dewPoint: '°C',
    cloudCover: '%',
    precipitationProbability: '%',
    uvIndex: '',
    sunshineDuration: 'hrs',
    pollen: 'grains/m³'
  },
  imperial: {
    temperature: '°F',
    temperatureApparent: '°F',
    humidity: '%',
    windSpeed: 'mph',
    windGust: 'mph',
    windDirection: '°',
    pressureSurfaceLevel: 'inHg',
    pressureSeaLevel: 'inHg',
    solarGHI: 'Btu/ft²',
    particulateMatter25: 'μg/m³',
    particulateMatter10: 'μg/m³',
    pollutantO3: 'μg/m³',
    pollutantNO2: 'μg/m³',
    pollutantCO: 'μg/m³',
    pollutantSO2: 'μg/m³',
    visibility: 'mi',
    dewPoint: '°F',
    cloudCover: '%',
    precipitationProbability: '%',
    uvIndex: '',
    sunshineDuration: 'hrs',
    pollen: 'grains/m³'
  }
}

export const WEATHER_CODES: Record<number, string> = {
  // Standard WMO Weather interpretation codes (Open-Meteo)
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',

  // Legacy Tomorrow.io codes for backward compatibility
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

export const EUROPEAN_AQI_LEVELS: Record<number, string> = {
  0: 'Good',
  1: 'Fair',
  2: 'Moderate',
  3: 'Poor',
  4: 'Very Poor',
  5: 'Extremely Poor'
}

export const POLLEN_INDEX: Record<number, string> = {
  0: 'None',
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High'
}
