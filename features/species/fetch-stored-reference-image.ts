import { useEffect, useRef, useState } from 'react'

import {
  referenceCategory,
  type ReferenceImageInput,
  type ReferenceImageSource,
} from '@/features/species/resolve-reference-image'
import { getSupabaseClient } from '@/lib/supabase/client'

// Client cache of resolved STORED image URLs (Supabase Storage / CDN).
// Only successful resolutions are kept for the session; transient failures cache
// nothing (retry next render); genuine "no image" gets a short negative TTL.
const storedCache = new Map<string, StoredImage>()
const negativeCache = new Map<string, number>()
const inFlight = new Map<string, Promise<StoredImage | null>>()
const NEGATIVE_TTL_MS = 5 * 60 * 1000

export interface ImageAttribution {
  author: string | null
  license: string | null
  sourceUrl: string | null
}

export interface StoredImage {
  uri: string
  source: ReferenceImageSource
  attribution: ImageAttribution | null
}

function hasAnyAttribution(a: ImageAttribution | null): boolean {
  return !!a && !!(a.author || a.license || a.sourceUrl)
}

const norm = (s?: string | null): string => (s ?? '').trim()

// Client cache key — identity only (same species → same entry across screens).
function clientKey(input: ReferenceImageInput): string {
  return [
    norm(input.commonName).toLowerCase(),
    norm(input.scientificName).toLowerCase(),
    referenceCategory(input),
    norm(input.dexNum),
    norm(input.speciesId),
  ].join('|')
}

function peek(key: string): StoredImage | null | undefined {
  const hit = storedCache.get(key)
  if (hit) return hit
  const negAt = negativeCache.get(key)
  if (negAt !== undefined && Date.now() - negAt < NEGATIVE_TTL_MS) return null
  return undefined
}

/**
 * Resolve the permanent, owned reference image for a species via the
 * `resolve-species-image` edge function (DB → domestic → Wikipedia → Wikimedia
 * Commons, verified + copied into Supabase Storage). Returns a CDN URL + the
 * CC attribution (author/license/source) for credit display.
 */
export async function resolveStoredImage(input: ReferenceImageInput): Promise<StoredImage | null> {
  const key = clientKey(input)
  const cached = peek(key)
  if (cached !== undefined) return cached
  if (inFlight.has(key)) return inFlight.get(key) ?? null

  const promise = (async (): Promise<StoredImage | null> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      inFlight.delete(key)
      return null
    }
    try {
      const { data, error } = await supabase.functions.invoke('resolve-species-image', {
        body: {
          commonName: input.commonName,
          scientificName: input.scientificName ?? null,
          kingdom: input.kingdom ?? null,
          dexNum: input.dexNum ?? null,
          speciesId: input.speciesId ?? null,
          taxonId: input.taxonId ?? null,
          isDomestic: input.isDomestic ?? false,
        },
      })
      if (error) throw error
      const uri = typeof data?.uri === 'string' ? data.uri : null
      const source = (data?.source ?? null) as ReferenceImageSource | null
      const rawAttr = (data?.attribution ?? null) as ImageAttribution | null
      const attribution = hasAnyAttribution(rawAttr) ? rawAttr : null
      const result = uri ? { uri, source: source ?? 'database', attribution } : null
      if (result) storedCache.set(key, result)
      else negativeCache.set(key, Date.now()) // genuinely nothing found — short TTL
      return result
    } catch {
      // Transient (network / function) error — cache NOTHING so the next render retries.
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return promise
}

export interface StoredImageResult {
  uri: string | null
  source: ReferenceImageSource | null
  attribution: ImageAttribution | null
  isResolving: boolean
}

/**
 * Hook wrapper around `resolveStoredImage` with the same recycle-safe, non-poisoning
 * semantics as `useTaxaPhoto` (synchronous reset when the species changes).
 */
export function useStoredReferenceImage(input: ReferenceImageInput): StoredImageResult {
  const key = clientKey(input)
  const hasIdentity = !!(norm(input.commonName) || norm(input.scientificName))

  const prevKeyRef = useRef(key)
  const initial = peek(key)
  const [value, setValue] = useState<StoredImage | null>(initial ?? null)
  const [isResolving, setIsResolving] = useState(() => initial === undefined && hasIdentity)

  if (prevKeyRef.current !== key) {
    prevKeyRef.current = key
    const cached = peek(key)
    const next = cached ?? null
    if (value?.uri !== next?.uri) setValue(next)
    const shouldResolve = cached === undefined && hasIdentity
    if (isResolving !== shouldResolve) setIsResolving(shouldResolve)
  }

  useEffect(() => {
    if (!hasIdentity) {
      setValue(null)
      setIsResolving(false)
      return
    }
    const cached = peek(key)
    if (cached !== undefined) {
      setValue(cached)
      setIsResolving(false)
      return
    }
    let cancelled = false
    setIsResolving(true)
    resolveStoredImage(input).then((result) => {
      if (cancelled) return
      setValue(result)
      setIsResolving(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasIdentity])

  return {
    uri: value?.uri ?? null,
    source: value?.source ?? null,
    attribution: value?.attribution ?? null,
    isResolving,
  }
}
