import { useEffect, useState } from 'react'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

interface TaxaResult {
  default_photo?: { medium_url?: string; square_url?: string }
}

// Module-level cache — survives re-renders, prevents duplicate simultaneous fetches
// for the same species (important when 20+ DEX cards render at once).
const photoCache = new Map<string, string | null>()
const inFlight = new Map<string, Promise<string | null>>()

async function fetchInatPhoto(query: string): Promise<string | null> {
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10`,
  )
  if (!res.ok) return null
  const data = (await res.json()) as { results?: TaxaResult[] }
  for (const r of data.results ?? []) {
    const url = r.default_photo?.medium_url ?? r.default_photo?.square_url
    if (url) return url
  }
  return null
}

async function fetchWikipediaPhoto(query: string): Promise<string | null> {
  const title = query.trim().replace(/ /g, '_')
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,
      { headers: { Accept: 'application/json' } },
    )
    if (res.ok) {
      const d = (await res.json()) as {
        thumbnail?: { source?: string }
        originalimage?: { source?: string }
      }
      // Upscale the thumbnail URL to 800px — far more reliable than full-res originals (often 5-10 MB)
      const thumb = d.thumbnail?.source
      if (thumb) return thumb.replace(/\/\d+px-/, '/800px-')
      // originalimage as last resort — only use if thumbnail is absent
      const orig = d.originalimage?.source
      if (orig) return orig
    }
  } catch {}

  // MediaWiki Action API fallback — resolves alternate titles and redirects
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json` +
      `&titles=${encodeURIComponent(query)}&pithumbsize=800&origin=*`,
    )
    if (res.ok) {
      const d = (await res.json()) as {
        query?: { pages?: Record<string, { thumbnail?: { source?: string } }> }
      }
      const pages = Object.values(d?.query?.pages ?? {})
      const url = pages[0]?.thumbnail?.source
      if (url) return url
    }
  } catch {}

  return null
}

async function fetchWikimediaPhoto(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search` +
      `&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=3&format=json&origin=*`,
    )
    if (!res.ok) return null
    const d = (await res.json()) as {
      query?: { search?: { title?: string }[] }
    }
    const file = d?.query?.search?.[0]?.title
    if (!file) return null
    // Construct Wikimedia thumbnail URL from file title
    const name = file.replace('File:', '').replace(/ /g, '_')
    const md5 = await md5Hash(name)
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(name)}/400px-${encodeURIComponent(name)}`
  } catch {
    return null
  }
}

// Simple MD5-like hash for Wikimedia path construction (not cryptographic)
async function md5Hash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null)
  if (!hashBuffer) return '00'
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function resolvePhoto(query: string, latin: string): Promise<string | null> {
  const cacheKey = `${query}|${latin}`

  if (photoCache.has(cacheKey)) return photoCache.get(cacheKey) ?? null

  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey) ?? null

  const promise = (async () => {
    let found: string | null = null

    // 1. iNat by common name — no rank filter, just get first photo
    if (query) found = await fetchInatPhoto(query).catch(() => null)

    // 2. Wikipedia by common name
    if (!found && query) found = await fetchWikipediaPhoto(query).catch(() => null)

    // 3. iNat by latin name
    if (!found && latin) found = await fetchInatPhoto(latin).catch(() => null)

    // 4. Wikipedia by latin name
    if (!found && latin) found = await fetchWikipediaPhoto(latin).catch(() => null)

    // 5. Wikimedia Commons search
    if (!found && (query || latin)) {
      found = await fetchWikimediaPhoto(query || latin).catch(() => null)
    }

    photoCache.set(cacheKey, found)
    inFlight.delete(cacheKey)
    return found
  })()

  inFlight.set(cacheKey, promise)
  return promise
}

export interface TaxaPhotoResult {
  url: string | null
  isResolving: boolean
}

export function useTaxaPhoto(
  name: string | null | undefined,
  kingdom?: KingdomKey | null,
  scientificName?: string | null,
): TaxaPhotoResult {
  const query = name?.trim() ?? ''
  const latin = scientificName?.trim() ?? ''
  const cacheKey = `${query}|${latin}`

  const [url, setUrl] = useState<string | null>(() => photoCache.get(cacheKey) ?? null)
  const [isResolving, setIsResolving] = useState(() => !photoCache.has(cacheKey) && !!(query || latin))

  useEffect(() => {
    if (!query && !latin) {
      setUrl(null)
      setIsResolving(false)
      return
    }

    // Already cached — use immediately
    if (photoCache.has(cacheKey)) {
      setUrl(photoCache.get(cacheKey) ?? null)
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)

    resolvePhoto(query, latin).then((result) => {
      if (!cancelled) {
        setUrl(result)
        setIsResolving(false)
      }
    })

    return () => { cancelled = true }
  }, [cacheKey, query, latin])

  return { url, isResolving }
}

// Fetch up to `limit` distinct reference photos for a species — used by detail page gallery.
export async function fetchSpeciesReferencePhotos(
  commonName: string,
  latinName?: string,
  limit = 6,
): Promise<string[]> {
  const photos: string[] = []
  const seen = new Set<string>()

  function add(url: string | null | undefined) {
    if (url && !seen.has(url) && photos.length < limit) {
      seen.add(url)
      photos.push(url)
    }
  }

  // Pull multiple results from iNat by common name
  if (commonName) {
    try {
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(commonName)}&per_page=10`,
      )
      if (res.ok) {
        const d = (await res.json()) as { results?: TaxaResult[] }
        for (const r of d.results ?? []) {
          add(r.default_photo?.medium_url ?? r.default_photo?.square_url)
        }
      }
    } catch {}
  }

  // Pull additional results from iNat by latin name
  if (latinName && photos.length < limit) {
    try {
      const res = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(latinName)}&per_page=6`,
      )
      if (res.ok) {
        const d = (await res.json()) as { results?: TaxaResult[] }
        for (const r of d.results ?? []) {
          add(r.default_photo?.medium_url ?? r.default_photo?.square_url)
        }
      }
    } catch {}
  }

  // Wikipedia as an additional source
  if (photos.length < limit) {
    const wikiUrl = await fetchWikipediaPhoto(commonName || latinName || '').catch(() => null)
    add(wikiUrl)
  }

  return photos
}
