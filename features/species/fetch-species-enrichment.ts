import { useEffect, useRef, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'

export interface SpeciesEnrichmentTaxonomy {
  kingdom: string | null
  phylum: string | null
  class: string | null
  order: string | null
  family: string | null
  genus: string | null
}

export interface SpeciesEnrichment {
  description: string | null
  taxonomy: SpeciesEnrichmentTaxonomy | null
}

export interface SpeciesEnrichmentInput {
  commonName?: string | null
  scientificName?: string | null
  kingdom?: string | null
  dexNum?: string | null
  speciesId?: string | null
  isDomestic?: boolean
}

const cache = new Map<string, SpeciesEnrichment>()
const negativeCache = new Map<string, number>()
const inFlight = new Map<string, Promise<SpeciesEnrichment | null>>()
const NEGATIVE_TTL_MS = 10 * 60 * 1000

const norm = (s?: string | null): string => (s ?? '').trim()

function keyFor(i: SpeciesEnrichmentInput): string {
  const category = i.isDomestic ? 'domestic' : (norm(i.kingdom) || 'unknown')
  return [norm(i.commonName).toLowerCase(), norm(i.scientificName).toLowerCase(), category, norm(i.dexNum), norm(i.speciesId)].join('|')
}

function peek(key: string): SpeciesEnrichment | null | undefined {
  const hit = cache.get(key)
  if (hit) return hit
  const negAt = negativeCache.get(key)
  if (negAt !== undefined && Date.now() - negAt < NEGATIVE_TTL_MS) return null
  return undefined
}

/** Real "What it is" description (Wikipedia) + taxonomy (GBIF) via edge function, cached. */
export async function resolveSpeciesEnrichment(input: SpeciesEnrichmentInput): Promise<SpeciesEnrichment | null> {
  const key = keyFor(input)
  const cached = peek(key)
  if (cached !== undefined) return cached
  if (inFlight.has(key)) return inFlight.get(key) ?? null

  const promise = (async (): Promise<SpeciesEnrichment | null> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      inFlight.delete(key)
      return null
    }
    try {
      const { data, error } = await supabase.functions.invoke('resolve-species-detail', {
        body: {
          commonName: input.commonName ?? null,
          scientificName: input.scientificName ?? null,
          kingdom: input.kingdom ?? null,
          dexNum: input.dexNum ?? null,
          speciesId: input.speciesId ?? null,
          isDomestic: input.isDomestic ?? false,
        },
      })
      if (error) throw error
      const result: SpeciesEnrichment = {
        description: typeof data?.description === 'string' ? data.description : null,
        taxonomy: data?.taxonomy ?? null,
      }
      if (result.description || result.taxonomy) cache.set(key, result)
      else negativeCache.set(key, Date.now())
      return result.description || result.taxonomy ? result : null
    } catch {
      return null // transient — retry next time
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return promise
}

export function useSpeciesEnrichment(input: SpeciesEnrichmentInput): SpeciesEnrichment | null {
  const key = keyFor(input)
  const hasIdentity = !!(norm(input.commonName) || norm(input.scientificName))

  const prevKeyRef = useRef(key)
  const [value, setValue] = useState<SpeciesEnrichment | null>(() => peek(key) ?? null)

  if (prevKeyRef.current !== key) {
    prevKeyRef.current = key
    setValue(peek(key) ?? null)
  }

  useEffect(() => {
    if (!hasIdentity) return
    const cached = peek(key)
    if (cached !== undefined) {
      setValue(cached)
      return
    }
    let cancelled = false
    resolveSpeciesEnrichment(input).then((r) => {
      if (!cancelled) setValue(r)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasIdentity])

  return value
}
