import Constants from 'expo-constants'
import { useEffect, useRef, useState } from 'react'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

interface TaxaResult {
  default_photo?: { medium_url?: string; square_url?: string }
  iconic_taxon_name?: string
}

// iNaturalist iconic_taxon_name → WildKind kingdom.
// Used to reject cross-category matches (e.g. "Bengal" → Amphibia when we expect mammal).
const INAT_ICONIC_TO_KINGDOM: Partial<Record<string, KingdomKey>> = {
  Mammalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Plantae: 'plant',
  Fungi: 'fungi',
}

// Module-level cache — cache key includes kingdom to prevent cross-category contamination.
// "Bengal|mammal" and "Bengal|amphibian" are distinct cache entries.
//
// Only SUCCESSFUL resolutions (a real URL) are stored here, and they are kept
// for the life of the process. A transient failure (e.g. iNat 429/5xx) is NEVER
// cached, so it is retried on the next render — this is what prevents an image
// from "disappearing" after a burst of requests rate-limits iNat.
const photoCache = new Map<string, string>()
// Which external source produced the cached URL — for the debug pipeline log.
export type ExternalPhotoSource = 'inaturalist' | 'wikipedia' | 'wikimedia' | 'google'
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

async function fetchInatPhoto(
  query: string,
  expectedKingdom?: KingdomKey | null,
): Promise<string | null> {
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10`,
  )
  // Throw on a transient HTTP failure so the caller treats it as "retry later",
  // NOT as "this species has no image". Returning null here would poison the cache.
  if (!res.ok) throw new Error(`iNaturalist HTTP ${res.status}`)
  const data = (await res.json()) as { results?: TaxaResult[] }

  for (const r of data.results ?? []) {
    // Kingdom validation: reject taxons that belong to a clearly different kingdom.
    // WildKind splits plants into plant/tree/flower, but iNat only has Plantae —
    // normalise those three to 'plant' before comparing so we don't reject valid results.
    if (expectedKingdom && r.iconic_taxon_name) {
      const taxonKingdom = INAT_ICONIC_TO_KINGDOM[r.iconic_taxon_name]
      if (taxonKingdom !== undefined) {
        const normalised =
          expectedKingdom === 'tree' || expectedKingdom === 'flower' ? 'plant' : expectedKingdom
        if (taxonKingdom !== normalised) {
          if (__DEV__) {
            console.log('IMAGE LOAD ERROR (iNat kingdom mismatch — skipped)', {
              query,
              expectedKingdom,
              normalised,
              taxonKingdom,
              iconic_taxon_name: r.iconic_taxon_name,
            })
          }
          continue
        }
      }
      // If iconic_taxon_name is unknown to our map (e.g. 'Animalia', 'Chromista'),
      // do not filter — we have no basis for rejecting it.
    }
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
      const thumb = d.thumbnail?.source
      if (thumb) return thumb.replace(/\/\d+px-/, '/800px-')
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
 * Google Programmable Search (Custom Search JSON API), image mode — the broad
 * fallback when iNat/Wikipedia/Wikimedia have nothing. Skipped (returns null, no
 * request) unless both an API key and a search-engine id (cx) are configured.
 * Throws on a transient HTTP error so it is retried rather than cached as empty.
 */
async function fetchGoogleImage(query: string): Promise<string | null> {
  const extra = Constants.expoConfig?.extra as
    | { googleSearchApiKey?: string; googleSearchCx?: string }
    | undefined
  const key = extra?.googleSearchApiKey?.trim()
  const cx = extra?.googleSearchCx?.trim()
  if (!key || !cx || !query.trim()) return null

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}` +
      `&searchType=image&num=1&safe=active&q=${encodeURIComponent(query)}`,
  )
  if (!res.ok) throw new Error(`Google CSE HTTP ${res.status}`)
  const d = (await res.json()) as { items?: { link?: string }[] }
  return d.items?.[0]?.link ?? null
}

/**
 * Resolve a reference photo for a species via iNat → Wikipedia → Wikimedia → Google.
 * Exported so `resolveReferenceImage` can call it without a React context.
 *
 * `kingdom` is used to validate iNat results — a mammal query will never
 * return an amphibian or plant photo even if the name is ambiguous.
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

    // 1. iNat by common name — with kingdom validation
    if (query) await attempt('inaturalist', () => fetchInatPhoto(query, kingdom))
    // 2. Wikipedia by common name
    if (query) await attempt('wikipedia', () => fetchWikipediaPhoto(query))
    // 3. iNat by scientific name — with kingdom validation
    if (latin) await attempt('inaturalist', () => fetchInatPhoto(latin, kingdom))
    // 4. Wikipedia by scientific name
    if (latin) await attempt('wikipedia', () => fetchWikipediaPhoto(latin))
    // 5. Wikimedia Commons search
    if (query || latin) await attempt('wikimedia', () => fetchWikimediaPhoto(query || latin))
    // 6. Google Programmable Search (only if configured) — broadest fallback
    if (query || latin) await attempt('google', () => fetchGoogleImage(query || latin))

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

  if (photos.length < limit) {
    const wikiUrl = await fetchWikipediaPhoto(commonName || latinName || '').catch(() => null)
    add(wikiUrl)
  }

  return photos
}
