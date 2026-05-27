import { enrichIdentResult } from '@/features/species/dex-number-registry'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import type { IdentResult } from '@/features/identify/types'
import { MANUAL_PICKER_CONFIDENCE_THRESHOLD } from '@/features/identify/types'
import { classifyPlantType } from '@/features/species/kingdom-from-taxonomy'

const GBIF_MATCH_URL = 'https://api.gbif.org/v1/species/match'

interface GbifMatchResponse {
  canonicalName?: string
  scientificName?: string
  kingdom?: string
  class?: string
  matchType?: 'EXACT' | 'FUZZY' | 'HIGHERTAXON' | 'NONE'
  confidence?: number
  usageKey?: number
}

const CLASS_TO_KINGDOM: Record<string, KingdomKey> = {
  Mammalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Chondrichthyes: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Bivalvia: 'mollusc',
  Gastropoda: 'mollusc',
}

function resolveKingdom(match: GbifMatchResponse, commonName?: string): KingdomKey | null {
  if (match.class) {
    const k = CLASS_TO_KINGDOM[match.class]
    if (k) return k
  }
  if (match.kingdom === 'Plantae' || match.kingdom === 'Fungi') {
    return commonName ? classifyPlantType(commonName) : 'plant'
  }
  if (match.kingdom === 'Animalia') return 'mammal'
  return null
}

export async function lookupSpeciesInGbif(commonName: string): Promise<IdentResult | null> {
  if (!commonName.trim()) return null

  try {
    const url = `${GBIF_MATCH_URL}?name=${encodeURIComponent(commonName)}&verbose=false`
    const res = await fetch(url)
    if (!res.ok) return null

    const match = (await res.json()) as GbifMatchResponse
    if (match.matchType === 'NONE') return null
    if ((match.confidence ?? 0) < 60) return null

    const latinName = match.canonicalName?.trim() || match.scientificName?.trim()
    const kingdom = resolveKingdom(match, commonName)

    return enrichIdentResult({
      commonName,
      kingdom,
      confidence: MANUAL_PICKER_CONFIDENCE_THRESHOLD,
      source: 'gbif',
      latinName,
      isDomestic: false,
    })
  } catch {
    return null
  }
}
