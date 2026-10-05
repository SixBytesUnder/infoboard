import fs from 'node:fs/promises'
import type { SensorReadings } from '~~/shared'

let cachedSDS: { pm25: number; pm10: number; lastRead: number; isSimulated: boolean } | null = null
let activeSdsPromise: Promise<{ pm25: number; pm10: number } | null> | null = null

export async function readSysfsValue(path: string): Promise<number | null> {
  try {
    const raw = await fs.readFile(path, 'utf8')
    const val = Number.parseFloat(raw.trim())
    return Number.isFinite(val) ? val : null
  } catch {
    return null
  }
}

async function readSDSFromSerial(portPath: string, timeoutMs = 3500): Promise<{ pm25: number; pm10: number } | null> {
  if (activeSdsPromise) {
    return activeSdsPromise
  }

  activeSdsPromise = (async () => {
    return new Promise<{ pm25: number; pm10: number } | null>((resolve) => {
      let isSettled = false
      let portInstance: any = null
      let buffer = Buffer.alloc(0)

      const cleanupAndResolve = (result: { pm25: number; pm10: number } | null) => {
        if (isSettled) return
        isSettled = true
        clearTimeout(timer)
        if (portInstance && portInstance.isOpen) {
          portInstance.close(() => resolve(result))
        } else {
          resolve(result)
        }
      }

      const timer = setTimeout(() => {
        cleanupAndResolve(null)
      }, timeoutMs)

      import('serialport').then(({ SerialPort }) => {
        try {
          portInstance = new SerialPort({
            path: portPath,
            baudRate: 9600,
            autoOpen: true
          })

          portInstance.on('error', () => {
            cleanupAndResolve(null)
          })

          portInstance.on('data', (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk])
            // Standard SDS011 reporting packet is 10 bytes: 0xAA 0xC0 [PM2.5 low] [PM2.5 high] [PM10 low] [PM10 high] [id1] [id2] [checksum] 0xAB
            while (buffer.length >= 10) {
              const headIdx = buffer.indexOf(0xaa)
              if (headIdx === -1) {
                buffer = Buffer.alloc(0)
                break
              }
              if (headIdx > 0) {
                buffer = buffer.subarray(headIdx)
              }
              if (buffer.length < 10) break

              const b0 = buffer[0]
              const b1 = buffer[1]
              const b2 = buffer[2]
              const b3 = buffer[3]
              const b4 = buffer[4]
              const b5 = buffer[5]
              const b6 = buffer[6]
              const b7 = buffer[7]
              const b8 = buffer[8]
              const b9 = buffer[9]

              if (
                b0 === 0xaa &&
                b1 === 0xc0 &&
                b9 === 0xab &&
                b2 !== undefined &&
                b3 !== undefined &&
                b4 !== undefined &&
                b5 !== undefined &&
                b6 !== undefined &&
                b7 !== undefined &&
                b8 !== undefined
              ) {
                // Checksum: sum of bytes 2..7 modulo 256
                const checksum = (b2 + b3 + b4 + b5 + b6 + b7) & 0xff
                if (checksum === b8) {
                  const rawPm25 = ((b3 << 8) | b2) / 10
                  const rawPm10 = ((b5 << 8) | b4) / 10
                  cleanupAndResolve({
                    pm25: Number(rawPm25.toFixed(2)),
                    pm10: Number(rawPm10.toFixed(2))
                  })
                  return
                }
              }
              buffer = buffer.subarray(1)
            }
          })
        } catch {
          cleanupAndResolve(null)
        }
      }).catch(() => {
        cleanupAndResolve(null)
      })
    })
  })().finally(() => {
    activeSdsPromise = null
  })

  return activeSdsPromise
}

