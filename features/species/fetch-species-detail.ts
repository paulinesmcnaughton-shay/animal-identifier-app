import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import {
  type SpeciesDetail,
  type SpeciesRarity,
  type SpeciesStat,
  type SpeciesTaxonomy,
  type SpeciesVital,
  slugifySpeciesName,
} from '@/data/species-catalog'
import {
  fetchDomesticSpeciesFromSupabase,
  type FetchDomesticSpeciesOptions,
} from '@/features/species/fetch-domestic-species'
import { isDomesticDexNumber, resolveGlobalDexNumber } from '@/features/species/dex-number-registry'
import { resolveLatinName } from '@/features/species/species-latin-names'
import { classifyPlantType, kingdomKeyFromTaxonomy } from '@/features/species/kingdom-from-taxonomy'
import type {
  LatinNameSource,
  SpeciesDetailFetchOptions,
  SpeciesDetailFetchResult,
} from '@/features/species/types'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type { SpeciesDetailFetchResult, SpeciesDetailFetchOptions, LatinNameSource } from '@/features/species/types'

type SpeciesRow = Database['public']['Tables']['species']['Row']

const KINGDOM_KEYS: KingdomKey[] = [
  'insect',
  'bird',
  'mammal',
  'reptile',
  'amphibian',
  'fish',
  'arachnid',
  'mollusc',
  'plant',
  'tree',
  'flower',
  'fungi',
]

const RARITIES: SpeciesRarity[] = ['Common', 'Uncommon', 'Rare', 'Very Rare']

const INAT_LOOKUP_RE = /^inat-(\d+)$/i
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface InatTaxon {
  id: number
  name?: string
  preferred_common_name?: string
  iconic_taxon_name?: string
  wikipedia_summary?: string
  default_photo?: { medium_url?: string; square_url?: string }
}

function parseKingdom(value: string | null): KingdomKey {
  if (value && KINGDOM_KEYS.includes(value as KingdomKey)) return value as KingdomKey
  return 'mammal'
}

function parseRarity(value: string | null): SpeciesRarity {
  if (value && RARITIES.includes(value as SpeciesRarity)) return value as SpeciesRarity
  return 'Common'
}

function parseStats(value: SpeciesRow['stats']): SpeciesStat[] {
  if (!Array.isArray(value)) return []
  const parsed: SpeciesStat[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    if (
      typeof row.label === 'string' &&
      typeof row.value === 'number' &&
      typeof row.color === 'string'
    ) {
      parsed.push({ label: row.label, value: row.value, color: row.color })
    }
  }
  return parsed
}

function parseVitals(value: SpeciesRow['vitals']): SpeciesVital[] {
  if (!Array.isArray(value)) return []
  const parsed: SpeciesVital[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    if (
      typeof row.label === 'string' &&
      typeof row.value === 'string' &&
      (row.icon === 'resize' ||
        row.icon === 'flash' ||
        row.icon === 'heart' ||
        row.icon === 'leaf') &&
      typeof row.tint === 'string' &&
      typeof row.iconColor === 'string'
    ) {
      parsed.push({
        label: row.label,
        value: row.value,
        icon: row.icon,
        tint: row.tint,
        iconColor: row.iconColor,
      })
    }
  }
  return parsed
}

