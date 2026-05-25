import { haversineDistanceM } from '@/features/map/geo'
import type { MapCoordinate } from '@/features/map/use-user-location'

/** Degrees clockwise from true north (0–360). */
export function bearingDegrees(from: MapCoordinate, to: { lat: number; lng: number }): number {
  const [fromLng, fromLat] = from
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const y = Math.sin(toRad(to.lng - fromLng)) * Math.cos(toRad(to.lat))
  const x =
    Math.cos(toRad(fromLat)) * Math.sin(toRad(to.lat))
    - Math.sin(toRad(fromLat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - fromLng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Screen-space arrow rotation: 0° = up on device, points toward destination. */
export function arrowRotationDegrees(
  bearingToTarget: number,
  deviceHeading: number | null,
): number {
  if (deviceHeading === null) return bearingToTarget
  return ((bearingToTarget - deviceHeading) % 360 + 360) % 360
}

export interface MapGuideBounds {
  ne: MapCoordinate
  sw: MapCoordinate
}

export function boundsForGuidePoints(
  points: MapCoordinate[],
  minSpanDeg = 0.0006,
): MapGuideBounds | null {
  if (points.length === 0) return null

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  const lngSpan = maxLng - minLng
  const latSpan = maxLat - minLat
  if (lngSpan < minSpanDeg) {
    const pad = (minSpanDeg - lngSpan) / 2
    minLng -= pad
    maxLng += pad
  }
  if (latSpan < minSpanDeg) {
    const pad = (minSpanDeg - latSpan) / 2
    minLat -= pad
    maxLat += pad
  }

  return {
    ne: [maxLng, maxLat],
    sw: [minLng, minLat],
  }
}

export function guideLineFeature(
  from: MapCoordinate,
  to: { lat: number; lng: number },
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [from, [to.lng, to.lat]],
    },
  }
}

export function liveGuideDistanceM(
  user: MapCoordinate,
  destination: { lat: number; lng: number },
): number {
  return haversineDistanceM(user, destination)
}
