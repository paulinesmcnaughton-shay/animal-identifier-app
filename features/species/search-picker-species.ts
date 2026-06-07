import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { kingdomKeyFromTaxonomy } from '@/features/species/kingdom-from-taxonomy'
import type { PickerKingdomFilter } from '@/features/species/picker-kingdom-tabs'
import { matchesPickerKingdom } from '@/features/species/picker-kingdom-tabs'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface PickerSpeciesItem {
  id: string
  commonName: string
  latinName: string
  kingdom: KingdomKey
  taxonomyKingdom: string | null
  imageUrl: string | null
  isDomestic: boolean
  dexNumber?: string
  gradient: readonly [string, string]
}

const INAT_ICONIC_MAP: Record<string, KingdomKey> = {
  Animalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Plantae: 'plant',
  Fungi: 'fungi',
}

interface InatTaxon {
  id: number
  name?: string
  preferred_common_name?: string
  default_photo?: { medium_url?: string; square_url?: string }
  iconic_taxon_name?: string
}

function mapDomesticRow(row: {
  id: string
  common_name: string
  latin_name: string | null
  kingdom: string | null
  dex_number: string
  reference_image_url: string | null
}): PickerSpeciesItem {
  const taxonomyKingdom = row.kingdom
  if (__DEV__) {
    console.log('RAW RESULT IMAGE FIELDS (domestic)', {
      name: row.common_name,
      dexNum: row.dex_number,
      reference_image_url: row.reference_image_url,
    })
  }
  return {
    id: row.id,
    commonName: row.common_name,
    latinName: row.latin_name ?? '',
    kingdom: kingdomKeyFromTaxonomy(taxonomyKingdom),
    taxonomyKingdom,
    imageUrl: row.reference_image_url,
    isDomestic: true,
    dexNumber: row.dex_number,
    gradient: ['#F5EBDC', '#C28A52'],
  }
}

function mapInatTaxon(taxon: InatTaxon): PickerSpeciesItem {
  const iconic = taxon.iconic_taxon_name ?? 'Animalia'
  const taxonomyKingdom = iconic
  const kingdom = INAT_ICONIC_MAP[iconic] ?? 'mammal'
  const commonName = taxon.preferred_common_name?.trim() || taxon.name?.trim() || 'Unknown'
  const imageUrl = taxon.default_photo?.medium_url ?? taxon.default_photo?.square_url ?? null
  if (__DEV__) {
    console.log('RAW RESULT IMAGE FIELDS (inat)', {
      name: commonName,
      taxonId: taxon.id,
      iconic_taxon_name: iconic,
      kingdom,
      medium_url: taxon.default_photo?.medium_url ?? null,
      square_url: taxon.default_photo?.square_url ?? null,
      imageUrl,
    })
  }
  return {
    id: `inat-${taxon.id}`,
    commonName,
    latinName: taxon.name ?? '',
    kingdom,
    taxonomyKingdom,
    imageUrl,
    isDomestic: false,
    gradient: ['#A8D8EA', '#5BC0EB'],
  }
}

function dedupeItems(items: PickerSpeciesItem[]): PickerSpeciesItem[] {
  const seen = new Set<string>()
  const unique: PickerSpeciesItem[] = []
  for (const item of items) {
    const key = item.commonName.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }
  return unique
}

function filterByKingdom(items: PickerSpeciesItem[], kingdom: PickerKingdomFilter): PickerSpeciesItem[] {
  return items.filter((item) => matchesPickerKingdom(kingdom, item.kingdom, item.taxonomyKingdom))
}

const BROWSE_ICONIC: Record<PickerKingdomFilter, string | null> = {
  all:       null,
  mammal:    'Mammalia',
  bird:      'Aves',
  reptile:   'Reptilia',
  amphibian: 'Amphibia',
  fish:      'Actinopterygii',
  insect:    'Insecta',
  arachnid:  'Arachnida',
  mollusc:   'Mollusca',
  plant:     'Plantae',
  tree:      'Plantae',
  flower:    'Plantae',
  fungi:     'Fungi',
}

