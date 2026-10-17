import { onMounted, onScopeDispose } from 'vue'

interface VendorFullscreenDocument {
  fullscreenElement?: Element | null
  webkitFullscreenElement?: Element | null
  mozFullScreenElement?: Element | null
  msFullscreenElement?: Element | null
  exitFullscreen?: () => Promise<void>
  webkitExitFullscreen?: () => Promise<void>
  mozCancelFullScreen?: () => Promise<void>
  msExitFullscreen?: () => Promise<void>
}

interface VendorFullscreenElement {
  requestFullscreen?: () => Promise<void>
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

export function useKioskState() {
  const isFullscreen = useState<boolean>('kiosk_fullscreen', () => false)

  const getFullscreenElement = () => {
    if (typeof document === 'undefined') return null
    const doc = document as unknown as VendorFullscreenDocument
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      null
    )
  }

  const syncFullscreen = () => {
    isFullscreen.value = Boolean(getFullscreenElement())
  }

  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', syncFullscreen)
      document.addEventListener('webkitfullscreenchange', syncFullscreen)
      syncFullscreen()
    }
  })

  onScopeDispose(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncFullscreen)
    }
  })

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return

    const doc = document as unknown as VendorFullscreenDocument
    const docEl = document.documentElement as unknown as VendorFullscreenElement
    const currentFs = getFullscreenElement()

    try {
      if (currentFs) {
        if (doc.exitFullscreen) await doc.exitFullscreen()
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
        else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen()
        else if (doc.msExitFullscreen) await doc.msExitFullscreen()
      } else {
        if (docEl.requestFullscreen) await docEl.requestFullscreen()
        else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen()
        else if (docEl.mozRequestFullScreen) await docEl.mozRequestFullScreen()
        else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', (err as Error).message)
    } finally {
      syncFullscreen()
    }
  }

  return {
    isFullscreen,
    toggleFullscreen
  }
}
