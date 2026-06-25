import type { Badge } from '@/data/badges'

export interface BadgeStats {
  spotsCaptured: number
  streakDays: number
  /** Distinct collected species per kingdom key (mammal, bird, tree, …). */
  kingdomCounts: Record<string, number>
  /** Total distinct species in the Wild Dex. */
  distinctSpecies: number
}

// Badge label (singular or plural) → kingdom key used on sightings.
const KINGDOM_BY_LABEL: Record<string, string> = {
  Mammal: 'mammal',
  Mammals: 'mammal',
  Bird: 'bird',
  Birds: 'bird',
  Fish: 'fish',
  Reptile: 'reptile',
  Reptiles: 'reptile',
  Amphibian: 'amphibian',
  Amphibians: 'amphibian',
  Insect: 'insect',
  Insects: 'insect',
  Arachnid: 'arachnid',
  Plant: 'plant',
  Plants: 'plant',
  Tree: 'tree',
  Trees: 'tree',
  Flower: 'flower',
  Flowers: 'flower',
}

// Distinct-species thresholds for the collection-tier badges. Tunable.
const COLLECTION_TIERS: Record<string, number> = {
  'Starter Collection': 5,
  'Growing Collection': 15,
  'Big Collection': 30,
  'Family Collection': 50,
  'Nature Collection': 100,
  'Dex Builder': 150,
}

/**
 * Whether a badge is earned from real progress. Covered today: total sightings,
 * day streaks, per-kingdom counts ("100 Birds"), first-of-kingdom ("First Mammal"),
 * and collection tiers. Habitat firsts, species sub-types (First Pine), care/explorer,
 * and category badges (Farm/Marine/Nocturnal) stay locked until their rules are added.
 */
export function isBadgeEarned(name: string, stats: BadgeStats): boolean {
  const sightings = /^(\d+) Sightings$/.exec(name)
  if (sightings) return stats.spotsCaptured >= Number(sightings[1])
  if (name === 'First Sighting') return stats.spotsCaptured >= 1

  const streak = /^(\d+) Day Streak$/.exec(name)
  if (streak) return stats.streakDays >= Number(streak[1])

  const kingdomCount =
    /^(\d+) (Mammals|Birds|Fish|Reptiles|Amphibians|Insects|Plants|Trees|Flowers)$/.exec(name)
  if (kingdomCount) {
    const key = KINGDOM_BY_LABEL[kingdomCount[2]]
    return (stats.kingdomCounts[key] ?? 0) >= Number(kingdomCount[1])
  }

  const firstOfKingdom =
    /^First (Mammal|Bird|Fish|Reptile|Amphibian|Insect|Arachnid|Plant|Tree|Flower)$/.exec(name)
  if (firstOfKingdom) {
    const key = KINGDOM_BY_LABEL[firstOfKingdom[1]]
    return (stats.kingdomCounts[key] ?? 0) >= 1
  }

  const tier = COLLECTION_TIERS[name]
  if (tier !== undefined) return stats.distinctSpecies >= tier

  return false
}

export function earnedBadgeIds(badges: Badge[], stats: BadgeStats): Set<string> {
  const earned = new Set<string>()
  for (const b of badges) if (isBadgeEarned(b.name, stats)) earned.add(b.id)
  return earned
}
