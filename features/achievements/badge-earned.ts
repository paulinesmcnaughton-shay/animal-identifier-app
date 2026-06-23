import type { Badge } from '@/data/badges'

export interface BadgeStats {
  spotsCaptured: number
  streakDays: number
}

/**
 * Whether a badge is earned, derived from real profile stats. Today this covers
 * the objective milestones (total sightings, day streaks); the species / places /
 * collection / explorer badges stay locked until their unlock rules are wired.
 */
export function isBadgeEarned(name: string, stats: BadgeStats): boolean {
  const sightings = /^(\d+) Sightings$/.exec(name)
  if (sightings) return stats.spotsCaptured >= Number(sightings[1])
  if (name === 'First Sighting') return stats.spotsCaptured >= 1

  const streak = /^(\d+) Day Streak$/.exec(name)
  if (streak) return stats.streakDays >= Number(streak[1])

  return false
}

export function earnedBadgeIds(badges: Badge[], stats: BadgeStats): Set<string> {
  const earned = new Set<string>()
  for (const b of badges) if (isBadgeEarned(b.name, stats)) earned.add(b.id)
  return earned
}
