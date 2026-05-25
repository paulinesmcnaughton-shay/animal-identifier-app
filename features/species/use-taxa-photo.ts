import { useEffect, useState } from 'react'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

const KINGDOM_ICONIC: Partial<Record<KingdomKey, string>> = {
  bird: 'Aves',
  mammal: 'Mammalia',
  insect: 'Insecta',
  reptile: 'Reptilia',
  amphibian: 'Amphibia',
  fish: 'Actinopterygii',
  arachnid: 'Arachnida',
  mollusc: 'Mollusca',
  plant: 'Plantae',
}

interface TaxaResult {
  iconic_taxon_name?: string
  default_photo?: { medium_url?: string }
}

function pickPhotoUrl(results: TaxaResult[], kingdom?: KingdomKey | null): string | null {
  const iconic = kingdom ? KINGDOM_ICONIC[kingdom] : null

  const match = iconic
    ? results.find((r) => r.iconic_taxon_name === iconic)
    : results[0]

  return match?.default_photo?.medium_url ?? results[0]?.default_photo?.medium_url ?? null
}

function looksLikeScientificName(value: string): boolean {
  return /^[A-Z][a-z]+(\s+[a-z]+)+/.test(value.trim())
}

async function fetchInatPhoto(
  query: string,
  kingdom: KingdomKey | null | undefined,
): Promise<string | null> {
  const response = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10&rank=species,subspecies,variety`,
  )
  if (!response.ok) return null
  const data = (await response.json()) as { results?: TaxaResult[] }
  return pickPhotoUrl(data?.results ?? [], kingdom)
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
  const [url, setUrl] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const query = name?.trim() ?? ''
  const latin = scientificName?.trim() ?? ''

  useEffect(() => {
    if (!query && !latin) {
      setUrl(null)
      setIsResolving(false)
      return
    }

    let cancelled = false
    setUrl(null)
    setIsResolving(true)

    void (async () => {
      try {
        const primaryQuery = looksLikeScientificName(query) ? query : latin || query
        let found = await fetchInatPhoto(primaryQuery, kingdom)
        if (cancelled) return

        if (!found && latin && latin !== primaryQuery) {
          found = await fetchInatPhoto(latin, kingdom)
        }
        if (cancelled) return

        if (!found && query && query !== primaryQuery) {
          found = await fetchInatPhoto(query, kingdom)
        }
        if (cancelled) return

        setUrl(found)
      } catch {
        if (!cancelled) setUrl(null)
      } finally {
        if (!cancelled) setIsResolving(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query, latin, kingdom])

  return { url, isResolving }
}
