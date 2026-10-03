<template>
  <div :class="bodyClasses">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClientDashboardConfig } from '~~/shared'

const config = useRuntimeConfig().public as unknown as ClientDashboardConfig

const bodyClasses = computed(() => {
  const classes: string[] = []
  if (config.app.magicMirror) classes.push('magic-mirror')
  if (config.app.lowPowerMode) classes.push('low-power')
  return classes.join(' ')
})

useHead({
  bodyAttrs: {
    class: bodyClasses
  }
})
</script>
