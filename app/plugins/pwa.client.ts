export default defineNuxtPlugin(() => {
  if (import.meta.client && 'serviceWorker' in navigator) {
    // In development mode, unregister any active Service Worker and purge shell caches
    // so Vite HMR and /_nuxt/ dev module requests are never intercepted or cached.
    if (import.meta.dev) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
        .catch(() => {})

      if ('caches' in window) {
        caches.keys()
          .then((keys) => {
            for (const key of keys) {
              if (key.startsWith('infoboard-shell-')) {
                caches.delete(key)
              }
            }
          })
          .catch(() => {})
      }
      return
    }

    // Proactively purge legacy caches (v1/v2) that may have cached /api/media/ or /api/backgrounds
    if ('caches' in window) {
      caches.keys()
        .then((keys) => {
          for (const key of keys) {
            if (key.startsWith('infoboard-shell-') && key !== 'infoboard-shell-v3') {
              caches.delete(key)
            }
          }
        })
        .catch(() => {})
    }

    const registerSw = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.update().catch(() => {})
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
    window.addEventListener('beforeinstallprompt', () => {
      console.info('[PWA] App is installable! beforeinstallprompt event captured.')
    })

    window.addEventListener('appinstalled', () => {
      console.info('[PWA] Infoboard was installed successfully.')
    })
  }
})
