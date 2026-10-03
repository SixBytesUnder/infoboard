import type { SensorReadings } from '~~/shared'
import { readSensorData } from '../utils/sensorDrivers'

export default defineEventHandler(async (event): Promise<SensorReadings> => {
  const config = useRuntimeConfig(event)
  const sensorConf = config.sensor

  return await readSensorData({
    dhtEnabled: sensorConf.dhtEnabled,
    dhtPin: sensorConf.dhtPin,
    dhtType: (sensorConf.dhtType === 'dht11' ? 'dht11' : 'dht22') as 'dht11' | 'dht22',
    senseHatEnabled: sensorConf.senseHatEnabled,
    sdsEnabled: sensorConf.sdsEnabled,
    sdsPort: sensorConf.sdsPort
  })
})
