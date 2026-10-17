export default defineNuxtPlugin(() => {
  if (import.meta.client && 'serviceWorker' in navigator) {
    const registerSw = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Check for service worker updates periodically
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('[PWA] New version installed and ready.')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error)
        })
    }

    if (document.readyState === 'complete') {
      registerSw()
    } else {
      window.addEventListener('load', registerSw, { once: true })
    }

    // Listen for PWA install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.info('[PWA] App is installable! beforeinstallprompt event captured.')
    })

    window.addEventListener('appinstalled', () => {
      console.info('[PWA] Infoboard was installed successfully.')
    })
  }
})