const BROWSE_KEYWORD: Partial<Record<PickerKingdomFilter, string>> = {
  tree:   'tree',
  flower: 'wildflower',
  fungi:  'mushroom',
}

// When the user types a category/kingdom word, browse that whole category instead
// of a free-text iNat search. Stops "fungi" matching the coral genus *Fungia*
// (and similar) and returns the right category with correct tags.
const CATEGORY_QUERY_TO_FILTER: Record<string, PickerKingdomFilter> = {
  fungi: 'fungi', fungus: 'fungi', funghi: 'fungi', mushroom: 'fungi', mushrooms: 'fungi', toadstool: 'fungi',
  plant: 'plant', plants: 'plant',
  tree: 'tree', trees: 'tree',
  flower: 'flower', flowers: 'flower', wildflower: 'flower', wildflowers: 'flower',
  bird: 'bird', birds: 'bird',
  mammal: 'mammal', mammals: 'mammal',
  insect: 'insect', insects: 'insect', bug: 'insect', bugs: 'insect',
  reptile: 'reptile', reptiles: 'reptile',
  amphibian: 'amphibian', amphibians: 'amphibian',
  fish: 'fish', fishes: 'fish',
  arachnid: 'arachnid', arachnids: 'arachnid',
  mollusc: 'mollusc', molluscs: 'mollusc', mollusk: 'mollusc', mollusks: 'mollusc',
}

async function searchInatBrowse(kingdom: PickerKingdomFilter): Promise<PickerSpeciesItem[]> {
  const iconic = BROWSE_ICONIC[kingdom]
  const keyword = BROWSE_KEYWORD[kingdom]

  let url = `https://api.inaturalist.org/v1/taxa?order_by=observations_count&order=desc&rank=species&per_page=30`
  if (iconic) url += `&iconic_taxa=${iconic}`
  if (keyword) url += `&q=${encodeURIComponent(keyword)}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = (await res.json()) as { results?: InatTaxon[] }
    return (json.results ?? []).map(mapInatTaxon)
  } catch {
    return []
  }
}

async function searchDomestic(query: string): Promise<PickerSpeciesItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const trimmed = query.trim()
  let request = supabase.from('domestic_species').select('*').order('common_name').limit(40)

  if (trimmed.length > 0) {
    request = supabase
      .from('domestic_species')
      .select('*')
      .or(`common_name.ilike.%${trimmed}%,latin_name.ilike.%${trimmed}%`)
      .order('common_name')
      .limit(40)
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapDomesticRow)
}

async function searchInaturalist(query: string): Promise<PickerSpeciesItem[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(trimmed)}&per_page=24&rank=species,subspecies,variety,hybrid`
  const res = await fetch(url)
  if (!res.ok) return []

  const json = (await res.json()) as { results?: InatTaxon[] }
  return (json.results ?? []).map(mapInatTaxon)
}

export async function searchPickerSpecies(
  query: string,
  kingdomFilter: PickerKingdomFilter,
): Promise<PickerSpeciesItem[]> {
  const trimmed = query.trim()
  const categoryFilter = CATEGORY_QUERY_TO_FILTER[trimmed.toLowerCase()]
  const [domestic, wild] = await Promise.all([
    searchDomestic(trimmed),
    categoryFilter
      ? searchInatBrowse(categoryFilter)
      : trimmed.length >= 2
        ? searchInaturalist(trimmed)
        : searchInatBrowse(kingdomFilter),
  ])

  const merged = dedupeItems([...domestic, ...wild])
  // A category-word search ("fungi") implies its own kingdom — don't also apply
  // the chip filter (usually 'all'), which already keeps everything.
  return filterByKingdom(merged, categoryFilter ?? kingdomFilter)
}

export function pickerItemToLookupId(item: PickerSpeciesItem): string {
  if (item.isDomestic && item.dexNumber) return item.dexNumber
  if (item.isDomestic) return item.id
  if (item.id.startsWith('inat-')) return item.id
  return slugifySpeciesName(item.commonName)
}
