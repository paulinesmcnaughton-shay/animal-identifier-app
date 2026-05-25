import type { Camera } from '@rnmapbox/maps'
import type { RefObject } from 'react'

import {
  boundsForGuidePoints,
  type MapGuideBounds,
} from '@/features/map/map-guide-math'
import type { MapSighting } from '@/features/map/map-sighting'
import { findVenueAt } from '@/features/map/venue-maps'
import type { MapCoordinate } from '@/features/map/use-user-location'

export type WalkGuidePhase = 'preview' | 'navigating'

export interface MapGuideTarget {
  sighting: MapSighting
  venueStyleUrl: string | null
}

export interface WalkGuideSession {
  target: MapGuideTarget
  phase: WalkGuidePhase
}

export function createMapGuideTarget(sighting: MapSighting): MapGuideTarget {
  const venue = findVenueAt(sighting.lat, sighting.lng)
  return {
    sighting,
    venueStyleUrl: venue?.styleUrl ?? null,
  }
}

export interface FitMapGuideCameraInput {
  cameraRef: RefObject<Camera | null>
  user: MapCoordinate
  destination: { lat: number; lng: number }
  hasLiveUser: boolean
  padding: [number, number, number, number]
  durationMs?: number
}

export function fitMapGuideCamera({
  cameraRef,
  user,
  destination,
  hasLiveUser,
  padding,
  durationMs = 900,
}: FitMapGuideCameraInput): void {
  const dest: MapCoordinate = [destination.lng, destination.lat]
  const points: MapCoordinate[] = hasLiveUser ? [user, dest] : [dest]
  const bounds = boundsForGuidePoints(points, hasLiveUser ? 0.0006 : 0.0012)
  if (!bounds) return

  cameraRef.current?.fitBounds(bounds.ne, bounds.sw, padding, durationMs)
}

export function mapGuideBounds(
  user: MapCoordinate,
  destination: { lat: number; lng: number },
  hasLiveUser: boolean,
): MapGuideBounds | null {
  const dest: MapCoordinate = [destination.lng, destination.lat]
  const points: MapCoordinate[] = hasLiveUser ? [user, dest] : [dest]
  return boundsForGuidePoints(points, hasLiveUser ? 0.0006 : 0.0012)
}

export function fitMapGuideCameraToRoute({
  cameraRef,
  coordinates,
  padding,
  durationMs = 900,
}: {
  cameraRef: RefObject<Camera | null>
  coordinates: MapCoordinate[]
  padding: [number, number, number, number]
  durationMs?: number
}): void {
  const bounds = boundsForGuidePoints(coordinates, 0.0008)
  if (!bounds) return
  cameraRef.current?.fitBounds(bounds.ne, bounds.sw, padding, durationMs)
}
