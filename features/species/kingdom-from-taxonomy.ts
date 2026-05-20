import type { KingdomKey } from '@/design/atoms/KingdomBadge'

const CLASS_TO_KINGDOM: Record<string, KingdomKey> = {
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
  plantae: 'plant',
  plant: 'plant',
}

export function kingdomKeyFromTaxonomy(value: string | null | undefined): KingdomKey {
  if (!value) return 'mammal'
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('fung')) return 'plant'
  if (normalized.includes('plant')) return 'plant'
  if (normalized.includes('aves') || normalized === 'bird') return 'bird'
  if (normalized.includes('insect')) return 'insect'
  if (normalized.includes('fish') || normalized.includes('actinoptery')) return 'fish'
  if (normalized.includes('reptil')) return 'reptile'
  if (normalized.includes('amphib')) return 'amphibian'
  if (normalized.includes('arachn')) return 'arachnid'
  if (normalized.includes('mollusc') || normalized.includes('gastropod')) return 'mollusc'
  return CLASS_TO_KINGDOM[normalized] ?? 'mammal'
}

export function isFungiTaxonomy(value: string | null | undefined): boolean {
  if (!value) return false
  return value.trim().toLowerCase().includes('fung')
}
