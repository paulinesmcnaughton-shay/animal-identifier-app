import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { CREATURE_ROSTER } from '@/features/home/creature-roster'
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

const GBIF_CLASS_TO_KINGDOM: Partial<Record<string, KingdomKey>> = {
  Mammalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Chondrichthyes: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Bivalvia: 'mollusc',
  Gastropoda: 'mollusc',
}

interface GbifSearchResult {
  key?: number
  canonicalName?: string
  scientificName?: string
  class?: string
  kingdom?: string
  rank?: string
  vernacularNames?: { vernacularName?: string; language?: string }[]
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

function mapGbifResult(r: GbifSearchResult): PickerSpeciesItem {
  const latinName = r.canonicalName?.trim() || r.scientificName?.trim() || ''
  const english = r.vernacularNames?.find(
    (v) => v.language === 'eng' && v.vernacularName?.trim(),
  )?.vernacularName
  const commonName = english?.trim() || latinName || 'Unknown'
  const kingdom: KingdomKey =
    (r.class ? GBIF_CLASS_TO_KINGDOM[r.class] : undefined) ??
    (r.kingdom === 'Plantae' ? 'plant' : 'mammal')
  // Photos resolve separately from Wikipedia/Wikimedia via the reference-image system.
  return {
    id: r.key ? `gbif-${r.key}` : slugifySpeciesName(latinName || commonName),
    commonName,
    latinName,
    kingdom,
    taxonomyKingdom: r.class ?? r.kingdom ?? null,
    imageUrl: null,
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

// Browse uses our own curated Creature roster (fully owned, no external API).
function browseFromRoster(kingdom: PickerKingdomFilter): PickerSpeciesItem[] {
  return CREATURE_ROSTER.filter((c) =>
    matchesPickerKingdom(kingdom, c.kingdom as KingdomKey, c.kingdom),
  )
    .slice(0, 30)
    .map((c) => ({
      id: c.id,
      commonName: c.commonName,
      latinName: c.scientificName,
      kingdom: c.kingdom as KingdomKey,
      taxonomyKingdom: c.kingdom,
      imageUrl: null,
      isDomestic: false,
      dexNumber: c.dexNumber,
      gradient: ['#A8D8EA', '#5BC0EB'] as const,
    }))
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

async function searchGbif(query: string): Promise<PickerSpeciesItem[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(trimmed)}` +
        `&rank=SPECIES&status=ACCEPTED&limit=24`,
    )
    if (!res.ok) return []
    const json = (await res.json()) as { results?: GbifSearchResult[] }
    return (json.results ?? []).map(mapGbifResult)
  } catch {
    return []
  }
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
      ? Promise.resolve(browseFromRoster(categoryFilter))
      : trimmed.length >= 2
        ? searchGbif(trimmed)
        : Promise.resolve(browseFromRoster(kingdomFilter)),
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
