import fs from 'node:fs/promises'
import path from 'node:path'
import type { BackgroundBatch, MediaAsset } from '~~/shared'
import { isPathInsideDirectory } from '../utils/sandbox'
import { sliceCircular } from '../utils/mediaStream'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v'])

const SCAN_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CachedCatalog {
  baseDir: string
  allowVideo: boolean
  timestamp: number
  items: MediaAsset[]
  uniqueFolders: string[]
}

let cachedCatalog: CachedCatalog | null = null
let activeScanPromise: Promise<CachedCatalog> | null = null

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

async function scanDirectoryRecursive(
  baseDir: string,
  relDir: string,
  allowVideo: boolean
): Promise<MediaAsset[]> {
  const currentDir = relDir ? path.join(baseDir, relDir) : baseDir
  let entries: import('node:fs').Dirent[] = []

  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true })
  } catch (err) {
    console.warn(`Failed to read directory ${currentDir}:`, (err as Error).message)
    return []
  }

  const subdirs: string[] = []
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    if (entry.isDirectory()) {
      subdirs.push(entry.name)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (IMAGE_EXTS.has(ext) || (allowVideo && VIDEO_EXTS.has(ext))) {
        files.push(entry.name)
      }
    }
  }

  subdirs.sort(naturalSort)
  files.sort(naturalSort)

  let allAssets: MediaAsset[] = []

  // 1. Process all folders (with their subfolders) first in alphabetical order
  for (const sub of subdirs) {
    const subRel = relDir ? `${relDir}/${sub}` : sub
    const subAssets = await scanDirectoryRecursive(baseDir, subRel, allowVideo)
    allAssets = allAssets.concat(subAssets)
  }

  // 2. Then files directly in this folder
  for (const file of files) {
    const fileRel = relDir ? `${relDir}/${file}` : file
    const ext = path.extname(file).toLowerCase()
    const isVideo = VIDEO_EXTS.has(ext)

    // Encode path segments while keeping forward slashes intact and escaping quotes for CSS safety
    const encodedPath = fileRel
      .split('/')
      .map(seg => encodeURIComponent(seg).replace(/'/g, '%27'))
      .join('/')

    allAssets.push({
      type: isVideo ? 'video' : 'image',
      url: `/api/media/${encodedPath}`,
      identifier: fileRel,
      title: file,
      folder: relDir || '[root]'
    })
  }

  return allAssets
}

async function getCatalog(baseDir: string, allowVideo: boolean, forceRefresh = false): Promise<CachedCatalog> {
  const now = Date.now()
  if (
    !forceRefresh &&
    cachedCatalog &&
    cachedCatalog.baseDir === baseDir &&
    cachedCatalog.allowVideo === allowVideo &&
    now - cachedCatalog.timestamp < SCAN_CACHE_TTL_MS
  ) {
    return cachedCatalog
  }

  if (activeScanPromise) {
    return activeScanPromise
  }

  activeScanPromise = (async () => {
    try {
      const items = await scanDirectoryRecursive(baseDir, '', allowVideo)
      const uniqueFolders = Array.from(new Set(items.map(it => it.folder || '[root]')))
      const nextCatalog: CachedCatalog = {
        baseDir,
        allowVideo,
        timestamp: Date.now(),
        items,
        uniqueFolders
      }
      cachedCatalog = nextCatalog
      return nextCatalog
    } finally {
      activeScanPromise = null
    }
  })()

  return activeScanPromise
}

export default defineEventHandler(async (event): Promise<BackgroundBatch> => {
  const config = useRuntimeConfig(event)
  const env = process.env
  const mediaConf = config.media
  const allowVideo = (env.NUXT_MEDIA_ALLOW_VIDEO || env.NUXT_PUBLIC_MEDIA_ALLOW_VIDEO || String(mediaConf.allowVideo)) === 'true'

  const baseDir = env.NUXT_MEDIA_LOCAL_DIR || mediaConf.localDir
  if (!baseDir) {
    return {
      items: [
        {
          type: 'image',
          url: '/images/nasa.jpg',
          identifier: 'nasa-default',
          title: 'Default Background',
          folder: '[default]'
        }
      ],
      totalCount: 1,
      hasMore: false
    }
  }

  const isSafe = await isPathInsideDirectory(baseDir, baseDir)
  if (!isSafe) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Configured media directory is invalid or inaccessible'
    })
  }

  try {
    const query = getQuery(event)
    const forceRefresh = query.refresh === '1' || query.refresh === 'true'
    const catalog = await getCatalog(baseDir, allowVideo, forceRefresh)
    const allItems = catalog.items
    const totalCount = allItems.length

    if (totalCount === 0) {
      return {
        items: [
          {
            type: 'image',
            url: '/images/nasa.jpg',
            identifier: 'nasa-default',
            title: 'No media found in folder',
            folder: '[default]'
          }
        ],
        totalCount: 1,
        hasMore: false
      }
    }

    const rawLimit = typeof query.limit === 'string' ? Number.parseInt(query.limit, 10) : 0
    const startId = typeof query.startId === 'string' ? query.startId : ''
    const afterId = typeof query.afterId === 'string' ? query.afterId : ''
    const skipFolderFrom = typeof query.skipFolderFrom === 'string' ? query.skipFolderFrom : ''

    let startIndex = 0

    if (skipFolderFrom) {
      const fromIdx = allItems.findIndex(it => it.identifier === skipFolderFrom)
      if (fromIdx !== -1) {
        const currentFolder = allItems[fromIdx]?.folder || '[root]'
        for (let offset = 1; offset < totalCount; offset++) {
          const candidateIdx = (fromIdx + offset) % totalCount
          const candidateFolder = allItems[candidateIdx]?.folder || '[root]'
          if (candidateFolder !== currentFolder) {
            startIndex = candidateIdx
            break
          }
        }
      }
    } else if (afterId) {
      const afterIdx = allItems.findIndex(it => it.identifier === afterId)
      if (afterIdx !== -1) {
        startIndex = (afterIdx + 1) % totalCount
      }
    } else if (startId) {
      const foundIdx = allItems.findIndex(it => it.identifier === startId)
      if (foundIdx !== -1) {
        startIndex = foundIdx
      }
    }

    const items = rawLimit > 0
      ? sliceCircular(allItems, startIndex, Math.min(rawLimit, totalCount))
      : (startIndex > 0 ? sliceCircular(allItems, startIndex, totalCount) : allItems)

    const uniqueFolders = catalog.uniqueFolders
    const currentFolder = items[0]?.folder || '[root]'
    const curFolderIdx = uniqueFolders.indexOf(currentFolder)
    const nextFolder = curFolderIdx !== -1
      ? (uniqueFolders[(curFolderIdx + 1) % uniqueFolders.length] || currentFolder)
      : (uniqueFolders[1] || uniqueFolders[0])

    return {
      items,
      totalCount,
      hasMore: totalCount > items.length,
      currentFolder,
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
          title: 'Fallback Background',
          folder: '[fallback]'
        }
      ],
      totalCount: 1,
      hasMore: false
    }
  }
})
