import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { storage } from '@/util/storage'

/** Mapbox order: [longitude, latitude] */
export type MapCoordinate = [number, number]

const LAST_LOCATION_KEY = 'map.lastKnownCoordinate'

/** Demo seed anchor (Hyde Park) — only for shifting mock pins, never the user dot. */
export const MAP_DEMO_ANCHOR = { lat: 51.505, lng: -0.09 }

interface CachedCoordinate {
  lng: number
  lat: number
}

interface UserLocationState {
  /** Best-known position: live GPS, else last cached fix from a prior session. */
  coordinate: MapCoordinate | null
  /** Fresh GPS fix received this session (not cache-only). */
  isLive: boolean
  isLoading: boolean
  permissionDenied: boolean
  /** Request a fresh GPS reading (e.g. when the map tab opens). */
  refreshLocation: () => Promise<void>
}

function toMapCoordinate(location: Location.LocationObject): MapCoordinate {
  return [location.coords.longitude, location.coords.latitude]
}

function isValidCoordinate(coord: MapCoordinate): boolean {
  const [lng, lat] = coord
  return (
    Number.isFinite(lng)
    && Number.isFinite(lat)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180
  )
}

async function readCachedCoordinate(): Promise<MapCoordinate | null> {
  const raw = await storage.getString(LAST_LOCATION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as CachedCoordinate
    const coord: MapCoordinate = [parsed.lng, parsed.lat]
    return isValidCoordinate(coord) ? coord : null
  } catch {
    return null
  }
}

async function writeCachedCoordinate(coord: MapCoordinate): Promise<void> {
  const [lng, lat] = coord
  await storage.set(LAST_LOCATION_KEY, JSON.stringify({ lng, lat }))
}

async function resolveForegroundPosition(): Promise<MapCoordinate | null> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 300_000,
    requiredAccuracy: 200,
  })
  if (lastKnown) {
    const coord = toMapCoordinate(lastKnown)
    if (isValidCoordinate(coord)) return coord
  }

  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
    const coord = toMapCoordinate(current)
    return isValidCoordinate(coord) ? coord : null
  } catch {
    return null
  }
}

function applyCoordinate(
  coord: MapCoordinate,
  setCoordinate: (c: MapCoordinate) => void,
  setIsLive: (live: boolean) => void,
): void {
  setCoordinate(coord)
  setIsLive(true)
  void writeCachedCoordinate(coord)
}

export function useUserLocation(): UserLocationState {
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const permissionGrantedRef = useRef(false)

  const refreshLocation = useCallback(async () => {
    if (!permissionGrantedRef.current) return

    const fresh = await resolveForegroundPosition()
    if (fresh) {
      applyCoordinate(fresh, setCoordinate, setIsLive)
    }
  }, [])

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null
    let cancelled = false

    void (async () => {
      const cached = await readCachedCoordinate()
      if (!cancelled && cached) {
        setCoordinate(cached)
      }

      const servicesOn = await Location.hasServicesEnabledAsync()
      if (!servicesOn) {
        if (!cancelled) {
          setPermissionDenied(true)
          setIsLoading(false)
        }
        return
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (!cancelled) {
          setPermissionDenied(true)
          setIsLoading(false)
        }
        return
      }

      permissionGrantedRef.current = true
      if (!cancelled) setPermissionDenied(false)

      const initial = await resolveForegroundPosition()
      if (!cancelled && initial) {
        applyCoordinate(initial, setCoordinate, setIsLive)
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
          timeInterval: 5000,
        },
        (location) => {
          if (cancelled) return
          const coord = toMapCoordinate(location)
          if (!isValidCoordinate(coord)) return
          applyCoordinate(coord, setCoordinate, setIsLive)
          setIsLoading(false)
        },
      )

      if (!cancelled) setIsLoading(false)
    })()

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void refreshLocation()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState)
    return () => subscription.remove()
  }, [refreshLocation])

  return { coordinate, isLive, isLoading, permissionDenied, refreshLocation }
}

export function shiftSightingsNearUser<T extends { lat: number; lng: number }>(
  items: T[],
  user: MapCoordinate,
): T[] {
  const [lng, lat] = user
  const dLat = lat - MAP_DEMO_ANCHOR.lat
  const dLng = lng - MAP_DEMO_ANCHOR.lng
  return items.map((item) => ({
    ...item,
    lat: item.lat + dLat,
    lng: item.lng + dLng,
  }))
}
