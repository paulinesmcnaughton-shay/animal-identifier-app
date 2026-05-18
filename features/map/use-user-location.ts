import * as Location from 'expo-location'
import { useEffect, useState } from 'react'

/** Mapbox order: [longitude, latitude] */
export type MapCoordinate = [number, number]

const LONDON_FALLBACK: MapCoordinate = [-0.09, 51.505]

interface UserLocationState {
  coordinate: MapCoordinate
  isLive: boolean
  isLoading: boolean
}

function toMapCoordinate(location: Location.LocationObject): MapCoordinate {
  return [location.coords.longitude, location.coords.latitude]
}

export function useUserLocation(): UserLocationState {
  const [coordinate, setCoordinate] = useState<MapCoordinate>(LONDON_FALLBACK)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null
    let cancelled = false

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted' || cancelled) {
        setIsLoading(false)
        return
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (!cancelled) {
          setCoordinate(toMapCoordinate(current))
          setIsLive(true)
        }
      } catch {
        // Keep London fallback for simulator / denied precise fix
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 4000,
        },
        (location) => {
          if (cancelled) return
          setCoordinate(toMapCoordinate(location))
          setIsLive(true)
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

  return { coordinate, isLive, isLoading }
}

export const MAP_DEMO_ANCHOR = { lat: 51.505, lng: -0.09 }

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
