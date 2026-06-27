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

// The 10 layouts, in order. A quest's design = THEME_ORDER[(typeIndex + tier) % 10],
// so tier 1 reproduces the original design pairing and higher tiers rotate the look.
const THEME_ORDER: QuestThemeKey[] = [
  'greenTopo', 'goldTicket', 'tealLagoon', 'coralSunset', 'forestInk',
  'nightSky', 'sageSoft', 'aquaWater', 'streakConfetti', 'premiumGold',
]
const TYPE_ORDER: QuestType[] = ['insect', 'bird', 'reptile', 'venue', 'mammal', 'dusk', 'flower', 'water', 'streak', 'rare']
const TIER_LABEL = ['STARTER', 'COLLECTOR', 'NATURALIST', 'EXPERT', 'MASTER']

interface TypeMeta {
  emoji: string
  label: string
  verb: string
  noun: string
  targets: [number, number, number, number, number]
  xp: [number, number, number, number, number]
}

const TYPE_META: Record<QuestType, TypeMeta> = {
  insect:  { emoji: '🐝', label: 'INSECTS',  verb: 'Spot',     noun: 'insects',       targets: [3, 8, 15, 25, 40],   xp: [50, 120, 200, 280, 360] },
  bird:    { emoji: '🪶', label: 'BIRDS',    verb: 'Spot',     noun: 'birds',         targets: [3, 10, 20, 35, 50],  xp: [75, 140, 240, 320, 420] },
  reptile: { emoji: '🦎', label: 'REPTILES', verb: 'Find',     noun: 'reptiles',      targets: [2, 5, 10, 18, 30],   xp: [60, 110, 190, 270, 360] },
  venue:   { emoji: '📍', label: 'VENUES',   verb: 'Visit',    noun: 'venues',        targets: [2, 4, 6, 9, 12],     xp: [80, 150, 220, 300, 400] },
  mammal:  { emoji: '🐾', label: 'MAMMALS',  verb: 'Log',      noun: 'mammals',       targets: [3, 8, 15, 25, 40],   xp: [50, 120, 200, 280, 360] },
  dusk:    { emoji: '🌙', label: 'DUSK',     verb: 'Spot',     noun: 'at dusk',       targets: [2, 5, 10, 18, 30],   xp: [90, 140, 220, 300, 380] },
  flower:  { emoji: '🌸', label: 'FLORA',    verb: 'Identify', noun: 'flowers',       targets: [2, 6, 12, 20, 32],   xp: [40, 100, 180, 260, 340] },
  water:   { emoji: '💧', label: 'WATER',    verb: 'Spot',     noun: 'in water',      targets: [3, 8, 15, 25, 40],   xp: [70, 120, 200, 280, 360] },
  streak:  { emoji: '🔥', label: 'STREAK',   verb: '',         noun: '',              targets: [7, 14, 30, 60, 100], xp: [120, 250, 400, 600, 900] },
  rare:    { emoji: '✦', label: 'RARE',      verb: 'Catch',    noun: 'rare creatures', targets: [1, 3, 6, 10, 15],   xp: [150, 300, 450, 600, 800] },
}

function questTitle(type: QuestType, target: number): string {
  if (type === 'streak') return `Keep a ${target}-day streak`
  if (type === 'rare' && target === 1) return 'Catch a rare creature'
  const m = TYPE_META[type]
  return `${m.verb} ${target} ${m.noun}`
}

// 50-quest pool: 5 tiers × 10 types, tier-major so the visible window mixes types.
export const QUESTS: Quest[] = TIER_LABEL.flatMap((tierLabel, tier) =>
  TYPE_ORDER.map((type, pos) => {
    const m = TYPE_META[type]
    const target = m.targets[tier]
    return {
      id: `${type}-${target}`,
      type,
      theme: THEME_ORDER[(pos + tier) % THEME_ORDER.length],
      eyebrow: `${m.emoji} ${tierLabel} · ${m.label}`,
      title: questTitle(type, target),
      target,
      pips: target <= 1 ? 1 : target === 2 ? 2 : 3,
      xpReward: m.xp[tier],
    }
  }),
)

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
