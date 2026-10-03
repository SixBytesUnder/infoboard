export interface TfLLineStatus {
  id: string
  name: string
  statusSeverity: number
  statusSeverityDescription: string
  reason?: string
}

export interface TransitPayload {
  lines: TfLLineStatus[]
  buses: Record<string, Record<string, string[]>>
  fetchedAt: string
  isStale?: boolean
  errorMessage?: string
}