export async function readSensorData(config: {
  dhtEnabled: boolean
  dhtPin: number
  dhtType: 'dht11' | 'dht22'
  senseHatEnabled: boolean
  sdsEnabled: boolean
  sdsPort: string
}): Promise<SensorReadings> {
  let temperature: number | undefined
  let humidity: number | undefined
  let pressure: number | undefined
  let pm25: number | undefined
  let pm10: number | undefined
  let isSimulated = false
  let hasError = false
  let error: string | undefined

  // 1. Try reading DHT via Linux IIO sysfs
  if (config.dhtEnabled) {
    const dhtPath = '/sys/bus/iio/devices/iio:device0'
    const isDetected = await fs.access(dhtPath).then(() => true).catch(() => false)
    if (isDetected) {
      const iioTemp = await readSysfsValue(`${dhtPath}/in_temp_input`)
      const iioHumidity = await readSysfsValue(`${dhtPath}/in_humidityrelative_input`)

      if (iioTemp !== null && iioHumidity !== null) {
        temperature = Math.round(iioTemp / 1000) // sysfs outputs millidegrees C
        humidity = Math.round(iioHumidity / 1000)
      } else {
        hasError = true
        error = error ? `${error}, DHT read failed` : 'DHT read failed'
      }
    } else {
      // Simulate realistic indoor room reading in dev
      isSimulated = true
      temperature = 21 + Math.round((Math.sin(Date.now() / 60000) * 1.5) * 10) / 10
      humidity = 48 + Math.round((Math.cos(Date.now() / 60000) * 4))
    }
  }

  // 2. Try reading Sense HAT via Linux IIO / i2c sysfs
  if (config.senseHatEnabled) {
    const hatPressurePath = '/sys/bus/i2c/devices/1-005c/iio:device1'
    const isDetected = await fs.access(hatPressurePath).then(() => true).catch(() => false)
    if (isDetected) {
      const hatPressure = await readSysfsValue(`${hatPressurePath}/in_pressure_input`)
      const hatTemp = await readSysfsValue('/sys/bus/i2c/devices/1-005f/iio:device0/in_temp_input')
      const hatHumidity = await readSysfsValue('/sys/bus/i2c/devices/1-005f/iio:device0/in_humidityrelative_input')

      if (hatPressure !== null) {
        pressure = Math.round(hatPressure * 10) // convert to hPa
      } else {
        hasError = true
        error = error ? `${error}, Sense HAT pressure read failed` : 'Sense HAT pressure read failed'
      }
      if (hatTemp !== null && temperature === undefined) {
        temperature = Math.round(hatTemp / 1000)
      }
      if (hatHumidity !== null && humidity === undefined) {
        humidity = Math.round(hatHumidity / 1000)
      }
    } else {
      isSimulated = true
      pressure = 1013 + Math.round(Math.sin(Date.now() / 120000) * 6)
      if (temperature === undefined) temperature = 21.5
      if (humidity === undefined) humidity = 45
    }
  }

  // 3. Try reading SDS011 via SerialPort
  if (config.sdsEnabled) {
    try {
      const { SerialPort } = await import('serialport')
      const ports = await SerialPort.list()
      const target = ports.find(p => p.path === config.sdsPort)

      if (target) {
        // Hardware sensor port detected!
        if (cachedSDS && !cachedSDS.isSimulated && Date.now() - cachedSDS.lastRead < 30000) {
          pm25 = cachedSDS.pm25
          pm10 = cachedSDS.pm10
        } else {
          const reading = await readSDSFromSerial(target.path)
          if (reading) {
            pm25 = reading.pm25
            pm10 = reading.pm10
            cachedSDS = { pm25, pm10, lastRead: Date.now(), isSimulated: false }
          } else {
            // Sensor detected but data could not be read
            hasError = true
            error = error ? `${error}, SDS011 read failed` : 'SDS011 sensor read failed'
          }
        }
      } else {
        // Sensor port not detected: dev environment dummy data
        isSimulated = true
        if (cachedSDS && cachedSDS.isSimulated && Date.now() - cachedSDS.lastRead < 30000) {
          pm25 = cachedSDS.pm25
          pm10 = cachedSDS.pm10
        } else {
          pm25 = Number((9.2 + Math.random() * 2).toFixed(2))
          pm10 = Number((15.4 + Math.random() * 3).toFixed(2))
          cachedSDS = { pm25, pm10, lastRead: Date.now(), isSimulated: true }
        }
      }
    } catch {
      // Fallback for dev environments where serialport fails
      isSimulated = true
      pm25 = 8.5
      pm10 = 14.0
    }
  }

  // Ensure PM values have at most 2 decimal places
  if (pm25 !== undefined) {
    pm25 = Number(pm25.toFixed(2))
  }
  if (pm10 !== undefined) {
    pm10 = Number(pm10.toFixed(2))
  }

  // Calculate SDS011 face icon
  let airQualityRating: 'smile' | 'neutral' | 'sad' | 'dead' | undefined
  if (pm25 !== undefined && pm10 !== undefined) {
    const worstVal = Math.max(pm25, pm10)
    if (worstVal <= 35) airQualityRating = 'smile'
    else if (worstVal <= 53) airQualityRating = 'neutral'
    else if (worstVal <= 70) airQualityRating = 'sad'
    else airQualityRating = 'dead'
  }

  return {
    temperature,
    humidity,
    pressure,
    pm25,
    pm10,
    airQualityRating,
    hasDht: config.dhtEnabled,
    hasSenseHat: config.senseHatEnabled,
    hasSds: config.sdsEnabled,
    isSimulated,
    hasError,
    error,
    updatedAt: new Date().toISOString()
  }
}
