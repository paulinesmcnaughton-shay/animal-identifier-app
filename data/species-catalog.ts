import type { KingdomKey } from '@/design/atoms/KingdomBadge'

export type SpeciesRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare'

export interface SpeciesStat {
  label: string
  value: number
  color: string
}

export interface SpeciesVital {
  label: string
  value: string
  icon: 'resize' | 'flash' | 'heart' | 'leaf'
  tint: string
  iconColor: string
}

export interface SpeciesTaxonomy {
  kingdom: string
  phylum: string
  class: string
  order: string
  family: string
}

export interface SpeciesDetail {
  id: string
  dexNumber: string
  commonName: string
  latinName: string
  kingdom: KingdomKey
  rarity: SpeciesRarity
  conservation: string
  region: string
  sounds: boolean
  description: string
  gradient: readonly [string, string]
  spottedAt?: string
  stats: SpeciesStat[]
  vitals: SpeciesVital[]
  taxonomy: SpeciesTaxonomy
}

const FOX: SpeciesDetail = {
  id: '1',
  dexNumber: '#012',
  commonName: 'Red Fox',
  latinName: 'Vulpes vulpes',
  kingdom: 'mammal',
  rarity: 'Uncommon',
  conservation: 'Least Concern',
  region: 'North America, Europe',
  sounds: true,
  description: 'Mostly nocturnal and famously clever. Listen for a sharp bark at dusk near woodland edges.',
  gradient: ['#FFB088', '#FF6B5B'],
  spottedAt: 'Today',
  stats: [
    { label: 'SPEED', value: 72, color: '#FF6B5B' },
    { label: 'STAMINA', value: 85, color: '#1a3d2b' },
    { label: 'SIZE', value: 38, color: '#FFC93C' },
    { label: 'RARITY', value: 58, color: '#A855F7' },
  ],
  vitals: [
    { label: 'LENGTH', value: '45–90 cm body', icon: 'resize', tint: '#F5EBDC', iconColor: '#92633A' },
    { label: 'TOP SPEED', value: '50 km/h', icon: 'flash', tint: '#FFEBEB', iconColor: '#FF6B5B' },
    { label: 'LIFESPAN', value: '3–4 years wild', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
    { label: 'DIET', value: 'Omnivore', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
  ],
  taxonomy: {
    kingdom: 'Animalia',
    phylum: 'Chordata',
    class: 'Mammalia',
    order: 'Carnivora',
    family: 'Canidae',
  },
}

const MONARCH: SpeciesDetail = {
  id: '3',
  dexNumber: '#047',
  commonName: 'Monarch Butterfly',
  latinName: 'Danaus plexippus',
  kingdom: 'insect',
  rarity: 'Uncommon',
  conservation: 'Endangered',
  region: 'Americas',
  sounds: false,
  description: 'Iconic orange-and-black migrant. Milkweed patches are the best places to spot them.',
  gradient: ['#FFB347', '#E85D04'],
  spottedAt: '3d ago',
  stats: [
    { label: 'SPEED', value: 45, color: '#FF6B5B' },
    { label: 'STAMINA', value: 92, color: '#1a3d2b' },
    { label: 'SIZE', value: 20, color: '#FFC93C' },
    { label: 'RARITY', value: 66, color: '#A855F7' },
  ],
  vitals: [
    { label: 'WINGSPAN', value: '8.9–10.2 cm wingspan', icon: 'resize', tint: '#ECF7D6', iconColor: '#65A30D' },
    { label: 'TOP SPEED', value: '19 km/h', icon: 'flash', tint: '#FFEBEB', iconColor: '#FF6B5B' },
    { label: 'LIFESPAN', value: '2–6 weeks', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
    { label: 'DIET', value: 'Nectar', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
  ],
  taxonomy: {
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    class: 'Insecta',
    order: 'Lepidoptera',
    family: 'Nymphalidae',
  },
}

export const SPECIES_CATALOG: Record<string, SpeciesDetail> = {
  '1': FOX,
  fox: FOX,
  '2': {
    id: '2',
    dexNumber: '#089',
    commonName: 'Robin',
    latinName: 'Erithacus rubecula',
    kingdom: 'bird',
    rarity: 'Common',
    conservation: 'Least Concern',
    region: 'Europe, Western Asia',
    sounds: true,
    description: 'Territorial songster with a bright orange breast. Often the first bird you hear at dawn.',
    gradient: ['#52b788', '#1a3d2b'],
    spottedAt: 'Yesterday',
    stats: [
      { label: 'SPEED', value: 55, color: '#FF6B5B' },
      { label: 'STAMINA', value: 70, color: '#1a3d2b' },
      { label: 'SIZE', value: 18, color: '#FFC93C' },
      { label: 'RARITY', value: 40, color: '#A855F7' },
    ],
    vitals: [
      { label: 'LENGTH', value: '12–14 cm', icon: 'resize', tint: '#DEF1F8', iconColor: '#2A8FB8' },
      { label: 'TOP SPEED', value: '25 km/h', icon: 'flash', tint: '#FFEBEB', iconColor: '#FF6B5B' },
      { label: 'LIFESPAN', value: '1–2 years', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
      { label: 'DIET', value: 'Insects, berries', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
    ],
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Aves',
      order: 'Passeriformes',
      family: 'Muscicapidae',
    },
  },
  '3': MONARCH,
  monarch: MONARCH,
  gecko: {
    id: 'gecko',
    dexNumber: '#054',
    commonName: 'Crested Gecko',
    latinName: 'Correlophus ciliatus',
    kingdom: 'reptile',
    rarity: 'Uncommon',
    conservation: 'Vulnerable',
    region: 'New Caledonia',
    sounds: false,
    description:
      'Look up — they cling to leaves and branches with sticky toe pads. Active at dusk in warm, humid spots.',
    gradient: ['#A4DE3A', '#6BAE1A'],
    stats: [
      { label: 'SPEED', value: 42, color: '#FF6B5B' },
      { label: 'STAMINA', value: 68, color: '#52b788' },
      { label: 'SIZE', value: 22, color: '#FFC93C' },
      { label: 'RARITY', value: 62, color: '#A855F7' },
    ],
    vitals: [
      { label: 'LENGTH', value: '15–20 cm', icon: 'resize', tint: '#D8F4E8', iconColor: '#0E8F65' },
      { label: 'TOP SPEED', value: 'Slow climber', icon: 'flash', tint: '#FFEBEB', iconColor: '#FF6B5B' },
      { label: 'LIFESPAN', value: '15–20 years', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
      { label: 'DIET', value: 'Insects, fruit', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
    ],
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Reptilia',
      order: 'Squamata',
      family: 'Diplodactylidae',
    },
  },
  corgi: {
    id: 'corgi',
    dexNumber: '#148',
    commonName: 'Pembroke Welsh Corgi',
    latinName: 'Canis lupus familiaris',
    kingdom: 'mammal',
    rarity: 'Common',
    conservation: 'Domestic',
    region: 'Worldwide (companion)',
    sounds: true,
    description: 'Short legs, big personality. Bred as a herding dog in Wales.',
    gradient: ['#E8C4A0', '#C28A52'],
    stats: [
      { label: 'SPEED', value: 48, color: '#FF6B5B' },
      { label: 'STAMINA', value: 78, color: '#1a3d2b' },
      { label: 'SIZE', value: 28, color: '#FFC93C' },
      { label: 'RARITY', value: 35, color: '#A855F7' },
    ],
    vitals: [
      { label: 'HEIGHT', value: '25–30 cm at shoulder', icon: 'resize', tint: '#F5EBDC', iconColor: '#92633A' },
      { label: 'TOP SPEED', value: '35 km/h', icon: 'flash', tint: '#FFEBEB', iconColor: '#FF6B5B' },
      { label: 'LIFESPAN', value: '12–15 years', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
      { label: 'DIET', value: 'Omnivore', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
    ],
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Mammalia',
      order: 'Carnivora',
      family: 'Canidae',
    },
  },
}

export function slugifySpeciesName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function resolveRouteParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0) return value[0]
  return undefined
}

export function getSpeciesDetail(
  id: string,
  overrides?: Partial<SpeciesDetail>,
): SpeciesDetail {
  const slug = overrides?.commonName ? slugifySpeciesName(overrides.commonName) : ''
  const found = SPECIES_CATALOG[id] ?? (slug ? SPECIES_CATALOG[slug] : undefined)

  if (found) {
    return {
      ...found,
      ...overrides,
      id: found.id,
      commonName: overrides?.commonName ?? found.commonName,
      dexNumber: overrides?.dexNumber ?? found.dexNumber,
      kingdom: overrides?.kingdom ?? found.kingdom,
    }
  }

  const commonName = overrides?.commonName ?? id.replace(/-/g, ' ')
  return {
    id,
    dexNumber: overrides?.dexNumber ?? '#???',
    commonName,
    latinName: overrides?.latinName ?? 'Species unknown',
    kingdom: overrides?.kingdom ?? 'mammal',
    rarity: overrides?.rarity ?? 'Common',
    conservation: overrides?.conservation ?? 'Unknown',
    region: overrides?.region ?? 'Unknown',
    sounds: overrides?.sounds ?? false,
    description:
      overrides?.description ??
      'A new entry for your Wild Dex. Keep exploring to learn more about this creature.',
    gradient: overrides?.gradient ?? ['#A8D8EA', '#5BC0EB'],
    spottedAt: overrides?.spottedAt ?? 'Just now',
    stats: overrides?.stats ?? [
      { label: 'SPEED', value: 50, color: '#FF6B5B' },
      { label: 'STAMINA', value: 50, color: '#1a3d2b' },
      { label: 'SIZE', value: 50, color: '#FFC93C' },
      { label: 'RARITY', value: 50, color: '#A855F7' },
    ],
    vitals: overrides?.vitals ?? [
      { label: 'NOTES', value: 'More data coming soon', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
      { label: 'REGION', value: 'Unknown', icon: 'resize', tint: '#DEF1F8', iconColor: '#2A8FB8' },
      { label: 'LIFESPAN', value: 'Unknown', icon: 'heart', tint: '#EDE0FB', iconColor: '#A855F7' },
      { label: 'DIET', value: 'Unknown', icon: 'leaf', tint: '#ECF7D6', iconColor: '#65A30D' },
    ],
    taxonomy: overrides?.taxonomy ?? {
      kingdom: 'Animalia',
      phylum: 'Unknown',
      class: 'Unknown',
      order: 'Unknown',
      family: 'Unknown',
    },
  }
}
