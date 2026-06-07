import { useEffect, useMemo, useState } from 'react'

import {
  getSpeciesDetail,
  type SpeciesDetail,
} from '@/data/species-catalog'
import { fetchSpeciesDetailFromSupabase } from '@/features/species/fetch-species-detail'
import { useSpeciesEnrichment } from '@/features/species/fetch-species-enrichment'
import { resolveDexNumber } from '@/features/species/resolve-dex-number'
import type { LatinNameSource } from '@/features/species/types'
import { isSupabaseConfigured } from '@/lib/supabase/config'

interface UseSpeciesDetailOptions {
  id: string
  overrides?: Partial<SpeciesDetail>
  /** When false, skips remote fetch (e.g. sheet not visible). Default true. */
  enabled?: boolean
  /** Keep isLoading false while fetching — show catalog fallback immediately. */
  silent?: boolean
  isDomestic?: boolean
  latinNameHint?: string
}

interface UseSpeciesDetailResult {
  species: SpeciesDetail
  heroImageUrl: string | null
  isLoading: boolean
  isFromSupabase: boolean
  isDomestic: boolean
  latinNameSource: LatinNameSource | null
  error: string | null
}

export function useSpeciesDetail({
  id,
  overrides,
  enabled = true,
  silent = false,
  isDomestic = false,
  latinNameHint,
}: UseSpeciesDetailOptions): UseSpeciesDetailResult {
  const fallback = useMemo(() => getSpeciesDetail(id, overrides), [id, overrides])

  const [remoteDetail, setRemoteDetail] = useState<SpeciesDetail | null>(null)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [latinNameSource, setLatinNameSource] = useState<LatinNameSource | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFromSupabase, setIsFromSupabase] = useState(false)
  const [isDomesticRemote, setIsDomesticRemote] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commonNameHint = overrides?.commonName

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      if (!silent) setIsLoading(true)
      setError(null)
      try {
        const result = await fetchSpeciesDetailFromSupabase(id, {
          commonNameHint,
          latinNameHint,
          isDomestic,
        })
        if (cancelled) return

        if (result) {
          setRemoteDetail(result.detail)
          setHeroImageUrl(result.imageUrl)
          setLatinNameSource(result.latinNameSource)
          setIsFromSupabase(true)
          setIsDomesticRemote(result.isDomestic)
        } else {
          setRemoteDetail(null)
          setHeroImageUrl(null)
          setLatinNameSource(null)
          setIsFromSupabase(false)
          setIsDomesticRemote(false)
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not load species'
        setError(message)
        setRemoteDetail(null)
        setHeroImageUrl(null)
        setLatinNameSource(null)
        setIsFromSupabase(false)
        setIsDomesticRemote(false)
        if (__DEV__) console.warn('[WildKind Supabase]', message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id, commonNameHint, latinNameHint, isDomestic, enabled, silent])

  const { species, resolvedLatinSource } = useMemo(() => {
    let source: LatinNameSource = 'catalog.fallback'

    if (latinNameHint?.trim() && !remoteDetail) {
      source = 'route.param.latin'
    }

    if (remoteDetail && latinNameSource) {
      source = latinNameSource
    }

    if (!remoteDetail) {
      const merged = {
        ...fallback,
        latinName: latinNameHint?.trim() || fallback.latinName,
      }
      return { species: merged, resolvedLatinSource: source }
    }

    const commonName = overrides?.commonName ?? remoteDetail.commonName
    const latinName =
      remoteDetail.latinName?.trim() ||
      latinNameHint?.trim() ||
      overrides?.latinName?.trim() ||
      fallback.latinName
    const kingdom = overrides?.kingdom ?? remoteDetail.kingdom

    const merged = {
      ...fallback,
      ...remoteDetail,
      ...overrides,
      id: remoteDetail.id,
      commonName,
      latinName,
      kingdom,
      dexNumber: resolveDexNumber(
        overrides?.dexNumber,
        remoteDetail.dexNumber,
        fallback.dexNumber,
        {
          speciesId: id,
          lookupId: id,
          commonName,
          latinName,
          kingdom,
          isDomestic,
        },
      ),
      stats: remoteDetail.stats.length > 0 ? remoteDetail.stats : fallback.stats,
      vitals: remoteDetail.vitals.length > 0 ? remoteDetail.vitals : fallback.vitals,
    }

    if (latinNameHint?.trim() && merged.latinName === latinNameHint.trim()) {
      source = 'route.param.latin'
    }

    return { species: merged, resolvedLatinSource: source }
  }, [fallback, remoteDetail, overrides, latinNameHint, latinNameSource])

  // Real "What it is" description (Wikipedia) + taxonomy (GBIF), cached server-side.
  const enrichment = useSpeciesEnrichment({
    commonName: species.commonName,
    scientificName: species.latinName,
    kingdom: species.kingdom,
    dexNum: species.dexNumber,
    speciesId: id,
    isDomestic: isDomestic || isDomesticRemote,
  })

  const enrichedSpecies = useMemo(
    () => applyEnrichment(species, enrichment),
    [species, enrichment],
  )

  useEffect(() => {
    if (!__DEV__) return
    console.log('[WildKind Species] latinName source:', resolvedLatinSource, {
      id,
      commonName: species.commonName,
      latinName: species.latinName,
      isDomestic: isDomestic || isDomesticRemote,
    })
  }, [resolvedLatinSource, species.commonName, species.latinName, id, isDomestic, isDomesticRemote])

  return {
    species: enrichedSpecies,
    heroImageUrl,
    isLoading,
    isFromSupabase,
    isDomestic: isDomestic || isDomesticRemote,
    latinNameSource: resolvedLatinSource,
    error,
  }
}

const GENERIC_DESCRIPTION = /familiar face in the wild dex|a new entry for your wild dex|often spotted in/i

function applyEnrichment(
  species: SpeciesDetail,
  enrichment: { description: string | null; taxonomy: { kingdom: string | null; phylum: string | null; class: string | null; order: string | null; family: string | null } | null } | null,
): SpeciesDetail {
  if (!enrichment) return species

  // Use the real description when the current one is a generic template.
  const enrichedDescription = enrichment.description?.trim()
  const description =
    enrichedDescription && GENERIC_DESCRIPTION.test(species.description)
      ? enrichedDescription
      : species.description

  // GBIF taxonomy is authoritative — fill any field it provides.
  const t = enrichment.taxonomy
  const taxonomy = t
    ? {
        kingdom: t.kingdom || species.taxonomy.kingdom,
        phylum: t.phylum || species.taxonomy.phylum,
        class: t.class || species.taxonomy.class,
        order: t.order || species.taxonomy.order,
        family: t.family || species.taxonomy.family,
      }
    : species.taxonomy

  if (description === species.description && taxonomy === species.taxonomy) return species
  return { ...species, description, taxonomy }
}
