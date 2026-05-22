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
import { kingdomKeyFromTaxonomy } from '@/features/species/kingdom-from-taxonomy'
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
      kingdom: 'Animalia',
      phylum: 'Unknown',
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
  const kingdom = kingdomKeyFromTaxonomy(taxon.iconic_taxon_name ?? 'Animalia')
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
    detail: { ...wildDetailShell(lookupId, commonName, latinName, kingdom), dexNumber },
    imageUrl,
    isDomestic: false,
    latinNameSource: 'inaturalist.taxon.name',
  }
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
    return json.results?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchWildSpeciesFromInaturalist(
  lookupId: string,
  commonNameHint?: string,
): Promise<SpeciesDetailFetchResult | null> {
  const inatId = parseInatTaxonId(lookupId)
  if (inatId !== null) {
    const taxon = await fetchInatTaxonById(inatId)
    if (taxon?.name?.trim()) {
      return mapInatTaxonToWildResult(taxon, lookupId)
    }
  }

  if (commonNameHint?.trim()) {
    const taxon = await fetchInatTaxonByName(commonNameHint)
    if (taxon?.name?.trim()) {
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

  const wildInat = await fetchWildSpeciesFromInaturalist(lookupId, commonNameHint)
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
