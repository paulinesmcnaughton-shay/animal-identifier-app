import { useEffect, useMemo, useState } from 'react'

import {
  fetchWalkingRoute,
  type WalkingRouteStep,
} from '@/features/map/fetch-walking-route'
import type { MapGuideTarget } from '@/features/map/map-guide'
import { computeWalkGuideMetrics } from '@/features/map/walking-guide-nav'
import { liveGuideDistanceM } from '@/features/map/map-guide-math'
import { guideLineFeature, bearingDegrees, arrowRotationDegrees } from '@/features/map/map-guide-math'
import type { MapCoordinate } from '@/features/map/use-user-location'

export interface WalkRouteSummary {
  distanceM: number
  durationSec: number
  isWalkingRoute: boolean
}

interface UseWalkingGuideResult {
  isRouteLoading: boolean
  routeFailed: boolean
  metrics: ReturnType<typeof computeWalkGuideMetrics> | null
  routeSummary: WalkRouteSummary | null
  routeSteps: WalkingRouteStep[]
}

function straightLineMetrics(
  user: MapCoordinate,
  destination: { lat: number; lng: number },
  deviceHeading: number | null,
): ReturnType<typeof computeWalkGuideMetrics> {
  const distanceM = liveGuideDistanceM(user, destination)
  const bearing = bearingDegrees(user, destination)
  return {
    distanceM,
    arrowRotationDeg: arrowRotationDegrees(bearing, deviceHeading),
    instruction: distanceM < 30 ? 'You are almost there' : 'Head toward the pin',
    maneuverModifier: null,
    maneuverType: 'depart',
    durationRemainingSec: Math.round(distanceM / 1.4),
    lineFeature: guideLineFeature(user, destination),
    isWalkingRoute: false,
    routeCoordinates: [user, [destination.lng, destination.lat]],
  }
}

export function useWalkingGuide(
  mapGuide: MapGuideTarget | null,
  userCoord: MapCoordinate | null,
  deviceHeading: number | null,
  mapboxToken: string,
): UseWalkingGuideResult {
  const [route, setRoute] = useState<Awaited<ReturnType<typeof fetchWalkingRoute>>>(null)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [routeFailed, setRouteFailed] = useState(false)

  const sightingId = mapGuide?.sighting.id ?? null
  const destLat = mapGuide?.sighting.lat
  const destLng = mapGuide?.sighting.lng

  useEffect(() => {
    if (!mapGuide || userCoord === null || !mapboxToken.trim()) {
      setRoute(null)
      setRouteFailed(false)
      setIsRouteLoading(false)
      return
    }

    let cancelled = false
    setIsRouteLoading(true)
    setRouteFailed(false)
    setRoute(null)

    void fetchWalkingRoute(userCoord, { lat: destLat!, lng: destLng! }, mapboxToken).then(
      (result) => {
        if (cancelled) return
        if (result) {
          setRoute(result)
          setRouteFailed(false)
        } else {
          setRoute(null)
          setRouteFailed(true)
        }
        setIsRouteLoading(false)
      },
    )

    return () => {
      cancelled = true
    }
  }, [destLat, destLng, mapboxToken, sightingId, userCoord, mapGuide])

  const metrics = useMemo(() => {
    if (!mapGuide || userCoord === null) return null

    const dest = mapGuide.sighting
    if (route) {
      return computeWalkGuideMetrics(userCoord, route, deviceHeading)
    }

    if (isRouteLoading) return null

    return straightLineMetrics(userCoord, dest, deviceHeading)
  }, [deviceHeading, isRouteLoading, mapGuide, route, userCoord])

  const routeSummary = useMemo((): WalkRouteSummary | null => {
    if (!mapGuide || userCoord === null) return null
    if (route) {
      return {
        distanceM: route.totalDistanceM,
        durationSec: route.totalDurationSec,
        isWalkingRoute: true,
      }
    }
    const distanceM = liveGuideDistanceM(userCoord, mapGuide.sighting)
    const walkSpeedMps = 1.4
    return {
      distanceM,
      durationSec: Math.max(60, distanceM / walkSpeedMps),
      isWalkingRoute: false,
    }
  }, [mapGuide, route, userCoord])

  const routeSteps = route?.steps ?? []

  return { isRouteLoading, routeFailed, metrics, routeSummary, routeSteps }
}
