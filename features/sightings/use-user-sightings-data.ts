import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import type { DexCardSpecies } from '@/components/DexCard'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { userSightingToNearbyMapPin } from '@/features/map/map-sighting-adapters'
import { filterWithinNearbyRadius } from '@/features/map/nearby-radius'
import { useUserLocation } from '@/features/map/use-user-location'
import {
  buildDexEntriesFromSightings,
  fetchUserSightings,
  type UserSightingRow,
} from '@/features/sightings/fetch-user-sightings'
import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import { useAuth } from '@/lib/auth/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/config'

interface UserSightingsDataState {
  mapPins: NearbyMapSighting[]
  dexEntries: DexCardSpecies[]
  recentCards: DexCardSpecies[]
  isLoading: boolean
}

const EMPTY: UserSightingsDataState = {
  mapPins: [],
  dexEntries: [],
  recentCards: [],
  isLoading: false,
}

export function useUserSightingsData(): UserSightingsDataState {
  const { isAuthenticated } = useAuth()
  const { coordinate: userCoord } = useUserLocation()
  const [rows, setRows] = useState<UserSightingRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured()) {
      setRows([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const fetched = await fetchUserSightings()
    setRows(fetched ?? [])
    setIsLoading(false)
  }, [isAuthenticated])

  const mapPins = useMemo(() => {
    if (userCoord === null) return []
    return filterWithinNearbyRadius(
      rows
        .map((row) => userSightingToNearbyMapPin(row, userCoord))
        .filter((item): item is NearbyMapSighting => item !== null),
    )
  }, [rows, userCoord])

  const dexEntries = useMemo(() => buildDexEntriesFromSightings(rows), [rows])

  useFocusEffect(
    useCallback(() => {
      void reload()
      const unsubscribe = subscribeAccountProfile(() => {
        void reload()
      })
      return unsubscribe
    }, [reload]),
  )

  return {
    mapPins,
    dexEntries,
    recentCards: dexEntries.slice(0, 8),
    isLoading,
  }
}
