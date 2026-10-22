import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseHts221Calibration,
  parseHts221Readings,
  parseLps25hPressure,
  parseLps25hTemperature,
  calculateDewPoint,
  calculateAmbientHumidity,
  calculateCalibratedTemperature,
  readSenseHatFromI2C,
  clearSenseHatCache
} from '../server/utils/senseHatDriver.ts'
import { readSensorData } from '../server/utils/sensorDrivers.ts'

test('Magnus-Tetens Dew Point calculation', () => {
  // Test case: 20°C and 50% relative humidity
  // Standard psychrometric dew point for 20°C @ 50% RH is approx 9.27°C
  const dewPoint = calculateDewPoint(20.0, 50.0)
  assert.ok(Math.abs(dewPoint - 9.27) < 0.1, `Dew point ${dewPoint} should be ~9.27°C`)
})

test('Magnus-Tetens Ambient Humidity compensation', () => {
  // Sensor warmed to 23.8°C reads 40% RH
  // True ambient temperature (calibrated with -1.8 offset) is 22.0°C
  // Because air cooled down to ambient without moisture loss, RH_ambient must be higher than RH_raw
  const tRaw = 23.8
  const rhRaw = 40.0
  const tCalibrated = 22.0

  const rhAmbient = calculateAmbientHumidity(tRaw, rhRaw, tCalibrated)

  assert.ok(rhAmbient > rhRaw, `RH ambient (${rhAmbient}%) must be higher than warmed sensor reading (${rhRaw}%)`)
  // Check exact physics: with a 1.8°C drop around 22°C, RH increases by ~4-5%
  assert.ok(rhAmbient > 44.0 && rhAmbient < 46.0, `RH ambient ${rhAmbient} should be ~44.7%`)

  // Boundary checks: Clamped to 0% - 100%
  const rhOver = calculateAmbientHumidity(35.0, 99.0, 10.0)
  assert.equal(rhOver, 100.0, 'Should clamp to 100%')

  const rhUnder = calculateAmbientHumidity(0.0, 0.0, 30.0)
  assert.ok(rhUnder >= 0.0 && rhUnder <= 100.0, 'Should be within [0, 100]%')
})

test('Calibrated Temperature calculation (No CPU temp math, ribbon cable offset)', () => {
  // Dual sensor average: HTS221 = 22.4°C, LPS25H = 22.8°C => T_raw = 22.6°C
  // With default offset -1.8°C => T_calibrated = 20.8°C
  const result = calculateCalibratedTemperature(22.4, 22.8, -1.8)
  assert.equal(Number(result.tRaw.toFixed(2)), 22.6)
  assert.equal(Number(result.tCalibrated.toFixed(2)), 20.8)

  // Single sensor fallback: only LPS25H available
  const resultLpsOnly = calculateCalibratedTemperature(undefined, 23.0, -1.8)
  assert.equal(resultLpsOnly.tRaw, 23.0)
  assert.equal(Number(resultLpsOnly.tCalibrated.toFixed(2)), 21.2)

  // Single sensor fallback: only HTS221 available
  const resultHtsOnly = calculateCalibratedTemperature(21.0, undefined, -1.8)
  assert.equal(resultHtsOnly.tRaw, 21.0)
  assert.equal(Number(resultHtsOnly.tCalibrated.toFixed(2)), 19.2)

  // Custom offset
  const resultCustom = calculateCalibratedTemperature(22.0, 22.0, -2.5)
  assert.equal(resultCustom.tCalibrated, 19.5)
})

