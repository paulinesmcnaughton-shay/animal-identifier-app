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

// The persisted GBIF catalog (public.species) — the authoritative, searchable
// source with stable dex numbers. Animals + fungi + plants.
const CATALOG_KINGDOMS = new Set<string>([
  'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'insect', 'arachnid', 'mollusc',
  'fungi', 'plant',
])

// Tree/flower are stored under 'plant' in the catalog — map filters accordingly.
function catalogKingdomFor(filter: string): string | null {
  if (filter === 'tree' || filter === 'flower') return 'plant'
  return CATALOG_KINGDOMS.has(filter) ? filter : null
}

interface CatalogRow {
  id: string
  common_name: string
  latin_name: string | null
  kingdom: string | null
  dex_number: string | null
  image_url: string | null
}

function mapCatalogRow(row: CatalogRow): PickerSpeciesItem {
  const kingdom = (row.kingdom && CATALOG_KINGDOMS.has(row.kingdom) ? row.kingdom : 'mammal') as KingdomKey
  return {
    id: row.id,
    commonName: row.common_name,
    latinName: row.latin_name ?? '',
    kingdom,
    taxonomyKingdom: row.kingdom,
    imageUrl: row.image_url,
    isDomestic: false,
    dexNumber: row.dex_number ?? undefined,
    gradient: ['#A8D8EA', '#5BC0EB'],
  }
}

const CATALOG_COLUMNS = 'id,common_name,latin_name,kingdom,dex_number,image_url'

// Relevance: a whole-word / prefix match ("African Lion" for "lion") beats a
// mid-word substring ("Dandelion"). Rows arrive pre-sorted by commonness, so a
// stable sort by this tier keeps the most-observed species first within a tier.
function relevanceTier(item: PickerSpeciesItem, q: string): number {
  const name = item.commonName.toLowerCase()
  const latin = item.latinName.toLowerCase()
  if (name === q || latin === q) return 0
  const wordBoundary = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  // Any whole-word match (prefix or mid-name) shares a tier so the most-observed
  // species wins: "African Lion" (18k records) outranks "Lion Shield".
  if (wordBoundary.test(name) || wordBoundary.test(latin)) return 1
  return 2
}

export const CATALOG_PAGE_SIZE = 48

async function searchCatalog(
  query: string,
  kingdomFilter: PickerKingdomFilter,
  offset = 0,
): Promise<PickerSpeciesItem[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const trimmed = query.trim()
  let request = supabase.from('species').select(CATALOG_COLUMNS)
  if (trimmed.length >= 2)
    request = request.or(`common_name.ilike.%${trimmed}%,latin_name.ilike.%${trimmed}%`)
  const catKingdom = catalogKingdomFor(kingdomFilter)
  if (catKingdom) request = request.eq('kingdom', catKingdom)

  // Pure browse (no text) — paginate alphabetically (A→Z), so it reads like a
  // directory you can scan by name. `id` is a stable tiebreaker so ties in
  // common_name never shift between pages.
  if (trimmed.length < 2) {
    // sort_name strips leading punctuation ("'Ilima", "(Asian) …") so browse
    // actually starts at A, not at a page of quote/paren-prefixed names.
    const { data, error } = await request
      .order('sort_name')
      .order('id')
      .range(offset, offset + CATALOG_PAGE_SIZE - 1)
    if (error) return []
    return (data ?? []).map(mapCatalogRow)
  }

  // Text search — relevance-rank a wider pool, then page through it. Re-fetches
  // the pool per page (bounded, rare beyond page 1) so tiering stays consistent.
  const { data, error } = await request.order('dex_number').limit(200)
  if (error) return []
  const q = trimmed.toLowerCase()
  const ranked = (data ?? [])
    .map(mapCatalogRow)
    .map((item, i) => ({ item, tier: relevanceTier(item, q), i }))
    .sort((a, b) => a.tier - b.tier || a.i - b.i)
    .map((x) => x.item)
  return ranked.slice(offset, offset + CATALOG_PAGE_SIZE)
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

// Wild source priority: our persisted catalog first (stable dex numbers, owned),
// then GBIF live for anything not yet in the catalog, then the roster as a
// last-resort browse (offline / catalog still warming).
async function resolveWild(
  trimmed: string,
  kingdomFilter: PickerKingdomFilter,
  categoryFilter: PickerKingdomFilter | undefined,
  offset: number,
): Promise<PickerSpeciesItem[]> {
  // Category words we can't serve from the catalog fall back to the (unpaginated) roster.
  if (categoryFilter && !catalogKingdomFor(categoryFilter)) {
    return offset === 0 ? browseFromRoster(categoryFilter) : []
  }

  const effectiveFilter = categoryFilter ?? kingdomFilter
  const catalog = await searchCatalog(trimmed, effectiveFilter, offset)
  // A specific first-page query that the catalog can't satisfy → reach out to GBIF live.
  if (trimmed.length >= 2 && offset === 0 && catalog.length < 8) {
    const gbif = await searchGbif(trimmed)
    const merged = dedupeItems([...catalog, ...gbif])
    if (merged.length > 0) return merged
  }
  if (catalog.length > 0) return catalog
  // Catalog empty on the first page (e.g. still warming) — fall back to the roster.
  return offset === 0 ? browseFromRoster(effectiveFilter) : []
}

export async function searchPickerSpecies(
  query: string,
  kingdomFilter: PickerKingdomFilter,
  offset = 0,
): Promise<PickerSpeciesItem[]> {
  const trimmed = query.trim()
  const categoryFilter = CATEGORY_QUERY_TO_FILTER[trimmed.toLowerCase()]
  const [domestic, wild] = await Promise.all([
    offset === 0 ? searchDomestic(trimmed) : Promise.resolve([]),
    resolveWild(trimmed, kingdomFilter, categoryFilter, offset),
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
