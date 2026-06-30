import { useEffect, useState } from 'react'

import { getSupabaseClient } from '@/lib/supabase/client'

// The total number of species in the searchable catalog — the "universe" the
// collection progress bar counts toward. Fetched once and cached for the session.
let cached: number | null = null

export function useCatalogCount(): number | null {
  const [count, setCount] = useState<number | null>(cached)

  useEffect(() => {
    if (cached !== null) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    let cancelled = false
    supabase
      .from('species')
      .select('id', { count: 'exact', head: true })
      .then(({ count: c }) => {
        if (cancelled || c == null) return
        cached = c
        setCount(c)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return count
}
