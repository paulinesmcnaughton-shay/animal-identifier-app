import type { CommunityNearbySighting } from '@/features/map/map-sighting'
import { MOCK_COMMUNITY_NEARBY, parseKingdom } from '@/features/map/mock-map-data'
import { boundingBox, formatSpottedAgo, haversineDistanceM } from '@/features/map/geo'
import { shiftSightingsNearUser, type MapCoordinate } from '@/features/map/use-user-location'
import { getSupabaseClient } from '@/lib/supabase/client'

const NEARBY_RADIUS_KM = 2
const NEARBY_LIMIT = 20

interface CommunitySightingRow {
  id: string
  species_name: string
  species_id: string | null
  kingdom: string
  latitude: number
  longitude: number
  spotted_at: string
  report_count: number
}

function rowToSighting(
  row: CommunitySightingRow,
  userCoord: MapCoordinate,
): CommunityNearbySighting {
  const lat = row.latitude
  const lng = row.longitude
  const distanceM = haversineDistanceM(userCoord, { lat, lng })

  return {
    id: row.id,
    name: row.species_name,
    kingdom: parseKingdom(row.kingdom),
    lat,
    lng,
    date: formatSpottedAgo(row.spotted_at),
    count: row.report_count,
    explorerCount: row.report_count,
    distanceM,
    isNew: Date.now() - new Date(row.spotted_at).getTime() < 48 * 3_600_000,
  }
}

function mockNearbyList(userCoord: MapCoordinate): CommunityNearbySighting[] {
  const shifted = shiftSightingsNearUser(MOCK_COMMUNITY_NEARBY, userCoord)

  return shifted
    .map((item) => ({
      ...item,
      explorerCount: item.count,
      distanceM: haversineDistanceM(userCoord, item),
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, NEARBY_LIMIT)
}

async function fetchFromSupabase(userCoord: MapCoordinate): Promise<CommunityNearbySighting[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const box = boundingBox(userCoord, NEARBY_RADIUS_KM)

  const { data, error } = await supabase
    .from('community_sightings')
    .select('id, species_name, species_id, kingdom, latitude, longitude, spotted_at, report_count')
    .gte('latitude', box.minLat)
    .lte('latitude', box.maxLat)
    .gte('longitude', box.minLng)
    .lte('longitude', box.maxLng)
    .order('spotted_at', { ascending: false })
    .limit(NEARBY_LIMIT)

  if (error) {
    if (__DEV__) console.warn('[WildKind] community_sightings fetch failed:', error.message)
    return null
  }

  if (!data?.length) return []

  return data
    .map((row) => rowToSighting(row as CommunitySightingRow, userCoord))
    .filter((item) => item.distanceM <= NEARBY_RADIUS_KM * 1000)
    .sort((a, b) => a.distanceM - b.distanceM)
}

/** Other explorers' public spots near the user — not the logged-in user's collection. */
export async function fetchNearbyCommunitySightings(
  userCoord: MapCoordinate,
): Promise<CommunityNearbySighting[]> {
  const fromDb = await fetchFromSupabase(userCoord)
  if (fromDb !== null) return fromDb
  return mockNearbyList(userCoord)
}
