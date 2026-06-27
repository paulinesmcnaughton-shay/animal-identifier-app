import { RARE_SPECIES_KEYWORDS } from '@/features/achievements/badge-earned'
import type { Collection, CollectionLookup } from '@/features/collections/collections'

// Detection categories — how a sighting advances a quest.
export type QuestType =
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

// The 10 card layouts from the Quest Cards design. Themes are decoupled from quest
// type so the deep quest pool can rotate through all 10 looks.
export type QuestThemeKey =
  | 'greenTopo'
  | 'goldTicket'
  | 'tealLagoon'
  | 'coralSunset'
  | 'forestInk'
  | 'nightSky'
  | 'sageSoft'
  | 'aquaWater'
  | 'streakConfetti'
  | 'premiumGold'

export interface Quest {
  id: string // unique
  type: QuestType
  theme: QuestThemeKey
  eyebrow: string // e.g. '🏆 WEEKLY · INSECTS' — rendered verbatim
  title: string
  target: number // goal for the type's count (or streak days)
  pips: number // milestone dots drawn on the card
  xpReward: number
}

const VENUE_COLLECTIONS = new Set<Collection>(['safari', 'zoo', 'aquarium', 'petting_zoo'])

// Deep pool (> 10). Every quest maps to one of the 10 layouts; layouts repeat. The
// home shows the first N unfinished quests, so completed ones rotate out and the next
// tier rotates in. Ordered easiest → hardest.
export const QUESTS: Quest[] = [
  { id: 'insect-3',  type: 'insect',  theme: 'greenTopo',      eyebrow: '🏆 WEEKLY · INSECTS',   title: 'Spot 3 insects',        target: 3,  pips: 3, xpReward: 50 },
  { id: 'bird-3',    type: 'bird',    theme: 'goldTicket',     eyebrow: '📸 DAILY · BIRD',        title: 'Photograph a bird',     target: 3,  pips: 3, xpReward: 75 },
  { id: 'reptile-2', type: 'reptile', theme: 'tealLagoon',     eyebrow: '🦎 WEEKLY · REPTILE',    title: 'Find a reptile',        target: 2,  pips: 2, xpReward: 60 },
  { id: 'venue-2',   type: 'venue',   theme: 'coralSunset',    eyebrow: '📍 VENUE QUEST',         title: 'Visit 2 venues',        target: 2,  pips: 2, xpReward: 80 },
  { id: 'mammal-3',  type: 'mammal',  theme: 'forestInk',      eyebrow: '🦌 WEEKLY · MAMMAL',     title: 'Log 3 mammals',         target: 3,  pips: 3, xpReward: 50 },
  { id: 'dusk-2',    type: 'dusk',    theme: 'nightSky',       eyebrow: '🌙 NIGHT QUEST',         title: 'Spot 2 at dusk',        target: 2,  pips: 2, xpReward: 90 },
  { id: 'flower-2',  type: 'flower',  theme: 'sageSoft',       eyebrow: '🌸 WEEKLY · FLORA',      title: 'Identify 2 flowers',    target: 2,  pips: 2, xpReward: 40 },
  { id: 'water-3',   type: 'water',   theme: 'aquaWater',      eyebrow: '💧 WATER QUEST',         title: 'Spot 3 in water',       target: 3,  pips: 3, xpReward: 70 },
  { id: 'streak-7',  type: 'streak',  theme: 'streakConfetti', eyebrow: '🔥 STREAK BONUS',        title: 'Keep a 7-day streak',   target: 7,  pips: 3, xpReward: 120 },
  { id: 'rare-1',    type: 'rare',    theme: 'premiumGold',    eyebrow: '✦ RARE FIND',            title: 'Catch a rare creature', target: 1,  pips: 1, xpReward: 150 },
  { id: 'insect-8',  type: 'insect',  theme: 'goldTicket',     eyebrow: '🐝 COLLECTOR · INSECTS', title: 'Spot 8 insects',        target: 8,  pips: 3, xpReward: 120 },
  { id: 'bird-10',   type: 'bird',    theme: 'tealLagoon',     eyebrow: '🪶 COLLECTOR · BIRDS',   title: 'Spot 10 birds',         target: 10, pips: 3, xpReward: 140 },
  { id: 'mammal-8',  type: 'mammal',  theme: 'coralSunset',    eyebrow: '🐾 COLLECTOR · MAMMALS', title: 'Spot 8 mammals',        target: 8,  pips: 3, xpReward: 120 },
  { id: 'reptile-5', type: 'reptile', theme: 'forestInk',      eyebrow: '🦎 COLLECTOR · REPTILE', title: 'Find 5 reptiles',       target: 5,  pips: 3, xpReward: 110 },
  { id: 'water-8',   type: 'water',   theme: 'nightSky',       eyebrow: '🐟 COLLECTOR · WATER',   title: 'Spot 8 in water',       target: 8,  pips: 3, xpReward: 120 },
  { id: 'flower-6',  type: 'flower',  theme: 'sageSoft',       eyebrow: '🌷 COLLECTOR · FLORA',   title: 'Identify 6 flowers',    target: 6,  pips: 3, xpReward: 100 },
  { id: 'dusk-5',    type: 'dusk',    theme: 'aquaWater',      eyebrow: '🌙 NIGHT OWL',           title: 'Spot 5 at dusk',        target: 5,  pips: 3, xpReward: 140 },
  { id: 'venue-4',   type: 'venue',   theme: 'streakConfetti', eyebrow: '📍 EXPLORER',            title: 'Visit 4 venues',        target: 4,  pips: 3, xpReward: 150 },
  { id: 'rare-3',    type: 'rare',    theme: 'premiumGold',    eyebrow: '✦ COLLECTOR · RARE',     title: 'Catch 3 rare creatures', target: 3, pips: 3, xpReward: 300 },
  { id: 'streak-14', type: 'streak',  theme: 'greenTopo',      eyebrow: '🔥 STREAK MASTER',       title: 'Keep a 14-day streak',  target: 14, pips: 3, xpReward: 250 },
  { id: 'insect-15', type: 'insect',  theme: 'nightSky',       eyebrow: '🦋 NATURALIST · INSECTS', title: 'Spot 15 insects',      target: 15, pips: 3, xpReward: 200 },
  { id: 'bird-20',   type: 'bird',    theme: 'greenTopo',      eyebrow: '🦅 NATURALIST · BIRDS',  title: 'Spot 20 birds',         target: 20, pips: 3, xpReward: 240 },
  { id: 'mammal-15', type: 'mammal',  theme: 'tealLagoon',     eyebrow: '🦁 NATURALIST · MAMMALS', title: 'Spot 15 mammals',      target: 15, pips: 3, xpReward: 200 },
  { id: 'water-15',  type: 'water',   theme: 'coralSunset',    eyebrow: '🐙 NATURALIST · WATER',  title: 'Spot 15 in water',      target: 15, pips: 3, xpReward: 200 },
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
// so each type matches a normalized set of synonyms.
const KINGDOM_SYNONYMS: Partial<Record<QuestType, Set<string>>> = {
  insect: new Set(['insect', 'insecta', 'bug']),
  bird: new Set(['bird', 'aves']),
  reptile: new Set(['reptile', 'reptilia']),
  mammal: new Set(['mammal', 'mammalia']),
  water: new Set(['fish', 'aquatic', 'water', 'actinopterygii', 'mollusc', 'amphibian']),
  flower: new Set(['flower', 'flora', 'plant', 'plantae', 'tree']),
}

function kingdomMatches(type: QuestType, kingdom: string): boolean {
  const set = KINGDOM_SYNONYMS[type]
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

/** Detection types a single sighting satisfies (excludes the profile-driven streak). */
export function questTypesForSighting(s: SightingLike, lookup?: CollectionLookup): Set<QuestType> {
  const types = new Set<QuestType>()
  const kingdom = (s.kingdom ?? '').trim().toLowerCase()

  for (const type of ['insect', 'bird', 'reptile', 'mammal', 'water', 'flower'] as const) {
    if (kingdomMatches(type, kingdom)) types.add(type)
  }
  if (isDusk(s.spottedAt)) types.add('dusk')
  if (isRare(s)) types.add('rare')
  if (lookup) {
    const cols = lookup({ commonName: s.speciesName, scientificName: s.scientificName ?? null }) as Collection[]
    if (cols.some((c) => VENUE_COLLECTIONS.has(c))) types.add('venue')
  }
  return types
}

export type TypeCounts = Record<QuestType, number>

const QUEST_TYPES: QuestType[] = ['insect', 'bird', 'reptile', 'venue', 'mammal', 'dusk', 'flower', 'water', 'streak', 'rare']

interface QuestCountInput {
  lookup?: CollectionLookup
  streakDays?: number
}

/**
 * Counts per detection type. Species types count DISTINCT species (a species spotted
 * twice counts once); the streak type reflects streak_days. Pass RAW sightings (not
 * pre-deduped) so per-sighting facts like dusk are not lost.
 */
export function questCountsFromSightings(
  sightings: SightingLike[],
  { lookup, streakDays = 0 }: QuestCountInput = {},
): TypeCounts {
  const sets = {} as Record<QuestType, Set<string>>
  for (const t of QUEST_TYPES) sets[t] = new Set<string>()

  for (const s of sightings) {
    const speciesId = s.speciesId ?? s.speciesName ?? ''
    if (!speciesId) continue
    for (const type of questTypesForSighting(s, lookup)) sets[type].add(speciesId)
  }

  const counts = {} as TypeCounts
  for (const t of QUEST_TYPES) counts[t] = sets[t].size
  counts.streak = streakDays
  return counts
}

export interface QuestProgress {
  quest: Quest
  count: number
  completed: boolean
}

export function buildQuestProgress(counts: TypeCounts): QuestProgress[] {
  return QUESTS.map((quest) => {
    const count = counts[quest.type]
    return { quest, count, completed: count >= quest.target }
  })
}

// ─── Completion / display ──────────────────────────────────────────────────────

const claimKey = (id: string): string => `${id}:done`

/** Whether the user has finished this quest for good (claimed reward). */
export function isQuestClaimed(questId: string, claimed: string[]): boolean {
  return claimed.includes(claimKey(questId))
}

/**
 * The quests to show in the carousel: drop anything finished (claimed) or already at
 * its goal, then take the next `max` so completed quests rotate out and new ones in.
 */
export function visibleQuests(progress: QuestProgress[], claimed: string[], max: number): QuestProgress[] {
  return progress
    .filter((p) => !p.completed && !isQuestClaimed(p.quest.id, claimed))
    .slice(0, max)
}

// ─── Reward crediting (awarded once via profiles.claimed_quests) ────────────────

export interface QuestRewardDelta {
  xpGain: number
  badgeGain: number
  newClaimed: string[]
}

export function computeQuestRewardDelta(counts: TypeCounts, claimed: string[]): QuestRewardDelta {
  const claimedSet = new Set(claimed)
  let xpGain = 0
  let badgeGain = 0

  for (const quest of QUESTS) {
    if (counts[quest.type] >= quest.target && !claimedSet.has(claimKey(quest.id))) {
      claimedSet.add(claimKey(quest.id))
      xpGain += quest.xpReward
      badgeGain += 1
    }
  }

  return { xpGain, badgeGain, newClaimed: [...claimedSet] }
}
