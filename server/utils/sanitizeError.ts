/**
 * Redacts sensitive API keys, tokens, and private calendar URL segments from error messages
 * while preserving HTTP status codes, upstream hostnames, and diagnostic context.
 */
export function sanitizeErrorMessage(
  err: unknown,
  secrets: Array<string | undefined> = []
): string {
  let msg = err instanceof Error ? err.message : String(err || 'Unknown error')

  // Redact any explicitly provided secret strings (e.g., API keys, app keys)
  for (const secret of secrets) {
    if (secret && secret.trim().length > 3) {
      msg = msg.split(secret).join('[REDACTED]')
      const encoded = encodeURIComponent(secret)
      if (encoded !== secret) {
        msg = msg.split(encoded).join('[REDACTED]')
      }
    }
  }

  // Redact common secret query parameters in URLs
  msg = msg.replace(
    /([?&](?:apikey|api_key|app_key|app_id|token|key|secret|auth|password|access_token)=)[^&\s"')]+/gi,
    '$1[REDACTED]'
  )

  // Redact Google Calendar private iCal address tokens (e.g., /private-3b8c9d.../basic.ics)
  msg = msg.replace(/\/private-[a-z0-9_-]+\//gi, '/private-[REDACTED]/')

  // Redact email addresses in calendar URLs (e.g., /ical/user%40domain.com/ or /ical/user@domain.com/)
  msg = msg.replace(/\/ical\/[^/\s"']+\//gi, '/ical/[REDACTED]/')

  // Redact Basic Auth credentials in URLs (https://user:pass@host)
  msg = msg.replace(/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/gi, '$1[REDACTED]@')

  return msg
}
