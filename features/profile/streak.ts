export const STREAK_WINDOW_MS = 24 * 60 * 60 * 1000

/** Streak is hidden in UI when this returns 0 (no spot in the last 24 hours). */
export function resolveEffectiveStreakDays(
  streakDays: number,
  lastSpottedAt: string | null,
): number {
  if (streakDays <= 0) return 0
  if (!lastSpottedAt) return 0

  const elapsed = Date.now() - new Date(lastSpottedAt).getTime()
  if (elapsed > STREAK_WINDOW_MS) return 0

  return streakDays
}

export function formatProfileStreakLabel(streakDays: number): string {
  if (streakDays === 1) return '1-day streak'
  return `${streakDays}-day streak`
}
