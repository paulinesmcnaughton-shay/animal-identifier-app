import { useEffect, useRef, useState } from 'react'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

// Module-level cache — cache key includes kingdom to prevent cross-category contamination.
// "Bengal|mammal" and "Bengal|amphibian" are distinct cache entries.
//
// Only SUCCESSFUL resolutions (a real URL) are stored here, and they are kept
// for the life of the process. A transient failure (5xx/network) is NEVER cached,
// so it is retried on the next render — this prevents an image from "disappearing"
// after a transient source error.
const photoCache = new Map<string, string>()
// Which external source produced the cached URL — for the debug pipeline log.
// Photos come ONLY from Wikipedia + Wikimedia Commons (CC-BY-SA / public domain,
// commercial-safe). iNaturalist (non-commercial photos) and Google image search
// (third-party copyright) are intentionally NOT used as photo sources.
export type ExternalPhotoSource = 'wikipedia' | 'wikimedia'
const photoSourceCache = new Map<string, ExternalPhotoSource>()
// Genuine "no image exists" results are remembered briefly so we don't refetch
// imageless species on every render, but still recover if the source later adds one.
const negativeCache = new Map<string, number>()
const NEGATIVE_TTL_MS = 5 * 60 * 1000
const inFlight = new Map<string, Promise<string | null>>()

export function peekPhotoSource(cacheKey: string): ExternalPhotoSource | null {
  return photoSourceCache.get(cacheKey) ?? null
}

/** Builds the cache key. Identity segments (species_id/dex/taxon/category) keep
 *  same-name-different-species entries distinct without breaking cross-screen reuse. */
export function buildPhotoCacheKey(
  query: string,
  latin: string,
  kingdom?: KingdomKey | null,
  identity?: string | null,
): string {
  return `${query}|${latin}|${kingdom ?? ''}|${identity ?? ''}`
}

/**
 * Reads the cache for a key.
 *   string    → resolved successfully (use it)
 *   null      → known to have no image (within negative TTL)
 *   undefined → unknown, needs resolving
 * Never returns a poisoned permanent null for a transient failure.
 */
