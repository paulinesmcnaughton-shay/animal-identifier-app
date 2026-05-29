import { useEffect, useState } from 'react'

import { resolveGbifHeroImageUrl } from '@/features/map/gbif-occurrence-media'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { fetchWikipediaImageUrl } from '@/features/species/fetch-wikipedia-image'
import { useTaxaPhoto } from '@/features/species/use-taxa-photo'

interface NearbyHeroImageState {
  url: string | null
  isLoading: boolean
}

export function useNearbyHeroImage(sighting: NearbyMapSighting | null): NearbyHeroImageState {
  const kingdom = sighting?.kingdom ?? null
  const { url: taxaPhotoUrl, isResolving: isTaxaResolving } = useTaxaPhoto(
    sighting?.name,
    kingdom,
    sighting?.scientificName,
  )

  const [gbifUrl, setGbifUrl] = useState<string | null>(null)
  const [gbifLoading, setGbifLoading] = useState(false)
  const [wikiUrl, setWikiUrl] = useState<string | null>(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  useEffect(() => {
    const name = sighting?.name?.trim()
    if (!name) {
      setWikiUrl(null)
      setWikiLoading(false)
      return
    }
    let cancelled = false
    setWikiUrl(null)
    setWikiLoading(true)
    void fetchWikipediaImageUrl(name).then((resolved) => {
      if (cancelled) return
      setWikiUrl(resolved)
      setWikiLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [sighting?.name])

  useEffect(() => {
    if (!sighting || sighting.source !== 'gbif') {
      setGbifUrl(null)
      setGbifLoading(false)
      return
    }

    const preview = sighting.previewImageUrl?.trim()
    if (preview) {
      setGbifUrl(preview)
      setGbifLoading(false)
      return
    }

    let cancelled = false
    setGbifLoading(true)
    setGbifUrl(null)

    void resolveGbifHeroImageUrl({
      previewImageUrl: null,
      taxonKey: sighting.gbifTaxonKey,
    }).then((url) => {
      if (cancelled) return
      setGbifUrl(url)
      setGbifLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [
    sighting?.gbifTaxonKey,
    sighting?.previewImageUrl,
    sighting?.source,
    sighting?.id,
  ])

  const url =
    sighting?.previewImageUrl?.trim()
    || gbifUrl
    || taxaPhotoUrl
    || wikiUrl
    || null

  const isLoading = sighting !== null && !url && (gbifLoading || isTaxaResolving || wikiLoading)

  return { url, isLoading }
}
