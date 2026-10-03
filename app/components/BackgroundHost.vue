<template>
  <div v-if="!magicMirror" class="background-host">
    <!-- MP4 Video Player -->
    <video
      v-if="currentAsset?.type === 'video'"
      ref="videoRef"
      class="bg-video-contain"
      autoplay
      playsinline
      :muted="isMuted"
      :src="currentAsset.url"
      @ended="onVideoEnded"
      @play="onVideoPlay"
    />

    <!-- Dual-Layer Image: Blurred Cover + Sharp Contain -->
    <div
      v-else-if="currentAsset?.type === 'image'"
      class="bg-image-blur"
      :style="{ backgroundImage: `url('${currentAsset.url}')` }"
    />
    <img
      v-if="currentAsset?.type === 'image'"
      :src="currentAsset.url"
      :alt="currentAsset.title || 'Background'"
      class="bg-image-contain"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onScopeDispose, watch } from 'vue'
import type { MediaAsset, BackgroundBatch } from '~~/shared'

const props = withDefaults(defineProps<{
  source?: 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr'
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
}>()

const currentAsset = ref<MediaAsset | null>(null)
const queue = ref<MediaAsset[]>([])
const currentFolder = ref<string | undefined>(undefined)
const nextFolder = ref<string | undefined>(undefined)
const videoRef = ref<HTMLVideoElement | null>(null)

let rotationTimer: ReturnType<typeof setTimeout> | null = null
let isPlayingVideo = false

const clearTimer = () => {
  if (rotationTimer !== null) {
    clearTimeout(rotationTimer)
    rotationTimer = null
  }
}

const scheduleNext = () => {
  clearTimer()
  if (isPlayingVideo || props.magicMirror || props.source === 'single') return

  rotationTimer = setTimeout(() => {
    advanceNext()
  }, props.intervalSeconds * 1000)
}

const fetchBatch = async (folder?: string) => {
  if (props.source === 'local' || props.source === 'single') {
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : ''
    const res = await $fetch<BackgroundBatch>(`/api/backgrounds${query}`)
    queue.value = res.items
    currentFolder.value = res.currentFolder
    nextFolder.value = res.nextFolder
  } else {
    const query = props.weatherTag ? `?weatherTag=${encodeURIComponent(props.weatherTag)}` : ''
    const items = await $fetch<MediaAsset[]>(`/api/photos${query}`)
    queue.value = items
  }
}

const advanceNext = async (skipFolder = false) => {
  clearTimer()
  isPlayingVideo = false

  if (skipFolder && nextFolder.value) {
    await fetchBatch(nextFolder.value)
  }

  if (queue.value.length === 0) {
    await fetchBatch(currentFolder.value)
  }

  if (queue.value.length > 0) {
    const nextItem = queue.value.shift()!
    currentAsset.value = nextItem
    emit('update:active-asset', nextItem)
    emit('update:is-video', nextItem.type === 'video')
  }

  scheduleNext()
}

const onVideoPlay = () => {
  isPlayingVideo = true
  clearTimer()
}

const onVideoEnded = () => {
  isPlayingVideo = false
  advanceNext()
}

// Watch weather condition tag changes for tagged photo rotation
watch(() => props.weatherTag, (newTag, oldTag) => {
  if (newTag && newTag !== oldTag && ['unsplash', 'pexels', 'flickr'].includes(props.source)) {
    queue.value = []
    advanceNext()
  }
})

onMounted(async () => {
  if (!props.magicMirror) {
    await advanceNext()
  }
})

onScopeDispose(() => {
  clearTimer()
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

.bg-image-blur {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(24px) brightness(0.6);
  transform: scale(1.06);
  transition: background-image 0.8s ease-in-out;
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
}

.bg-image-contain {
  animation: fade-in 0.8s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
