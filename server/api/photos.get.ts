import type { MediaAsset } from '~~/shared'

interface NasaResponse {
  media_type?: string
  hdurl?: string
  url?: string
  title?: string
  copyright?: string
}

interface UnsplashPhoto {
  urls: {
    regular: string
    full: string
  }
  user?: {
    name: string
  }
  description?: string
  alt_description?: string
}

interface PexelsResponse {
  photos?: Array<{
    src: {
      large2x?: string
      large: string
    }
    photographer?: string
    alt?: string
  }>
}

interface FlickrResponse {
  photos?: {
    photo?: Array<{
      id: string
      server: string
      secret: string
      farm: number
      title: string
    }>
  }
}

export default defineEventHandler(async (event): Promise<MediaAsset[]> => {
  const config = useRuntimeConfig(event)
  const mediaConf = config.media
  const query = getQuery(event)
  const weatherTag = (query.weatherTag as string) || ''

  const source = mediaConf.source

  // 1. NASA APOD
  if (source === 'nasa') {
    try {
      const apiKey = mediaConf.nasaApiKey || 'DEMO_KEY'
      const data = await $fetch<NasaResponse>(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}&hd=true`, {
        signal: AbortSignal.timeout(8000)
      })

      if (data.media_type === 'image' && (data.hdurl || data.url)) {
        return [
          {
            type: 'image',
            url: data.hdurl || data.url || '/images/nasa.jpg',
            identifier: 'nasa-apod',
            title: data.title || 'Astronomy Picture of the Day',
            credit: data.copyright || 'NASA'
          }
        ]
      }
    } catch (err) {
      console.warn('NASA APOD failed, using bundled fallback:', (err as Error).message)
    }

    // Fallback to bundled NASA asset
    return [
      {
        type: 'image',
        url: '/images/nasa.jpg',
        identifier: 'nasa-default',
        title: 'NASA Astronomy Picture',
        credit: 'NASA'
      }
    ]
  }

  // 2. Unsplash
  if (source === 'unsplash') {
    if (!mediaConf.unsplashKey) {
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Unsplash Key Missing' }]
    }
    try {
      const isTagged = mediaConf.weatherTagged && weatherTag
      const endpoint = isTagged
        ? `https://api.unsplash.com/search/photos?query=weather%20${encodeURIComponent(weatherTag)}&per_page=30`
        : 'https://api.unsplash.com/photos/random?count=30'

      const resp = await $fetch<UnsplashPhoto[] | { results: UnsplashPhoto[] }>(endpoint, {
        headers: {
          Authorization: `Client-ID ${mediaConf.unsplashKey}`
        },
        signal: AbortSignal.timeout(8000)
      })

      const rawList = Array.isArray(resp) ? resp : resp.results || []
      return rawList.map((p, idx) => ({
        type: 'image',
        url: p.urls.regular || p.urls.full,
        identifier: `unsplash-${idx}`,
        title: p.description || p.alt_description || 'Unsplash Photo',
        credit: p.user?.name ? `Photo by ${p.user.name}` : undefined
      }))
    } catch (err) {
      console.warn('Unsplash fetch failed:', (err as Error).message)
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Unsplash Error' }]
    }
  }

  // 3. Pexels
  if (source === 'pexels') {
    if (!mediaConf.pexelsKey) {
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Pexels Key Missing' }]
    }
    try {
      const isTagged = mediaConf.weatherTagged && weatherTag
      const endpoint = isTagged
        ? `https://api.pexels.com/v1/search?query=weather%20${encodeURIComponent(weatherTag)}&per_page=50`
        : 'https://api.pexels.com/v1/curated?per_page=50'

      const resp = await $fetch<PexelsResponse>(endpoint, {
        headers: {
          Authorization: mediaConf.pexelsKey
        },
        signal: AbortSignal.timeout(8000)
      })

      const photos = resp.photos || []
      return photos.map((p, idx) => ({
        type: 'image',
        url: p.src.large2x || p.src.large,
        identifier: `pexels-${idx}`,
        title: p.alt || 'Pexels Photo',
        credit: p.photographer ? `Photo by ${p.photographer}` : undefined
      }))
    } catch (err) {
      console.warn('Pexels fetch failed:', (err as Error).message)
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Pexels Error' }]
    }
  }

  // 4. Flickr
  if (source === 'flickr') {
    if (!mediaConf.flickrKey) {
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Flickr Key Missing' }]
    }
    try {
      const tag = weatherTag ? encodeURIComponent(weatherTag) : 'landscape'
      const endpoint = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${mediaConf.flickrKey}&tags=${tag}&format=json&nojsoncallback=1&per_page=30`

      const resp = await $fetch<FlickrResponse>(endpoint, {
        signal: AbortSignal.timeout(8000)
      })

      const photos = resp.photos?.photo || []
      return photos.map((p, idx) => ({
        type: 'image',
        url: `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
        identifier: `flickr-${idx}`,
        title: p.title || 'Flickr Photo'
      }))
    } catch (err) {
      console.warn('Flickr fetch failed:', (err as Error).message)
      return [{ type: 'image', url: '/images/nasa.jpg', identifier: 'fallback', title: 'Flickr Error' }]
    }
  }

  return []
})
