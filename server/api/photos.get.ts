import type { MediaAsset } from '~~/shared'

interface NasaLibraryItem {
  data?: Array<{
    center?: string
    title?: string
    photographer?: string
    nasa_id?: string
    media_type?: string
  }>
  links?: Array<{
    href: string
    rel?: string
    render?: string
  }>
}

interface NasaLibraryResponse {
  collection?: {
    items?: NasaLibraryItem[]
  }
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

  // 1. NASA Space Gallery (images-api.nasa.gov) with APOD & local fallback
  if (source === 'nasa') {
    try {
      const userQuery = (query.q as string) || (mediaConf as { nasaQuery?: string }).nasaQuery || ''
      const defaultKeywords = ['nebula', 'galaxy', 'deep space', 'carina nebula', 'supernova']
      const searchTopic: string = userQuery || defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)] || 'nebula'

      const resp = await $fetch<NasaLibraryResponse>(
        `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTopic)}&media_type=image`,
        { signal: AbortSignal.timeout(9000) }
      )

      const rawItems = resp?.collection?.items || []
      const assets: MediaAsset[] = []

      for (const item of rawItems) {
        const d = item.data?.[0]
        const links = item.links || []
        if (!d || d.media_type !== 'image') continue

        // Select optimal resolution: prefer large (~1080p) or medium, fallback to original
        const imgUrl = links.find(l => l.href?.includes('~large'))?.href
          || links.find(l => l.href?.includes('~medium'))?.href
          || links.find(l => l.href?.includes('~orig'))?.href

        if (!imgUrl) continue

        assets.push({
          type: 'image',
          url: imgUrl,
          identifier: `nasa-${d.nasa_id || assets.length}`,
          title: d.title || 'NASA Deep Space',
          credit: d.photographer || d.center || 'NASA'
        })
      }

      if (assets.length > 0) {
        return assets
      }
    } catch (err) {
      console.warn('NASA Image Library fetch failed, trying APOD fallback:', (err as Error).message)
    }

    // Secondary fallback: Try modern APOD endpoint from science.nasa.gov
    try {
      const apodBasic = await $fetch<Array<{ title?: string; hdurl?: string; url?: string; media_type?: string }>>(
        'https://science.nasa.gov/wp-json/wp/v2/apod-basic',
        { signal: AbortSignal.timeout(6000) }
      )
      const valid = apodBasic?.find(it => it.media_type === 'image' && (it.hdurl || it.url))
      if (valid) {
        return [
          {
            type: 'image',
            url: valid.hdurl || valid.url || '/images/nasa.jpg',
            identifier: 'nasa-apod',
            title: valid.title || 'Astronomy Picture of the Day',
            credit: 'NASA'
          }
        ]
      }
    } catch (apodErr) {
      console.warn('NASA APOD fallback also failed:', (apodErr as Error).message)
    }

    // Ultimate fallback: Bundled NASA asset
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
