import { useEffect, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'

export interface SpeciesSighting {
  id: string
  photoUri: string | null
  spottedAt: string
  latitude: number | null
  longitude: number | null
}

export function useSpeciesUserSightings(speciesId: string): SpeciesSighting[] {
  const [sightings, setSightings] = useState<SpeciesSighting[]>([])

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
        .select('id, photo_uri, spotted_at, latitude, longitude')
        .eq('user_id', userId)
        .eq('species_id', speciesId)
        .order('spotted_at', { ascending: false })
        .limit(20)

      setSightings(
        (data ?? []).map((r) => ({
          id: r.id as string,
          photoUri: (r.photo_uri as string | null) ?? null,
          spottedAt: r.spotted_at as string,
          latitude: (r.latitude as number | null) ?? null,
          longitude: (r.longitude as number | null) ?? null,
        })),
      )
    })()
  }, [speciesId])

  return sightings
}