function parseTaxonomy(value: SpeciesRow['taxonomy']): SpeciesTaxonomy {
  const fallback: SpeciesTaxonomy = {
    kingdom: 'Animalia',
    phylum: 'Unknown',
    class: 'Unknown',
    order: 'Unknown',
    family: 'Unknown',
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fallback
  const row = value as Record<string, unknown>
  return {
    kingdom: typeof row.kingdom === 'string' ? row.kingdom : fallback.kingdom,
    phylum: typeof row.phylum === 'string' ? row.phylum : fallback.phylum,
    class: typeof row.class === 'string' ? row.class : fallback.class,
    order: typeof row.order === 'string' ? row.order : fallback.order,
    family: typeof row.family === 'string' ? row.family : fallback.family,
  }
}

export function mapSpeciesRowToDetail(row: SpeciesRow): SpeciesDetail {
  const gradientStart = row.gradient_start ?? '#A8D8EA'
  const gradientEnd = row.gradient_end ?? '#5BC0EB'
  const stats = parseStats(row.stats)
  const vitals = parseVitals(row.vitals)

  return {
    id: row.id,
    dexNumber: row.dex_number ?? '#???',
    commonName: row.common_name,
    latinName: row.latin_name ?? 'Species unknown',
    kingdom: parseKingdom(row.kingdom),
    rarity: parseRarity(row.rarity),
    conservation: row.conservation ?? 'Unknown',
    region: row.region ?? 'Unknown',
    sounds: row.sounds ?? false,
    description: row.description ?? '',
    gradient: [gradientStart, gradientEnd],
    stats: stats.length > 0 ? stats : [],
    vitals: vitals.length > 0 ? vitals : [],
    taxonomy: parseTaxonomy(row.taxonomy),
  }
}

function isDomesticDexLookup(lookupId: string): boolean {
  const safe = lookupId.replace(/[^a-zA-Z0-9#_-]/g, '')
  return isDomesticDexNumber(safe)
}

function parseInatTaxonId(lookupId: string): number | null {
  const match = lookupId.trim().match(INAT_LOOKUP_RE)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function shouldQueryDomestic(lookupId: string, isDomestic?: boolean): boolean {
  if (isDomestic) return true
  if (isDomesticDexLookup(lookupId)) return true
  const safeId = lookupId.replace(/[^a-zA-Z0-9-]/g, '')
  return UUID_RE.test(safeId)
}

const PLANT_KINGDOMS = new Set<KingdomKey>(['plant', 'tree', 'flower'])

function defaultTaxonomyKingdom(kingdom: KingdomKey): string {
  if (PLANT_KINGDOMS.has(kingdom)) return 'Plantae'
  if (kingdom === 'fungi') return 'Fungi'
  return 'Animalia'
}

function wildDetailShell(
  lookupId: string,
  commonName: string,
  latinName: string,
  kingdom: KingdomKey,
): SpeciesDetail {
  const resolvedLatin =
    latinName.trim() && latinName !== 'Species unknown'
      ? latinName
      : resolveLatinName({ speciesId: lookupId, commonName }) ?? 'Species unknown'

  return {
    id: lookupId,
    dexNumber: '#???',
    commonName,
    latinName: resolvedLatin,
    kingdom,
    rarity: 'Common',
    conservation: 'Unknown',
    region: 'Unknown',
    sounds: false,
    description: 'A new entry for your Wild Dex. Keep exploring to learn more about this creature.',
    gradient: ['#A8D8EA', '#5BC0EB'],
    stats: [],
    vitals: [],
    taxonomy: {
      kingdom: defaultTaxonomyKingdom(kingdom),
      phylum: PLANT_KINGDOMS.has(kingdom) ? 'Tracheophyta' : kingdom === 'fungi' ? 'Unknown' : 'Unknown',
      class: 'Unknown',
      order: 'Unknown',
      family: 'Unknown',
    },
  }
}

function mapInatTaxonToWildResult(
  taxon: InatTaxon,
  lookupId: string,
): SpeciesDetailFetchResult {
  const latinName = taxon.name?.trim() || 'Species unknown'
  const commonName =
    taxon.preferred_common_name?.trim() || taxon.name?.trim() || 'Unknown species'
  const baseKingdom = kingdomKeyFromTaxonomy(taxon.iconic_taxon_name ?? 'Animalia')
  const kingdom = baseKingdom === 'plant' ? classifyPlantType(commonName, latinName) : baseKingdom
  const dexNumber = resolveGlobalDexNumber({
    lookupId,
    commonName,
    latinName,
    inatTaxonId: taxon.id,
    kingdom,
  })
  const imageUrl =
    taxon.default_photo?.medium_url?.trim() ||
    taxon.default_photo?.square_url?.trim() ||
    null

  return {
    detail: {
      ...wildDetailShell(lookupId, commonName, latinName, kingdom),
      dexNumber,
      ...(taxon.wikipedia_summary?.trim()
        ? { description: stripHtml(taxon.wikipedia_summary) }
        : {}),
    },
    imageUrl,
    isDomestic: false,
    latinNameSource: 'inaturalist.taxon.name',
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type WikiPageMap = Record<string, { extract?: string; missing?: string }>

async function fetchWikiExtract(title: string): Promise<string | null> {
  if (!title.trim()) return null
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts` +
      `&exintro=true&explaintext=true&redirects=1` +
      `&titles=${encodeURIComponent(title.trim())}` +
      `&format=json&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { query?: { pages?: WikiPageMap } }
    const pages = json.query?.pages ?? {}
    const page = Object.values(pages)[0]
    if (!page || 'missing' in page) return null
    const extract = page.extract?.trim()
    if (!extract) return null
    // Take first 2 sentences only
    const sentences = extract.match(/[^.!?]+[.!?]+/g) ?? []
    return sentences.slice(0, 2).join(' ').trim() || null
  } catch {
    return null
  }
}

async function searchWikiTitle(query: string): Promise<string | null> {
  if (!query.trim()) return null
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&list=search` +
      `&srsearch=${encodeURIComponent(query.trim())}&srlimit=1` +
      `&format=json&origin=*`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { query?: { search?: Array<{ title: string }> } }
    const title = json.query?.search?.[0]?.title
    if (!title) return null
    return fetchWikiExtract(title)
  } catch {
    return null
  }
}

export async function fetchWikipediaSummary(latinName: string, commonName: string): Promise<string | null> {
  // Latin name is most specific — try it first
  if (latinName.trim()) {
    const result = await fetchWikiExtract(latinName)
    if (result) return result
  }
  // Common name direct lookup
  if (commonName.trim()) {
    const result = await fetchWikiExtract(commonName)
    if (result) return result
  }
  // Search fallback handles disambiguation, synonyms, capitalisation differences
  return searchWikiTitle(commonName || latinName)
}

async function fetchInatTaxonById(taxonId: number): Promise<InatTaxon | null> {
  try {
    const res = await fetch(`https://api.inaturalist.org/v1/taxa/${taxonId}`)
    if (!res.ok) return null
    const json = (await res.json()) as { results?: InatTaxon[] }
    return json.results?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchInatTaxonByName(commonName: string): Promise<InatTaxon | null> {
  const trimmed = commonName.trim()
  if (!trimmed) return null

  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(trimmed)}&per_page=1&rank=species,subspecies,variety`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = (await res.json()) as { results?: InatTaxon[] }
    const taxon = json.results?.[0] ?? null
    if (!taxon) return null
    // Search results often omit wikipedia_summary — fetch full detail to get it
    if (!taxon.wikipedia_summary?.trim() && taxon.id) {
      const detail = await fetchInatTaxonById(taxon.id)
      return detail ?? taxon
    }
    return taxon
  } catch {
    return null
  }
}

async function enrichWithDescription(taxon: InatTaxon): Promise<InatTaxon> {
  if (taxon.wikipedia_summary?.trim()) return taxon
  const latinName = taxon.name?.trim() ?? ''
  const commonName = taxon.preferred_common_name?.trim() || latinName
  const summary = await fetchWikipediaSummary(latinName, commonName)
  if (!summary) return taxon
  return { ...taxon, wikipedia_summary: summary }
}

async function fetchWildSpeciesFromInaturalist(
  lookupId: string,
  commonNameHint?: string,
  latinNameHint?: string,
): Promise<SpeciesDetailFetchResult | null> {
  const inatId = parseInatTaxonId(lookupId)
  if (inatId !== null) {
    const raw = await fetchInatTaxonById(inatId)
    if (raw?.name?.trim()) {
      const taxon = await enrichWithDescription(raw)
      return mapInatTaxonToWildResult(taxon, lookupId)
    }
  }

  // Scientific name first — it's unambiguous. Searching by the common name alone
  // can return the wrong species (e.g. "Leopard" → the leopard SLUG on iNaturalist).
  if (latinNameHint?.trim()) {
    const raw = await fetchInatTaxonByName(latinNameHint)
    if (raw?.name?.trim()) {
      const taxon = await enrichWithDescription(raw)
      const resolvedId = lookupId.trim() || slugifySpeciesName(commonNameHint ?? latinNameHint)
      return mapInatTaxonToWildResult(taxon, resolvedId)
    }
  }

  if (commonNameHint?.trim()) {
    const raw = await fetchInatTaxonByName(commonNameHint)
    if (raw?.name?.trim()) {
      const taxon = await enrichWithDescription(raw)
      const resolvedId = lookupId.trim() || slugifySpeciesName(commonNameHint)
      return mapInatTaxonToWildResult(taxon, resolvedId)
    }
  }

  return null
}

async function fetchWildSpeciesRowFromSupabase(
  lookupId: string,
): Promise<SpeciesDetailFetchResult | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const safeId = lookupId.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safeId) return null

  const slug = slugifySpeciesName(safeId)

  const { data, error } = await supabase
    .from('species')
    .select('*')
    .or(`id.eq.${safeId},slug.eq.${safeId},slug.eq.${slug}`)
    .maybeSingle()

  if (error) {
    if (__DEV__) console.warn('[WildKind Supabase] species fetch', error.message)
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    detail: mapSpeciesRowToDetail(data),
    imageUrl: data.image_url?.trim() || null,
    isDomestic: false,
    latinNameSource: 'species.latin_name',
  }
}

export async function fetchSpeciesDetailFromSupabase(
  lookupId: string,
  options?: SpeciesDetailFetchOptions,
): Promise<SpeciesDetailFetchResult | null> {
  const commonNameHint = options?.commonNameHint?.trim()
  const latinNameHint = options?.latinNameHint?.trim()
  const queryDomestic = shouldQueryDomestic(lookupId, options?.isDomestic)

  if (queryDomestic) {
    const domesticOptions: FetchDomesticSpeciesOptions = {
      allowFuzzyNameSearch: Boolean(options?.isDomestic),
    }
    const domestic = await fetchDomesticSpeciesFromSupabase(
      lookupId,
      commonNameHint,
      domesticOptions,
    )
    if (__DEV__) {
      console.log('[WildKind fetchSpeciesDetail] domestic lookup:', {
        lookupId,
        commonNameHint,
        isDomestic: options?.isDomestic,
        found: !!domestic,
      })
    }
    if (domestic) return domestic
    if (options?.isDomestic) return null
  }

  const wildInat = await fetchWildSpeciesFromInaturalist(lookupId, commonNameHint, latinNameHint)
  if (wildInat) {
    if (__DEV__) {
      console.log('[WildKind fetchSpeciesDetail] wild iNaturalist:', {
        lookupId,
        latinName: wildInat.detail.latinName,
        taxonName: wildInat.detail.latinName,
      })
    }
    return wildInat
  }

  return fetchWildSpeciesRowFromSupabase(lookupId)
}
