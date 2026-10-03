import fs from 'node:fs/promises'
import path from 'node:path'
import type { BackgroundBatch, MediaAsset } from '~~/shared'
import { isPathInsideDirectory, sanitizeSubPath } from '../utils/sandbox'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm'])

export default defineEventHandler(async (event): Promise<BackgroundBatch> => {
  const config = useRuntimeConfig(event)
  const mediaConf = config.media
  const query = getQuery(event)
  const requestedFolder = sanitizeSubPath((query.folder as string) || '')

  const baseDir = mediaConf.localDir
  if (!baseDir) {
    return {
      items: [
        {
          type: 'image',
          url: '/images/nasa.jpg',
          identifier: 'nasa-default',
          title: 'Default Background'
        }
      ]
    }
  }

  const targetDir = requestedFolder ? path.join(baseDir, requestedFolder) : baseDir

  const isSafe = await isPathInsideDirectory(targetDir, baseDir)
  if (!isSafe) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Path traversal outside media directory is not allowed'
    })
  }

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true })
    const items: MediaAsset[] = []
    const subdirs: string[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        subdirs.push(entry.name)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const relativeSub = requestedFolder ? `${requestedFolder}/${entry.name}` : entry.name

        if (IMAGE_EXTS.has(ext)) {
          items.push({
            type: 'image',
            url: `/api/media/${encodeURIComponent(relativeSub)}`,
            identifier: relativeSub,
            title: entry.name,
            folder: requestedFolder
          })
        } else if (mediaConf.allowVideo && VIDEO_EXTS.has(ext)) {
          items.push({
            type: 'video',
            url: `/api/media/${encodeURIComponent(relativeSub)}`,
            identifier: relativeSub,
            title: entry.name,
            folder: requestedFolder
          })
        }
      }
    }

    subdirs.sort()
    const nextFolder = subdirs.length > 0 ? (requestedFolder ? `${requestedFolder}/${subdirs[0]}` : subdirs[0]) : undefined

    if (items.length === 0 && subdirs.length > 0 && !requestedFolder) {
      // If root has no images but has subfolders, recursively find first folder with images
      const firstFolder = subdirs[0]
      if (firstFolder) {
        return await $fetch<BackgroundBatch>(`/api/backgrounds?folder=${encodeURIComponent(firstFolder)}`)
      }
    }

    return {
      items,
      currentFolder: requestedFolder,
      nextFolder
    }
  } catch (err) {
    console.warn('Local background scan error:', (err as Error).message)
    return {
      items: [
        {
          type: 'image',
          url: '/images/nasa.jpg',
          identifier: 'fallback',
          title: 'Fallback Background'
        }
      ]
    }
  }
})
