<template>
  <div v-if="!magicMirror" class="background-host">
    <!-- Video Player -->
    <video
      v-if="currentAsset?.type === 'video'"
      ref="videoRef"
      class="bg-video-contain"
      autoplay
      playsinline
      :muted="isMuted"
      :src="currentAsset.url"
      @play="onVideoPlay"
      @ended="onVideoEnded"
      @error="onVideoError"
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
      @error="onImageError"
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

const playlist = ref<MediaAsset[]>([])
const currentIndex = ref<number>(0)
const currentAsset = ref<MediaAsset | null>(null)
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
    advanceNext(false)
  }, props.intervalSeconds * 1000)
}

const STORAGE_KEY_ASSET = 'infoboard_active_media_id'

const loadPlaylist = async (isBackgroundRefresh = false) => {
  try {
    let items: MediaAsset[] = []

    if (props.source === 'local' || props.source === 'single') {
      const res = await $fetch<BackgroundBatch>('/api/backgrounds')
      items = res.items || []
    } else {
      const query = props.weatherTag ? `?weatherTag=${encodeURIComponent(props.weatherTag)}` : ''
      items = await $fetch<MediaAsset[]>(`/api/photos${query}`)
    }

    if (items.length > 0) {
      playlist.value = items
      if (!isBackgroundRefresh) {
        let startIdx = 0
        if (typeof window !== 'undefined' && props.source === 'local') {
          try {
            const savedId = localStorage.getItem(STORAGE_KEY_ASSET)
            if (savedId) {
              const foundIdx = items.findIndex(it => it.identifier === savedId)
              if (foundIdx !== -1) {
                startIdx = foundIdx
              }
            }
          } catch {
            // LocalStorage restricted or disabled
          }
        }
        currentIndex.value = startIdx
        displayCurrent()
      }
    }
  } catch (err) {
    console.warn('Failed to load media playlist:', (err as Error).message)
  }
}

const displayCurrent = () => {
  if (playlist.value.length === 0) {
    currentAsset.value = null
    emit('update:active-asset', null)
    emit('update:is-video', false)
    return
  }

  const asset = playlist.value[currentIndex.value]
  if (!asset) {
    currentAsset.value = null
    emit('update:active-asset', null)
    emit('update:is-video', false)
    return
  }

  currentAsset.value = asset
  emit('update:active-asset', asset)
  emit('update:is-video', asset.type === 'video')

  // Persist current media position in localStorage for seamless resume
  if (typeof window !== 'undefined' && props.source === 'local') {
    try {
      localStorage.setItem(STORAGE_KEY_ASSET, asset.identifier)
    } catch {
      // Ignore quota errors
    }
  }

  if (asset.type === 'image') {
    scheduleNext()
  }
}

const advanceNext = async (skipFolder = false) => {
  clearTimer()
  isPlayingVideo = false

  if (playlist.value.length === 0) {
    await loadPlaylist()
    return
  }

  if (props.source === 'single') {
    return
  }

  if (skipFolder) {
    const curFolder = currentAsset.value?.folder || '[root]'
    let targetIndex = -1

    for (let offset = 1; offset < playlist.value.length; offset++) {
      const candidateIdx = (currentIndex.value + offset) % playlist.value.length
      const candidate = playlist.value[candidateIdx]
      const candidateFolder = candidate?.folder || '[root]'
      if (candidateFolder !== curFolder) {
        targetIndex = candidateIdx
        break
      }
    }

    if (targetIndex !== -1) {
      currentIndex.value = targetIndex
      displayCurrent()
      return
    }
  }

  // Next image / sequential item
  const nextIdx = (currentIndex.value + 1) % playlist.value.length

  // If completing a full loop of the entire playlist, refresh from server
  if (nextIdx === 0 && props.source === 'local') {
    await loadPlaylist(true)
  }

  currentIndex.value = nextIdx
  displayCurrent()
}

const onVideoPlay = () => {
  isPlayingVideo = true
  clearTimer()
}

const onVideoEnded = () => {
  isPlayingVideo = false
  advanceNext(false)
}

const onVideoError = () => {
  console.warn('Video failed to play, skipping to next media item')
  isPlayingVideo = false
  advanceNext(false)
}

const onImageError = () => {
  console.warn('Image failed to load, skipping in 1.5s')
  clearTimer()
  rotationTimer = setTimeout(() => {
    advanceNext(false)
  }, 1500)
}

// Watch weather tag changes for dynamic tagged photo sources
watch(() => props.weatherTag, (newTag, oldTag) => {
  if (newTag && newTag !== oldTag && ['unsplash', 'pexels', 'flickr'].includes(props.source)) {
    loadPlaylist()
  }
})

onMounted(async () => {
  if (!props.magicMirror) {
    await loadPlaylist()
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
