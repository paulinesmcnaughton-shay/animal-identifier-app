import { useEffect, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'

export function useSpeciesUserPhotos(speciesId: string): string[] {
  const [photos, setPhotos] = useState<string[]>([])

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
        .select('photo_uri')
        .eq('user_id', userId)
        .eq('species_id', speciesId)
        .not('photo_uri', 'is', null)
        .order('spotted_at', { ascending: false })
        .limit(10)

      const uris = (data ?? [])
        .map((r: { photo_uri: string | null }) => r.photo_uri)
        .filter((u): u is string => !!u)

      setPhotos(uris)
    })()
  }, [speciesId])

  return photos
}
