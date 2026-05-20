import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import type { IdentResult } from '@/features/identify/types'

export type DexCatalog = 'wild' | 'domestic' | 'farm' | 'plant'

const PLACEHOLDER_DEX_NUMBERS = new Set(['#???', '#??', '???', ''])

export function isPlaceholderDexNumber(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_DEX_NUMBERS.has(value.trim())
}

const WILD_DEX_RE = /^#\d{3,5}$/
const DOMESTIC_DEX_RE = /^D\d{3,5}$/i
const FARM_DEX_RE = /^F\d{3}$/i
const PLANT_DEX_RE = /^P\d{3,5}$/i

const FARM_SPECIES_IDS = new Set([
  'horse',
  'cow',
  'sheep',
  'pig',
  'goat',
  'chicken',
  'duck',
  'rabbit',
])

/**
 * Canonical assignments — one dex number per species.
 * Alternate keys (aliases) may point at the same entry; numbers never repeat across entries.
 */
const CURATED_ASSIGNMENTS = [
  {
    dexNumber: '#003',
    speciesIds: ['cardinal'],
    commonNames: ['cardinal', 'northern cardinal'],
    latinNames: ['cardinalis cardinalis'],
    inatTaxonIds: [9083],
  },
  {
    dexNumber: '#012',
    speciesIds: ['fox', 'red-fox'],
    commonNames: ['red fox'],
    latinNames: ['vulpes vulpes'],
    inatTaxonIds: [42197],
  },
  {
    dexNumber: '#015',
    speciesIds: ['deer', 'white-tailed-deer'],
    commonNames: ['white-tailed deer'],
    latinNames: ['odocoileus virginianus'],
    inatTaxonIds: [42163],
  },
  {
    dexNumber: '#021',
    speciesIds: ['owl', 'barn-owl'],
    commonNames: ['barn owl'],
    latinNames: ['tyto alba'],
    inatTaxonIds: [73405],
  },
  {
    dexNumber: '#028',
    speciesIds: ['squirrel'],
    commonNames: ['squirrel', 'eastern gray squirrel'],
    latinNames: ['sciurus carolinensis'],
    inatTaxonIds: [46017],
  },
  {
    dexNumber: '#031',
    speciesIds: ['bumblebee'],
    commonNames: ['bumblebee', 'buff-tailed bumblebee'],
    latinNames: ['bombus terrestris'],
    inatTaxonIds: [52763],
  },
  {
    dexNumber: '#047',
    speciesIds: ['monarch', 'monarch-butterfly'],
    commonNames: ['monarch', 'monarch butterfly'],
    latinNames: ['danaus plexippus'],
    inatTaxonIds: [48662],
  },
  {
    dexNumber: '#054',
    speciesIds: ['gecko', 'crested-gecko'],
    commonNames: ['crested gecko'],
    latinNames: ['correlophus ciliatus'],
    inatTaxonIds: [324540],
  },
  {
    dexNumber: '#066',
    speciesIds: ['turtle', 'box-turtle'],
    commonNames: ['box turtle', 'eastern box turtle'],
    latinNames: ['terrapene carolina'],
    inatTaxonIds: [39079],
  },
  {
    dexNumber: '#068',
    speciesIds: ['penguin', 'emperor-penguin'],
    commonNames: ['emperor penguin'],
    latinNames: ['aptenodytes forsteri'],
    inatTaxonIds: [3812],
  },
  {
    dexNumber: '#071',
    speciesIds: ['dolphin'],
    commonNames: ['dolphin', 'common dolphin'],
    latinNames: ['delphinus delphis'],
    inatTaxonIds: [41586],
  },
  {
    dexNumber: '#072',
    speciesIds: ['spider', 'orb-weaver'],
    commonNames: ['orb weaver', 'garden spider'],
    latinNames: [],
    inatTaxonIds: [47922],
  },
  {
    dexNumber: '#088',
    speciesIds: ['frog', 'treefrog'],
    commonNames: ['treefrog', 'tree frog', 'american green tree frog'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: '#089',
    speciesIds: ['robin'],
    commonNames: ['robin', 'european robin'],
    latinNames: ['erithacus rubecula'],
    inatTaxonIds: [127870],
  },
  {
    dexNumber: '#099',
    speciesIds: ['snail', 'garden-snail'],
    commonNames: ['garden snail'],
    latinNames: ['helix aspersa', 'cornu aspersum'],
    inatTaxonIds: [52778],
  },
  {
    dexNumber: 'D001',
    speciesIds: [],
    commonNames: ['mixed breed dog'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D002',
    speciesIds: ['dog-labrador'],
    commonNames: ['labrador', 'labrador retriever'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D003',
    speciesIds: ['dog-golden'],
    commonNames: ['golden retriever'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D005',
    speciesIds: ['dog-french-bulldog'],
    commonNames: ['french bulldog'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D008',
    speciesIds: ['dog-beagle'],
    commonNames: ['beagle'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D012',
    speciesIds: ['corgi'],
    commonNames: ['pembroke welsh corgi', 'welsh corgi'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D016',
    speciesIds: ['dog-husky'],
    commonNames: ['siberian husky', 'husky'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D051',
    speciesIds: [],
    commonNames: ['mixed breed cat'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D054',
    speciesIds: ['cat-tabby'],
    commonNames: ['tabby', 'tabby cat'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D057',
    speciesIds: ['cat-maine-coon'],
    commonNames: ['maine coon'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D081',
    speciesIds: ['hamster'],
    commonNames: ['hamster', 'syrian hamster'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D082',
    speciesIds: ['goldfish'],
    commonNames: ['goldfish'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'D083',
    speciesIds: ['parrot'],
    commonNames: ['macaw', 'scarlet macaw'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F001',
    speciesIds: ['horse'],
    commonNames: ['horse'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F002',
    speciesIds: ['cow'],
    commonNames: ['cow', 'cattle'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F003',
    speciesIds: ['sheep'],
    commonNames: ['sheep'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F004',
    speciesIds: ['pig'],
    commonNames: ['pig'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F005',
    speciesIds: ['goat'],
    commonNames: ['goat'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F006',
    speciesIds: ['chicken'],
    commonNames: ['chicken'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F007',
    speciesIds: ['duck'],
    commonNames: ['duck'],
    latinNames: [],
    inatTaxonIds: [],
  },
  {
    dexNumber: 'F008',
    speciesIds: ['rabbit'],
    commonNames: ['rabbit'],
    latinNames: [],
    inatTaxonIds: [],
  },
] as const

const SPECIES_ID_TO_DEX: Record<string, string> = {}
const COMMON_NAME_TO_DEX: Record<string, string> = {}
const LATIN_NAME_TO_DEX: Record<string, string> = {}
const INAT_TAXON_ID_TO_DEX: Record<number, string> = {}
const ASSIGNED_DEX_NUMBERS = new Set<string>()

for (const entry of CURATED_ASSIGNMENTS) {
  if (ASSIGNED_DEX_NUMBERS.has(entry.dexNumber)) {
    throw new Error(`Duplicate dex number in registry: ${entry.dexNumber}`)
  }
  ASSIGNED_DEX_NUMBERS.add(entry.dexNumber)

  for (const id of entry.speciesIds) {
    const slug = slugifySpeciesName(id)
    SPECIES_ID_TO_DEX[slug] = entry.dexNumber
    SPECIES_ID_TO_DEX[id] = entry.dexNumber
  }
  for (const name of entry.commonNames) {
    COMMON_NAME_TO_DEX[normalizeCommonKey(name)] = entry.dexNumber
  }
  for (const name of entry.latinNames) {
    LATIN_NAME_TO_DEX[normalizeLatinKey(name)] = entry.dexNumber
  }
  for (const taxonId of entry.inatTaxonIds) {
    if (INAT_TAXON_ID_TO_DEX[taxonId]) {
      throw new Error(`Duplicate iNat taxon id in registry: ${taxonId}`)
    }
    INAT_TAXON_ID_TO_DEX[taxonId] = entry.dexNumber
  }
}

export interface DexNumberInput {
  speciesId?: string
  lookupId?: string
  commonName?: string
  latinName?: string
  inatTaxonId?: number
  kingdom?: KingdomKey | null
  isDomestic?: boolean
  dexNumberOverride?: string
}

export function formatDexNumber(catalog: DexCatalog, serial: number): string {
  const n = String(Math.max(1, Math.min(99999, serial))).padStart(3, '0')
  switch (catalog) {
    case 'wild':
      return `#${n}`
    case 'domestic':
      return `D${n}`
    case 'farm':
      return `F${n}`
    case 'plant':
      return `P${n}`
  }
}

/** Unique wild dex from iNat taxon — uses full taxon id so no two species collide. */
function wildDexFromInatTaxonId(taxonId: number): string {
  const curated = INAT_TAXON_ID_TO_DEX[taxonId]
  if (curated) return curated
  return `#${String(taxonId).padStart(5, '0')}`
}

/** Unique plant dex from iNat taxon. */
function plantDexFromInatTaxonId(taxonId: number): string {
  const curated = INAT_TAXON_ID_TO_DEX[taxonId]
  if (curated) return curated
  return `P${String(taxonId).padStart(5, '0')}`
}

export function inatLookupId(taxonId: number): string {
  return `inat-${taxonId}`
}

export function isWildDexNumber(value: string): boolean {
  return WILD_DEX_RE.test(value.trim())
}

export function isDomesticDexNumber(value: string): boolean {
  return DOMESTIC_DEX_RE.test(value.trim())
}

export function isFarmDexNumber(value: string): boolean {
  return FARM_DEX_RE.test(value.trim())
}

export function isPlantDexNumber(value: string): boolean {
  return PLANT_DEX_RE.test(value.trim())
}

export function parseDexCatalog(dexNumber: string): DexCatalog | null {
  const safe = dexNumber.trim()
  if (isWildDexNumber(safe)) return 'wild'
  if (isDomesticDexNumber(safe)) return 'domestic'
  if (isFarmDexNumber(safe)) return 'farm'
  if (isPlantDexNumber(safe)) return 'plant'
  return null
}

export function getDexNumberForSpeciesId(speciesId: string): string | undefined {
  const slug = slugifySpeciesName(speciesId)
  return SPECIES_ID_TO_DEX[slug] ?? SPECIES_ID_TO_DEX[speciesId]
}

function normalizeCommonKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeLatinKey(name: string): string {
  return name.trim().toLowerCase()
}

function lookupBySpeciesId(speciesId: string | undefined): string | undefined {
  if (!speciesId?.trim()) return undefined
  const raw = speciesId.trim()
  const slug = slugifySpeciesName(raw)
  return SPECIES_ID_TO_DEX[raw] ?? SPECIES_ID_TO_DEX[slug]
}

function lookupByCommonName(commonName: string | undefined): string | undefined {
  if (!commonName?.trim()) return undefined
  return COMMON_NAME_TO_DEX[normalizeCommonKey(commonName)]
}

function lookupByLatinName(latinName: string | undefined): string | undefined {
  if (!latinName?.trim()) return undefined
  return LATIN_NAME_TO_DEX[normalizeLatinKey(latinName)]
}

export function dexNumberFromInatTaxonId(
  taxonId: number,
  kingdom?: KingdomKey | null,
): string {
  if (kingdom === 'plant') return plantDexFromInatTaxonId(taxonId)
  return wildDexFromInatTaxonId(taxonId)
}

function inferCatalogFromContext(input: DexNumberInput): DexCatalog {
  if (input.isDomestic) return 'domestic'
  if (input.kingdom === 'plant') return 'plant'

  const id = input.speciesId ?? input.lookupId ?? ''
  if (FARM_SPECIES_IDS.has(slugifySpeciesName(id))) return 'farm'

  const common = input.commonName ? normalizeCommonKey(input.commonName) : ''
  if (/\b(horse|cow|sheep|pig|goat|chicken|duck)\b/.test(common)) return 'farm'

  return 'wild'
}

export function resolveGlobalDexNumber(input: DexNumberInput): string {
  const override = input.dexNumberOverride?.trim()
  if (override && !isPlaceholderDexNumber(override)) return override

  const fromId = lookupBySpeciesId(input.speciesId) ?? lookupBySpeciesId(input.lookupId)
  if (fromId) return fromId

  const fromCommon = lookupByCommonName(input.commonName)
  if (fromCommon) return fromCommon

  const fromLatin = lookupByLatinName(input.latinName)
  if (fromLatin) return fromLatin

  if (input.inatTaxonId != null && Number.isFinite(input.inatTaxonId)) {
    return dexNumberFromInatTaxonId(input.inatTaxonId, input.kingdom)
  }

  const catalog = inferCatalogFromContext(input)

  if (catalog === 'domestic') {
    const mixed = lookupByCommonName(input.commonName)
    if (mixed) return mixed
    return '#???'
  }

  if (catalog === 'farm') {
    const farm = lookupByCommonName(input.commonName) ?? lookupBySpeciesId(input.lookupId)
    if (farm) return farm
    return '#???'
  }

  if (catalog === 'plant') {
    const seed = slugifySpeciesName(input.commonName ?? input.lookupId ?? 'plant')
    const serial = 1 + hashString(`plant:${seed}`)
    const candidate = formatDexNumber('plant', serial)
    if (!ASSIGNED_DEX_NUMBERS.has(candidate)) return candidate
    return `P${String(hashString(seed)).padStart(5, '0').slice(-5)}`
  }

  const seed = slugifySpeciesName(
    input.commonName ?? input.latinName ?? input.lookupId ?? 'unknown',
  )
  const serial = 1 + hashString(`wild:${seed}`)
  const candidate = formatDexNumber('wild', serial)
  if (!ASSIGNED_DEX_NUMBERS.has(candidate)) return candidate

  return '#???'
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash % 99998
}

export function enrichIdentResult(
  result: IdentResult,
  options?: { inatTaxonId?: number },
): IdentResult {
  if (result.dexNumber && !isPlaceholderDexNumber(result.dexNumber)) {
    return result
  }

  const inatTaxonId = options?.inatTaxonId
  const lookupId =
    inatTaxonId != null ? inatLookupId(inatTaxonId) : result.lookupId

  const dexNumber = resolveGlobalDexNumber({
    speciesId: result.lookupId,
    lookupId,
    commonName: result.commonName,
    latinName: result.latinName,
    inatTaxonId,
    kingdom: result.kingdom,
    isDomestic: result.isDomestic,
    dexNumberOverride: result.dexNumber,
  })

  return {
    ...result,
    dexNumber,
    lookupId: lookupId ?? result.lookupId,
  }
}
