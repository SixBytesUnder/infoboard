import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { isPathInsideDirectory, sanitizeSubPath } from '../../utils/sandbox'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const baseDir = config.media.localDir

  if (!baseDir) {
    throw createError({ statusCode: 404, statusMessage: 'Media directory not configured' })
  }

  const param = getRouterParam(event, 'path') || event.context.params?.path || event.context.params?._ || ''
  const rawPath = Array.isArray(param) ? param.join('/') : String(param)
  let decodedPath = rawPath
  try {
    decodedPath = decodeURIComponent(rawPath)
  } catch {
    // Keep rawPath if malformed URI component
  }
  const safeSubPath = sanitizeSubPath(decodedPath)
  const fullPath = path.join(baseDir, safeSubPath)

  const isSafe = await isPathInsideDirectory(fullPath, baseDir)
  if (!isSafe) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Path traversal is not allowed' })
  }

  let stats: fs.Stats
  try {
    stats = await fsPromises.stat(fullPath)
    if (!stats.isFile()) {
      throw createError({ statusCode: 404, statusMessage: 'Not a file' })
    }
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const ext = path.extname(fullPath).toLowerCase()
  const mimeType = MIME_MAP[ext] || 'application/octet-stream'
  const fileSize = stats.size

  const rangeHeader = getHeader(event, 'range')

  // Support Byte-Range requests for MP4 video streaming
  if (mimeType.startsWith('video/') && rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-')
    const start = Number.parseInt(parts[0] || '0', 10)
    const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    setResponseStatus(event, 206)
    setResponseHeaders(event, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': mimeType
    })

    return sendStream(event, fs.createReadStream(fullPath, { start, end }))
  }

  // Standard full-file response
  setResponseHeaders(event, {
    'Content-Length': fileSize.toString(),
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=86400, immutable'
  })

  return sendStream(event, fs.createReadStream(fullPath))
})
