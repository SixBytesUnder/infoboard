import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { isPathInsideDirectory, sanitizeSubPath } from '../../utils/sandbox'
import { parseByteRange, resolveMimeType } from '../../utils/mediaStream'

export default defineEventHandler(async (event) => {
  const method = event.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const config = useRuntimeConfig(event)
  const baseDir = process.env.NUXT_MEDIA_LOCAL_DIR || config.media.localDir

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
  const userAgent = getHeader(event, 'user-agent') || ''
  const mimeType = resolveMimeType(ext, userAgent)
  const fileSize = stats.size
  const isVideo = mimeType.startsWith('video/')

  const rangeHeader = getHeader(event, 'range')

  // Support Byte-Range requests for video streaming (and any ranged media request)
  if (rangeHeader && (isVideo || fileSize > 0)) {
    if (fileSize === 0) {
      setResponseHeaders(event, { 'Content-Range': 'bytes */0' })
      throw createError({ statusCode: 416, statusMessage: 'Range Not Satisfiable' })
    }

    const range = parseByteRange(rangeHeader, fileSize)
    if (!range) {
      setResponseHeaders(event, {
        'Content-Range': `bytes */${fileSize}`,
        'Accept-Ranges': 'bytes'
      })
      throw createError({ statusCode: 416, statusMessage: 'Range Not Satisfiable' })
    }

    const { start, end } = range
    const chunkSize = end - start + 1

    setResponseStatus(event, 206)
    setResponseHeaders(event, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600'
    })

    if (method === 'HEAD') {
      event.node.res.end()
      return
    }

    const stream = fs.createReadStream(fullPath, { start, end })
    event.node.res.once('close', () => {
      if (!stream.destroyed) {
        stream.destroy()
      }
    })

    return sendStream(event, stream)
  }

  // Standard full-file response (always advertise Accept-Ranges: bytes so iOS/Safari knows seeking is supported)
  setResponseStatus(event, 200)
  setResponseHeaders(event, {
    'Accept-Ranges': 'bytes',
    'Content-Length': fileSize.toString(),
    'Content-Type': mimeType,
    'Cache-Control': isVideo ? 'public, max-age=3600' : 'public, max-age=86400, immutable'
  })

  if (method === 'HEAD') {
    event.node.res.end()
    return
  }

  const stream = fs.createReadStream(fullPath)
  event.node.res.once('close', () => {
    if (!stream.destroyed) {
      stream.destroy()
    }
  })

  return sendStream(event, stream)
})
