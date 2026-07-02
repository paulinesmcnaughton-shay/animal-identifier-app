import { useEffect, useState } from 'react'

import { colors } from '@/design/tokens'
import { getSupabaseClient } from '@/lib/supabase/client'

export type Collection =
  | 'wild'
  | 'domestic'
  | 'farm'
  | 'petting_zoo'
  | 'safari'
  | 'zoo'
  | 'aquarium'

export interface CollectionDef {
  id: Collection
  label: string
  emoji: string
  accent: string
  description: string
}

/** Display metadata for each collection — used by Dex filters, quests, venue UI. */
export const COLLECTIONS: CollectionDef[] = [
  { id: 'wild',        label: 'Wild',        emoji: '🦊', accent: colors.greenLight, description: 'Animals and plants in the wild' },
  { id: 'domestic',    label: 'Pets',        emoji: '🐶', accent: colors.earthLight, description: 'Dogs, cats and household pets' },
  { id: 'farm',        label: 'Farm',        emoji: '🐄', accent: colors.coralDeep,  description: 'Farm and barnyard animals' },
  { id: 'petting_zoo', label: 'Petting Zoo', emoji: '🐐', accent: colors.sun,        description: 'Friendly petting-zoo animals' },
  { id: 'safari',      label: 'Safari',      emoji: '🦁', accent: colors.earth,      description: 'Savanna and safari wildlife' },
  { id: 'zoo',         label: 'Zoo',         emoji: '🦒', accent: colors.plum,       description: 'Zoo animals from around the world' },
  { id: 'aquarium',    label: 'Aquarium',    emoji: '🐠', accent: colors.skyDeep,    description: 'Aquarium and marine life' },
]

export function collectionDef(id: Collection): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.id === id)
}

export interface CatalogSpecies {
  id: string
  commonName: string
  scientificName: string | null
  kingdom: string | null
  dexNumber: string | null
  collections: Collection[]
  referenceImageUrl: string | null
}

interface CatalogRow {
  id: string
  common_name: string
  scientific_name: string | null
  kingdom: string | null
  dex_number: string | null
  collections: string[] | null
  reference_image_url: string | null
}

function mapRow(row: CatalogRow): CatalogSpecies {
  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    kingdom: row.kingdom,
    dexNumber: row.dex_number,
    collections: (row.collections ?? []) as Collection[],
    referenceImageUrl: row.reference_image_url,
  }
}

const SELECT = 'id, common_name, scientific_name, kingdom, dex_number, collections, reference_image_url'

/** All curated catalog species in a collection (safari, zoo, aquarium, …). */
export async function fetchCatalogByCollection(collection: Collection): Promise<CatalogSpecies[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('catalog_species')
    .select(SELECT)
    .contains('collections', [collection])
    .order('dex_number')
  if (error || !data) return []
  return (data as CatalogRow[]).map(mapRow)
}

const SPECIES_COLLECTION_PAGE_SIZE = 48
interface SpeciesCollectionRow {
  id: string
  common_name: string
  latin_name: string | null
  kingdom: string | null
  dex_number: string | null
  image_url: string | null
}

/**
 * Safari/Zoo/Aquarium/Farm/Petting-zoo species from the FULL occurrence-ranked
 * catalog (tagged by taxonomy — see migration species_collections_tagging),
 * not just the small hand-curated `catalog_species` table. This is what makes
 * "browse Safari" actually comprehensive instead of ~20 hand-picked animals.
 * Alphabetical, paginated — same pattern as the rest of Open Source browse.
 */
export async function fetchSpeciesByCollection(
  collection: Collection,
  offset = 0,
): Promise<CatalogSpecies[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('species')
    .select('id, common_name, latin_name, kingdom, dex_number, image_url')
    .contains('collections', [collection])
    .order('sort_name')
    .order('id')
    .range(offset, offset + SPECIES_COLLECTION_PAGE_SIZE - 1)
  if (error || !data) return []
  return (data as SpeciesCollectionRow[]).map((row) => ({
    id: row.id,
    commonName: row.common_name,
    scientificName: row.latin_name,
    kingdom: row.kingdom,
    dexNumber: row.dex_number,
    collections: [collection],
    referenceImageUrl: row.image_url,
  }))
}

/** Entire curated catalog. */
export async function fetchCatalog(): Promise<CatalogSpecies[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.from('catalog_species').select(SELECT).order('dex_number')
  if (error || !data) return []
  return (data as CatalogRow[]).map(mapRow)
}

// ─── Collection lookup (which collections a captured species belongs to) ────────

let catalogCache: CatalogSpecies[] | null = null
let catalogPromise: Promise<CatalogSpecies[]> | null = null

async function loadCatalogOnce(): Promise<CatalogSpecies[]> {
  if (catalogCache) return catalogCache
  if (!catalogPromise) catalogPromise = fetchCatalog().then((rows) => ((catalogCache = rows), rows))
  return catalogPromise
}

export type CollectionLookup = (q: { commonName?: string | null; scientificName?: string | null }) => Collection[]

const norm = (s?: string | null): string => (s ?? '').trim().toLowerCase()

export function buildCollectionLookup(rows: CatalogSpecies[]): CollectionLookup {
  const byName = new Map<string, Collection[]>()
  for (const r of rows) {
    if (r.commonName) byName.set(norm(r.commonName), r.collections)
    if (r.scientificName) byName.set(norm(r.scientificName), r.collections)
  }
  return (q) => byName.get(norm(q.commonName)) ?? byName.get(norm(q.scientificName)) ?? []
}

/** Hook: loads the catalog once and returns a fn mapping a species → its collections. */
export function useCollectionLookup(): CollectionLookup {
  const [lookup, setLookup] = useState<CollectionLookup>(() => () => [])
  useEffect(() => {
    let cancelled = false
    void loadCatalogOnce().then((rows) => {
      if (!cancelled) setLookup(() => buildCollectionLookup(rows))
    })
    return () => {
      cancelled = true
    }
  }, [])
  return lookup
}
