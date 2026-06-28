/** XP required to advance from level `n` to `n + 1` — tunable curve from product rules. */
export function xpToReachNextLevel(level: number): number {
  return Math.round(100 * level * 1.15 ** level)
}

export interface LevelProgress {
  level: number
  xpIntoLevel: number // XP earned since reaching the current level
  xpForLevel: number // XP needed to clear the current level
  xpRemaining: number
  progress: number // 0..1 toward the next level
}

const MAX_LEVEL = 200

/**
 * Derives the level (and progress within it) from LIFETIME total XP by spending the
 * total against each level's threshold. This is the single source of truth for level —
 * `profiles.level` is kept in sync but never read for display, so XP and level can't drift.
 */
export function levelForTotalXp(totalXp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (level < MAX_LEVEL && remaining >= xpToReachNextLevel(level)) {
    remaining -= xpToReachNextLevel(level)
    level += 1
  }
  const xpForLevel = xpToReachNextLevel(level)
  return {
    level,
    xpIntoLevel: remaining,
    xpForLevel,
    xpRemaining: Math.max(0, xpForLevel - remaining),
    progress: xpForLevel > 0 ? Math.min(1, remaining / xpForLevel) : 0,
  }
}
