import type { DexCardSpecies } from '@/components/DexCard'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import type { SpeciesDto } from '@/data/schemas'
import { getDexNumberForSpeciesId } from '@/features/species/dex-number-registry'

export const RECENT_FINDS_LIMIT = 10
/** @deprecated Use RECENT_FINDS_LIMIT */
export const HOME_RECENT_FINDS_LIMIT = RECENT_FINDS_LIMIT

export interface RecentFindItem {
  id: string
  number: string
  name: string
  date: string
  kingdom: KingdomKey
  gradient: readonly [string, string]
  /** ISO timestamp — used to sort newest first. */
  spottedAt: string
}

export const mockSpecies: SpeciesDto[] = [
  { id: '1', commonName: 'Red Fox', scientificName: 'Vulpes vulpes' },
  { id: '2', commonName: 'Robin', scientificName: 'Erithacus rubecula' },
]

/** Gamification stats only — for display name / username use `@/features/settings/account-profile`. */
export const mockUser = {
  level: 14,
  streakDays: 12,
  /** Total species captured — drives bronze / silver / gold header badge */
  spotsCaptured: 47,
}

export const mockWeeklyQuest = {
  title: 'Spot 3 insects this week',
  daysLeft: 4,
  current: 2,
  total: 3,
  xpReward: 50,
  progressEmoji: ['🪲', '🐝'],
}

function dexNum(id: string): string {
  return getDexNumberForSpeciesId(id) ?? '#???'
}

export const mockCreatureOfDay = {
  id: 'gecko',
  commonName: 'Crested Gecko',
  scientificName: 'Correlophus ciliatus',
  kingdom: 'Reptile',
  dexNumber: dexNum('gecko'),
  description: 'Look up — they cling to leaves and branches with sticky toe pads. Active at dusk in warm, humid spots.',
  bonusXp: 20,
  gradient: ['#A4DE3A', '#1a3d2b'] as const,
  heroImage: require('@/assets/images/crested_gecko_faq.webp'),
}

export interface HomeNotification {
  id: string
  title: string
  message: string
  timeAgo: string
  icon: 'sparkles' | 'ribbon' | 'trophy' | 'leaf' | 'flame'
  iconBg: string
}

export const mockHomeNotifications: HomeNotification[] = [
  {
    id: 'n1',
    title: 'New species spotted!',
    message: 'Monarch added to your Wild Dex · +25 XP',
    timeAgo: '2m ago',
    icon: 'sparkles',
    iconBg: '#1a3d2b',
  },
  {
    id: 'n2',
    title: 'Kingdom unlocked',
    message: 'First mammal logged — Mammal badge earned',
    timeAgo: '1h ago',
    icon: 'ribbon',
    iconBg: '#A855F7',
  },
  {
    id: 'n3',
    title: 'Weekly quest update',
    message: '1 more insect to finish · +50 XP waiting',
    timeAgo: 'Today',
    icon: 'trophy',
    iconBg: '#FFC93C',
  },
]

/** Full recent-finds list (newest first when read via getHomeRecentFinds). */
export const mockRecentFinds: RecentFindItem[] = [
  { id: 'gecko', number: dexNum('gecko'), name: 'Crested Gecko', date: '1w ago', kingdom: 'reptile', gradient: ['#A4DE3A', '#6BAE1A'], spottedAt: '2026-05-13T14:00:00.000Z' },
  { id: 'frog', number: dexNum('frog'), name: 'Treefrog', date: '3d ago', kingdom: 'amphibian', gradient: ['#52b788', '#1a3d2b'], spottedAt: '2026-05-17T09:30:00.000Z' },
  { id: 'cardinal', number: dexNum('cardinal'), name: 'Cardinal', date: '2d ago', kingdom: 'bird', gradient: ['#FF6B5B', '#A83232'], spottedAt: '2026-05-18T16:45:00.000Z' },
  { id: 'monarch', number: dexNum('monarch'), name: 'Monarch', date: 'Yesterday', kingdom: 'insect', gradient: ['#FFC93C', '#E8A020'], spottedAt: '2026-05-19T11:20:00.000Z' },
  { id: 'fox', number: dexNum('fox'), name: 'Red Fox', date: 'Today', kingdom: 'mammal', gradient: ['#FF6B5B', '#E04A39'], spottedAt: '2026-05-20T08:15:00.000Z' },
  { id: 'owl', number: dexNum('owl'), name: 'Barn Owl', date: 'Today', kingdom: 'bird', gradient: ['#D4C4F5', '#9B7ED9'], spottedAt: '2026-05-20T07:00:00.000Z' },
  { id: 'bumblebee', number: dexNum('bumblebee'), name: 'Bumblebee', date: 'Today', kingdom: 'insect', gradient: ['#FFC93C', '#7C3AED'], spottedAt: '2026-05-20T06:30:00.000Z' },
  { id: 'turtle', number: dexNum('turtle'), name: 'Box Turtle', date: 'Yesterday', kingdom: 'reptile', gradient: ['#52b788', '#0E8F65'], spottedAt: '2026-05-19T18:00:00.000Z' },
  { id: 'deer', number: dexNum('deer'), name: 'White-tailed Deer', date: '2d ago', kingdom: 'mammal', gradient: ['#C28A52', '#92633A'], spottedAt: '2026-05-18T12:00:00.000Z' },
  { id: 'snail', number: dexNum('snail'), name: 'Garden Snail', date: '3d ago', kingdom: 'mollusc', gradient: ['#FCE7C7', '#B45309'], spottedAt: '2026-05-17T20:00:00.000Z' },
  { id: 'spider', number: dexNum('spider'), name: 'Orb Weaver', date: '4d ago', kingdom: 'arachnid', gradient: ['#E0E1F8', '#4338CA'], spottedAt: '2026-05-16T10:00:00.000Z' },
]

export function recentFindsNewestFirst(items: RecentFindItem[]): RecentFindItem[] {
  return [...items].sort(
    (a, b) => new Date(b.spottedAt).getTime() - new Date(a.spottedAt).getTime(),
  )
}

/** Newest-first recent finds (Spot home + Profile). */
export function getRecentFinds(): RecentFindItem[] {
  return recentFindsNewestFirst(mockRecentFinds).slice(0, RECENT_FINDS_LIMIT)
}

/** @deprecated Use getRecentFinds */
export function getHomeRecentFinds(): RecentFindItem[] {
  return getRecentFinds()
}

export function recentFindToDexCard(item: RecentFindItem): DexCardSpecies {
  return {
    id: item.id,
    number: item.number,
    name: item.name,
    date: item.date,
    kingdom: item.kingdom,
    gradient: item.gradient,
  }
}

export function getRecentFindDexCards(): DexCardSpecies[] {
  return getRecentFinds().map(recentFindToDexCard)
}
