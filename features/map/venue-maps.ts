import type { MapCoordinate } from '@/features/map/use-user-location'

/**
 * Indoor / on-premise venues (zoos, botanical gardens, aquariums).
 * Pins use fixed WGS84 coordinates inside `bounds`; optional `styleUrl` for
 * venue-specific Mapbox tiles when available.
 */
export interface VenueMapDefinition {
  id: string
  displayName: string
  sw: MapCoordinate
  ne: MapCoordinate
  styleUrl?: string
  /** Max distance to treat as on-foot venue navigation (m). */
  walkRadiusM: number
}

/** Add venue entries as you ship custom indoor map tiles. */
export const VENUE_MAPS: readonly VenueMapDefinition[] = []

export function findVenueAt(lat: number, lng: number): VenueMapDefinition | null {
  for (const venue of VENUE_MAPS) {
    const [swLng, swLat] = venue.sw
    const [neLng, neLat] = venue.ne
    if (lng >= swLng && lng <= neLng && lat >= swLat && lat <= neLat) {
      return venue
    }
  }
  return null
}

export function isVenueWalkGuide(
  destination: { lat: number; lng: number },
  distanceM: number,
): boolean {
  const venue = findVenueAt(destination.lat, destination.lng)
  if (venue) return distanceM <= venue.walkRadiusM
  return distanceM <= 600
}
