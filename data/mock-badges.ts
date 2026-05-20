import type { CollectorTier } from '@/lib/collector-tier'

export type BadgeTier = CollectorTier | 'platinum'

export type BadgeFilterKey = 'all' | BadgeTier | 'in_progress'

export interface AchievementBadge {
  id: string
  name: string
  tier: BadgeTier
  symbol: string
  earnedDate?: string
  progressPercent?: number
}

export const mockBadgeStats = {
  earned: 23,
  remaining: 47,
}

export const mockLatestUnlock = {
  name: 'Hot Streak',
  detail: '7-day spotting streak · Apr 3',
  tier: 'gold' as const,
  symbol: 'flame' as const,
}

export const mockAchievementBadges: AchievementBadge[] = [
  { id: 'first-spot', name: 'First Spot', tier: 'bronze', symbol: 'star', earnedDate: 'Mar 12' },
  { id: 'bug-hunter', name: 'Bug Hunter', tier: 'silver', symbol: 'bug', earnedDate: 'Mar 18' },
  { id: 'birder', name: 'Birder', tier: 'gold', symbol: 'leaf', earnedDate: 'Apr 1' },
  { id: 'night-owl', name: 'Night Owl', tier: 'gold', symbol: 'moon', earnedDate: 'Apr 3' },
  { id: 'forest-friend', name: 'Forest Friend', tier: 'silver', symbol: 'leaf', earnedDate: 'Apr 5' },
  { id: 'backyard-hero', name: 'Backyard Hero', tier: 'bronze', symbol: 'home', progressPercent: 60 },
  { id: 'explorer', name: 'Explorer', tier: 'silver', symbol: 'compass', progressPercent: 40 },
  { id: 'winter-spotter', name: 'Winter Spotter', tier: 'bronze', symbol: 'snow', progressPercent: 25 },
  { id: 'road-tripper', name: 'Road Tripper', tier: 'gold', symbol: 'map', progressPercent: 10 },
  { id: 'rare-find', name: 'Rare Find', tier: 'platinum', symbol: 'diamond', earnedDate: 'Feb 28' },
  { id: 'early-bird', name: 'Early Bird', tier: 'bronze', symbol: 'sunny', earnedDate: 'Jan 14' },
  { id: 'pond-watcher', name: 'Pond Watcher', tier: 'silver', symbol: 'water', progressPercent: 80 },
]

export function filterAchievementBadges(
  badges: AchievementBadge[],
  filter: BadgeFilterKey,
): AchievementBadge[] {
  if (filter === 'all') return badges
  if (filter === 'in_progress') {
    return badges.filter((b) => b.progressPercent !== undefined && b.progressPercent < 100)
  }
  return badges.filter((b) => b.tier === filter)
}
