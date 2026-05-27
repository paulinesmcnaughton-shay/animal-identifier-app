import { useEffect, useMemo, useState } from 'react'

import { getDexNumberForSpeciesId } from '@/features/species/dex-number-registry'
import {
  detectDeviceTimezone,
  loadTimezone,
} from '@/features/settings/timezone-preference'

export interface CreatureRosterItem {
  id: string
  commonName: string
  scientificName: string
  kingdom: string
  dexNumber: string
  description: string
  bonusXp: number
  heroImage: number
}

function dexNum(id: string): string {
  return getDexNumberForSpeciesId(id) ?? '#???'
}

export const CREATURE_ROSTER: CreatureRosterItem[] = [
  {
    id: 'gecko',
    commonName: 'Crested Gecko',
    scientificName: 'Correlophus ciliatus',
    kingdom: 'Reptile',
    dexNumber: dexNum('gecko'),
    description: 'Look up — they cling to leaves and branches with sticky toe pads. Active at dusk in warm, humid spots.',
    bonusXp: 20,
    heroImage: require('@/assets/images/crested_gecko_faq.webp'),
  },
  {
    id: 'fox',
    commonName: 'Red Fox',
    scientificName: 'Vulpes vulpes',
    kingdom: 'Mammal',
    dexNumber: dexNum('fox'),
    description: 'Adaptable and cunning, red foxes thrive across forests, fields, and city parks. Most active at dawn and dusk.',
    bonusXp: 25,
    heroImage: require('@/assets/images/red-fox-hero.jpg'),
  },
  {
    id: 'monarch',
    commonName: 'Monarch Butterfly',
    scientificName: 'Danaus plexippus',
    kingdom: 'Insect',
    dexNumber: dexNum('monarch'),
    description: 'One of the great migrators — travels thousands of miles each year. Look for them near milkweed in summer.',
    bonusXp: 30,
    heroImage: require('@/assets/images/crested-gecko-featured.jpg'),
  },
  {
    id: 'cardinal',
    commonName: 'Northern Cardinal',
    scientificName: 'Cardinalis cardinalis',
    kingdom: 'Bird',
    dexNumber: dexNum('cardinal'),
    description: 'The male\'s vivid red plumage is unmistakable. Year-round resident — listen for their loud, clear whistle at dawn.',
    bonusXp: 20,
    heroImage: require('@/assets/images/crested-gecko-featured.jpg'),
  },
  {
    id: 'frog',
    commonName: 'Green Tree Frog',
    scientificName: 'Hyla cinerea',
    kingdom: 'Amphibian',
    dexNumber: dexNum('frog'),
    description: 'Found clinging to reeds and leaves near still water. Their bright green skin blends perfectly into foliage.',
    bonusXp: 20,
    heroImage: require('@/assets/images/crested_gecko_faq.webp'),
  },
  {
    id: 'owl',
    commonName: 'Barn Owl',
    scientificName: 'Tyto alba',
    kingdom: 'Bird',
    dexNumber: dexNum('owl'),
    description: 'Silent flier with a heart-shaped face. Hunts by sound alone in total darkness — a true night predator.',
    bonusXp: 35,
    heroImage: require('@/assets/images/crested-gecko-featured.jpg'),
  },
  {
    id: 'bumblebee',
    commonName: 'Common Bumble Bee',
    scientificName: 'Bombus terrestris',
    kingdom: 'Insect',
    dexNumber: dexNum('bumblebee'),
    description: 'Vital pollinators with a distinctive buzz. Spot them hovering over flowers in gardens and meadows.',
    bonusXp: 20,
    heroImage: require('@/assets/images/crested_gecko_faq.webp'),
  },
  {
    id: 'turtle',
    commonName: 'Eastern Box Turtle',
    scientificName: 'Terrapene carolina',
    kingdom: 'Reptile',
    dexNumber: dexNum('turtle'),
    description: 'Their domed shell closes completely for protection. Move slowly through leaf litter in moist woodlands.',
    bonusXp: 25,
    heroImage: require('@/assets/images/crested_gecko_faq.webp'),
  },
]

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
