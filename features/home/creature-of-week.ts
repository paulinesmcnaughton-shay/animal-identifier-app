import { useEffect, useMemo, useState } from 'react'

import { CREATURE_ROSTER, type CreatureRosterItem } from '@/features/home/creature-roster'
import {
  detectDeviceTimezone,
  loadTimezone,
} from '@/features/settings/timezone-preference'

export { CREATURE_ROSTER }
export type { CreatureRosterItem }

function getLocalDateInTimezone(tz: string): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const year = parseInt(parts.find(p => p.type === 'year')?.value ?? '2024')
    const month = parseInt(parts.find(p => p.type === 'month')?.value ?? '1') - 1
    const day = parseInt(parts.find(p => p.type === 'day')?.value ?? '1')
    return new Date(year, month, day)
  } catch {
    return new Date()
  }
}

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Onboarding captures POSITIVE interests (profiles.interests), not fears —
// there's no "what scares you" question. We can't tell "didn't think to pick
// insects" apart from "afraid of insects", so we only filter the classic
// phobia-prone kingdoms (insects, arachnids), and only when the user HAS
// interests saved — an empty/missing array means "unanswered", not "avoid
// everything", so it must not filter anything. Every other kingdom (mammal,
// bird, reptile, amphibian, fish, mollusc) always stays in rotation regardless
// of what was picked, to keep Creature of the Week varied and not narrow it to
// only-explicitly-selected categories.
export function kingdomsToExcludeFromInterests(interests: readonly string[]): ReadonlySet<string> {
  if (interests.length === 0) return EMPTY_EXCLUDED
  const excluded = new Set<string>()
  if (!interests.includes('insects')) excluded.add('insect')
  if (!interests.includes('spiders') && !interests.includes('scorpions')) excluded.add('arachnid')
  return excluded
}

const EMPTY_EXCLUDED: ReadonlySet<string> = new Set()

export function getCreatureOfWeek(
  timezone: string,
  excludeKingdoms: ReadonlySet<string> = EMPTY_EXCLUDED,
): CreatureRosterItem {
  const localDate = getLocalDateInTimezone(timezone)
  const weekNum = isoWeekNumber(localDate)
  const year = localDate.getFullYear()
  const pool =
    excludeKingdoms.size > 0
      ? CREATURE_ROSTER.filter((c) => !excludeKingdoms.has(c.kingdom))
      : CREATURE_ROSTER
  // Safety net: if an exclusion set somehow empties the pool, fall back to the
  // full roster rather than crashing or showing nothing.
  const source = pool.length > 0 ? pool : CREATURE_ROSTER
  const index = (year * 53 + weekNum - 1) % source.length
  return source[index] ?? source[0]!
}

export function useCreatureOfWeek(excludeKingdoms?: ReadonlySet<string>): CreatureRosterItem {
  const [timezone, setTimezone] = useState(() => detectDeviceTimezone())

  useEffect(() => {
    void loadTimezone().then(setTimezone)
  }, [])

  return useMemo(() => getCreatureOfWeek(timezone, excludeKingdoms), [timezone, excludeKingdoms])
}

export interface WeekMeta {
  week: number
  year: number
  key: string // claim key stored in profiles.claimed_quests
  label: string // postmark label, e.g. 'WK 26 2026'
}

export function getWeekMeta(timezone: string): WeekMeta {
  const localDate = getLocalDateInTimezone(timezone)
  const week = isoWeekNumber(localDate)
  const year = localDate.getFullYear()
  return { week, year, key: `cotw:${year}-W${week}`, label: `WK ${week} ${year}` }
}

export function useCreatureWeekMeta(): WeekMeta {
  const [timezone, setTimezone] = useState(() => detectDeviceTimezone())

  useEffect(() => {
    void loadTimezone().then(setTimezone)
  }, [])

  return useMemo(() => getWeekMeta(timezone), [timezone])
}
