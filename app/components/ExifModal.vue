<template>
  <div v-if="exif && hasAnyData" class="glass-panel exif-panel">
    <div class="exif-header">
      <span class="exif-title">EXIF Photo Metadata</span>
      <button type="button" class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="exif-body">
      <div v-if="exif.Make || exif.Model" class="exif-row">
        <span class="lbl">Camera:</span>
        <span class="val">{{ [exif.Make, exif.Model].filter(Boolean).join(' ') }}</span>
      </div>
      <div v-if="exif.DateTime" class="exif-row">
        <span class="lbl">Date:</span>
        <span class="val">{{ exif.DateTime }}</span>
      </div>
      <div v-if="exif.ExposureTime" class="exif-row">
        <span class="lbl">Exposure:</span>
        <span class="val">{{ exif.ExposureTime }}</span>
      </div>
      <div v-if="exif.FNumber" class="exif-row">
        <span class="lbl">Aperture:</span>
        <span class="val">{{ exif.FNumber }}</span>
      </div>
      <div v-if="exif.ISO" class="exif-row">
        <span class="lbl">ISO:</span>
        <span class="val">{{ exif.ISO }}</span>
      </div>
      <div v-if="exif.FocalLength" class="exif-row">
        <span class="lbl">Focal Length:</span>
        <span class="val">{{ exif.FocalLength }}</span>
      </div>
      <div v-if="exif.PixelXDimension && exif.PixelYDimension" class="exif-row">
        <span class="lbl">Dimensions:</span>
        <span class="val">{{ exif.PixelXDimension }} × {{ exif.PixelYDimension }} px</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExifMetadata } from '~~/shared'

const props = defineProps<{
  exif: ExifMetadata | null
}>()

defineEmits<{
  close: []
}>()

const hasAnyData = computed(() => {
  if (!props.exif) return false
  return Object.values(props.exif).some(v => v !== undefined && v !== '')
})
</script>

<style scoped>
.exif-panel {
  position: fixed;
  bottom: 4rem;
  right: 1.5rem;
  padding: 1rem 1.25rem;
  max-width: 320px;
  z-index: 40;
  font-size: 0.78rem;
  animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.exif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.exif-title {
  font-weight: 700;
  color: var(--accent-cyan);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
}

.close-btn:hover {
  color: var(--text-primary);
}

.exif-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.exif-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.lbl {
  color: var(--text-secondary);
}

.val {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}
</style>
