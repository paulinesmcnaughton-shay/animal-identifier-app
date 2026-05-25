import type { MapCoordinate } from '@/features/map/use-user-location'

const EARTH_RADIUS_M = 6_371_000

export function haversineDistanceM(
  from: MapCoordinate,
  to: { lat: number; lng: number },
): number {
  const [fromLng, fromLat] = from
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(to.lat - fromLat)
  const dLng = toRad(to.lng - fromLng)
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(fromLat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Rough bounding box (~radiusKm) for Supabase lat/lng filters. */
export function boundingBox(
  center: MapCoordinate,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const [lng, lat] = center
  const deltaLat = radiusKm / 111
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  }
}

/** @deprecated Use formatDistance from @/features/settings/distance-unit */
export function formatDistanceM(m: number): string {
  const miles = m / 1609.344
  if (miles < 0.1) return `${Math.round(m / 0.3048)} ft away`
  if (miles < 10) return `${miles.toFixed(1)} mi away`
  return `${Math.round(miles)} mi away`
}

export function formatSpottedAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'Today'
  if (hours < 24) return 'Today'
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? '1w ago' : `${weeks}w ago`
}
