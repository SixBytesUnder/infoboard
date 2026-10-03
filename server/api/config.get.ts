import type { ClientDashboardConfig } from '~~/shared'

export default defineEventHandler((event): ClientDashboardConfig => {
  const config = useRuntimeConfig(event)
  return config.public as unknown as ClientDashboardConfig
})
