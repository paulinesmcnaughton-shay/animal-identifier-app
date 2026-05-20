import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors } from '@/design/tokens'
import type { SpeciesDetail, SpeciesRarity, SpeciesStat, SpeciesVital } from '@/data/species-catalog'
import type { Database } from '@/lib/supabase/database.types'

export type DomesticSpeciesRow = Database['public']['Tables']['domestic_species']['Row']

const KINGDOM_CLASS_TO_KEY: Record<string, KingdomKey> = {
  mammalia: 'mammal',
  aves: 'bird',
  reptilia: 'reptile',
  amphibia: 'amphibian',
  actinopterygii: 'fish',
  insecta: 'insect',
  arachnida: 'arachnid',
  gastropoda: 'mollusc',
  mammal: 'mammal',
  bird: 'bird',
  reptile: 'reptile',
  amphibian: 'amphibian',
  fish: 'fish',
  insect: 'insect',
  arachnid: 'arachnid',
  mollusc: 'mollusc',
}

function kingdomFromClass(value: string | null): KingdomKey {
  if (!value) return 'mammal'
  const key = KINGDOM_CLASS_TO_KEY[value.trim().toLowerCase()]
  return key ?? 'mammal'
}

function rarityFromScore(score: number | null): SpeciesRarity {
  if (score === null || score === undefined) return 'Common'
  if (score >= 85) return 'Very Rare'
  if (score >= 65) return 'Rare'
  if (score >= 40) return 'Uncommon'
  return 'Common'
}

function statValue(value: number | null, fallback = 50): number {
  if (value === null || value === undefined) return fallback
  return Math.min(100, Math.max(0, value))
}

export function mapDomesticSpeciesRowToDetail(row: DomesticSpeciesRow): SpeciesDetail {
  const kingdomKey = kingdomFromClass(row.kingdom)
  const stats: SpeciesStat[] = [
    { label: 'SPEED', value: statValue(row.speed), color: colors.coral },
    { label: 'STAMINA', value: statValue(row.stamina), color: colors.green },
    { label: 'SIZE', value: statValue(row.size), color: colors.sun },
    { label: 'RARITY', value: statValue(row.rarity), color: colors.plum },
  ]

  const vitals: SpeciesVital[] = []
  if (row.top_speed) {
    vitals.push({
      label: 'TOP SPEED',
      value: row.top_speed,
      icon: 'flash',
      tint: '#FFEBEB',
      iconColor: colors.coral,
    })
  }
  if (row.lifespan) {
    vitals.push({
      label: 'LIFESPAN',
      value: row.lifespan,
      icon: 'heart',
      tint: '#EDE0FB',
      iconColor: colors.plum,
    })
  }
  if (row.diet) {
    vitals.push({
      label: 'DIET',
      value: row.diet,
      icon: 'leaf',
      tint: '#ECF7D6',
      iconColor: colors.greenLight,
    })
  }
  if (row.region) {
    vitals.push({
      label: 'REGION',
      value: row.region,
      icon: 'resize',
      tint: '#DEF1F8',
      iconColor: colors.skyDeep,
    })
  }

  const taxonomicClass = row.kingdom ?? 'Mammalia'

  return {
    id: row.id,
    dexNumber: row.dex_number,
    commonName: row.common_name,
    latinName: row.latin_name ?? 'Species unknown',
    kingdom: kingdomKey,
    rarity: rarityFromScore(row.rarity),
    conservation: 'Unknown',
    region: row.region ?? 'Unknown',
    sounds: false,
    description: row.region
      ? `Often spotted in ${row.region}. A familiar face in the Wild Dex.`
      : 'A familiar face in the Wild Dex.',
    gradient: ['#F5EBDC', '#C28A52'],
    stats,
    vitals,
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: taxonomicClass,
      order: 'Unknown',
      family: 'Unknown',
    },
  }
}
