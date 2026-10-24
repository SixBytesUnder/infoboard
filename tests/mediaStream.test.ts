import test from 'node:test'
import assert from 'node:assert/strict'
import { parseByteRange, resolveMimeType, sliceCircular } from '../server/utils/mediaStream.ts'

test('parseByteRange handles standard, open-ended, suffix, and multi-range headers', () => {
  const fileSize = 381143

  // 1. iOS Safari 2-byte initial probe
  assert.deepEqual(parseByteRange('bytes=0-1', fileSize), { start: 0, end: 1 })

  // 2. Open-ended range request
  assert.deepEqual(parseByteRange('bytes=0-', fileSize), { start: 0, end: 381142 })
  assert.deepEqual(parseByteRange('bytes=374910-', fileSize), { start: 374910, end: 381142 })

  // 3. Suffix byte-range spec (RFC 7233 Section 2.1: last N bytes for MP4 moov atom)
  assert.deepEqual(parseByteRange('bytes=-6233', fileSize), {
    start: 381143 - 6233,
    end: 381142
  })

  // Suffix larger than file size clamps start to 0
  assert.deepEqual(parseByteRange('bytes=-500000', fileSize), {
    start: 0,
    end: 381142
  })

  // 4. Multi-range header uses first range instead of failing with 416
  assert.deepEqual(parseByteRange('bytes=0-1, 374910-381142', fileSize), {
    start: 0,
    end: 1
  })

  // 5. End byte beyond fileSize clamps to fileSize - 1
  assert.deepEqual(parseByteRange('bytes=100-999999', fileSize), {
    start: 100,
    end: 381142
  })

  // 6. Invalid ranges return null (416)
  assert.equal(parseByteRange('bytes=-', fileSize), null)
  assert.equal(parseByteRange('bytes=-0', fileSize), null)
  assert.equal(parseByteRange('bytes=400000-400010', fileSize), null)
  assert.equal(parseByteRange('bytes=500-100', fileSize), null)
  assert.equal(parseByteRange('items=0-10', fileSize), null)
  assert.equal(parseByteRange('bytes=0-1', 0), null)
})

test('resolveMimeType serves .mov appropriately for Safari vs Chromium/Firefox', () => {
  const ipadSafariUa = 'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1'
  const desktopChromeUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  const desktopFirefoxUa = 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0'

  assert.equal(resolveMimeType('.mov', ipadSafariUa), 'video/quicktime')
  assert.equal(resolveMimeType('.mov', desktopChromeUa), 'video/mp4')
  assert.equal(resolveMimeType('.mov', desktopFirefoxUa), 'video/mp4')
  assert.equal(resolveMimeType('.mp4', ipadSafariUa), 'video/mp4')
  assert.equal(resolveMimeType('.m4v', ipadSafariUa), 'video/mp4')
})

test('sliceCircular extracts bounded windows and wraps around circularly', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  assert.deepEqual(sliceCircular(items, 0, 3), ['a', 'b', 'c'])
  assert.deepEqual(sliceCircular(items, 3, 3), ['d', 'e', 'a'])
  assert.deepEqual(sliceCircular(items, 2, 10), ['c', 'd', 'e', 'a', 'b'])
  assert.deepEqual(sliceCircular([], 0, 5), [])
})
