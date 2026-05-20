import type { SpeciesDetail } from '@/data/species-catalog'

export type LatinNameSource =
  | 'inaturalist.taxon.name'
  | 'domestic_species.latin_name'
  | 'species.latin_name'
  | 'route.param.latin'
  | 'catalog.fallback'

export interface SpeciesDetailFetchResult {
  detail: SpeciesDetail
  imageUrl: string | null
  isDomestic: boolean
  latinNameSource: LatinNameSource
}

export interface SpeciesDetailFetchOptions {
  commonNameHint?: string
  latinNameHint?: string
  /** When true, only domestic_species is queried (by id/dex/name). */
  isDomestic?: boolean
}
