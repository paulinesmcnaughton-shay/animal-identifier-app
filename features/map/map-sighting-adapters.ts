import { slugifySpeciesName } from '@/data/species-catalog'
import { formatSpottedAgo, haversineDistanceM } from '@/features/map/geo'
import type { MapSighting, NearbyMapSighting } from '@/features/map/map-sighting'
import { parseKingdom } from '@/features/map/mock-map-data'
import type { MapCoordinate } from '@/features/map/use-user-location'
import type { UserSightingRow } from '@/features/sightings/fetch-user-sightings'

export function userSightingToNearbyMapPin(
  row: UserSightingRow,
  userCoord: MapCoordinate,
): NearbyMapSighting | null {
  if (row.latitude == null || row.longitude == null) return null

  const lat = row.latitude
  const lng = row.longitude

  return {
    id: row.id,
    name: row.species_name,
    speciesId: row.species_id,
    kingdom: parseKingdom(row.kingdom),
    lat,
    lng,
    date: formatSpottedAgo(row.spotted_at),
    count: 1,
    isNew: Date.now() - new Date(row.spotted_at).getTime() < 48 * 3_600_000,
    distanceM: haversineDistanceM(userCoord, { lat, lng }),
    source: 'user',
    explorerCount: 1,
    isVerified: false,
    spottedByUsername: null,
    previewImageUrl: row.photo_uri?.trim() || null,
    scientificName: row.latin_name?.trim() || null,
    gbifTaxonKey: null,
    gbifOccurrenceKey: null,
  }
}

/** Ensures a map pin has fields required by the shared nearby detail card. */
export function toNearbyMapSighting(
  sighting: MapSighting,
  userCoord: MapCoordinate,
  overrides?: Partial<NearbyMapSighting>,
): NearbyMapSighting {
  if ('distanceM' in sighting && typeof (sighting as NearbyMapSighting).distanceM === 'number') {
    return sighting as NearbyMapSighting
  }

  return {
    ...sighting,
    speciesId: overrides?.speciesId ?? slugifySpeciesName(sighting.name),
    distanceM: haversineDistanceM(userCoord, sighting),
    source: overrides?.source ?? 'user',
    explorerCount: 1,
    isVerified: false,
    spottedByUsername: null,
    previewImageUrl: overrides?.previewImageUrl ?? null,
    scientificName: overrides?.scientificName ?? null,
    gbifTaxonKey: null,
    gbifOccurrenceKey: null,
    ...overrides,
  }
}
