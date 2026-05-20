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

export function useTaxaPhoto(
  name: string | null | undefined,
  kingdom?: KingdomKey | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null)
  const query = name?.trim() ?? ''

  useEffect(() => {
    if (!query) {
      setUrl(null)
      return
    }

    let cancelled = false
    setUrl(null)

    void fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10&rank=species,subspecies,variety`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const results = (data?.results ?? []) as TaxaResult[]
        setUrl(pickPhotoUrl(results, kingdom))
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [query, kingdom])

  return url
}
