import { canUseAiGateway, invokeAiGateway } from '@/features/identify/ai-gateway'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { parseKingdom } from '@/features/map/mock-map-data'
import type { MapCoordinate } from '@/features/map/use-user-location'

interface AiSpeciesSuggestion {
  commonName: string
  latinName: string
  kingdom: string
}

async function queryClaudeForSpecies(
  lat: number,
  lng: number,
): Promise<AiSpeciesSuggestion[]> {
  if (!canUseAiGateway()) return []

  try {
    const { suggestions } = await invokeAiGateway<{ suggestions?: AiSpeciesSuggestion[] }>({
      action: 'ai_nearby',
      lat,
      lng,
    })
    return Array.isArray(suggestions) ? suggestions : []
  } catch {
    return []
  }
}

export async function fetchAiNearbySightings(
  userCoord: MapCoordinate,
): Promise<NearbyMapSighting[]> {
  const [lng, lat] = userCoord
  const suggestions = await queryClaudeForSpecies(lat, lng)

  return suggestions.map(
    (s, i): NearbyMapSighting => ({
      id: `ai-${s.latinName.replace(/\s+/g, '-').toLowerCase()}-${i}`,
      name: s.commonName,
      speciesId: s.commonName.toLowerCase().replace(/\s+/g, '-'),
      scientificName: s.latinName,
      kingdom: parseKingdom(s.kingdom),
      lat,
      lng,
      date: 'Commonly seen here',
      count: 1,
      distanceM: 0,
      source: 'ai',
      explorerCount: 0,
      isVerified: false,
      spottedByUsername: null,
    }),
  )
}
