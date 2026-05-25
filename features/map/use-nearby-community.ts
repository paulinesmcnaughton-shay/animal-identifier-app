import { useCallback, useEffect, useState } from 'react'

import { fetchNearbyCommunitySightings } from '@/features/map/fetch-nearby-community'
import type { CommunityNearbySighting } from '@/features/map/map-sighting'
import type { MapCoordinate } from '@/features/map/use-user-location'

interface NearbyCommunityState {
  items: CommunityNearbySighting[]
  isLoading: boolean
  error: string | null
}

export function useNearbyCommunitySightings(userCoord: MapCoordinate, enabled: boolean) {
  const [state, setState] = useState<NearbyCommunityState>({
    items: [],
    isLoading: false,
    error: null,
  })

  const reload = useCallback(async () => {
    if (!enabled) {
      setState({ items: [], isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const items = await fetchNearbyCommunitySightings(userCoord)
      setState({ items, isLoading: false, error: null })
    } catch {
      setState({
        items: [],
        isLoading: false,
        error: 'Could not load nearby spots.',
      })
    }
  }, [enabled, userCoord])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload }
}
