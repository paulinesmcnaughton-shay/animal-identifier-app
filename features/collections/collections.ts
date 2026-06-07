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

/** Entire curated catalog. */
export async function fetchCatalog(): Promise<CatalogSpecies[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase.from('catalog_species').select(SELECT).order('dex_number')
  if (error || !data) return []
  return (data as CatalogRow[]).map(mapRow)
}
