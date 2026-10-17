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
import { ref, nextTick, onMounted, onScopeDispose, watch } from 'vue'
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
  'update:can-skip': [val: boolean]
}>()

interface ImageSlot {
  id: number
  asset: MediaAsset | null
  isActive: boolean
  isTop: boolean
}

// Fixed 2-slot ping-pong buffer to guarantee zero DOM or bitmap memory growth
const slots = ref<[ImageSlot, ImageSlot]>([
  { id: 0, asset: null, isActive: false, isTop: false },
  { id: 1, asset: null, isActive: false, isTop: false }
])

const activeSlotIndex = ref<0 | 1>(0)
const playlist = ref<MediaAsset[]>([])
const currentIndex = ref<number>(0)
const currentAsset = ref<MediaAsset | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

let rotationTimer: ReturnType<typeof setTimeout> | null = null
let transitionTimer: ReturnType<typeof setTimeout> | null = null
let preloadTimeoutId: ReturnType<typeof setTimeout> | null = null
let activePreloadImg: HTMLImageElement | null = null
let isPlayingVideo = false
let currentLoadToken = 0

const STORAGE_KEY_ASSET = 'infoboard_active_media_id'

const getSafeBackgroundUrl = (url?: string) => {
  if (!url) return 'none'
  const safeUrl = url.replace(/'/g, '%27')
  return `url('${safeUrl}')`
}

const clearTimer = () => {
  if (rotationTimer !== null) {
    clearTimeout(rotationTimer)
    rotationTimer = null
  }
}

const cancelPreload = () => {
  currentLoadToken++
  if (preloadTimeoutId !== null) {
    clearTimeout(preloadTimeoutId)
    preloadTimeoutId = null
  }
  if (activePreloadImg) {
    activePreloadImg.onload = null
    activePreloadImg.onerror = null
    activePreloadImg.src = ''
    activePreloadImg = null
  }
}

const finalizeTransition = () => {
  if (transitionTimer !== null) {
    clearTimeout(transitionTimer)
    transitionTimer = null
  }

  const incomingSlotIdx = (1 - activeSlotIndex.value) as 0 | 1
  if (slots.value[incomingSlotIdx].asset) {
    activeSlotIndex.value = incomingSlotIdx
    slots.value[incomingSlotIdx].isActive = true
    slots.value[incomingSlotIdx].isTop = false

    const oldSlotIdx = (1 - incomingSlotIdx) as 0 | 1
    // Unmount outgoing slot elements to free decoded bitmap memory in WebKit
    slots.value[oldSlotIdx].isActive = false
    slots.value[oldSlotIdx].asset = null
    slots.value[oldSlotIdx].isTop = false
  }
}

const scheduleNext = () => {
  clearTimer()
  if (isPlayingVideo || props.magicMirror || props.source === 'single' || playlist.value.length <= 1) return

  rotationTimer = setTimeout(() => {
    advanceNext(false)
  }, props.intervalSeconds * 1000)
}

const persistActiveAsset = (identifier?: string) => {
  if (typeof window !== 'undefined' && props.source === 'local' && identifier) {
    try {
      localStorage.setItem(STORAGE_KEY_ASSET, identifier)
    } catch {
      // LocalStorage restricted or quota exceeded
    }
  }
}

const preloadImage = (url: string, token: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve()
    }

    if (activePreloadImg) {
      activePreloadImg.onload = null
      activePreloadImg.onerror = null
      activePreloadImg.src = ''
      activePreloadImg = null
    }
    if (preloadTimeoutId !== null) {
      clearTimeout(preloadTimeoutId)
      preloadTimeoutId = null
    }

    const img = new Image()
    activePreloadImg = img

    const cleanup = () => {
      if (preloadTimeoutId !== null) {
        clearTimeout(preloadTimeoutId)
        preloadTimeoutId = null
      }
      if (activePreloadImg === img) {
        activePreloadImg = null
      }
      img.onload = null
      img.onerror = null
    }

    preloadTimeoutId = setTimeout(() => {
      cleanup()
      img.src = ''
      reject(new Error('Image preload timed out after 15s'))
    }, 15000)

    img.onload = async () => {
      cleanup()
      if (token !== currentLoadToken) {
        img.src = ''
        return reject(new Error('Image preload superseded'))
      }

      // Off-thread bitmap decoding avoids UI frame stutter on older iPad Pro chips
      if (typeof img.decode === 'function') {
        try {
          await img.decode()
        } catch {
          // Continue if browser cannot decode asynchronously
        }
      }

      if (token !== currentLoadToken) {
        img.src = ''
        return reject(new Error('Image preload superseded'))
      }

      resolve()
    }

    img.onerror = () => {
      cleanup()
      img.src = ''
      reject(new Error('Image failed to download'))
    }

    img.src = url
  })
}

