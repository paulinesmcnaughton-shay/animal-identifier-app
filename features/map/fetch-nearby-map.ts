import type { NearbyMapSighting } from '@/features/map/map-sighting'
import {
  fetchCommunityMapSightings,
  mockCommunityNearUser,
} from '@/features/map/fetch-community-nearby'
import { fetchGbifNearbySightings } from '@/features/map/fetch-gbif-nearby'
import { fetchAiNearbySightings } from '@/features/map/fetch-ai-nearby'
import { haversineDistanceM } from '@/features/map/geo'
import {
  NEARBY_RADIUS_STEPS_MILES,
  NEARBY_RADIUS_M,
  sortByDistancePriority,
} from '@/features/map/nearby-radius'
import type { MapCoordinate } from '@/features/map/use-user-location'

const NEARBY_MAP_LIMIT = 40
const DEDUPE_RADIUS_M = 80

const STEP_RADII_KM = NEARBY_RADIUS_STEPS_MILES.map((miles) => miles * 1.609344)

function dedupeKey(item: NearbyMapSighting): string {
  return `${item.name.toLowerCase()}|${Math.round(item.lat * 1000)}|${Math.round(item.lng * 1000)}`
}

function mergeNearbyLayers(
  community: NearbyMapSighting[],
  gbif: NearbyMapSighting[],
): NearbyMapSighting[] {
  const merged: NearbyMapSighting[] = []
  const keys = new Set<string>()

  for (const item of community) {
    const key = dedupeKey(item)
    if (keys.has(key)) continue
    keys.add(key)
    merged.push(item)
  }

  for (const item of gbif) {
    const key = dedupeKey(item)
    if (keys.has(key)) continue

    const nearCommunity = community.some(
      (other) =>
        other.name.toLowerCase() === item.name.toLowerCase()
        && haversineDistanceM([item.lng, item.lat], { lat: other.lat, lng: other.lng })
          < DEDUPE_RADIUS_M,
    )
    if (nearCommunity) continue

    keys.add(key)
    merged.push(item)
  }

  return sortByDistancePriority(merged).slice(0, NEARBY_MAP_LIMIT)
}

async function fetchLayersForRadius(
  userCoord: MapCoordinate,
  radiusKm: number,
): Promise<{ community: NearbyMapSighting[]; gbif: NearbyMapSighting[] }> {
  const maxDistanceM = radiusKm * 1000

  const [gbifNear, communityResult] = await Promise.all([
    fetchGbifNearbySightings(userCoord, { stillImageOnly: true }, radiusKm),
    fetchCommunityMapSightings(userCoord, radiusKm),
  ])

  let gbif = gbifNear
  if (gbif.length === 0) {
    gbif = await fetchGbifNearbySightings(userCoord, { stillImageOnly: false }, radiusKm)
  }

  return {
    community: communityResult ?? [],
    gbif: gbif.filter((item) => item.distanceM <= maxDistanceM),
  }
}

/**
 * Fetch GBIF + community sightings, starting at 5 miles and expanding by 5-mile
 * steps (10, 15, 20) only when the current radius returns nothing. Hard cap: 20 mi.
 */
export async function fetchNearbyMapSightings(
  userCoord: MapCoordinate,
): Promise<NearbyMapSighting[]> {
  for (const radiusKm of STEP_RADII_KM) {
    const { community, gbif } = await fetchLayersForRadius(userCoord, radiusKm)
    const merged = mergeNearbyLayers(community, gbif)
    if (merged.length > 0) return merged
  }

  // GBIF returned nothing for all steps — try AI suggestions first, then mock
  const aiResults = await fetchAiNearbySightings(userCoord)
  if (aiResults.length > 0) return aiResults

  const mockNear = mockCommunityNearUser(userCoord).filter(
    (item) => item.distanceM <= NEARBY_RADIUS_M,
  )
  return sortByDistancePriority(mockNear).slice(0, NEARBY_MAP_LIMIT)
}
