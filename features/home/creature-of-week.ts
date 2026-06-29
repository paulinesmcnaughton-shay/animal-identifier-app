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

export function getCreatureOfWeek(timezone: string): CreatureRosterItem {
  const localDate = getLocalDateInTimezone(timezone)
  const weekNum = isoWeekNumber(localDate)
  const year = localDate.getFullYear()
  const index = (year * 53 + weekNum - 1) % CREATURE_ROSTER.length
  return CREATURE_ROSTER[index] ?? CREATURE_ROSTER[0]!
}

export function useCreatureOfWeek(): CreatureRosterItem {
  const [timezone, setTimezone] = useState(() => detectDeviceTimezone())

  useEffect(() => {
    void loadTimezone().then(setTimezone)
  }, [])

  return useMemo(() => getCreatureOfWeek(timezone), [timezone])
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
