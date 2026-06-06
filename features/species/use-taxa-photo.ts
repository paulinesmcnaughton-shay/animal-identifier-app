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
const photoCache = new Map<string, string | null>()
const inFlight = new Map<string, Promise<string | null>>()

async function fetchInatPhoto(
  query: string,
  expectedKingdom?: KingdomKey | null,
): Promise<string | null> {
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10`,
  )
  if (!res.ok) return null
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
 * Resolve a reference photo for a species via iNat → Wikipedia → Wikimedia.
 * Exported so `resolveReferenceImage` can call it without a React context.
 *
 * `kingdom` is used to validate iNat results — a mammal query will never
 * return an amphibian or plant photo even if the name is ambiguous.
 */
export async function resolvePhoto(
  query: string,
  latin: string,
  kingdom?: KingdomKey | null,
): Promise<string | null> {
  // Cache key includes kingdom to isolate "Bengal (mammal)" from "Bengal (amphibian)".
  const cacheKey = `${query}|${latin}|${kingdom ?? ''}`

  if (photoCache.has(cacheKey)) return photoCache.get(cacheKey) ?? null
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey) ?? null

  const promise = (async () => {
    let found: string | null = null

    // 1. iNat by common name — with kingdom validation
    if (query) found = await fetchInatPhoto(query, kingdom).catch(() => null)

    // 2. Wikipedia by common name
    if (!found && query) found = await fetchWikipediaPhoto(query).catch(() => null)

    // 3. iNat by scientific name — with kingdom validation
    if (!found && latin) found = await fetchInatPhoto(latin, kingdom).catch(() => null)

    // 4. Wikipedia by scientific name
    if (!found && latin) found = await fetchWikipediaPhoto(latin).catch(() => null)

    // 5. Wikimedia Commons search
    if (!found && (query || latin)) {
      found = await fetchWikimediaPhoto(query || latin).catch(() => null)
    }

    if (__DEV__) {
      console.log('RESOLVED REFERENCE IMAGE', {
        query,
        latin,
        kingdom: kingdom ?? null,
        result: found,
        source: found ? 'external' : 'none',
      })
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
  const cacheKey = `${query}|${latin}|${kingdom ?? ''}`

  // Track the previous cacheKey so we can synchronously reset state when the
  // species changes (FlatList recycles cells — new props arrive without unmount).
  const prevCacheKeyRef = useRef(cacheKey)

  // Compute the correct initial url for this render cycle.
  // Reads from the module-level cache; O(1), safe to call every render.
  const initialUrl = photoCache.get(cacheKey) ?? null
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [isResolving, setIsResolving] = useState(
    () => !photoCache.has(cacheKey) && !!(query || latin),
  )

  // Synchronous state reset when cacheKey changes mid-lifecycle (recycled cells).
  // We call setState during render only when the key has actually changed — React
  // handles this safely by re-rendering once more before committing.
  if (prevCacheKeyRef.current !== cacheKey) {
    prevCacheKeyRef.current = cacheKey
    const cached = photoCache.get(cacheKey) ?? null
    if (url !== cached) setUrl(cached)
    const shouldResolve = !photoCache.has(cacheKey) && !!(query || latin)
    if (isResolving !== shouldResolve) setIsResolving(shouldResolve)
  }

  useEffect(() => {
    if (!query && !latin) {
      setUrl(null)
      setIsResolving(false)
      return
    }

    if (photoCache.has(cacheKey)) {
      setUrl(photoCache.get(cacheKey) ?? null)
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)

    resolvePhoto(query, latin, kingdom).then((result) => {
      if (!cancelled) {
        setUrl(result)
        setIsResolving(false)
      }
    })

    return () => { cancelled = true }
  }, [cacheKey, kingdom, latin, query])

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
