export interface SensorReadings {
  temperature?: number
  humidity?: number
  pressure?: number
  pm25?: number
  pm10?: number
  airQualityRating?: 'smile' | 'neutral' | 'sad' | 'dead'
  hasDht: boolean
  hasSenseHat: boolean
  hasSds: boolean
  isSimulated: boolean
  hasError?: boolean
  error?: string
  updatedAt: string
}
