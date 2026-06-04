import { useEffect, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'
import { subscribeSightingsChanged } from './sightings-events'

export interface SpeciesSighting {
  id: string
  photoUri: string | null
  spottedAt: string
  latitude: number | null
  longitude: number | null
  notes: string | null
  journalEntry: string | null
  userCaption: string | null
  isFavorite: boolean
}

export function useSpeciesUserSightings(speciesId: string): SpeciesSighting[] {
  const [sightings, setSightings] = useState<SpeciesSighting[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => subscribeSightingsChanged(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    if (!speciesId) return
    const supabase = getSupabaseClient()
    if (!supabase) return

    void (async () => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('user_sightings')
        .select('id, photo_uri, spotted_at, latitude, longitude, notes, journal_entry, user_caption, is_favorite')
        .eq('user_id', userId)
        .eq('species_id', speciesId)
        .eq('is_deleted', false)
        .order('spotted_at', { ascending: false })
        .limit(20)

      setSightings(
        (data ?? []).map((r) => ({
          id: r.id as string,
          photoUri: (r.photo_uri as string | null) ?? null,
          spottedAt: r.spotted_at as string,
          latitude: (r.latitude as number | null) ?? null,
          longitude: (r.longitude as number | null) ?? null,
          notes: (r.notes as string | null) ?? null,
          journalEntry: (r.journal_entry as string | null) ?? null,
          userCaption: (r.user_caption as string | null) ?? null,
          isFavorite: (r.is_favorite as boolean) ?? false,
        })),
      )
    })()
  }, [speciesId, refreshKey])

  return sightings
}
