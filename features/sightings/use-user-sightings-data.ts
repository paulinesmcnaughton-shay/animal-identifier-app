import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DexCardSpecies } from '@/components/DexCard'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { userSightingToNearbyMapPin } from '@/features/map/map-sighting-adapters'
import { useUserLocation } from '@/features/map/use-user-location'
import {
  buildDexEntriesFromSightings,
  fetchUserSightings,
  type UserSightingRow,
} from '@/features/sightings/fetch-user-sightings'
import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import { subscribeSightingsChanged } from '@/features/sightings/sightings-events'
import { useAuth } from '@/lib/auth/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase/config'

interface UserSightingsDataState {
  mapPins: NearbyMapSighting[]
  dexEntries: DexCardSpecies[]
  recentCards: DexCardSpecies[]
  isLoading: boolean
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
    console.log('Nearby Sightings raw count:', fetched?.length ?? 0)
    setRows(fetched ?? [])
    setIsLoading(false)
  }, [isAuthenticated])

  // Re-run on map focus and when account profile changes (e.g. new sighting saved)
  useFocusEffect(
    useCallback(() => {
      void reload()
      const unsubscribe = subscribeAccountProfile(() => {
        void reload()
      })
      return unsubscribe
    }, [reload]),
  )

  // Global subscription — stays active regardless of which tab is focused.
  // This ensures a Dex delete (fired from another tab) immediately clears the map pins.
  useEffect(() => subscribeSightingsChanged(() => {
    console.log('REFRESH FIRED — Nearby Sightings reloading')
    void reload()
  }), [reload])

  const mapPins = useMemo(
    () => {
      // Log is_deleted status for each row during debugging
      if (__DEV__) {
        rows.forEach((r) => {
          if (r.is_deleted || r.deleted_at) {
            console.log('Nearby Sightings: deleted row in cache', r.id, {
              is_deleted: r.is_deleted,
              deleted_at: r.deleted_at,
            })
          }
        })
      }

      const pins = rows
        .map((row) => userSightingToNearbyMapPin(row, userCoord))
        .filter((item): item is NearbyMapSighting => item !== null)

      const removedIds = rows
        .filter((r) => r.is_deleted || r.deleted_at)
        .map((r) => r.id)
      if (removedIds.length > 0) {
        console.log('Nearby Sightings: removed/deleted sighting ids', removedIds)
      }

      console.log('Nearby Sightings filtered count:', pins.length)
      return pins
    },
    [rows, userCoord],
  )

  const dexEntries = useMemo(() => buildDexEntriesFromSightings(rows), [rows])

  return {
    mapPins,
    dexEntries,
    recentCards: dexEntries.slice(0, 8),
    isLoading,
  }
}
