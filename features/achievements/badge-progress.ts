import { BADGES, type Badge } from '@/data/badges'
import { earnedBadgeIds, isBadgeEarned, type BadgeStats } from '@/features/achievements/badge-earned'
import { storage } from '@/util/storage'

const SEEN_KEY = 'badges.seenIds'

/**
 * The user's best earned badge to feature on the home screen: the highest Sightings
 * milestone they've reached, falling back to the most recently earned badge.
 */
export function topEarnedBadge(stats: BadgeStats): Badge | null {
  let best: Badge | null = null
  let bestN = -1
  let lastEarned: Badge | null = null
  for (const b of BADGES) {
    if (!isBadgeEarned(b.name, stats)) continue
    lastEarned = b
    const m = /^(\d+) Sightings$/.exec(b.name)
    if (m && Number(m[1]) > bestN) {
      bestN = Number(m[1])
      best = b
    }
  }
  return best ?? lastEarned
}

/** How many earned badges the user hasn't viewed yet (drives the "new" highlight). */
export async function getNewlyEarnedCount(stats: BadgeStats): Promise<number> {
  const raw = await storage.getString(SEEN_KEY)
  const seen = new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
  let count = 0
  for (const id of earnedBadgeIds(BADGES, stats)) if (!seen.has(id)) count += 1
  return count
}

/** Mark all currently-earned badges as seen — call when the Badges screen opens. */
export async function markBadgesSeen(stats: BadgeStats): Promise<void> {
  await storage.set(SEEN_KEY, JSON.stringify([...earnedBadgeIds(BADGES, stats)]))
}
