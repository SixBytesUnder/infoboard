import type { SensorReadings } from '~~/shared'
import { readSensorData } from '../utils/sensorDrivers'

export default defineEventHandler(async (event): Promise<SensorReadings> => {
  const config = useRuntimeConfig(event)
  const sensorConf = config.sensor as typeof config.sensor & {
    senseHatTempOffset?: number
    senseHatPressureOffsetHpa?: number
  }
  const env = process.env

  const isSenseHatEnabled = Boolean(
    sensorConf.senseHatEnabled ||
    env.NUXT_SENSOR_SENSE_HAT_ENABLED === 'true' ||
    env.NUXT_SENSOR_SENSEHAT_ENABLED === 'true' ||
    env.NUXT_PUBLIC_SENSOR_SENSE_HAT_ENABLED === 'true' ||
    env.NUXT_PUBLIC_SENSOR_SENSEHAT_ENABLED === 'true'
  )

  const isDhtEnabled = Boolean(
    sensorConf.dhtEnabled ||
    env.NUXT_SENSOR_DHT_ENABLED === 'true' ||
    env.NUXT_PUBLIC_SENSOR_DHT_ENABLED === 'true'
  )

  const isSdsEnabled = Boolean(
    sensorConf.sdsEnabled ||
    env.NUXT_SENSOR_SDS_ENABLED === 'true' ||
    env.NUXT_PUBLIC_SENSOR_SDS_ENABLED === 'true'
  )

  const senseHatTempOffset = Number(
    sensorConf.senseHatTempOffset ??
    env.NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET ??
    env.SENSE_HAT_TEMP_OFFSET ??
    -1.8
  )

  const senseHatPressureOffsetHpa = Number(
    sensorConf.senseHatPressureOffsetHpa ??
    env.NUXT_SENSOR_SENSE_HAT_PRESSURE_OFFSET_HPA ??
    env.SENSE_HAT_PRESSURE_OFFSET_HPA ??
    0.0
  )

  return await readSensorData({
    dhtEnabled: isDhtEnabled,
    dhtPin: sensorConf.dhtPin,
    dhtType: (sensorConf.dhtType === 'dht11' ? 'dht11' : 'dht22') as 'dht11' | 'dht22',
    senseHatEnabled: isSenseHatEnabled,
    senseHatTempOffset,
    senseHatPressureOffsetHpa,
    sdsEnabled: isSdsEnabled,
    sdsPort: sensorConf.sdsPort
  })
})
