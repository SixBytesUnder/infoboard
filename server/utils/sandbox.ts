import path from 'node:path'
import fs from 'node:fs/promises'

export async function isPathInsideDirectory(targetPath: string, rootDir: string): Promise<boolean> {
  try {
    const resolvedRoot = await fs.realpath(rootDir)
    const resolvedTarget = await fs.realpath(targetPath)
    const relative = path.relative(resolvedRoot, resolvedTarget)
    return !relative.startsWith('..') && !path.isAbsolute(relative)
  } catch {
    return false
  }
}

export function sanitizeSubPath(subPath: string): string {
  // Normalize and remove leading slashes, backslashes, or parent directory attempts
  const normalized = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '')
  return normalized.replace(/^[\/\\]+/, '')
}
