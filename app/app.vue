<template>
  <div :class="bodyClasses">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toClientDashboardConfig } from '~~/shared'

const config = toClientDashboardConfig(useRuntimeConfig().public)

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
