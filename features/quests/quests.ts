import { colors } from '@/design/tokens'

export type QuestCategory = 'insect' | 'mammal' | 'aquatic' | 'farm' | 'tree'

export interface Quest {
  id: QuestCategory
  category: QuestCategory
  title: string
  emoji: string
  accent: string
  /** Catches needed to earn the badge. */
  target: number
  /** A catch beyond the target earns the bonus XP. */
  bonusTarget: number
  /** XP for completing the badge target. */
  xpReward: number
  /** Extra XP for the bonus catch. */
  bonusXp: number
}

export const QUEST_TARGET = 3
export const QUEST_BONUS_TARGET = 4
export const QUEST_XP_REWARD = 50
export const QUEST_BONUS_XP = 150

export const QUESTS: Quest[] = [
  { id: 'insect',  category: 'insect',  title: 'Spot 3 insects',         emoji: '🪲', accent: colors.plum,     target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP },
  { id: 'mammal',  category: 'mammal',  title: 'Spot 3 mammals',         emoji: '🐾', accent: colors.earth,    target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP },
  { id: 'aquatic', category: 'aquatic', title: 'Spot 3 aquatic animals', emoji: '🐟', accent: colors.skyDeep,  target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP },
  { id: 'farm',    category: 'farm',    title: 'Spot 3 farm animals',    emoji: '🐄', accent: colors.coralDeep, target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP },
  { id: 'tree',    category: 'tree',    title: 'Spot 3 trees',           emoji: '🌳', accent: colors.green,    target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP },
]

export interface SightingLike {
  kingdom?: string | null
  dexNumber?: string | null
  speciesId?: string | null
  speciesName?: string | null
}

const FARM_NAME_RE = /\b(horse|cow|cattle|bull|calf|sheep|lamb|pig|hog|goat|chicken|hen|rooster|duck|rabbit|donkey|turkey)\b/i

function isFarm(s: SightingLike): boolean {
  const dex = (s.dexNumber ?? '').replace(/^#/, '')
  if (/^F\d/i.test(dex)) return true
  const text = `${s.speciesId ?? ''} ${s.speciesName ?? ''}`
  return FARM_NAME_RE.test(text)
}

/**
 * Maps a captured species to the quest it advances, or null if none.
 * Farm is checked first so a cow/sheep counts as farm, not generic mammal.
 */
export function categoryForSighting(s: SightingLike): QuestCategory | null {
  if (isFarm(s)) return 'farm'
  const k = (s.kingdom ?? '').toLowerCase()
  if (k === 'insect') return 'insect'
  if (k === 'mammal') return 'mammal'
  if (k === 'fish') return 'aquatic'
  if (k === 'tree') return 'tree'
  return null
}

/** Distinct-species counts per quest category from a list of sightings. */
export function questCountsFromSightings(sightings: SightingLike[]): Record<QuestCategory, number> {
  const counts: Record<QuestCategory, number> = { insect: 0, mammal: 0, aquatic: 0, farm: 0, tree: 0 }
  for (const s of sightings) {
    const cat = categoryForSighting(s)
    if (cat) counts[cat] += 1
  }
  return counts
}

export interface QuestProgress {
  quest: Quest
  count: number
  badgeEarned: boolean
  bonusEarned: boolean
}

export function buildQuestProgress(counts: Record<QuestCategory, number>): QuestProgress[] {
  return QUESTS.map((quest) => {
    const count = counts[quest.category]
    return {
      quest,
      count,
      badgeEarned: count >= quest.target,
      bonusEarned: count >= quest.bonusTarget,
    }
  })
}

// ─── Reward crediting (awarded once via profiles.claimed_quests) ────────────────

const badgeKey = (c: QuestCategory): string => `${c}:badge`
const bonusKey = (c: QuestCategory): string => `${c}:bonus`

export interface QuestRewardDelta {
  xpGain: number
  badgeGain: number
  newClaimed: string[]
}

/**
 * Given distinct-species counts and the already-claimed milestone keys, returns
 * the XP/badge to award for newly-reached milestones and the updated claimed set.
 */
export function computeQuestRewardDelta(
  counts: Record<QuestCategory, number>,
  claimed: string[],
): QuestRewardDelta {
  const claimedSet = new Set(claimed)
  let xpGain = 0
  let badgeGain = 0

  for (const quest of QUESTS) {
    const count = counts[quest.category]
    if (count >= quest.target && !claimedSet.has(badgeKey(quest.category))) {
      claimedSet.add(badgeKey(quest.category))
      xpGain += quest.xpReward
      badgeGain += 1
    }
    if (count >= quest.bonusTarget && !claimedSet.has(bonusKey(quest.category))) {
      claimedSet.add(bonusKey(quest.category))
      xpGain += quest.bonusXp
    }
  }

  return { xpGain, badgeGain, newClaimed: [...claimedSet] }
}
