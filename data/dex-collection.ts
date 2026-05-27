import type { DexCardSpecies } from '@/components/DexCard'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { getDexNumberForSpeciesId } from '@/features/species/dex-number-registry'
import { AVATAR_SHUFFLE_CATALOG } from '@/features/settings/avatar-shuffle-catalog'

export const DEX_COLLECTION_SIZE = AVATAR_SHUFFLE_CATALOG.length

export interface DexCollectionEntry extends DexCardSpecies {
  spottedAt: string
}

const KINGDOM_BY_ID: Record<string, KingdomKey> = {
  fox: 'mammal',
  gecko: 'reptile',
  owl: 'bird',
  'dog-labrador': 'mammal',
  'dog-golden': 'mammal',
  'dog-beagle': 'mammal',
  'dog-french-bulldog': 'mammal',
  'dog-husky': 'mammal',
  'cat-tabby': 'mammal',
  'cat-maine-coon': 'mammal',
  rabbit: 'mammal',
  horse: 'mammal',
  cow: 'mammal',
  sheep: 'mammal',
  pig: 'mammal',
  goat: 'mammal',
  chicken: 'bird',
  duck: 'bird',
  parrot: 'bird',
  hamster: 'mammal',
  goldfish: 'fish',
  monarch: 'insect',
  bumblebee: 'insect',
  deer: 'mammal',
  squirrel: 'mammal',
  turtle: 'reptile',
  dolphin: 'mammal',
  penguin: 'bird',
}

const GRADIENT_BY_KINGDOM: Record<KingdomKey, readonly [string, string]> = {
  mammal: ['#FFB088', '#FF6B5B'],
  bird: ['#FF8A80', '#E04A39'],
  reptile: ['#A4DE3A', '#0E8F65'],
  amphibian: ['#98E2C6', '#3DCCA8'],
  fish: ['#B388FF', '#7C3AED'],
  insect: ['#FFC93C', '#E8A020'],
  arachnid: ['#C4B5FD', '#4338CA'],
  mollusc: ['#FCE7C7', '#B45309'],
  plant:  ['#A4DE3A', '#65A30D'],
  tree:   ['#52B788', '#2D6A4F'],
  flower: ['#F9A8D4', '#E879A0'],
}

function formatSpottedLabel(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return `${daysAgo}d ago`
  const weeks = Math.floor(daysAgo / 7)
  return weeks === 1 ? '1w ago' : `${weeks}w ago`
}

function buildDexCollection(): DexCollectionEntry[] {
  const baseMs = Date.parse('2026-05-20T12:00:00.000Z')
  const dayMs = 86_400_000

  return AVATAR_SHUFFLE_CATALOG.map((entry, index) => {
    const kingdom = KINGDOM_BY_ID[entry.id] ?? 'mammal'
    const daysAgo = index
    const spottedAt = new Date(baseMs - daysAgo * dayMs).toISOString()
    const number = getDexNumberForSpeciesId(entry.id) ?? '#???'

    return {
      id: entry.id,
      number,
      name: entry.label,
      date: formatSpottedLabel(daysAgo),
      kingdom,
      gradient: GRADIENT_BY_KINGDOM[kingdom],
      spottedAt,
      ...(index === 0 ? { cornerBadge: 'NEW' as const, showFootprint: true } : {}),
      ...(entry.id === 'monarch' ? { cornerBadge: 'RARE' as const } : {}),
    }
  })
}

const MOCK_DEX_COLLECTION = buildDexCollection()

/** All collected species, newest spotted first (top → bottom in grid). */
export function getDexCollectionSorted(): DexCollectionEntry[] {
  return [...MOCK_DEX_COLLECTION].sort(
    (a, b) => new Date(b.spottedAt).getTime() - new Date(a.spottedAt).getTime(),
  )
}

export function getDexCollectionByKingdom(kingdom: KingdomKey): DexCollectionEntry[] {
  return getDexCollectionSorted().filter((entry) => entry.kingdom === kingdom)
}
