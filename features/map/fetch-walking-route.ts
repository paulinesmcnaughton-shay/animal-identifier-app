import type { MapCoordinate } from '@/features/map/use-user-location'

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/walking'

export interface WalkingRouteStep {
  instruction: string
  modifier: string | null
  maneuverType: string
  location: MapCoordinate
  distanceM: number
}

export interface WalkingRoute {
  coordinates: MapCoordinate[]
  steps: WalkingRouteStep[]
  totalDistanceM: number
  totalDurationSec: number
}

interface MapboxDirectionsResponse {
  routes?: {
    distance?: number
    duration?: number
    geometry?: { coordinates?: [number, number][] }
    legs?: {
      steps?: {
        distance?: number
        duration?: number
        maneuver?: {
          type?: string
          modifier?: string
          instruction?: string
          location?: [number, number]
        }
      }[]
    }[]
  }[]
}

function formatCoordinatePair(from: MapCoordinate, to: { lat: number; lng: number }): string {
  const [fromLng, fromLat] = from
  return `${fromLng},${fromLat};${to.lng},${to.lat}`
}

export async function fetchWalkingRoute(
  from: MapCoordinate,
  to: { lat: number; lng: number },
  accessToken: string,
): Promise<WalkingRoute | null> {
  const token = accessToken.trim()
  if (!token) return null

  const coords = formatCoordinatePair(from, to)
  const params = new URLSearchParams({
    geometries: 'geojson',
    steps: 'true',
    overview: 'full',
    language: 'en',
    access_token: token,
  })

  try {
    const response = await fetch(`${DIRECTIONS_BASE}/${coords}?${params.toString()}`)
    if (!response.ok) {
      if (__DEV__) console.warn('[WildKind] walking directions failed:', response.status)
      return null
    }

    const payload = (await response.json()) as MapboxDirectionsResponse
    const route = payload.routes?.[0]
    const rawCoords = route?.geometry?.coordinates
    if (!route || !rawCoords?.length) return null

    const coordinates: MapCoordinate[] = rawCoords.map(([lng, lat]) => [lng, lat])
    const legSteps = route.legs?.[0]?.steps ?? []

    const steps: WalkingRouteStep[] = legSteps
      .map((step) => {
        const loc = step.maneuver?.location
        if (!loc) return null
        const instruction = step.maneuver?.instruction?.trim()
        if (!instruction) return null

        return {
          instruction,
          modifier: step.maneuver?.modifier ?? null,
          maneuverType: step.maneuver?.type ?? 'continue',
          location: [loc[0], loc[1]] as MapCoordinate,
          distanceM: step.distance ?? 0,
        }
      })
      .filter((item): item is WalkingRouteStep => item !== null)

    return {
      coordinates,
      steps,
      totalDistanceM: route.distance ?? 0,
      totalDurationSec: route.duration ?? 0,
    }
  } catch (error) {
    if (__DEV__) console.warn('[WildKind] walking directions error:', error)
    return null
  }
}
