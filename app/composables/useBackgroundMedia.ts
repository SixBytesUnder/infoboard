import { ref, shallowRef, nextTick, onMounted, onScopeDispose, watch } from 'vue'
import type { MediaAsset, BackgroundBatch } from '~~/shared'

export type MediaSourceType = 'local' | 'single' | 'nasa' | 'unsplash' | 'pexels' | 'flickr'

export interface ImageSlot {
  id: number
  asset: MediaAsset | null
  isActive: boolean
  isTop: boolean
}

const STORAGE_KEY_ASSET = 'infoboard_active_media_id'

export function getSafeBackgroundUrl(url?: string): string {
  if (!url) return 'none'
  if (!/^(https?:\/\/|\/)/i.test(url)) return 'none'
  const safeUrl = encodeURI(url)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
  return `url('${safeUrl}')`
}

export interface UseBackgroundMediaOptions {
  getSource: () => MediaSourceType
  getIntervalSeconds: () => number
  getMagicMirror: () => boolean
  getWeatherTag: () => string
  onActiveAssetChange: (asset: MediaAsset | null) => void
  onIsVideoChange: (val: boolean) => void
  onCanSkipChange: (canSkip: boolean) => void
}

export function useBackgroundMedia(options: UseBackgroundMediaOptions) {
  // Fixed 2-slot ping-pong buffer to guarantee zero DOM or bitmap memory growth
  const slots = ref<[ImageSlot, ImageSlot]>([
    { id: 0, asset: null, isActive: false, isTop: false },
    { id: 1, asset: null, isActive: false, isTop: false }
  ])

  const activeSlotIndex = ref<0 | 1>(0)
  const playlist = shallowRef<MediaAsset[]>([])
  const currentIndex = ref<number>(0)
  const currentAsset = shallowRef<MediaAsset | null>(null)

  let rotationTimer: ReturnType<typeof setTimeout> | null = null
  let transitionTimer: ReturnType<typeof setTimeout> | null = null
  let preloadTimeoutId: ReturnType<typeof setTimeout> | null = null
  let activePreloadImg: HTMLImageElement | null = null
  let isPlayingVideo = false
  let currentLoadToken = 0

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

  const resetSlots = () => {
    slots.value[0].asset = null
    slots.value[0].isActive = false
    slots.value[1].asset = null
    slots.value[1].isActive = false
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
    if (
      isPlayingVideo ||
      options.getMagicMirror() ||
      options.getSource() === 'single' ||
      playlist.value.length <= 1
    ) {
      return
    }

    rotationTimer = setTimeout(() => {
      advanceNext(false)
    }, options.getIntervalSeconds() * 1000)
  }

  const persistActiveAsset = (identifier?: string) => {
    if (typeof window !== 'undefined' && options.getSource() === 'local' && identifier) {
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
      resetSlots()
      options.onActiveAssetChange(null)
      options.onIsVideoChange(false)
      return
    }

    const asset = playlist.value[currentIndex.value]
    if (!asset) {
      currentAsset.value = null
      options.onActiveAssetChange(null)
      options.onIsVideoChange(false)
      return
    }

    // Handle Video Asset
    if (asset.type === 'video') {
      cancelPreload()
      finalizeTransition()
      resetSlots()

      currentAsset.value = asset
      options.onActiveAssetChange(asset)
      options.onIsVideoChange(true)
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
      options.onActiveAssetChange(asset)
      options.onIsVideoChange(false)
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
          options.onActiveAssetChange(asset)
          options.onIsVideoChange(false)
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
      const source = options.getSource()
      const weatherTag = options.getWeatherTag()

      if (source === 'local' || source === 'single') {
        const res = await $fetch<BackgroundBatch>('/api/backgrounds')
        items = res.items || []
      } else {
        const query = weatherTag ? `?weatherTag=${encodeURIComponent(weatherTag)}` : ''
        items = await $fetch<MediaAsset[]>(`/api/photos${query}`)
      }

      if (items.length > 0) {
        playlist.value = items
        options.onCanSkipChange(items.length > 1)
        if (!isBackgroundRefresh) {
          let startIdx = 0
          if (typeof window !== 'undefined' && source === 'local') {
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
          await displayCurrent(true)
        }
      } else {
        playlist.value = []
        options.onCanSkipChange(false)
      }
    } catch (err) {
      console.warn('Failed to load media playlist:', (err as Error).message)
      options.onCanSkipChange(false)
    }
  }

  const advanceNext = async (skipFolder = false) => {
    clearTimer()
    isPlayingVideo = false

    if (playlist.value.length === 0) {
      await loadPlaylist()
      return
    }

    if (options.getSource() === 'single') {
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
    if (nextIdx === 0 && options.getSource() === 'local') {
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
    } else if (currentAsset.value?.type === 'image') {
      scheduleNext()
    }
  }

  // Watch weather tag changes for dynamic tagged photo sources
  watch(options.getWeatherTag, (newTag, oldTag) => {
    if (newTag && newTag !== oldTag && ['unsplash', 'pexels', 'flickr'].includes(options.getSource())) {
      loadPlaylist()
    }
  })

  // Watch interval changes to immediately reschedule next rotation
  watch(options.getIntervalSeconds, () => {
    if (currentAsset.value?.type === 'image') {
      scheduleNext()
    }
  })

  // Watch magic mirror mode to release resources
  watch(options.getMagicMirror, (val) => {
    if (val) {
      clearTimer()
      cancelPreload()
      finalizeTransition()
      resetSlots()
    } else {
      displayCurrent(true)
    }
  })

  onMounted(async () => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    if (!options.getMagicMirror()) {
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

  return {
    slots,
    currentAsset,
    advanceNext,
    onVideoPlay,
    onVideoEnded,
    onVideoError,
    onImageError
  }
}
