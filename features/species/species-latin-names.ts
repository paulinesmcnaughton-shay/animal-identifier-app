import { slugifySpeciesName } from '@/data/species-catalog'

/**
 * Canonical binomial / trinomial names keyed by species id.
 * Single source of truth for mock data, catalog fallbacks, and offline detail.
 */
const SPECIES_LATIN_BY_ID: Record<string, string> = {
  fox: 'Vulpes vulpes',
  gecko: 'Correlophus ciliatus',
  owl: 'Tyto alba',
  monarch: 'Danaus plexippus',
  bumblebee: 'Bombus impatiens',
  deer: 'Odocoileus virginianus',
  squirrel: 'Sciurus carolinensis',
  turtle: 'Terrapene carolina',
  dolphin: 'Delphinus delphis',
  penguin: 'Aptenodytes forsteri',
  cardinal: 'Cardinalis cardinalis',
  frog: 'Hyla cinerea',
  treefrog: 'Hyla cinerea',
  snail: 'Cornu aspersum',
  spider: 'Neoscona crucifera',
  robin: 'Turdus migratorius',
  corgi: 'Canis lupus familiaris',
  'dog-labrador': 'Canis lupus familiaris',
  'dog-golden': 'Canis lupus familiaris',
  'dog-beagle': 'Canis lupus familiaris',
  'dog-french-bulldog': 'Canis lupus familiaris',
  'dog-husky': 'Canis lupus familiaris',
  'cat-tabby': 'Felis catus',
  'cat-maine-coon': 'Felis catus',
  hamster: 'Mesocricetus auratus',
  goldfish: 'Carassius auratus',
  parrot: 'Ara macao',
  horse: 'Equus caballus',
  cow: 'Bos taurus',
  sheep: 'Ovis aries',
  pig: 'Sus scrofa domesticus',
  goat: 'Capra hircus',
  chicken: 'Gallus gallus domesticus',
  duck: 'Anas platyrhynchos domesticus',
  rabbit: 'Oryctolagus cuniculus',
}

/** Accepted synonyms → canonical Latin (lowercase). */
const LATIN_SYNONYMS: Record<string, string> = {
  'helix aspersa': 'Cornu aspersum',
  'canis familiaris': 'Canis lupus familiaris',
}

export function normalizeLatinName(name: string): string {
  return name.trim().toLowerCase()
}

export function getLatinNameForSpeciesId(speciesId: string): string | undefined {
  if (!speciesId.trim()) return undefined
  const slug = slugifySpeciesName(speciesId)
  return SPECIES_LATIN_BY_ID[slug] ?? SPECIES_LATIN_BY_ID[speciesId]
}

export function resolveLatinName(input: {
  speciesId?: string
  commonName?: string
  latinName?: string
}): string | undefined {
  const hint = input.latinName?.trim()
  if (hint) {
    const normalized = normalizeLatinName(hint)
    const canonical = LATIN_SYNONYMS[normalized] ?? hint
    return formatLatinBinomial(canonical)
  }

  const fromId = getLatinNameForSpeciesId(input.speciesId ?? '')
  if (fromId) return fromId

  if (input.commonName?.trim()) {
    const slug = slugifySpeciesName(input.commonName)
    return SPECIES_LATIN_BY_ID[slug]
  }

  return undefined
}

/** Title-case genus + species for display (e.g. "Vulpes vulpes"). */
export function formatLatinBinomial(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part, index) => {
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }
      if (part.toLowerCase() === 'x') return '×'
      return part.toLowerCase()
    })
    .join(' ')
}

export function speciesDetailRouteParams(input: {
  id: string
  name: string
  number: string
  kingdom: string
  latinName?: string
  isDomestic?: boolean
}): Record<string, string> {
  const latin =
    input.latinName ??
    resolveLatinName({ speciesId: input.id, commonName: input.name })

  return {
    id: input.id,
    name: input.name,
    number: input.number,
    kingdom: input.kingdom,
    ...(latin ? { latin } : {}),
    ...(input.isDomestic ? { domestic: '1' } : {}),
  }
}

function isDomesticSpeciesId(speciesId: string): boolean {
  const id = slugifySpeciesName(speciesId)
  return (
    id.startsWith('dog-') ||
    id.startsWith('cat-') ||
    id === 'corgi' ||
    id === 'hamster' ||
    id === 'goldfish' ||
    id === 'parrot'
  )
}

export function speciesDetailRouteParamsFromId(input: {
  id: string
  name: string
  number: string
  kingdom: string
}): Record<string, string> {
  return speciesDetailRouteParams({
    ...input,
    isDomestic: isDomesticSpeciesId(input.id),
  })
}
