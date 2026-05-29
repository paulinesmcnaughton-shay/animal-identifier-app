import { useEffect, useMemo, useState } from 'react'

import { slugifySpeciesName } from '@/data/species-catalog'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import {
  hasSpecificFieldGuide,
  resolveNearbyFieldGuide,
  resolveSpeciesLookupKey,
  type NearbyFieldGuide,
} from '@/features/map/nearby-field-guide'
import { fetchAiFieldGuide } from '@/features/map/fetch-ai-field-guide'
import { useNearbyHeroImage } from '@/features/map/use-nearby-hero-image'
import { fetchWikipediaSummary } from '@/features/species/fetch-species-detail'
import { useSpeciesDetail } from '@/features/species/use-species-detail'
import { getSupabaseClient } from '@/lib/supabase/client'

export function useNearbySpotDetail(sighting: NearbyMapSighting | null) {
  const lookupId = sighting ? resolveSpeciesLookupKey(sighting) : 'unknown'

  const { species, heroImageUrl, isLoading } = useSpeciesDetail({
    id: lookupId,
    enabled: sighting !== null,
    silent: true,
    overrides: sighting
      ? {
          commonName: sighting.name,
          kingdom: sighting.kingdom,
          ...(sighting.scientificName
            ? { latinName: sighting.scientificName.split(',')[0]?.trim() }
            : {}),
        }
      : undefined,
    latinNameHint: sighting?.scientificName?.split(',')[0]?.trim(),
  })

  const { url: heroPhotoUrl, isLoading: isHeroImageLoading } = useNearbyHeroImage(sighting)

  const latin = sighting?.scientificName?.split(',')[0]?.trim() ?? ''
  const common = sighting?.name.trim() ?? ''

  const [wikiDescription, setWikiDescription] = useState<string | null>(null)
  const [aiGuide, setAiGuide] = useState<NearbyFieldGuide | null>(null)
  const [userCapturedUrl, setUserCapturedUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase || !sighting) {
      setUserCapturedUrl(null)
      return
    }
    const speciesId = sighting.speciesId?.trim() || slugifySpeciesName(sighting.name)
    let cancelled = false
    void (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData.user?.id
        if (!userId || cancelled) return
        const { data } = await supabase
          .from('user_sightings')
          .select('photo_uri')
          .eq('user_id', userId)
          .eq('species_id', speciesId)
          .not('photo_uri', 'is', null)
          .order('spotted_at', { ascending: false })
          .limit(1)
        if (!cancelled) setUserCapturedUrl(data?.[0]?.photo_uri?.trim() || null)
      } catch {
        // image is optional — never surface this error
      }
    })()
    return () => { cancelled = true }
  }, [sighting?.speciesId, sighting?.name])

  useEffect(() => {
    if (!common) {
      setWikiDescription(null)
      return
    }
    let cancelled = false
    setWikiDescription(null)
    void fetchWikipediaSummary(latin, common).then((summary) => {
      if (!cancelled) setWikiDescription(summary)
    })
    return () => {
      cancelled = true
    }
  }, [latin, common])

  useEffect(() => {
    if (!sighting || hasSpecificFieldGuide(sighting)) {
      setAiGuide(null)
      return
    }
    let cancelled = false
    setAiGuide(null)
    const latinHint = sighting.scientificName?.split(',')[0]?.trim()
    void fetchAiFieldGuide(sighting.name, latinHint).then((result) => {
      if (!cancelled) setAiGuide(result)
    })
    return () => {
      cancelled = true
    }
  }, [sighting])

  const guide = useMemo(() => {
    if (!sighting) {
      return resolveNearbyFieldGuide(
        {
          id: 'unknown',
          name: 'Unknown',
          kingdom: 'mammal',
          lat: 0,
          lng: 0,
          date: '',
          count: 1,
          distanceM: 0,
          source: 'gbif',
          explorerCount: 1,
          isVerified: false,
        },
        null,
      )
    }

    if (hasSpecificFieldGuide(sighting)) return resolveNearbyFieldGuide(sighting, null)

    if (aiGuide) return aiGuide

    const description =
      wikiDescription ??
      (species.description?.trim() && !species.description.startsWith('A new entry for your Wild Dex')
        ? species.description
        : null)

    return resolveNearbyFieldGuide(sighting, description)
  }, [sighting, species.description, wikiDescription, aiGuide])

  const remotePhotoUrl = heroPhotoUrl || heroImageUrl?.trim() || userCapturedUrl || null

  return {
    species,
    guide,
    remotePhotoUrl,
    lookupId: sighting?.speciesId ?? slugifySpeciesName(sighting?.name ?? ''),
    isLoading: sighting !== null && isLoading,
    isHeroImageLoading,
  }
}
