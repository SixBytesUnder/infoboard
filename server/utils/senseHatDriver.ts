import fs from 'node:fs/promises'
import type { PromisifiedBus } from 'i2c-bus'

export const HTS221_I2C_ADDR = 0x5f
export const LPS25H_I2C_ADDR = 0x5c

// Register addresses
export const HTS221_REG = {
  WHO_AM_I: 0x0f,
  CTRL_REG1: 0x20,
  CTRL_REG2: 0x21,
  STATUS_REG: 0x27,
  HUMIDITY_OUT_L: 0x28,
  TEMP_OUT_L: 0x2a,
  CALIB_START: 0x30
} as const

export const LPS25H_REG = {
  REF_P_XL: 0x08,
  WHO_AM_I: 0x0f,
  CTRL_REG1: 0x20,
  STATUS_REG: 0x27,
  PRESS_OUT_XL: 0x28,
  TEMP_OUT_L: 0x2b
} as const

// STMicroelectronics auto-increment bit for multi-byte reads
const AUTO_INCREMENT = 0x80

export interface Hts221Calibration {
  h0Rh: number
  h1Rh: number
  t0DegC: number
  t1DegC: number
  h0T0Out: number
  h1T0Out: number
  t0Out: number
  t1Out: number
}

export interface SenseHatCalibratedReading {
  temperature: number
  humidity: number
  pressure: number
  tRaw: number
  tRawHts?: number
  tRawLps?: number
  rhRaw?: number
  pRaw?: number
  dewPoint?: number
  timestamp: number
}

// In-memory cache to prevent bus saturation (3–5 second TTL)
const CACHE_TTL_MS = 4000
let cachedReading: SenseHatCalibratedReading | null = null
let activeReadPromise: Promise<SenseHatCalibratedReading | null> | null = null

let busInstance: PromisifiedBus | null = null
let busPromise: Promise<PromisifiedBus | null> | null = null
let hts221CalibCache: Hts221Calibration | null = null
let isInitialized = false

/**
 * Parses HTS221 16-byte calibration block (registers 0x30 to 0x3F).
 */
export function parseHts221Calibration(buf: Buffer): Hts221Calibration {
  if (buf.length < 16) {
    throw new Error('HTS221 calibration buffer must be at least 16 bytes')
  }

  const h0Rh = buf.readUInt8(0) / 2.0
  const h1Rh = buf.readUInt8(1) / 2.0

  const t0DegCx8 = buf.readUInt8(2)
  const t1DegCx8 = buf.readUInt8(3)
  const t1T0Msb = buf.readUInt8(5)

  const t0Msb = t1T0Msb & 0x03
  const t1Msb = (t1T0Msb & 0x0c) >> 2

  const t0DegC = ((t0Msb << 8) | t0DegCx8) / 8.0
  const t1DegC = ((t1Msb << 8) | t1DegCx8) / 8.0

  const h0T0Out = buf.readInt16LE(6)
  const h1T0Out = buf.readInt16LE(10)

  const t0Out = buf.readInt16LE(12)
  const t1Out = buf.readInt16LE(14)

  return {
    h0Rh,
    h1Rh,
    t0DegC,
    t1DegC,
    h0T0Out,
    h1T0Out,
    t0Out,
    t1Out
  }
}

/**
 * Linearly interpolates raw HTS221 humidity and temperature using calibration coefficients.
 */
export function parseHts221Readings(
  humBuf: Buffer,
  tempBuf: Buffer,
  cal: Hts221Calibration
): { rhRaw: number; tRawHts: number } {
  const hOut = humBuf.readInt16LE(0)
  const tOut = tempBuf.readInt16LE(0)

  const deltaH = cal.h1Rh - cal.h0Rh
  const deltaHOut = cal.h1T0Out - cal.h0T0Out
  const rhRaw = deltaHOut !== 0
    ? cal.h0Rh + ((hOut - cal.h0T0Out) * deltaH) / deltaHOut
    : cal.h0Rh

  const deltaT = cal.t1DegC - cal.t0DegC
  const deltaTOut = cal.t1Out - cal.t0Out
  const tRawHts = deltaTOut !== 0
    ? cal.t0DegC + ((tOut - cal.t0Out) * deltaT) / deltaTOut
    : cal.t0DegC

  return {
    rhRaw: Math.max(0, Math.min(100, rhRaw)),
    tRawHts
  }
}

/**
 * Parses LPS25H 24-bit two's-complement barometric pressure in hPa.
 */
export function parseLps25hPressure(buf: Buffer): number {
  if (buf.length < 3) {
    throw new Error('LPS25H pressure buffer must be at least 3 bytes')
  }
  const b0 = buf.readUInt8(0)
  const b1 = buf.readUInt8(1)
  const b2 = buf.readUInt8(2)
  let rawPress = (b2 << 16) | (b1 << 8) | b0
  if (rawPress & 0x800000) {
    rawPress -= 0x1000000
  }
  return rawPress / 4096.0
}

/**
 * Parses LPS25H 16-bit two's-complement temperature in degrees Celsius.
 */
