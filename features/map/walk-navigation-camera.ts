import type { Camera } from '@rnmapbox/maps'
import type { RefObject } from 'react'

import { haversineDistanceM } from '@/features/map/geo'
import { bearingDegrees } from '@/features/map/map-guide-math'
import type { MapCoordinate } from '@/features/map/use-user-location'

function pointFromCoord(coord: MapCoordinate): { lat: number; lng: number } {
  const [lng, lat] = coord
  return { lat, lng }
}

/** Point on the route ahead of the user — used to orient the map when compass is unavailable. */
export function walkNavLookAheadCoordinate(
  user: MapCoordinate,
  routeCoordinates: MapCoordinate[],
): MapCoordinate | null {
  if (routeCoordinates.length === 0) return null

  let closestIndex = 0
  let closestDistanceM = Infinity
  for (let i = 0; i < routeCoordinates.length; i += 1) {
    const distanceM = haversineDistanceM(user, pointFromCoord(routeCoordinates[i]))
    if (distanceM < closestDistanceM) {
      closestDistanceM = distanceM
      closestIndex = i
    }
  }

  const aheadIndex = Math.min(closestIndex + 10, routeCoordinates.length - 1)
  return routeCoordinates[aheadIndex] ?? null
}

/** Street-level zoom — individual buildings and block names visible (Google Maps walk style). */
export const WALK_NAV_ZOOM_LEVEL = 19

export interface WalkNavCameraPadding {
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
}

export function walkNavCameraPadding(
  safeAreaTop: number,
  safeAreaBottom: number,
): WalkNavCameraPadding {
  return {
    paddingTop: safeAreaTop + 132,
    paddingBottom: safeAreaBottom + 96,
    paddingLeft: 48,
    paddingRight: 48,
  }
}

export function resolveWalkNavHeading(
  deviceHeading: number | null,
  user: MapCoordinate,
  lookAhead: MapCoordinate | null,
): number | undefined {
  if (deviceHeading !== null && Number.isFinite(deviceHeading)) {
    return ((deviceHeading % 360) + 360) % 360
  }
  if (lookAhead) {
    const [lng, lat] = lookAhead
    return bearingDegrees(user, { lat, lng })
  }
  return undefined
}

export interface ApplyWalkNavigationCameraInput {
  cameraRef: RefObject<Camera | null>
  user: MapCoordinate
  padding: WalkNavCameraPadding
  heading?: number
  animationDurationMs?: number
}

export function applyWalkNavigationCamera({
  cameraRef,
  user,
  padding,
  heading,
  animationDurationMs = 350,
}: ApplyWalkNavigationCameraInput): void {
  cameraRef.current?.setCamera({
    centerCoordinate: user,
    zoomLevel: WALK_NAV_ZOOM_LEVEL,
    heading,
    padding,
    animationDuration: animationDurationMs,
    animationMode: 'easeTo',
  })
}
