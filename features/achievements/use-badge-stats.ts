import { useMemo } from 'react'

import type { BadgeStats } from '@/features/achievements/badge-earned'
import { useCollectionLookup } from '@/features/collections/collections'
import { useAccountProfile } from '@/features/settings/account-profile'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'

/** Real badge progress, computed from the user's sightings + collection tags. */
export function useBadgeStats(): BadgeStats {
  const { spotsCaptured, streakDays } = useAccountProfile()
  const { rows } = useUserSightingsData()
  const lookup = useCollectionLookup()

  return useMemo(() => {
    const kingdomCounts: Record<string, number> = {}
    const seen = new Set<string>()
    const domestic = new Set<string>()
    const wild = new Set<string>()
    const farm = new Set<string>()
    const speciesNames: string[] = []
    const habitats = new Set<string>()
    let photoCount = 0
    let hasEarlyBird = false
    let hasMorning = false
    let hasNight = false
    let hasWeekend = false
    let hasAutumn = false

    for (const r of rows) {
      for (const h of r.habitats ?? []) habitats.add(h)

      // Time/season flags use every sighting (device-local interpretation of UTC).
      const at = new Date(r.spotted_at)
      const hour = at.getHours()
      const day = at.getDay()
      const month = at.getMonth()
      if (hour >= 4 && hour < 8) hasEarlyBird = true
      if (hour >= 5 && hour < 11) hasMorning = true
      if (hour >= 20 || hour < 5) hasNight = true
      if (day === 0 || day === 6) hasWeekend = true
      if (month >= 8 && month <= 10) hasAutumn = true
      if (r.photo_uri) photoCount += 1

      // Per-species counts are distinct.
      const key = r.species_id || r.species_name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      const kingdom = (r.kingdom || '').toLowerCase()
      kingdomCounts[kingdom] = (kingdomCounts[kingdom] ?? 0) + 1

      speciesNames.push(r.species_name.toLowerCase())
      if (r.latin_name) speciesNames.push(r.latin_name.toLowerCase())

      const collections = lookup({ commonName: r.species_name, scientificName: r.latin_name })
      const isDomestic = r.is_domestic || collections.includes('domestic')
      if (isDomestic) domestic.add(key)
      else wild.add(key)
      if (collections.includes('farm')) farm.add(key)
    }

    return {
      spotsCaptured,
      streakDays,
      kingdomCounts,
      distinctSpecies: seen.size,
      domesticCount: domestic.size,
      wildCount: wild.size,
      farmCount: farm.size,
      speciesNames,
      photoCount,
      hasEarlyBird,
      hasMorning,
      hasNight,
      hasWeekend,
      hasAutumn,
      habitats,
    }
  }, [spotsCaptured, streakDays, rows, lookup])
}