function peekCachedPhoto(cacheKey: string): string | null | undefined {
  const hit = photoCache.get(cacheKey)
  if (hit) return hit
  const negAt = negativeCache.get(cacheKey)
  if (negAt !== undefined && Date.now() - negAt < NEGATIVE_TTL_MS) return null
  return undefined
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
        originalimage?: { source?: string; width?: number }
      }
      const thumb = d.thumbnail?.source
      if (thumb) {
        // Never request a width wider than the source — Wikimedia returns HTTP 400
        // for an upscaled thumb, which would make the image fail to load.
        const origWidth = d.originalimage?.width
        const targetWidth = origWidth ? Math.min(800, origWidth) : 480
        return thumb.replace(/\/\d+px-/, `/${targetWidth}px-`)
      }
      const orig = d.originalimage?.source
      if (orig) return orig
    }
  } catch {}

  // MediaWiki Action API fallback
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
    const name = file.replace('File:', '').replace(/ /g, '_')
    const md5 = await md5Hash(name)
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(name)}/400px-${encodeURIComponent(name)}`
  } catch {
    return null
  }
}

async function md5Hash(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null)
  if (!hashBuffer) return '00'
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Resolve a reference photo for a species via Wikipedia → Wikimedia Commons —
 * the only photo sources we use, both commercial-safe (CC-BY-SA / public domain).
 * Exported so `resolveReferenceImage` can call it without a React context.
 */
export async function resolvePhoto(
  query: string,
  latin: string,
  kingdom?: KingdomKey | null,
  identity?: string | null,
): Promise<string | null> {
  // Cache key isolates "Bengal (mammal)" from "Bengal (amphibian)" and, via the
  // identity segment, same-name-different-species entries.
  const cacheKey = buildPhotoCacheKey(query, latin, kingdom, identity)

  const cached = peekCachedPhoto(cacheKey)
  if (cached !== undefined) return cached
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey) ?? null

  const promise = (async () => {
    let found: string | null = null
    let foundSource: ExternalPhotoSource | null = null
    // Tracks whether any source failed transiently (network/HTTP). If so we must
    // NOT remember a null result — a retry could still succeed.
    let hadTransientError = false

    async function attempt(
      source: ExternalPhotoSource,
      fn: () => Promise<string | null>,
    ): Promise<void> {
      if (found) return
      try {
        const r = await fn()
        if (r) {
          found = r
          foundSource = source
        }
      } catch {
        hadTransientError = true
      }
    }

    // 1. Wikipedia by common name
    if (query) await attempt('wikipedia', () => fetchWikipediaPhoto(query))
    // 2. Wikipedia by scientific name
    if (latin) await attempt('wikipedia', () => fetchWikipediaPhoto(latin))
    // 3. Wikimedia Commons search (common or scientific name)
    if (query || latin) await attempt('wikimedia', () => fetchWikimediaPhoto(query || latin))

    if (__DEV__) {
      console.log('RESOLVED REFERENCE IMAGE', {
        query,
        latin,
        kingdom: kingdom ?? null,
        result: found,
        source: foundSource ?? 'none',
        hadTransientError,
      })
    }

    if (found) {
      // Success — remember permanently. Never overwrite a good URL.
      photoCache.set(cacheKey, found)
      if (foundSource) photoSourceCache.set(cacheKey, foundSource)
      negativeCache.delete(cacheKey)
    } else if (!hadTransientError) {
      // Genuinely no image — remember for a short window, then allow a retry.
      negativeCache.set(cacheKey, Date.now())
    }
    // Transient failure with no result: cache NOTHING so the next access retries.

    inFlight.delete(cacheKey)
    return found
  })()

  inFlight.set(cacheKey, promise)
  return promise
}

export interface TaxaPhotoResult {
  url: string | null
  isResolving: boolean
  source: ExternalPhotoSource | null
}

export function useTaxaPhoto(
  name: string | null | undefined,
  kingdom?: KingdomKey | null,
  scientificName?: string | null,
  identity?: string | null,
): TaxaPhotoResult {
  const query = name?.trim() ?? ''
  const latin = scientificName?.trim() ?? ''
  const cacheKey = buildPhotoCacheKey(query, latin, kingdom, identity)

  // Track the previous cacheKey so we can synchronously reset state when the
  // species changes (FlatList recycles cells — new props arrive without unmount).
  const prevCacheKeyRef = useRef(cacheKey)

  // Compute the correct initial url for this render cycle.
  // Reads from the module-level cache; O(1), safe to call every render.
  const initialCached = peekCachedPhoto(cacheKey)
  const [url, setUrl] = useState<string | null>(initialCached ?? null)
  const [isResolving, setIsResolving] = useState(
    () => initialCached === undefined && !!(query || latin),
  )

  // Synchronous state reset when cacheKey changes mid-lifecycle (recycled cells).
  // We call setState during render only when the key has actually changed — React
  // handles this safely by re-rendering once more before committing.
  if (prevCacheKeyRef.current !== cacheKey) {
    prevCacheKeyRef.current = cacheKey
    const cached = peekCachedPhoto(cacheKey)
    const nextUrl = cached ?? null
    if (url !== nextUrl) setUrl(nextUrl)
    const shouldResolve = cached === undefined && !!(query || latin)
    if (isResolving !== shouldResolve) setIsResolving(shouldResolve)
  }

  useEffect(() => {
    if (!query && !latin) {
      setUrl(null)
      setIsResolving(false)
      return
    }

    const cached = peekCachedPhoto(cacheKey)
    if (cached !== undefined) {
      setUrl(cached)
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)

    resolvePhoto(query, latin, kingdom, identity).then((result) => {
      if (!cancelled) {
        setUrl(result)
        setIsResolving(false)
      }
    })

    return () => { cancelled = true }
  }, [cacheKey, kingdom, latin, query, identity])

  return { url, isResolving, source: url ? peekPhotoSource(cacheKey) : null }
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

  // Wikipedia + Wikimedia Commons only (commercial-safe CC content).
  if (commonName) add(await fetchWikipediaPhoto(commonName).catch(() => null))
  if (latinName && photos.length < limit) add(await fetchWikipediaPhoto(latinName).catch(() => null))
  if (photos.length < limit) {
    add(await fetchWikimediaPhoto(commonName || latinName || '').catch(() => null))
  }

  return photos
}