test('HTS221 Calibration and reading parser', () => {
  // Construct 16-byte buffer for calibration
  const calBuf = Buffer.alloc(16)
  calBuf.writeUInt8(80, 0)   // H0_rH_x2 = 80 => H0 = 40%
  calBuf.writeUInt8(160, 1)  // H1_rH_x2 = 160 => H1 = 80%
  calBuf.writeUInt8(160, 2)  // T0_degC_x8 = 160 => T0 = 20°C
  calBuf.writeUInt8(80, 3)   // T1_degC_x8 = 80
  calBuf.writeUInt8(0, 4)
  calBuf.writeUInt8(0x01, 5) // T1_T0_msb = 0x01 (T0 MSB = 1 => T0 = (256 + 160)/8 = 52°C, T1 MSB = 0 => T1 = 10°C)
  calBuf.writeInt16LE(-1000, 6) // H0_T0_OUT = -1000
  calBuf.writeInt16LE(3000, 10) // H1_T0_OUT = 3000
  calBuf.writeInt16LE(100, 12)  // T0_OUT = 100
  calBuf.writeInt16LE(500, 14)  // T1_OUT = 500

  const cal = parseHts221Calibration(calBuf)
  assert.equal(cal.h0Rh, 40)
  assert.equal(cal.h1Rh, 80)
  assert.equal(cal.t0DegC, 52)
  assert.equal(cal.t1DegC, 10)
  assert.equal(cal.h0T0Out, -1000)
  assert.equal(cal.h1T0Out, 3000)

  // Test reading interpolation: raw humidity = 1000 => halfway between -1000 and 3000 => 40 + (80-40)/2 = 60%
  const humBuf = Buffer.alloc(2)
  humBuf.writeInt16LE(1000, 0)

  const tempBuf = Buffer.alloc(2)
  tempBuf.writeInt16LE(300, 0) // halfway between 100 and 500 => 52 + (10 - 52)/2 = 31°C

  const readings = parseHts221Readings(humBuf, tempBuf, cal)
  assert.equal(readings.rhRaw, 60)
  assert.equal(readings.tRawHts, 31)
})

test('LPS25H 24-bit Pressure and 16-bit Temperature parsing', () => {
  // Pressure: 4096 LSB per hPa. 1013.25 hPa = 1013.25 * 4096 = 4150272 = 0x3F5400
  const pressBuf = Buffer.alloc(3)
  pressBuf.writeUInt8(0x00, 0) // XL
  pressBuf.writeUInt8(0x54, 1) // L
  pressBuf.writeUInt8(0x3f, 2) // H

  const pressure = parseLps25hPressure(pressBuf)
  assert.equal(pressure, 1013.25)

  // Temperature: 42.5 + raw / 480.0
  // For raw = 0 => 42.5°C
  const tempBufZero = Buffer.alloc(2)
  tempBufZero.writeInt16LE(0, 0)
  assert.equal(parseLps25hTemperature(tempBufZero), 42.5)

  // For raw = -9600 => 42.5 + (-9600 / 480) = 42.5 - 20 = 22.5°C
  const tempBuf = Buffer.alloc(2)
  tempBuf.writeInt16LE(-9600, 0)
  assert.equal(parseLps25hTemperature(tempBuf), 22.5)
})

test('Fallback when /dev/i2c-1 is missing or in local development', async () => {
  clearSenseHatCache()

  // On machines without /dev/i2c-1 (like local Windows dev), readSenseHatFromI2C returns null
  const hw = await readSenseHatFromI2C()
  assert.equal(hw, null, 'Hardware reading should return null when /dev/i2c-1 is not present')

  // readSensorData should gracefully return simulated values
  const sensorData = await readSensorData({
    dhtEnabled: false,
    dhtPin: 4,
    dhtType: 'dht22',
    senseHatEnabled: true,
    senseHatTempOffset: -1.8,
    senseHatPressureOffsetHpa: 0.0,
    sdsEnabled: false,
    sdsPort: '/dev/ttyUSB0'
  })

  assert.equal(sensorData.isSimulated, true)
  assert.equal(sensorData.hasSenseHat, true)
  assert.equal(sensorData.temperature, 21.5)
  assert.equal(sensorData.humidity, 45)
  assert.ok(sensorData.pressure !== undefined && sensorData.pressure >= 1000 && sensorData.pressure <= 1030)
})