export function parseLps25hTemperature(buf: Buffer): number {
  if (buf.length < 2) {
    throw new Error('LPS25H temperature buffer must be at least 2 bytes')
  }
  const rawTemp = buf.readInt16LE(0)
  return 42.5 + rawTemp / 480.0
}

/**
 * Calculates actual dew point using the Magnus-Tetens formula.
 * Constants: a = 17.27, b = 237.7 °C
 */
export function calculateDewPoint(temperature: number, relativeHumidity: number): number {
  const a = 17.27
  const b = 237.7
  const rhSafe = Math.max(0.01, Math.min(100, relativeHumidity))
  const alpha = (a * temperature) / (b + temperature) + Math.log(rhSafe / 100)
  return (b * alpha) / (a - alpha)
}

/**
 * Recalculates true ambient relative humidity (%) using Magnus-Tetens compensation:
 * 1. Derives actual dew point from warmed sensor (T_raw, RH_raw).
 * 2. Recalculates RH_ambient at calibrated ambient temperature (T_calibrated).
 * 3. Clamps result between 0% and 100%.
 */
export function calculateAmbientHumidity(
  tRaw: number,
  rhRaw: number,
  tCalibrated: number
): number {
  const a = 17.27
  const b = 237.7
  const dewPoint = calculateDewPoint(tRaw, rhRaw)
  const alphaDew = (a * dewPoint) / (b + dewPoint)
  const betaCal = (a * tCalibrated) / (b + tCalibrated)
  const rhAmbient = 100 * Math.exp(alphaDew - betaCal)
  return Math.max(0, Math.min(100, rhAmbient))
}

/**
 * Computes calibrated temperature by averaging available HTS221 and LPS25H raw temperatures
 * and applying the configured self-heating offset.
 *
 * NOTE: For an extended ribbon-cable tethered Sense HAT, do NOT factor in CPU temp.
 */
export function calculateCalibratedTemperature(
  tRawHts?: number,
  tRawLps?: number,
  offset = -1.8
): { tRaw: number; tCalibrated: number } {
  let tRaw: number
  if (tRawHts !== undefined && tRawLps !== undefined) {
    tRaw = (tRawHts + tRawLps) / 2
  } else if (tRawHts !== undefined) {
    tRaw = tRawHts
  } else if (tRawLps !== undefined) {
    tRaw = tRawLps
  } else {
    throw new Error('No temperature reading available from Sense HAT')
  }

  return {
    tRaw,
    tCalibrated: tRaw + offset
  }
}

/**
 * Lazily acquires the promisified I2C bus singleton for /dev/i2c-1.
 * Returns null if /dev/i2c-1 is missing or i2c-bus cannot be loaded.
 */
async function getPromisifiedBus(): Promise<PromisifiedBus | null> {
  if (busInstance) return busInstance
  if (busPromise) return busPromise

  busPromise = (async () => {
    try {
      // Check /dev/i2c-1 existence first
      const exists = await fs.access('/dev/i2c-1').then(() => true).catch(() => false)
      if (!exists) return null

      // Dynamically load native i2c-bus addon
      const i2c = await import('i2c-bus')
      const bus = await i2c.openPromisified(1)
      busInstance = bus
      return bus
    } catch {
      busInstance = null
      return null
    } finally {
      busPromise = null
    }
  })()

  return busPromise
}

/**
 * Initializes HTS221 and LPS25H sensors over user-space I2C without kernel drivers.
 */
async function initSensors(bus: PromisifiedBus): Promise<boolean> {
  let anySuccess = false

  // 1. Initialize HTS221: Power ON (bit 7), BDU (bit 2), 1Hz ODR (bits 1:0 = 01) => 0x85
  try {
    await bus.writeByte(HTS221_I2C_ADDR, HTS221_REG.CTRL_REG1, 0x85)

    if (!hts221CalibCache) {
      const calBuf = Buffer.alloc(16)
      await bus.readI2cBlock(HTS221_I2C_ADDR, HTS221_REG.CALIB_START | AUTO_INCREMENT, 16, calBuf)
      hts221CalibCache = parseHts221Calibration(calBuf)
    }
    anySuccess = true
  } catch {
    // HTS221 unavailable or not connected
  }

  // 2. Initialize LPS25H: Power ON (bit 7), 12.5Hz ODR (bits 6:4 = 011), BDU (bit 2) => 0xb4, or 1Hz => 0x90
  try {
    await bus.writeByte(LPS25H_I2C_ADDR, LPS25H_REG.CTRL_REG1, 0x90)
    anySuccess = true
  } catch {
    // LPS25H unavailable or not connected
  }

  return anySuccess
}

/**
 * Reads raw sensor registers from HTS221 and LPS25H.
 */
