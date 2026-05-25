import { haversineDistanceM } from '@/features/map/geo'
import {
  arrowRotationDegrees,
  bearingDegrees,
} from '@/features/map/map-guide-math'
import type { WalkingRoute, WalkingRouteStep } from '@/features/map/fetch-walking-route'
import type { MapCoordinate } from '@/features/map/use-user-location'

export interface WalkGuideMetrics {
  distanceM: number
  arrowRotationDeg: number
  instruction: string
  maneuverModifier: string | null
  maneuverType: string
  durationRemainingSec: number | null
  lineFeature: GeoJSON.Feature<GeoJSON.LineString>
  isWalkingRoute: boolean
  routeCoordinates: MapCoordinate[]
}

function pointFromCoord(coord: MapCoordinate): { lat: number; lng: number } {
  const [lng, lat] = coord
  return { lat, lng }
}

function polylineLengthM(coords: MapCoordinate[], startIndex: number, endIndex: number): number {
  let total = 0
  const end = Math.min(endIndex, coords.length - 1)
  for (let i = startIndex; i < end; i += 1) {
    total += haversineDistanceM(coords[i], pointFromCoord(coords[i + 1]))
  }
  return total
}

function findClosestRouteIndex(user: MapCoordinate, coords: MapCoordinate[]): number {
  let bestIndex = 0
  let bestDistance = Infinity

  for (let i = 0; i < coords.length; i += 1) {
    const d = haversineDistanceM(user, pointFromCoord(coords[i]))
    if (d < bestDistance) {
      bestDistance = d
      bestIndex = i
    }
  }

  return bestIndex
}

function distanceAlongRouteToIndex(coords: MapCoordinate[], index: number): number {
  return polylineLengthM(coords, 0, index)
}

function distanceAlongRouteToStep(coords: MapCoordinate[], step: WalkingRouteStep): number {
  const closest = findClosestRouteIndex(step.location, coords)
  return distanceAlongRouteToIndex(coords, closest)
}

function resolveActiveStep(
  coords: MapCoordinate[],
  steps: WalkingRouteStep[],
  progressAlongM: number,
): WalkingRouteStep | null {
  for (const step of steps) {
    const stepAlong = distanceAlongRouteToStep(coords, step)
    if (stepAlong > progressAlongM + 12) {
      return step
    }
  }
  return steps[steps.length - 1] ?? null
}

function lookAheadCoordinate(
  coords: MapCoordinate[],
  fromIndex: number,
): MapCoordinate {
  const aheadIndex = Math.min(fromIndex + 6, coords.length - 1)
  return coords[aheadIndex] ?? coords[coords.length - 1]
}

export function routeLineFeature(
  coordinates: MapCoordinate[],
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  }
}

export function formatWalkDurationLabel(durationSec: number): string {
  const minutes = Math.max(1, Math.round(durationSec / 60))
  return `${minutes} min`
}

export function maneuverIconName(
  modifier: string | null,
  maneuverType: string,
): 'flag' | 'arrow-up' | 'arrow-back' | 'arrow-forward' | 'return-up-back' {
  if (maneuverType === 'arrive' || maneuverType === 'destination') return 'flag'
  if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') {
    return 'arrow-back'
  }
  if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') {
    return 'arrow-forward'
  }
  if (modifier === 'uturn') return 'return-up-back'
  return 'arrow-up'
}

export function computeWalkGuideMetrics(
  user: MapCoordinate,
  route: WalkingRoute,
  deviceHeading: number | null,
): WalkGuideMetrics {
  const { coordinates, steps } = route
  const closestIndex = findClosestRouteIndex(user, coordinates)
  const progressAlongM = distanceAlongRouteToIndex(coordinates, closestIndex)
  const remainingDistanceM = polylineLengthM(coordinates, closestIndex, coordinates.length - 1)

  const activeStep = resolveActiveStep(coordinates, steps, progressAlongM)
  const instruction =
    activeStep?.instruction
    ?? (remainingDistanceM < 25 ? 'You have arrived' : 'Continue on the path')

  const lookAhead = lookAheadCoordinate(coordinates, closestIndex)
  const bearing = bearingDegrees(user, pointFromCoord(lookAhead))

  const walkSpeedMps = 1.4
  const durationRemainingSec = Math.round(remainingDistanceM / walkSpeedMps)

  return {
    distanceM: Math.max(remainingDistanceM, 0),
    arrowRotationDeg: arrowRotationDegrees(bearing, deviceHeading),
    instruction,
    maneuverModifier: activeStep?.modifier ?? null,
    maneuverType: activeStep?.maneuverType ?? 'continue',
    durationRemainingSec,
    lineFeature: routeLineFeature(coordinates),
    isWalkingRoute: true,
    routeCoordinates: coordinates,
  }
}
