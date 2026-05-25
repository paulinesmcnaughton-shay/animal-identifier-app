import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchNearbyMapSightings } from '@/features/map/fetch-nearby-map'
import { haversineDistanceM } from '@/features/map/geo'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { NEARBY_RELOAD_MOVE_M } from '@/features/map/nearby-radius'
import type { MapCoordinate } from '@/features/map/use-user-location'

interface NearbyMapState {
  items: NearbyMapSighting[]
  isLoading: boolean
  error: string | null
}

function coordToPoint(coord: MapCoordinate): { lat: number; lng: number } {
  const [lng, lat] = coord
  return { lat, lng }
}

export function useNearbyCommunitySightings(
  userCoord: MapCoordinate | null,
  enabled: boolean,
) {
  const [state, setState] = useState<NearbyMapState>({
    items: [],
    isLoading: false,
    error: null,
  })
  const lastFetchCoordRef = useRef<MapCoordinate | null>(null)
  const fetchGenerationRef = useRef(0)
  const hasNonEmptyResultsRef = useRef(false)

  const reload = useCallback(
    async (force = false) => {
      if (!enabled || userCoord === null) {
        lastFetchCoordRef.current = null
        setState({ items: [], isLoading: false, error: null })
        return
      }

      if (!force && lastFetchCoordRef.current !== null) {
        const movedM = haversineDistanceM(
          lastFetchCoordRef.current,
          coordToPoint(userCoord),
        )
        if (movedM < NEARBY_RELOAD_MOVE_M) return
      }

      const generation = ++fetchGenerationRef.current
      lastFetchCoordRef.current = userCoord

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const items = await fetchNearbyMapSightings(userCoord)
        if (generation !== fetchGenerationRef.current) return
        hasNonEmptyResultsRef.current = items.length > 0
        setState({ items, isLoading: false, error: null })
      } catch {
        if (generation !== fetchGenerationRef.current) return
        hasNonEmptyResultsRef.current = false
        setState({
          items: [],
          isLoading: false,
          error: 'Could not load nearby species.',
        })
      }
    },
    [enabled, userCoord],
  )

  useEffect(() => {
    void reload(false)
  }, [reload])

  useFocusEffect(
    useCallback(() => {
      if (!enabled || userCoord === null) return
      lastFetchCoordRef.current = null
      void reload(true)
    }, [enabled, reload, userCoord]),
  )

  return { ...state, reload: () => reload(true) }
}
