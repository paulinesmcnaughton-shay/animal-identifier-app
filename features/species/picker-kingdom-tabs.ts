import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { KINGDOM } from '@/design/atoms/KingdomBadge'
import { colors } from '@/design/tokens'
import { isFungiTaxonomy } from '@/features/species/kingdom-from-taxonomy'

export type PickerKingdomFilter = 'all' | KingdomKey | 'fungi'

export interface PickerKingdomTab {
  id: PickerKingdomFilter
  label: string
  color: string
  tint: string
}

export const PICKER_KINGDOM_TABS: PickerKingdomTab[] = [
  { id: 'all', label: 'All', color: colors.ink2, tint: colors.hairline },
  { id: 'mammal', label: 'Mammal', color: KINGDOM.mammal.bg, tint: '#F5EBDC' },
  { id: 'bird', label: 'Bird', color: KINGDOM.bird.bg, tint: '#DEF1F8' },
  { id: 'insect', label: 'Insect', color: KINGDOM.insect.bg, tint: '#FFF3D6' },
  { id: 'reptile', label: 'Reptile', color: KINGDOM.reptile.bg, tint: '#D8F4E8' },
  { id: 'amphibian', label: 'Amphibian', color: KINGDOM.amphibian.bg, tint: '#ECF7D6' },
  { id: 'fish', label: 'Fish', color: KINGDOM.fish.bg, tint: '#EDE0FB' },
  { id: 'plant', label: 'Plant', color: KINGDOM.plant.bg, tint: '#ECF7D6' },
  { id: 'fungi', label: 'Fungi', color: colors.plum, tint: '#EDE0FB' },
]

export function matchesPickerKingdom(
  filter: PickerKingdomFilter,
  kingdom: KingdomKey,
  taxonomyKingdom?: string | null,
): boolean {
  if (filter === 'all') return true
  if (filter === 'fungi') return isFungiTaxonomy(taxonomyKingdom)
  if (filter === 'plant') return kingdom === 'plant' || kingdom === 'tree' || kingdom === 'flower'
  return kingdom === filter
}
