import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { KINGDOM } from '@/design/atoms/KingdomBadge'
import { colors } from '@/design/tokens'
import { isFungiTaxonomy } from '@/features/species/kingdom-from-taxonomy'

export type PickerKingdomFilter = 'all' | KingdomKey | 'fungi'

export interface PickerKingdomTab {
  id: PickerKingdomFilter
  label: string
  emoji: string
  color: string
  tint: string
}

export const PICKER_KINGDOM_TABS: PickerKingdomTab[] = [
  { id: 'all',       label: 'All',       emoji: '🌍', color: colors.ink2,             tint: colors.hairline },
  { id: 'mammal',    label: 'Mammal',    emoji: KINGDOM.mammal.emoji,    color: KINGDOM.mammal.bg,    tint: '#F5EBDC' },
  { id: 'bird',      label: 'Bird',      emoji: KINGDOM.bird.emoji,      color: KINGDOM.bird.bg,      tint: '#FFEBEB' },
  { id: 'insect',    label: 'Insect',    emoji: KINGDOM.insect.emoji,    color: KINGDOM.insect.bg,    tint: '#FFF3D6' },
  { id: 'reptile',   label: 'Reptile',   emoji: KINGDOM.reptile.emoji,   color: KINGDOM.reptile.bg,   tint: '#DEF1F8' },
  { id: 'amphibian', label: 'Amphibian', emoji: KINGDOM.amphibian.emoji, color: KINGDOM.amphibian.bg, tint: '#ECF7D6' },
  { id: 'fish',      label: 'Fish',      emoji: KINGDOM.fish.emoji,      color: KINGDOM.fish.bg,      tint: '#EDE0FB' },
  { id: 'plant',     label: 'Plant',     emoji: KINGDOM.plant.emoji,     color: KINGDOM.plant.bg,     tint: '#ECF7D6' },
  { id: 'tree',      label: 'Tree',      emoji: KINGDOM.tree.emoji,      color: KINGDOM.tree.bg,      tint: '#D4EDE1' },
  { id: 'flower',    label: 'Flower',    emoji: KINGDOM.flower.emoji,    color: KINGDOM.flower.bg,    tint: '#FCE7F3' },
  { id: 'arachnid',  label: 'Arachnid',  emoji: KINGDOM.arachnid.emoji,  color: KINGDOM.arachnid.bg,  tint: '#E0E1F8' },
  { id: 'mollusc',   label: 'Mollusc',   emoji: KINGDOM.mollusc.emoji,   color: KINGDOM.mollusc.bg,   tint: '#F5EBDC' },
  { id: 'fungi',     label: 'Fungi',     emoji: '🍄',                    color: colors.plum,          tint: '#EDE0FB' },
]

export function matchesPickerKingdom(
  filter: PickerKingdomFilter,
  kingdom: KingdomKey,
  taxonomyKingdom?: string | null,
): boolean {
  if (filter === 'all') return true
  if (filter === 'fungi') return isFungiTaxonomy(taxonomyKingdom)
  // plant/tree/flower: iNat items come back as 'plant' so include it in all three
  if (filter === 'plant') return kingdom === 'plant' || kingdom === 'tree' || kingdom === 'flower'
  if (filter === 'tree') return kingdom === 'tree' || kingdom === 'plant'
  if (filter === 'flower') return kingdom === 'flower' || kingdom === 'plant'
  return kingdom === filter
}
