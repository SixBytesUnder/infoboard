import fs from 'node:fs/promises'
import path from 'node:path'
import ExifReader from 'exifreader'
import type { ExifMetadata } from '~~/shared'
import { isPathInsideDirectory, sanitizeSubPath } from '../utils/sandbox'

export default defineEventHandler(async (event): Promise<ExifMetadata> => {
  const config = useRuntimeConfig(event)
  const baseDir = config.media.localDir

  if (!baseDir) return {}

  const query = getQuery(event)
  const rawFile = Array.isArray(query.file) ? query.file[0] : query.file
  const relFile = sanitizeSubPath(typeof rawFile === 'string' ? rawFile : '')
  if (!relFile) return {}

  const fullPath = path.join(baseDir, relFile)
  const isSafe = await isPathInsideDirectory(fullPath, baseDir)
  if (!isSafe) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  try {
    // Read first 128 KB for EXIF headers rather than entire file
    const fileHandle = await fs.open(fullPath, 'r')
    let buffer: Buffer
    let bytesRead = 0
    try {
      buffer = Buffer.alloc(131072)
      const readResult = await fileHandle.read(buffer, 0, 131072, 0)
      bytesRead = readResult.bytesRead
    } finally {
      await fileHandle.close()
    }

    const tags = ExifReader.load(buffer.subarray(0, bytesRead))

    const fn = tags.FNumber?.description
    const fNumber = fn ? (fn.startsWith('f/') ? fn : `f/${fn}`) : undefined

    const fl = tags.FocalLength?.description
    const focalLength = fl ? (fl.endsWith('mm') ? fl : `${fl}mm`) : undefined

    const et = tags.ExposureTime?.description
    const exposureTime = et ? (et.endsWith('s') ? et : `${et}s`) : undefined

    return {
      Make: tags.Make?.description,
      Model: tags.Model?.description,
      DateTime: tags.DateTime?.description,
      ExposureTime: exposureTime,
      ExposureProgram: tags.ExposureProgram?.description,
      FNumber: fNumber,
      ISO: tags.ISOSpeedRatings?.description,
      Flash: tags.Flash?.description,
      FocalLength: focalLength,
      PixelXDimension: tags.PixelXDimension?.description,
      PixelYDimension: tags.PixelYDimension?.description
    }
  } catch (err) {
    console.warn('EXIF read error:', (err as Error).message)
    return {}
  }
})
