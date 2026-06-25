import { useMemo } from 'react'

import type { BadgeStats } from '@/features/achievements/badge-earned'
import { useAccountProfile } from '@/features/settings/account-profile'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'

/** Real badge progress: profile counters + per-kingdom distinct-species counts. */
export function useBadgeStats(): BadgeStats {
  const { spotsCaptured, streakDays } = useAccountProfile()
  const { dexEntries } = useUserSightingsData()

  return useMemo(() => {
    const kingdomCounts: Record<string, number> = {}
    for (const entry of dexEntries) {
      kingdomCounts[entry.kingdom] = (kingdomCounts[entry.kingdom] ?? 0) + 1
    }
    return { spotsCaptured, streakDays, kingdomCounts, distinctSpecies: dexEntries.length }
  }, [spotsCaptured, streakDays, dexEntries])
}
