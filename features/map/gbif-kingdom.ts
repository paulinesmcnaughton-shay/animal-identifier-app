import type { KingdomKey } from '@/design/atoms/KingdomBadge'

const CLASS_TO_KINGDOM: Record<string, KingdomKey> = {
  Aves: 'bird',
  Mammalia: 'mammal',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Amphibia: 'amphibian',
  Reptilia: 'reptile',
  Actinopterygii: 'fish',
  Chondrichthyes: 'fish',
  Gastropoda: 'mollusc',
  Bivalvia: 'mollusc',
  Cephalopoda: 'mollusc',
}

export function kingdomFromGbifTaxonomy(taxonomy: {
  class?: string | null
  order?: string | null
  phylum?: string | null
}): KingdomKey {
  const className = taxonomy.class?.trim()
  if (className && CLASS_TO_KINGDOM[className]) {
    return CLASS_TO_KINGDOM[className]
  }

  const order = taxonomy.order?.trim().toLowerCase() ?? ''
  if (order.includes('lepidoptera') || order.includes('diptera') || order.includes('hymenoptera')) {
    return 'insect'
  }

  return 'mammal'
}
