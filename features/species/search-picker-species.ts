import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { kingdomKeyFromTaxonomy, isFungiTaxonomy } from '@/features/species/kingdom-from-taxonomy'
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
  Fungi: 'plant',
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
  return {
    id: `inat-${taxon.id}`,
    commonName,
    latinName: taxon.name ?? '',
    kingdom: isFungiTaxonomy(iconic) ? 'plant' : kingdom,
    taxonomyKingdom,
    imageUrl: taxon.default_photo?.medium_url ?? taxon.default_photo?.square_url ?? null,
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
  const [domestic, wild] = await Promise.all([
    searchDomestic(query),
    searchInaturalist(query),
  ])

  const merged = dedupeItems([...domestic, ...wild])
  return filterByKingdom(merged, kingdomFilter)
}

export function pickerItemToLookupId(item: PickerSpeciesItem): string {
  if (item.isDomestic && item.dexNumber) return item.dexNumber
  if (item.isDomestic) return item.id
  if (item.id.startsWith('inat-')) return item.id
  return slugifySpeciesName(item.commonName)
}
