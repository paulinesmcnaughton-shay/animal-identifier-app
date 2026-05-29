import { slugifySpeciesName } from '@/data/species-catalog'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { MOCK_COMMUNITY_NEARBY, parseKingdom } from '@/features/map/mock-map-data'
import type { SightingMapPrivacy } from '@/features/map/sighting-privacy'
import { boundingBox, formatSpottedAgo, haversineDistanceM } from '@/features/map/geo'
import { NEARBY_RADIUS_KM, NEARBY_RADIUS_M } from '@/features/map/nearby-radius'
import { shiftSightingsNearUser, type MapCoordinate } from '@/features/map/use-user-location'
import { getSupabaseClient } from '@/lib/supabase/client'
const COMMUNITY_LIMIT = 24

interface CommunitySightingRow {
  id: string
  species_name: string
  species_id: string | null
  kingdom: string
  latitude: number
  longitude: number
  spotted_at: string
  report_count: number
  privacy: SightingMapPrivacy
  profiles?: { username: string | null } | null
}

function rowToSighting(
  row: CommunitySightingRow,
  userCoord: MapCoordinate,
  maxDistanceM: number,
): NearbyMapSighting | null {
  const lat = row.latitude
  const lng = row.longitude
  const distanceM = haversineDistanceM(userCoord, { lat, lng })
  if (distanceM > maxDistanceM) return null

  const isPublic = row.privacy === 'public'
  const rawUsername = row.profiles?.username?.trim() || null
  const username = rawUsername ? rawUsername.replace(/\s/g, '') || null : null

  return {
    id: row.id,
    name: row.species_name,
    speciesId: row.species_id ?? slugifySpeciesName(row.species_name),
    kingdom: parseKingdom(row.kingdom),
    lat,
    lng,
    date: formatSpottedAgo(row.spotted_at),
    count: row.report_count,
    distanceM,
    source: 'community',
    explorerCount: row.report_count,
    isVerified: false,
    isNew: Date.now() - new Date(row.spotted_at).getTime() < 48 * 3_600_000,
    spottedByUsername: isPublic ? username : null,
  }
}

function mockCommunityNearUser(userCoord: MapCoordinate): NearbyMapSighting[] {
  return shiftSightingsNearUser(MOCK_COMMUNITY_NEARBY, userCoord)
    .map((item) => ({
      ...item,
      distanceM: haversineDistanceM(userCoord, item),
      source: 'community' as const,
      explorerCount: item.count,
      isVerified: false,
      spottedByUsername: null,
    }))
    .filter((item) => item.distanceM <= NEARBY_RADIUS_M)
    .sort((a, b) => a.distanceM - b.distanceM)
}

/** Layer 2 — anonymous + public WildKind sightings only. */
export async function fetchCommunityMapSightings(
  userCoord: MapCoordinate,
  radiusKm = NEARBY_RADIUS_KM,
): Promise<NearbyMapSighting[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const box = boundingBox(userCoord, radiusKm)

  const { data, error } = await supabase
    .from('community_sightings')
    .select(
      `
      id,
      species_name,
      species_id,
      kingdom,
      latitude,
      longitude,
      spotted_at,
      report_count,
      privacy,
      profiles ( username )
    `,
    )
    .in('privacy', ['anonymous', 'public'])
    .gte('latitude', box.minLat)
    .lte('latitude', box.maxLat)
    .gte('longitude', box.minLng)
    .lte('longitude', box.maxLng)
    .order('spotted_at', { ascending: false })
    .limit(COMMUNITY_LIMIT)

  if (error) {
    if (__DEV__) console.warn('[WildKind] community_sightings fetch failed:', error.message)
    return null
  }

  const maxDistanceM = radiusKm * 1000

  return (data ?? [])
    .map((row) => rowToSighting(row as CommunitySightingRow, userCoord, maxDistanceM))
    .filter((item): item is NearbyMapSighting => item !== null)
    .sort((a, b) => a.distanceM - b.distanceM)
}

export { mockCommunityNearUser }