async function readRawSensors(bus: PromisifiedBus): Promise<{
  tRawHts?: number
  rhRaw?: number
  pRaw?: number
  tRawLps?: number
}> {
  let tRawHts: number | undefined
  let rhRaw: number | undefined
  let pRaw: number | undefined
  let tRawLps: number | undefined

  // Read HTS221 (Humidity & Temp)
  if (hts221CalibCache) {
    try {
      const humBuf = Buffer.alloc(2)
      await bus.readI2cBlock(HTS221_I2C_ADDR, HTS221_REG.HUMIDITY_OUT_L | AUTO_INCREMENT, 2, humBuf)

      const tempBuf = Buffer.alloc(2)
      await bus.readI2cBlock(HTS221_I2C_ADDR, HTS221_REG.TEMP_OUT_L | AUTO_INCREMENT, 2, tempBuf)

      const parsed = parseHts221Readings(humBuf, tempBuf, hts221CalibCache)
      tRawHts = parsed.tRawHts
      rhRaw = parsed.rhRaw
    } catch {
      // HTS221 read transient error
    }
  }

  // Read LPS25H (Pressure & Temp)
  try {
    const pressBuf = Buffer.alloc(3)
    await bus.readI2cBlock(LPS25H_I2C_ADDR, LPS25H_REG.PRESS_OUT_XL | AUTO_INCREMENT, 3, pressBuf)
    pRaw = parseLps25hPressure(pressBuf)

    const tempBuf = Buffer.alloc(2)
    await bus.readI2cBlock(LPS25H_I2C_ADDR, LPS25H_REG.TEMP_OUT_L | AUTO_INCREMENT, 2, tempBuf)
    tRawLps = parseLps25hTemperature(tempBuf)
  } catch {
    // LPS25H read transient error
  }

  return { tRawHts, rhRaw, pRaw, tRawLps }
}

/**
 * Reads calibrated physical Sense HAT data using direct user-space I2C on /dev/i2c-1.
 * Caches in-memory for 3–5 seconds to avoid saturating the bus.
 * Returns null if hardware is missing, unresponsive, or running in local dev.
 */
export async function readSenseHatFromI2C(options?: {
  tempOffset?: number
  pressureOffsetHpa?: number
}): Promise<SenseHatCalibratedReading | null> {
  const now = Date.now()
  if (cachedReading && now - cachedReading.timestamp < CACHE_TTL_MS) {
    return cachedReading
  }

  if (activeReadPromise) {
    return activeReadPromise
  }

  activeReadPromise = (async () => {
    try {
      const bus = await getPromisifiedBus()
      if (!bus) return null

      if (!isInitialized) {
        const ok = await initSensors(bus)
        if (!ok) return null
        isInitialized = true
        // Allow brief settle time on sensor power-up
        await new Promise(resolve => setTimeout(resolve, 60))
      }

      const raw = await readRawSensors(bus)

      // Need at least one valid reading to proceed
      if (raw.tRawHts === undefined && raw.tRawLps === undefined && raw.pRaw === undefined) {
        return null
      }

      const tempOffset = options?.tempOffset ?? -1.8
      const { tRaw, tCalibrated } = calculateCalibratedTemperature(raw.tRawHts, raw.tRawLps, tempOffset)

      let rhAmbient: number
      let dewPoint: number | undefined
      if (raw.rhRaw !== undefined) {
        dewPoint = calculateDewPoint(tRaw, raw.rhRaw)
        rhAmbient = calculateAmbientHumidity(tRaw, raw.rhRaw, tCalibrated)
      } else {
        rhAmbient = 45.0
      }

      const pressureOffset = options?.pressureOffsetHpa ?? 0.0
      const pCalibrated = (raw.pRaw !== undefined ? raw.pRaw : 1013.25) + pressureOffset

      const result: SenseHatCalibratedReading = {
        temperature: Number(tCalibrated.toFixed(1)),
        humidity: Number(rhAmbient.toFixed(1)),
        pressure: Number(pCalibrated.toFixed(1)),
        tRaw: Number(tRaw.toFixed(2)),
        tRawHts: raw.tRawHts !== undefined ? Number(raw.tRawHts.toFixed(2)) : undefined,
        tRawLps: raw.tRawLps !== undefined ? Number(raw.tRawLps.toFixed(2)) : undefined,
        rhRaw: raw.rhRaw !== undefined ? Number(raw.rhRaw.toFixed(2)) : undefined,
        pRaw: raw.pRaw !== undefined ? Number(raw.pRaw.toFixed(2)) : undefined,
        dewPoint: dewPoint !== undefined ? Number(dewPoint.toFixed(2)) : undefined,
        timestamp: Date.now()
      }

      cachedReading = result
      return result
    } catch {
      // Invalidate on bus error so next attempt re-initializes cleanly
      if (busInstance) {
        try {
          await busInstance.close()
        } catch {
          // Ignore close error
        }
        busInstance = null
      }
      isInitialized = false
      return null
    }
  })().finally(() => {
    activeReadPromise = null
  })

  return activeReadPromise
}

/**
 * Resets the in-memory cache (for testing or configuration changes).
 */
export function clearSenseHatCache(): void {
  cachedReading = null
  activeReadPromise = null
}

/**
 * Closes the active I2C bus connection and resets state.
 */
export async function closeSenseHatBus(): Promise<void> {
  clearSenseHatCache()
  isInitialized = false
  hts221CalibCache = null
  if (busInstance) {
    try {
      await busInstance.close()
    } catch {
      // Ignore
    }
    busInstance = null
  }
}
