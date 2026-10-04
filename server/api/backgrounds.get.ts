import fs from 'node:fs/promises'
import path from 'node:path'
import type { BackgroundBatch, MediaAsset } from '~~/shared'
import { isPathInsideDirectory } from '../utils/sandbox'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v'])

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

export default defineEventHandler(async (event): Promise<BackgroundBatch> => {
  const config = useRuntimeConfig(event)
  const mediaConf = config.media

  const baseDir = mediaConf.localDir
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
      ]
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
    const items = await scanDirectoryRecursive(baseDir, '', mediaConf.allowVideo)

    if (items.length === 0) {
      return {
        items: [
          {
            type: 'image',
            url: '/images/nasa.jpg',
            identifier: 'nasa-default',
            title: 'No media found in folder',
            folder: '[default]'
          }
        ]
      }
    }

    const uniqueFolders = Array.from(new Set(items.map(it => it.folder || '[root]')))

    return {
      items,
      currentFolder: items[0]?.folder,
      nextFolder: uniqueFolders[1] || uniqueFolders[0]
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
      ]
    }
  }
})
