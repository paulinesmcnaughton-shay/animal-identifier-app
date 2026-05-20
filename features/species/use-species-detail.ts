import { useEffect, useMemo, useState } from 'react'

import {
  getSpeciesDetail,
  type SpeciesDetail,
} from '@/data/species-catalog'
import { fetchSpeciesDetailFromSupabase } from '@/features/species/fetch-species-detail'
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
        if (__DEV__) console.warn('[Wildr Supabase]', message)
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

    const merged = {
      ...fallback,
      ...remoteDetail,
      ...overrides,
      id: remoteDetail.id,
      commonName: overrides?.commonName ?? remoteDetail.commonName,
      latinName:
        remoteDetail.latinName?.trim() ||
        latinNameHint?.trim() ||
        overrides?.latinName?.trim() ||
        fallback.latinName,
      dexNumber: resolveDexNumber(overrides?.dexNumber, remoteDetail.dexNumber, fallback.dexNumber),
      kingdom: overrides?.kingdom ?? remoteDetail.kingdom,
      stats: remoteDetail.stats.length > 0 ? remoteDetail.stats : fallback.stats,
      vitals: remoteDetail.vitals.length > 0 ? remoteDetail.vitals : fallback.vitals,
    }

    if (latinNameHint?.trim() && merged.latinName === latinNameHint.trim()) {
      source = 'route.param.latin'
    }

    return { species: merged, resolvedLatinSource: source }
  }, [fallback, remoteDetail, overrides, latinNameHint, latinNameSource])

  useEffect(() => {
    if (!__DEV__) return
    console.log('[Wildr Species] latinName source:', resolvedLatinSource, {
      id,
      commonName: species.commonName,
      latinName: species.latinName,
      isDomestic: isDomestic || isDomesticRemote,
    })
  }, [resolvedLatinSource, species.commonName, species.latinName, id, isDomestic, isDomesticRemote])

  return {
    species,
    heroImageUrl,
    isLoading,
    isFromSupabase,
    isDomestic: isDomestic || isDomesticRemote,
    latinNameSource: resolvedLatinSource,
    error,
  }
}
