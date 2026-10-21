import type { SensorReadings } from '~~/shared'
import { readSensorData } from '../utils/sensorDrivers'

export default defineEventHandler(async (event): Promise<SensorReadings> => {
  const config = useRuntimeConfig(event)
  const sensorConf = config.sensor
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

  return await readSensorData({
    dhtEnabled: isDhtEnabled,
    dhtPin: sensorConf.dhtPin,
    dhtType: (sensorConf.dhtType === 'dht11' ? 'dht11' : 'dht22') as 'dht11' | 'dht22',
    senseHatEnabled: isSenseHatEnabled,
    sdsEnabled: isSdsEnabled,
    sdsPort: sensorConf.sdsPort
  })
})
