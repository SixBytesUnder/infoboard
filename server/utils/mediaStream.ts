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

export function resolveMimeType(ext: string, userAgent = ''): string {
  const normalizedExt = ext.toLowerCase()
  if (normalizedExt === '.mov') {
    // Safari / iOS AVFoundation handles video/quicktime natively, whereas
    // Chromium / Firefox HTMLMediaElement rejects video/quicktime but plays
    // H.264/AAC QuickTime containers when served as video/mp4.
    const isSafari = /Safari/i.test(userAgent) && !/(Chrome|Chromium|CriOS|FxiOS|Edg)/i.test(userAgent)
    return isSafari ? 'video/quicktime' : 'video/mp4'
  }
  return MIME_MAP[normalizedExt] || 'application/octet-stream'
}

export function parseByteRange(
  rangeHeader: string | undefined,
  fileSize: number
): { start: number; end: number } | null {
  if (!rangeHeader || fileSize <= 0 || !/^bytes=/i.test(rangeHeader.trim())) {
    return null
  }

  // If multiple ranges are requested (e.g. "bytes=0-1, 1024-2047"), serve the first range
  const firstRangeSpec = rangeHeader.trim().replace(/^bytes=/i, '').split(',')[0]?.trim() || ''
  const match = /^(\d*)-(\d*)$/.exec(firstRangeSpec)
  if (!match || (!match[1] && !match[2])) {
    return null
  }

  let start: number
  let end: number

  if (!match[1] && match[2]) {
    // Suffix byte-range spec: "bytes=-N" means the last N bytes of the file (RFC 7233 Section 2.1)
    const suffixLength = Number.parseInt(match[2], 10)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null
    }
    start = Math.max(0, fileSize - suffixLength)
    end = fileSize - 1
  } else {
    start = match[1] ? Number.parseInt(match[1], 10) : 0
    end = match[2] ? Math.min(Number.parseInt(match[2], 10), fileSize - 1) : fileSize - 1
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start > end ||
    start >= fileSize
  ) {
    return null
  }

  return { start, end }
}

export function sliceCircular<T>(items: T[], startIndex: number, count: number): T[] {
  const total = items.length
  if (total === 0 || count <= 0) return []
  if (count >= total) {
    const normalized = ((startIndex % total) + total) % total
    if (normalized === 0) return items
    return items.slice(normalized).concat(items.slice(0, normalized))
  }
  const normalizedStart = ((startIndex % total) + total) % total
  const end = normalizedStart + count
  if (end <= total) {
    return items.slice(normalizedStart, end)
  }
  return items.slice(normalizedStart).concat(items.slice(0, end - total))
}
