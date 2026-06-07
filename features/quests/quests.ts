import { colors } from '@/design/tokens'
import type { Collection, CollectionLookup } from '@/features/collections/collections'

// Kingdom-derived categories (matched from a sighting's kingdom/dex/name)…
export type QuestCategory = 'insect' | 'mammal' | 'aquatic' | 'farm' | 'tree'
// …plus collection quests (matched from the catalog's collection tags).
export type QuestKey = QuestCategory | 'safari' | 'zoo' | 'aquarium' | 'petting_zoo'

export interface Quest {
  id: QuestKey
  kind: 'kingdom' | 'collection'
  title: string
  emoji: string
  accent: string
  target: number
  bonusTarget: number
  xpReward: number
  bonusXp: number
}

export const QUEST_TARGET = 3
export const QUEST_BONUS_TARGET = 4
export const QUEST_XP_REWARD = 50
export const QUEST_BONUS_XP = 150

const base = { target: QUEST_TARGET, bonusTarget: QUEST_BONUS_TARGET, xpReward: QUEST_XP_REWARD, bonusXp: QUEST_BONUS_XP }

export const QUESTS: Quest[] = [
  { id: 'insect',      kind: 'kingdom',    title: 'Spot 3 insects',         emoji: '🪲', accent: colors.plum,      ...base },
  { id: 'mammal',      kind: 'kingdom',    title: 'Spot 3 mammals',         emoji: '🐾', accent: colors.earth,     ...base },
  { id: 'aquatic',     kind: 'kingdom',    title: 'Spot 3 aquatic animals', emoji: '🐟', accent: colors.skyDeep,   ...base },
  { id: 'farm',        kind: 'kingdom',    title: 'Spot 3 farm animals',    emoji: '🐄', accent: colors.coralDeep, ...base },
  { id: 'tree',        kind: 'kingdom',    title: 'Spot 3 trees',           emoji: '🌳', accent: colors.green,     ...base },
  { id: 'safari',      kind: 'collection', title: 'Spot 3 safari animals',  emoji: '🦁', accent: colors.earth,     ...base },
  { id: 'zoo',         kind: 'collection', title: 'Spot 3 zoo animals',     emoji: '🦒', accent: colors.plum,      ...base },
  { id: 'aquarium',    kind: 'collection', title: 'Spot 3 aquarium animals',emoji: '🐠', accent: colors.skyDeep,   ...base },
  { id: 'petting_zoo', kind: 'collection', title: 'Spot 3 petting-zoo animals', emoji: '🐐', accent: colors.greenLight, ...base },
]

export interface SightingLike {
  kingdom?: string | null
  dexNumber?: string | null
  speciesId?: string | null
  speciesName?: string | null
  scientificName?: string | null
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

type QuestCounts = Record<QuestKey, number>

const QUEST_KEYS = QUESTS.map((q) => q.id)
const COLLECTION_QUEST_KEYS = new Set<string>(QUESTS.filter((q) => q.kind === 'collection').map((q) => q.id))

function emptyCounts(): QuestCounts {
  const c = {} as QuestCounts
  for (const k of QUEST_KEYS) c[k] = 0
  return c
}

/** All quest keys a single species satisfies (kingdom category + catalog collections). */
export function questsForSighting(s: SightingLike, lookup?: CollectionLookup): Set<QuestKey> {
  const keys = new Set<QuestKey>()
  const cat = categoryForSighting(s)
  if (cat) keys.add(cat)
  if (lookup) {
    const cols = lookup({ commonName: s.speciesName, scientificName: s.scientificName ?? null })
    for (const col of cols as Collection[]) {
      if (COLLECTION_QUEST_KEYS.has(col)) keys.add(col as QuestKey)
    }
  }
  return keys
}

/** Distinct-species counts per quest from a list of sightings (one count per quest per species). */
export function questCountsFromSightings(sightings: SightingLike[], lookup?: CollectionLookup): QuestCounts {
  const counts = emptyCounts()
  for (const s of sightings) {
    for (const key of questsForSighting(s, lookup)) counts[key] += 1
  }
  return counts
}

export interface QuestProgress {
  quest: Quest
  count: number
  badgeEarned: boolean
  bonusEarned: boolean
}

export function buildQuestProgress(counts: QuestCounts): QuestProgress[] {
  return QUESTS.map((quest) => {
    const count = counts[quest.id]
    return {
      quest,
      count,
      badgeEarned: count >= quest.target,
      bonusEarned: count >= quest.bonusTarget,
    }
  })
}

// ─── Reward crediting (awarded once via profiles.claimed_quests) ────────────────

const badgeKey = (c: QuestKey): string => `${c}:badge`
const bonusKey = (c: QuestKey): string => `${c}:bonus`

export interface QuestRewardDelta {
  xpGain: number
  badgeGain: number
  newClaimed: string[]
}

export function computeQuestRewardDelta(counts: QuestCounts, claimed: string[]): QuestRewardDelta {
  const claimedSet = new Set(claimed)
  let xpGain = 0
  let badgeGain = 0

  for (const quest of QUESTS) {
    const count = counts[quest.id]
    if (count >= quest.target && !claimedSet.has(badgeKey(quest.id))) {
      claimedSet.add(badgeKey(quest.id))
      xpGain += quest.xpReward
      badgeGain += 1
    }
    if (count >= quest.bonusTarget && !claimedSet.has(bonusKey(quest.id))) {
      claimedSet.add(bonusKey(quest.id))
      xpGain += quest.bonusXp
    }
  }

  return { xpGain, badgeGain, newClaimed: [...claimedSet] }
}
