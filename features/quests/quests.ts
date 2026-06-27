import { RARE_SPECIES_KEYWORDS } from '@/features/achievements/badge-earned'
import type { Collection, CollectionLookup } from '@/features/collections/collections'

// The 10 home quests, matching the Quest Cards design set.
export type QuestKey =
  | 'insect'
  | 'bird'
  | 'reptile'
  | 'venue'
  | 'mammal'
  | 'dusk'
  | 'flower'
  | 'water'
  | 'streak'
  | 'rare'

// 'streak' is profile-driven (streak_days); every other quest counts distinct species.
type QuestMetric = 'species' | 'streak'

export interface Quest {
  id: QuestKey
  metric: QuestMetric
  eyebrow: string // e.g. '🏆 WEEKLY · INSECTS' — rendered verbatim
  title: string
  target: number // goal for the metric (species count, or streak days)
  pips: number // milestone dots drawn on the card
  xpReward: number
}

const VENUE_COLLECTIONS = new Set<Collection>(['safari', 'zoo', 'aquarium', 'petting_zoo'])

export const QUESTS: Quest[] = [
  { id: 'insect',  metric: 'species', eyebrow: '🏆 WEEKLY · INSECTS',  title: 'Spot 3 insects',       target: 3, pips: 3, xpReward: 50 },
  { id: 'bird',    metric: 'species', eyebrow: '📸 DAILY · BIRD',      title: 'Photograph a bird',    target: 3, pips: 3, xpReward: 75 },
  { id: 'reptile', metric: 'species', eyebrow: '🦎 WEEKLY · REPTILE',  title: 'Find a reptile',       target: 2, pips: 2, xpReward: 60 },
  { id: 'venue',   metric: 'species', eyebrow: '📍 VENUE QUEST',       title: 'Visit a new venue',    target: 2, pips: 2, xpReward: 80 },
  { id: 'mammal',  metric: 'species', eyebrow: '🦌 WEEKLY · MAMMAL',   title: 'Log a mammal',         target: 3, pips: 3, xpReward: 50 },
  { id: 'dusk',    metric: 'species', eyebrow: '🌙 NIGHT QUEST',       title: 'Spot at dusk',         target: 2, pips: 2, xpReward: 90 },
  { id: 'flower',  metric: 'species', eyebrow: '🌸 WEEKLY · FLORA',    title: 'Identify a flower',    target: 2, pips: 2, xpReward: 40 },
  { id: 'water',   metric: 'species', eyebrow: '💧 WATER QUEST',       title: 'Spot life in water',   target: 3, pips: 3, xpReward: 70 },
  { id: 'streak',  metric: 'streak',  eyebrow: '🔥 STREAK BONUS',      title: 'Keep a 7-day streak',  target: 7, pips: 3, xpReward: 120 },
  { id: 'rare',    metric: 'species', eyebrow: '✦ RARE FIND',          title: 'Catch a rare creature', target: 1, pips: 1, xpReward: 150 },
]

export interface SightingLike {
  kingdom?: string | null
  dexNumber?: string | null
  speciesId?: string | null
  speciesName?: string | null
  scientificName?: string | null
  spottedAt?: string | null
}

// Kingdom strings arrive inconsistently (e.g. 'mammal', 'Plantae', 'plant', 'tree'),
// so each quest matches a normalized set of synonyms.
const KINGDOM_SYNONYMS: Partial<Record<QuestKey, Set<string>>> = {
  insect: new Set(['insect', 'insecta', 'bug']),
  bird: new Set(['bird', 'aves']),
  reptile: new Set(['reptile', 'reptilia']),
  mammal: new Set(['mammal', 'mammalia']),
  water: new Set(['fish', 'aquatic', 'water', 'actinopterygii', 'mollusc', 'amphibian']),
  flower: new Set(['flower', 'flora', 'plant', 'plantae', 'tree']),
}

function kingdomMatches(key: QuestKey, kingdom: string): boolean {
  const set = KINGDOM_SYNONYMS[key]
  return set ? set.has(kingdom) : false
}

/** Spotted after sunset or before dawn (local time). */
function isDusk(spottedAt?: string | null): boolean {
  if (!spottedAt) return false
  const hour = new Date(spottedAt).getHours()
  return hour >= 18 || hour < 6
}

function isRare(s: SightingLike): boolean {
  const text = `${s.speciesName ?? ''} ${s.scientificName ?? ''} ${s.speciesId ?? ''}`.toLowerCase()
  return RARE_SPECIES_KEYWORDS.some((k) => text.includes(k))
}

/** Species-level quest keys a single sighting satisfies (excludes the streak quest). */
export function questsForSighting(s: SightingLike, lookup?: CollectionLookup): Set<QuestKey> {
  const keys = new Set<QuestKey>()
  const kingdom = (s.kingdom ?? '').trim().toLowerCase()

  for (const key of ['insect', 'bird', 'reptile', 'mammal', 'water', 'flower'] as const) {
    if (kingdomMatches(key, kingdom)) keys.add(key)
  }
  if (isDusk(s.spottedAt)) keys.add('dusk')
  if (isRare(s)) keys.add('rare')
  if (lookup) {
    const cols = lookup({ commonName: s.speciesName, scientificName: s.scientificName ?? null }) as Collection[]
    if (cols.some((c) => VENUE_COLLECTIONS.has(c))) keys.add('venue')
  }
  return keys
}

type QuestCounts = Record<QuestKey, number>

const QUEST_KEYS = QUESTS.map((q) => q.id)

function emptyCounts(): QuestCounts {
  const c = {} as QuestCounts
  for (const k of QUEST_KEYS) c[k] = 0
  return c
}

interface QuestCountInput {
  lookup?: CollectionLookup
  streakDays?: number
}

/**
 * Counts each quest's progress. Species quests count DISTINCT species satisfying the
 * quest (a species spotted twice counts once); the streak quest reflects streak_days.
 * Pass raw sightings (not pre-deduped) so per-sighting facts like dusk are not lost.
 */
export function questCountsFromSightings(
  sightings: SightingLike[],
  { lookup, streakDays = 0 }: QuestCountInput = {},
): QuestCounts {
  const sets = {} as Record<QuestKey, Set<string>>
  for (const k of QUEST_KEYS) sets[k] = new Set<string>()

  for (const s of sightings) {
    const speciesId = s.speciesId ?? s.speciesName ?? ''
    if (!speciesId) continue
    for (const key of questsForSighting(s, lookup)) sets[key].add(speciesId)
  }

  const counts = emptyCounts()
  for (const k of QUEST_KEYS) counts[k] = sets[k].size
  counts.streak = streakDays
  return counts
}

export interface QuestProgress {
  quest: Quest
  count: number
  completed: boolean
}

export function buildQuestProgress(counts: QuestCounts): QuestProgress[] {
  return QUESTS.map((quest) => {
    const count = counts[quest.id]
    return { quest, count, completed: count >= quest.target }
  })
}

// ─── Reward crediting (awarded once via profiles.claimed_quests) ────────────────

const claimKey = (id: QuestKey): string => `${id}:done`

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
    if (counts[quest.id] >= quest.target && !claimedSet.has(claimKey(quest.id))) {
      claimedSet.add(claimKey(quest.id))
      xpGain += quest.xpReward
      badgeGain += 1
    }
  }

  return { xpGain, badgeGain, newClaimed: [...claimedSet] }
}
