import { ref } from 'vue'

const isFullscreen = ref(false)

export function useKioskState() {
  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return

    const doc = document as unknown as {
      fullscreenElement?: Element
      webkitFullscreenElement?: Element
      mozFullScreenElement?: Element
      msFullscreenElement?: Element
      exitFullscreen?: () => Promise<void>
      webkitExitFullscreen?: () => Promise<void>
      mozCancelFullScreen?: () => Promise<void>
      msExitFullscreen?: () => Promise<void>
    }

    const docEl = document.documentElement as unknown as {
      requestFullscreen?: () => Promise<void>
      webkitRequestFullscreen?: () => Promise<void>
      mozRequestFullScreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }

    const currentFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement

    if (currentFs) {
      if (doc.exitFullscreen) await doc.exitFullscreen()
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
      else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen()
      else if (doc.msExitFullscreen) await doc.msExitFullscreen()
      isFullscreen.value = false
    } else {
      if (docEl.requestFullscreen) await docEl.requestFullscreen()
      else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen()
      else if (docEl.mozRequestFullScreen) await docEl.mozRequestFullScreen()
      else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen()
      isFullscreen.value = true
    }
  }

  return {
    isFullscreen,
    toggleFullscreen
  }
}
