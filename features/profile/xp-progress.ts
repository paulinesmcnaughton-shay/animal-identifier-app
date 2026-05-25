/** XP required to advance from level `n` to `n + 1` — tunable curve from product rules. */
export function xpToReachNextLevel(level: number): number {
  return Math.round(100 * level * 1.15 ** level)
}

export interface XpProgressSnapshot {
  currentXp: number
  xpForNextLevel: number
  xpRemaining: number
  progress: number
}

export function buildXpProgress(level: number, currentXp: number): XpProgressSnapshot {
  const xpForNextLevel = xpToReachNextLevel(Math.max(1, level))
  const xpRemaining = Math.max(0, xpForNextLevel - currentXp)
  const progress = xpForNextLevel > 0 ? Math.min(1, currentXp / xpForNextLevel) : 0

  return {
    currentXp,
    xpForNextLevel,
    xpRemaining,
    progress,
  }
}
