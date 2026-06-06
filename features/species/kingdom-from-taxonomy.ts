import type { KingdomKey } from '@/design/atoms/KingdomBadge'

const TREE_RE =
  /\b(tree|trees|oak|maple|pine|cedar|spruce|fir|birch|ash|elm|willow|palm|beech|walnut|chestnut|poplar|larch|yew|holly|boxwood|buxus|privet|hedge|shrub|bush|conifer|sycamore|redwood|sequoia|cypress|juniper|alder|hornbeam|acacia|eucalyptus|baobab|fig|mulberry|bamboo|cactus|succulent)\b/i

const FLOWER_RE =
  /\b(flower|flowers|rose|tulip|daisy|sunflower|lily|orchid|peony|carnation|daffodil|hydrangea|lavender|poppy|iris|chrysanthemum|marigold|zinnia|dahlia|aster|blossom|violet|pansy|geranium|begonia|petunia|foxglove|snapdragon|lupin|buttercup|dandelion|clover|heather|bluebell|primrose|crocus|hyacinth|freesia|jasmine|camellia|azalea|rhododendron|wisteria|bougainvillea|hibiscus|magnolia|cosmos|verbena|lobelia)\b/i

export function classifyPlantType(commonName: string, latinName?: string): 'tree' | 'flower' | 'plant' {
  const text = `${commonName} ${latinName ?? ''}`
  if (FLOWER_RE.test(text)) return 'flower'
  if (TREE_RE.test(text)) return 'tree'
  return 'plant'
}

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
  fungi: 'fungi',
  fungus: 'fungi',
  basidiomycota: 'fungi',
  ascomycota: 'fungi',
  mushroom: 'fungi',
}

export function kingdomKeyFromTaxonomy(value: string | null | undefined): KingdomKey {
  if (!value) return 'mammal'
  const normalized = value.trim().toLowerCase()
  // Fungi must resolve before plant — some systems list fungi under Plantae but they are distinct
  if (normalized.includes('fung') || normalized.includes('basidiomyc') || normalized.includes('ascomyc') || normalized.includes('mycel')) return 'fungi'
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
