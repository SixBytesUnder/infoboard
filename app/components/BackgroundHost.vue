<template>
  <div v-if="!magicMirror" class="background-host">
    <!-- Video Player -->
    <video
      v-if="currentAsset?.type === 'video'"
      class="bg-video-contain"
      autoplay
      playsinline
      :muted="isMuted"
      :src="currentAsset.url"
      @play="onVideoPlay"
      @ended="onVideoEnded"
      @error="onVideoError"
    />

    <!-- Dual-Layer Ping-Pong Crossfading Image Slots -->
    <div
      v-for="slot in slots"
      :key="slot.id"
      class="bg-media-layer"
      :class="{ 'is-active': slot.isActive, 'is-top': slot.isTop }"
    >
      <div
        v-if="slot.asset?.url"
        class="bg-image-blur"
        :style="{ backgroundImage: getSafeBackgroundUrl(slot.asset.url) }"
      />
      <img
        v-if="slot.asset?.url"
        :src="slot.asset.url"
        :alt="slot.asset.title || 'Background'"
        class="bg-image-contain"
        decoding="async"
        @error="onImageError"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBackgroundMedia, getSafeBackgroundUrl, type MediaSourceType } from '~/composables/useBackgroundMedia'
import type { MediaAsset } from '~~/shared'

const props = withDefaults(defineProps<{
  source?: MediaSourceType
  intervalSeconds?: number
  isMuted?: boolean
  magicMirror?: boolean
  weatherTag?: string
}>(), {
  source: 'local',
  intervalSeconds: 60,
  isMuted: true,
  magicMirror: false,
  weatherTag: ''
})

const emit = defineEmits<{
  'update:active-asset': [asset: MediaAsset | null]
  'update:is-video': [val: boolean]
  'update:can-skip': [val: boolean]
}>()

const {
  slots,
  currentAsset,
  advanceNext,
  onVideoPlay,
  onVideoEnded,
  onVideoError,
  onImageError
} = useBackgroundMedia({
  getSource: () => props.source,
  getIntervalSeconds: () => props.intervalSeconds,
  getMagicMirror: () => props.magicMirror,
  getWeatherTag: () => props.weatherTag,
  onActiveAssetChange: asset => emit('update:active-asset', asset),
  onIsVideoChange: val => emit('update:is-video', val),
  onCanSkipChange: val => emit('update:can-skip', val)
})

defineExpose({
  nextImage: () => advanceNext(false),
  nextFolder: () => advanceNext(true)
})
</script>

<style scoped>
.background-host {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
  background-color: #0b0c0e;
}

.bg-media-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity;
  transform: translateZ(0);
  contain: layout style;
}

.bg-media-layer.is-active {
  opacity: 1;
}

.bg-media-layer.is-top {
  z-index: 2;
}

.bg-image-blur {
  position: absolute;
  inset: -30px;
  background-size: cover;
  background-position: center;
  filter: blur(16px) brightness(0.85);
  z-index: 0;
  pointer-events: none;
  transform: translateZ(0);
}

.bg-image-contain,
.bg-video-contain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  margin: auto;
  z-index: 1;
  pointer-events: none;
  -webkit-touch-callout: none;
  user-select: none;
}
</style>