const displayCurrent = async (isInitial = false) => {
  if (playlist.value.length === 0) {
    currentAsset.value = null
    cancelPreload()
    finalizeTransition()
    slots.value[0].asset = null
    slots.value[0].isActive = false
    slots.value[1].asset = null
    slots.value[1].isActive = false
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

  // Handle Video Asset
  if (asset.type === 'video') {
    cancelPreload()
    finalizeTransition()
    slots.value[0].asset = null
    slots.value[0].isActive = false
    slots.value[1].asset = null
    slots.value[1].isActive = false

    currentAsset.value = asset
    emit('update:active-asset', asset)
    emit('update:is-video', true)
    persistActiveAsset(asset.identifier)
    return
  }

  // Handle Image Asset
  const token = ++currentLoadToken

  try {
    await preloadImage(asset.url, token)
  } catch (err) {
    if (token !== currentLoadToken) return
    console.warn(`Failed to preload image (${asset.url}):`, (err as Error).message)
    clearTimer()
    rotationTimer = setTimeout(() => {
      advanceNext(false)
    }, 1500)
    return
  }

  if (token !== currentLoadToken) return

  // Settle any active transition cleanly before starting next
  finalizeTransition()

  if (isInitial || !currentAsset.value) {
    // Initial mount: load directly into slot 0 and fade in
    activeSlotIndex.value = 0
    slots.value[0].asset = asset
    slots.value[0].isTop = true
    slots.value[0].isActive = false
    slots.value[1].asset = null
    slots.value[1].isActive = false

    currentAsset.value = asset
    emit('update:active-asset', asset)
    emit('update:is-video', false)
    persistActiveAsset(asset.identifier)

    await nextTick()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== currentLoadToken) return
        slots.value[0].isActive = true
        transitionTimer = setTimeout(() => {
          slots.value[0].isTop = false
          scheduleNext()
        }, 1200)
      })
    })
  } else {
    // Ping-pong crossfade: incoming slot fades in over outgoing slot
    const incomingSlotIdx = (1 - activeSlotIndex.value) as 0 | 1
    const outgoingSlotIdx = activeSlotIndex.value

    slots.value[incomingSlotIdx].asset = asset
    slots.value[incomingSlotIdx].isTop = true
    slots.value[incomingSlotIdx].isActive = false
    slots.value[outgoingSlotIdx].isTop = false

    await nextTick()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== currentLoadToken) return

        // Both blurred background & contained photo fade in simultaneously
        slots.value[incomingSlotIdx].isActive = true

        currentAsset.value = asset
        emit('update:active-asset', asset)
        emit('update:is-video', false)
        persistActiveAsset(asset.identifier)

        // After crossfade ends, unmount old slot to free WebKit bitmap memory
        transitionTimer = setTimeout(() => {
          if (token !== currentLoadToken) return
          activeSlotIndex.value = incomingSlotIdx
          slots.value[incomingSlotIdx].isTop = false

          slots.value[outgoingSlotIdx].isActive = false
          slots.value[outgoingSlotIdx].asset = null
          slots.value[outgoingSlotIdx].isTop = false

          transitionTimer = null
          scheduleNext()
        }, 1200)
      })
    })
  }
}

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
      emit('update:can-skip', items.length > 1)
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
            // LocalStorage restricted
          }
        }
        currentIndex.value = startIdx
        displayCurrent(true)
      }
    } else {
      playlist.value = []
      emit('update:can-skip', false)
    }
  } catch (err) {
    console.warn('Failed to load media playlist:', (err as Error).message)
    emit('update:can-skip', false)
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
      displayCurrent(false)
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
  displayCurrent(false)
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
  console.warn('Image failed to render, skipping in 1.5s')
  clearTimer()
  rotationTimer = setTimeout(() => {
    advanceNext(false)
  }, 1500)
}

const handleVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.hidden) {
    clearTimer()
    cancelPreload()
    finalizeTransition()
  } else {
    if (currentAsset.value?.type === 'image') {
      scheduleNext()
    }
  }
}

// Watch weather tag changes for dynamic tagged photo sources
watch(() => props.weatherTag, (newTag, oldTag) => {
  if (newTag && newTag !== oldTag && ['unsplash', 'pexels', 'flickr'].includes(props.source)) {
    loadPlaylist()
  }
})

// Watch interval changes to immediately reschedule next rotation
watch(() => props.intervalSeconds, () => {
  if (currentAsset.value?.type === 'image') {
    scheduleNext()
  }
})

// Watch magic mirror mode to release resources
watch(() => props.magicMirror, (val) => {
  if (val) {
    clearTimer()
    cancelPreload()
    finalizeTransition()
    slots.value[0].asset = null
    slots.value[1].asset = null
    slots.value[0].isActive = false
    slots.value[1].isActive = false
  } else {
    displayCurrent(true)
  }
})

onMounted(async () => {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  if (!props.magicMirror) {
    await loadPlaylist()
  }
})

onScopeDispose(() => {
  clearTimer()
  cancelPreload()
  if (transitionTimer !== null) {
    clearTimeout(transitionTimer)
    transitionTimer = null
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
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
